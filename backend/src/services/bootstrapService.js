const { DEFAULT_MATERIALS, HEADERS, SHEETS } = require("../constants/masterData");
const sheetsService = require("./sheetsService");

function createId(prefix, rows, key) {
  const max = rows.reduce((acc, row) => {
    const raw = String(row[key] || "");
    const numeric = Number(raw.replace(/[^0-9]/g, ""));
    if (!Number.isFinite(numeric)) return acc;
    return Math.max(acc, numeric);
  }, 0);
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

async function bootstrapSheets() {
  const targets = Object.values(SHEETS);

  for (const sheetName of targets) {
    await sheetsService.ensureSheetWithHeaders(sheetName, HEADERS[sheetName]);
  }

  const materialRows = await sheetsService.readRows(SHEETS.MATERIALS, HEADERS[SHEETS.MATERIALS]);
  if (materialRows.length) return;

  for (const material of DEFAULT_MATERIALS) {
    const currentRows = await sheetsService.readRows(SHEETS.MATERIALS, HEADERS[SHEETS.MATERIALS]);
    await sheetsService.appendRow(SHEETS.MATERIALS, HEADERS[SHEETS.MATERIALS], {
      "Material ID": createId("MAT", currentRows, "Material ID"),
      Name: material,
      "Is Active": "TRUE"
    });
  }
}

module.exports = { bootstrapSheets, createId };