const fs = require("fs/promises");
const path = require("path");
const { google } = require("googleapis");

const ApiError = require("../utils/apiError");

class SheetsService {
  constructor() {
    this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    this.client = null;
    this.ready = false;
    this.useLocalStore =
      process.env.USE_LOCAL_STORE === "true" ||
      (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID && process.env.NODE_ENV !== "production");
    this.localStorePath = path.resolve(__dirname, "../data/localSheets.json");
    this.localStoreLock = Promise.resolve();
    this.knownSheets = null;
    this.ensuredHeaders = new Set();
    this.rowCache = new Map();
    this.rowCacheTtlMs = Number(process.env.SHEETS_ROW_CACHE_TTL_MS || 8000);
  }

  cacheKey(sheetName, headers) {
    return `${sheetName}::${headers.join("|")}`;
  }

  invalidateRowCache(sheetName) {
    for (const key of this.rowCache.keys()) {
      if (key.startsWith(`${sheetName}::`)) {
        this.rowCache.delete(key);
      }
    }
  }

  mapRows(values, headers) {
    return values.map((row, index) => {
      const record = { __rowNumber: index + 2 };
      headers.forEach((header, headerIndex) => {
        record[header] = row[headerIndex] ?? "";
      });
      return record;
    });
  }

  withLocalStoreLock(action) {
    const run = this.localStoreLock.then(action);
    this.localStoreLock = run.catch(() => {});
    return run;
  }

  async readLocalStoreUnsafe() {
    try {
      const raw = await fs.readFile(this.localStorePath, "utf8");
      return JSON.parse(raw);
    } catch (_error) {
      return {};
    }
  }

  async writeLocalStoreUnsafe(store) {
    await fs.mkdir(path.dirname(this.localStorePath), { recursive: true });
    await fs.writeFile(this.localStorePath, JSON.stringify(store, null, 2), "utf8");
  }

  ensureLocalSheet(store, sheetName, headers) {
    const current = store[sheetName];
    if (!current || !Array.isArray(current.headers)) {
      store[sheetName] = { headers, rows: [] };
      return;
    }

    store[sheetName].headers = headers;
    if (!Array.isArray(store[sheetName].rows)) {
      store[sheetName].rows = [];
    }
  }

  async init() {
    if (this.useLocalStore || this.ready) return;

    if (!this.spreadsheetId) {
      throw new ApiError(500, "GOOGLE_SHEETS_SPREADSHEET_ID is missing in backend/.env");
    }

    let credentials = null;

    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      try {
        credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      } catch (_error) {
        throw new ApiError(500, "GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON");
      }
    }

    const auth = credentials
      ? new google.auth.GoogleAuth({
          credentials,
          scopes: ["https://www.googleapis.com/auth/spreadsheets"]
        })
      : new google.auth.GoogleAuth({
          keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_FILE || "service-account.json",
          scopes: ["https://www.googleapis.com/auth/spreadsheets"]
        });

    const authClient = await auth.getClient();
    this.client = google.sheets({ version: "v4", auth: authClient });
    this.ready = true;
  }

  async loadKnownSheets() {
    if (this.knownSheets) return this.knownSheets;
    const meta = await this.client.spreadsheets.get({ spreadsheetId: this.spreadsheetId });
    this.knownSheets = new Set(
      (meta.data.sheets || []).map((sheet) => String(sheet.properties?.title || ""))
    );
    return this.knownSheets;
  }

  async ensureSheetWithHeaders(sheetName, headers) {
    if (this.useLocalStore) {
      await this.withLocalStoreLock(async () => {
        const store = await this.readLocalStoreUnsafe();
        this.ensureLocalSheet(store, sheetName, headers);
        await this.writeLocalStoreUnsafe(store);
      });
      return;
    }

    await this.init();
    if (this.ensuredHeaders.has(sheetName)) return;

    const knownSheets = await this.loadKnownSheets();
    const sheetExists = knownSheets.has(sheetName);

    if (!sheetExists) {
      try {
        await this.client.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            requests: [{ addSheet: { properties: { title: sheetName } } }]
          }
        });
      } catch (error) {
        // Handle eventual consistency race where sheet was created by another request/process.
        if (!String(error.message || "").includes("already exists")) {
          throw error;
        }
      }
      knownSheets.add(sheetName);
    }

    const response = await this.client.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!1:1`
    });

    const current = response.data.values?.[0] || [];
    const headersMismatch = !current.length || headers.some((header, index) => current[index] !== header);

    if (headersMismatch) {
      await this.client.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [headers] }
      });
    }

    this.ensuredHeaders.add(sheetName);
  }

  async readRows(sheetName, headers) {
    if (this.useLocalStore) {
      return this.withLocalStoreLock(async () => {
        const store = await this.readLocalStoreUnsafe();
        this.ensureLocalSheet(store, sheetName, headers);
        await this.writeLocalStoreUnsafe(store);
        const rows = store[sheetName].rows || [];
        return this.mapRows(rows, headers);
      });
    }

    const key = this.cacheKey(sheetName, headers);
    const cached = this.rowCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.rowCacheTtlMs) {
      return cached.rows;
    }

    await this.ensureSheetWithHeaders(sheetName, headers);

    const response = await this.client.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A2:ZZ`
    });

    const values = response.data.values || [];
    const rows = this.mapRows(values, headers);
    this.rowCache.set(key, { timestamp: Date.now(), rows });
    return rows;
  }

  async appendRow(sheetName, headers, rowObject) {
    const row = headers.map((header) => rowObject[header] ?? "");

    if (this.useLocalStore) {
      await this.withLocalStoreLock(async () => {
        const store = await this.readLocalStoreUnsafe();
        this.ensureLocalSheet(store, sheetName, headers);
        store[sheetName].rows.push(row);
        await this.writeLocalStoreUnsafe(store);
      });
      return;
    }

    await this.ensureSheetWithHeaders(sheetName, headers);

    await this.client.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A:ZZ`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] }
    });
    this.invalidateRowCache(sheetName);
  }

  async updateRow(sheetName, rowNumber, headers, rowObject) {
    const row = headers.map((header) => rowObject[header] ?? "");

    if (this.useLocalStore) {
      await this.withLocalStoreLock(async () => {
        const store = await this.readLocalStoreUnsafe();
        this.ensureLocalSheet(store, sheetName, headers);
        const index = rowNumber - 2;
        if (index < 0 || index >= store[sheetName].rows.length) return;
        store[sheetName].rows[index] = row;
        await this.writeLocalStoreUnsafe(store);
      });
      return;
    }

    await this.ensureSheetWithHeaders(sheetName, headers);

    await this.client.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A${rowNumber}`,
      valueInputOption: "RAW",
      requestBody: { values: [row] }
    });
    this.invalidateRowCache(sheetName);
  }

  async deleteRow(sheetName, rowNumber) {
    if (this.useLocalStore) {
      await this.withLocalStoreLock(async () => {
        const store = await this.readLocalStoreUnsafe();
        const index = rowNumber - 2;
        if (index < 0 || index >= (store[sheetName]?.rows || []).length) return;
        store[sheetName].rows.splice(index, 1);
        await this.writeLocalStoreUnsafe(store);
      });
      return;
    }

    await this.init();

    const meta = await this.client.spreadsheets.get({ spreadsheetId: this.spreadsheetId });
    const sheet = (meta.data.sheets || []).find((item) => item.properties?.title === sheetName);
    if (!sheet) return;

    await this.client.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheet.properties.sheetId,
                dimension: "ROWS",
                startIndex: rowNumber - 1,
                endIndex: rowNumber
              }
            }
          }
        ]
      }
    });
    this.invalidateRowCache(sheetName);
  }

  async getStorageStatus() {
    const googleConfigured = Boolean(
      process.env.GOOGLE_SHEETS_SPREADSHEET_ID &&
        (process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_SERVICE_ACCOUNT_FILE)
    );

    if (this.useLocalStore) {
      return {
        mode: "local",
        googleConfigured,
        googleConnected: false,
        spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || ""
      };
    }

    try {
      await this.init();
      await this.client.spreadsheets.get({ spreadsheetId: this.spreadsheetId });
      return {
        mode: "google-sheets",
        googleConfigured,
        googleConnected: true,
        spreadsheetId: this.spreadsheetId
      };
    } catch (_error) {
      return {
        mode: "google-sheets",
        googleConfigured,
        googleConnected: false,
        spreadsheetId: this.spreadsheetId || ""
      };
    }
  }

  async syncLocalToGoogle(sheetHeadersMap) {
    if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
      throw new ApiError(400, "GOOGLE_SHEETS_SPREADSHEET_ID is required for sync.");
    }

    const store = await this.withLocalStoreLock(async () => this.readLocalStoreUnsafe());

    const originalUseLocal = this.useLocalStore;
    this.useLocalStore = false;
    this.ready = false;
    this.client = null;
    this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    this.knownSheets = null;
    this.ensuredHeaders.clear();
    this.rowCache.clear();

    await this.init();

    const summary = [];

    for (const [sheetName, headers] of Object.entries(sheetHeadersMap)) {
      await this.ensureSheetWithHeaders(sheetName, headers);

      await this.client.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A2:ZZ`
      });

      const rows = store[sheetName]?.rows || [];
      if (rows.length) {
        await this.client.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetName}!A2`,
          valueInputOption: "RAW",
          insertDataOption: "INSERT_ROWS",
          requestBody: { values: rows }
        });
      }

      summary.push({ sheetName, rows: rows.length });
    }

    this.useLocalStore = originalUseLocal;

    return { synced: true, summary };
  }
}

module.exports = new SheetsService();
