const { HEADERS, SHEETS } = require("../constants/masterData");
const sheetsService = require("./sheetsService");
const { createId } = require("./bootstrapService");
const ApiError = require("../utils/apiError");
const { toNumber, roundTo2 } = require("../utils/number");
const { formatDateISO, getMonthBounds, getWeekBounds, isWithinRange } = require("../utils/date");

function mapDeltaToCreditDebit(delta) {
  const normalized = roundTo2(toNumber(delta, 0));
  if (normalized > 0) {
    return { credit: normalized, debit: 0 };
  }
  if (normalized < 0) {
    return { credit: 0, debit: Math.abs(normalized) };
  }
  return { credit: 0, debit: 0 };
}

function getOpeningBaseBalance(customerId) {
  const raw = process.env.REPORT_OPENING_BALANCE_OVERRIDE;
  if (raw === undefined || raw === null || String(raw).trim() === "") return 0;
  const scopedCustomerId = String(process.env.REPORT_OPENING_BALANCE_CUSTOMER_ID || "").trim();
  if (scopedCustomerId && String(customerId || "").trim() !== scopedCustomerId) return 0;
  return roundTo2(toNumber(raw, 0));
}

async function getCustomers() {
  const rows = await sheetsService.readRows(SHEETS.CUSTOMERS, HEADERS[SHEETS.CUSTOMERS]);
  return rows.map((row) => ({
    rowNumber: row.__rowNumber,
    customerId: row["Customer ID"],
    name: row.Name,
    phone: row.Phone,
    address: row.Address,
    balance: roundTo2(toNumber(row.Balance))
  }));
}

async function getCustomerById(customerId) {
  const customers = await getCustomers();
  return customers.find((customer) => customer.customerId === customerId) || null;
}

async function addCustomer(payload) {
  const rows = await sheetsService.readRows(SHEETS.CUSTOMERS, HEADERS[SHEETS.CUSTOMERS]);
  const existing = rows.find((row) => String(row.Name).toLowerCase() === String(payload.name).toLowerCase());
  if (existing) throw new ApiError(409, "Customer with this name already exists.");

  const customerId = createId("CUS", rows, "Customer ID");
  const balance = roundTo2(toNumber(payload.balance, 0));

  const customerRow = {
    "Customer ID": customerId,
    Name: payload.name,
    Phone: payload.phone || "",
    Address: payload.address || "",
    Balance: balance
  };

  await sheetsService.appendRow(SHEETS.CUSTOMERS, HEADERS[SHEETS.CUSTOMERS], customerRow);

  const vehicleNumber = String(payload.vehicleNumber || "").trim();
  if (vehicleNumber) {
    const vehicles = await sheetsService.readRows(SHEETS.VEHICLES, HEADERS[SHEETS.VEHICLES]);
    const normalizedCustomerId = String(customerId || "").trim();
    const duplicateVehicle = vehicles.find(
      (row) =>
        String(row["Vehicle Number"] || "").trim().toLowerCase() === vehicleNumber.toLowerCase() &&
        String(row["Customer ID"] || "").trim() === normalizedCustomerId
    );
    if (!duplicateVehicle) {
      const vehicleId = createId("VEH", vehicles, "Vehicle ID");
      await sheetsService.appendRow(SHEETS.VEHICLES, HEADERS[SHEETS.VEHICLES], {
        "Vehicle ID": vehicleId,
        "Vehicle Number": vehicleNumber,
        "Customer ID": customerId,
        Type: payload.vehicleType || ""
      });
    }
  }

  return {
    customerId,
    name: payload.name,
    phone: payload.phone || "",
    address: payload.address || "",
    balance
  };
}

async function updateCustomer(customerId, payload) {
  const rows = await sheetsService.readRows(SHEETS.CUSTOMERS, HEADERS[SHEETS.CUSTOMERS]);
  const target = rows.find((row) => row["Customer ID"] === customerId);
  if (!target) throw new ApiError(404, "Customer not found.");

  const nextRow = {
    "Customer ID": customerId,
    Name: payload.name ?? target.Name,
    Phone: payload.phone ?? target.Phone,
    Address: payload.address ?? target.Address,
    Balance: payload.balance === undefined ? target.Balance : roundTo2(toNumber(payload.balance, 0))
  };

  await sheetsService.updateRow(SHEETS.CUSTOMERS, target.__rowNumber, HEADERS[SHEETS.CUSTOMERS], nextRow);

  return {
    customerId,
    name: nextRow.Name,
    phone: nextRow.Phone,
    address: nextRow.Address,
    balance: roundTo2(toNumber(nextRow.Balance))
  };
}

async function deleteCustomer(customerId, options = {}) {
  const cascade = Boolean(options.cascade);
  const rows = await sheetsService.readRows(SHEETS.CUSTOMERS, HEADERS[SHEETS.CUSTOMERS]);
  const matches = rows
    .filter((row) => row["Customer ID"] === customerId)
    .sort((a, b) => b.__rowNumber - a.__rowNumber);
  if (!matches.length) throw new ApiError(404, "Customer not found.");

  const [salesRows, ledgerRows] = await Promise.all([
    sheetsService.readRows(SHEETS.SALES, HEADERS[SHEETS.SALES]),
    sheetsService.readRows(SHEETS.LEDGER, HEADERS[SHEETS.LEDGER])
  ]);
  const vehicleRows = await sheetsService.readRows(SHEETS.VEHICLES, HEADERS[SHEETS.VEHICLES]);

  const linkedSales = salesRows.filter((row) => row["Customer ID"] === customerId).length;
  const linkedLedger = ledgerRows.filter((row) => row["Customer ID"] === customerId).length;

  if (!cascade && (linkedSales > 0 || linkedLedger > 0)) {
    throw new ApiError(
      409,
      `Cannot delete customer. Linked transactions found (sales: ${linkedSales}, ledger: ${linkedLedger}). Use force delete to remove linked rows.`
    );
  }

  if (cascade) {
    const salesToDelete = salesRows
      .filter((row) => row["Customer ID"] === customerId)
      .map((row) => row.__rowNumber);
    await sheetsService.deleteRows(SHEETS.SALES, salesToDelete);

    const ledgerToDelete = ledgerRows
      .filter((row) => row["Customer ID"] === customerId)
      .map((row) => row.__rowNumber);
    await sheetsService.deleteRows(SHEETS.LEDGER, ledgerToDelete);

    const vehiclesToDelete = vehicleRows
      .filter((row) => row["Customer ID"] === customerId)
      .map((row) => row.__rowNumber);
    await sheetsService.deleteRows(SHEETS.VEHICLES, vehiclesToDelete);
  }

  await sheetsService.deleteRows(
    SHEETS.CUSTOMERS,
    matches.map((row) => row.__rowNumber)
  );
}

async function getVehicles() {
  const rows = await sheetsService.readRows(SHEETS.VEHICLES, HEADERS[SHEETS.VEHICLES]);
  return rows.map((row) => ({
    rowNumber: row.__rowNumber,
    vehicleId: row["Vehicle ID"],
    vehicleNumber: row["Vehicle Number"],
    customerId: row["Customer ID"] || "",
    type: row.Type || ""
  }));
}

async function addVehicle(payload) {
  const rows = await sheetsService.readRows(SHEETS.VEHICLES, HEADERS[SHEETS.VEHICLES]);
  const normalizedVehicleNumber = String(payload.vehicleNumber || "").trim().toLowerCase();
  const normalizedCustomerId = String(payload.customerId || "").trim();
  const duplicate = rows.find(
    (row) =>
      String(row["Vehicle Number"] || "").trim().toLowerCase() === normalizedVehicleNumber &&
      String(row["Customer ID"] || "").trim() === normalizedCustomerId
  );
  if (duplicate) throw new ApiError(409, "Vehicle number already exists for this customer.");

  const vehicleId = createId("VEH", rows, "Vehicle ID");
  await sheetsService.appendRow(SHEETS.VEHICLES, HEADERS[SHEETS.VEHICLES], {
    "Vehicle ID": vehicleId,
    "Vehicle Number": payload.vehicleNumber,
    "Customer ID": payload.customerId || "",
    Type: payload.type || ""
  });

  return { vehicleId, vehicleNumber: payload.vehicleNumber, customerId: payload.customerId || "", type: payload.type || "" };
}

async function updateVehicle(vehicleId, payload) {
  const rows = await sheetsService.readRows(SHEETS.VEHICLES, HEADERS[SHEETS.VEHICLES]);
  const target = rows.find((row) => row["Vehicle ID"] === vehicleId);
  if (!target) throw new ApiError(404, "Vehicle not found.");

  const nextVehicleNumber = String(payload.vehicleNumber ?? target["Vehicle Number"] ?? "").trim();
  const nextCustomerId = String(payload.customerId ?? target["Customer ID"] ?? "").trim();
  const duplicate = rows.find(
    (row) =>
      row["Vehicle ID"] !== vehicleId &&
      String(row["Vehicle Number"] || "").trim().toLowerCase() === nextVehicleNumber.toLowerCase() &&
      String(row["Customer ID"] || "").trim() === nextCustomerId
  );
  if (duplicate) throw new ApiError(409, "Vehicle number already exists for this customer.");

  const row = {
    "Vehicle ID": vehicleId,
    "Vehicle Number": payload.vehicleNumber ?? target["Vehicle Number"],
    "Customer ID": payload.customerId ?? target["Customer ID"] ?? "",
    Type: payload.type ?? target.Type ?? ""
  };

  await sheetsService.updateRow(SHEETS.VEHICLES, target.__rowNumber, HEADERS[SHEETS.VEHICLES], row);
  return { vehicleId, vehicleNumber: row["Vehicle Number"], customerId: row["Customer ID"], type: row.Type };
}

async function deleteVehicle(vehicleId, options = {}) {
  const cascade = Boolean(options.cascade);
  const rows = await sheetsService.readRows(SHEETS.VEHICLES, HEADERS[SHEETS.VEHICLES]);
  const target = rows.find((row) => row["Vehicle ID"] === vehicleId);
  if (!target) throw new ApiError(404, "Vehicle not found.");

  const salesRows = await sheetsService.readRows(SHEETS.SALES, HEADERS[SHEETS.SALES]);
  const linkedSales = salesRows.filter(
    (row) => String(row.Vehicle || "").trim().toLowerCase() === String(target["Vehicle Number"]).trim().toLowerCase()
  ).length;

  if (!cascade && linkedSales > 0) {
    throw new ApiError(409, `Cannot delete vehicle. Linked sales found (${linkedSales}). Use force delete to remove linked sales.`);
  }

  if (cascade && linkedSales > 0) {
    const salesToDelete = salesRows
      .filter(
        (row) =>
          String(row.Vehicle || "").trim().toLowerCase() ===
          String(target["Vehicle Number"]).trim().toLowerCase()
      )
      .map((row) => row.__rowNumber);
    await sheetsService.deleteRows(SHEETS.SALES, salesToDelete);
  }

  await sheetsService.deleteRow(SHEETS.VEHICLES, target.__rowNumber);
}

async function getMaterials() {
  const rows = await sheetsService.readRows(SHEETS.MATERIALS, HEADERS[SHEETS.MATERIALS]);
  const mapped = rows.map((row) => ({
    rowNumber: row.__rowNumber,
    materialId: row["Material ID"],
    name: row.Name,
    price: roundTo2(toNumber(row.Price, 0)),
    isActive: String(row["Is Active"]).toLowerCase() !== "false"
  }));

  // Guard against accidental duplicate material rows in Google Sheets.
  // Keep a single record per material name, preferring active entries.
  const byName = new Map();
  for (const material of mapped) {
    const key = String(material.name || "").trim().toLowerCase();
    if (!key) continue;

    const existing = byName.get(key);
    if (!existing || (!existing.isActive && material.isActive)) {
      byName.set(key, material);
    }
  }

  return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
}

async function addMaterial(payload) {
  const rows = await sheetsService.readRows(SHEETS.MATERIALS, HEADERS[SHEETS.MATERIALS]);
  const duplicate = rows.find((row) => String(row.Name).toLowerCase() === String(payload.name).toLowerCase());
  if (duplicate) throw new ApiError(409, "Material already exists.");

  const materialId = createId("MAT", rows, "Material ID");
  const material = {
    "Material ID": materialId,
    Name: payload.name,
    Price: roundTo2(toNumber(payload.price, 0)),
    "Is Active": payload.isActive === false ? "FALSE" : "TRUE"
  };

  await sheetsService.appendRow(SHEETS.MATERIALS, HEADERS[SHEETS.MATERIALS], material);
  return { materialId, name: payload.name, price: roundTo2(toNumber(payload.price, 0)), isActive: payload.isActive !== false };
}

async function updateMaterial(materialId, payload) {
  const rows = await sheetsService.readRows(SHEETS.MATERIALS, HEADERS[SHEETS.MATERIALS]);
  const target = rows.find((row) => row["Material ID"] === materialId);
  if (!target) throw new ApiError(404, "Material not found.");

  const row = {
    "Material ID": materialId,
    Name: payload.name ?? target.Name,
    Price: payload.price === undefined ? roundTo2(toNumber(target.Price, 0)) : roundTo2(toNumber(payload.price, 0)),
    "Is Active": payload.isActive === undefined ? target["Is Active"] : payload.isActive ? "TRUE" : "FALSE"
  };

  await sheetsService.updateRow(SHEETS.MATERIALS, target.__rowNumber, HEADERS[SHEETS.MATERIALS], row);
  return {
    materialId,
    name: row.Name,
    price: roundTo2(toNumber(row.Price, 0)),
    isActive: String(row["Is Active"]).toLowerCase() !== "false"
  };
}

async function deleteMaterial(materialId) {
  const rows = await sheetsService.readRows(SHEETS.MATERIALS, HEADERS[SHEETS.MATERIALS]);
  const target = rows.find((row) => row["Material ID"] === materialId);
  if (!target) throw new ApiError(404, "Material not found.");

  const normalizedName = String(target.Name || "").trim().toLowerCase();
  const matches = rows
    .filter((row) => {
      if (row["Material ID"] === materialId) return true;
      return String(row.Name || "").trim().toLowerCase() === normalizedName;
    })
    .sort((a, b) => b.__rowNumber - a.__rowNumber);

  await sheetsService.deleteRows(
    SHEETS.MATERIALS,
    matches.map((row) => row.__rowNumber)
  );
}

async function updateCustomerBalance(customerId, balance) {
  const rows = await sheetsService.readRows(SHEETS.CUSTOMERS, HEADERS[SHEETS.CUSTOMERS]);
  const target = rows.find((row) => row["Customer ID"] === customerId);
  if (!target) throw new ApiError(404, "Customer not found.");

  const row = {
    "Customer ID": target["Customer ID"],
    Name: target.Name,
    Phone: target.Phone,
    Address: target.Address,
    Balance: roundTo2(balance)
  };
  await sheetsService.updateRow(SHEETS.CUSTOMERS, target.__rowNumber, HEADERS[SHEETS.CUSTOMERS], row);
}

async function createLedgerEntry(payload) {
  const rows = await sheetsService.readRows(SHEETS.LEDGER, HEADERS[SHEETS.LEDGER]);
  const ledgerId = createId("LED", rows, "Ledger ID");
  const row = {
    Date: payload.date,
    "Ledger ID": ledgerId,
    "Customer ID": payload.customerId,
    Credit: roundTo2(toNumber(payload.credit, 0)),
    Debit: roundTo2(toNumber(payload.debit, 0)),
    Balance: roundTo2(toNumber(payload.balance, 0)),
    Reference: payload.reference || "",
    Type: payload.type || "",
    Notes: payload.notes || ""
  };

  await sheetsService.appendRow(SHEETS.LEDGER, HEADERS[SHEETS.LEDGER], row);
  return { ledgerId, ...payload };
}

async function recomputeCustomerBalanceFromLedger(customerId) {
  const rows = await sheetsService.readRows(SHEETS.LEDGER, HEADERS[SHEETS.LEDGER]);
  const customerRows = rows
    .filter((row) => row["Customer ID"] === customerId)
    .sort((a, b) => {
      const dateCompare = String(a.Date || "").localeCompare(String(b.Date || ""));
      if (dateCompare !== 0) return dateCompare;
      return String(a["Ledger ID"] || "").localeCompare(String(b["Ledger ID"] || ""));
    });

  let balance = getOpeningBaseBalance(customerId);
  for (const row of customerRows) {
    balance = roundTo2(balance + toNumber(row.Credit, 0) - toNumber(row.Debit, 0));
    row.Balance = balance;
  }

  for (const row of customerRows) {
    await sheetsService.updateRow(SHEETS.LEDGER, row.__rowNumber, HEADERS[SHEETS.LEDGER], {
      Date: row.Date,
      "Ledger ID": row["Ledger ID"],
      "Customer ID": row["Customer ID"],
      Credit: roundTo2(toNumber(row.Credit, 0)),
      Debit: roundTo2(toNumber(row.Debit, 0)),
      Balance: roundTo2(toNumber(row.Balance, 0)),
      Reference: row.Reference || "",
      Type: row.Type || "",
      Notes: row.Notes || ""
    });
  }

  await updateCustomerBalance(customerId, balance);
  return balance;
}

async function syncSalesBalancesFromLedger(customerId) {
  const [salesRows, ledgerRows] = await Promise.all([
    sheetsService.readRows(SHEETS.SALES, HEADERS[SHEETS.SALES]),
    sheetsService.readRows(SHEETS.LEDGER, HEADERS[SHEETS.LEDGER])
  ]);

  const ledgerByReference = new Map();
  for (const row of ledgerRows) {
    if (String(row["Customer ID"] || "").trim() !== String(customerId || "").trim()) continue;
    const reference = String(row.Reference || "").trim();
    if (!reference) continue;
    ledgerByReference.set(reference, roundTo2(toNumber(row.Balance, 0)));
  }

  const customerSales = salesRows.filter((row) => row["Customer ID"] === customerId);
  for (const saleRow of customerSales) {
    const saleId = String(saleRow["Sale ID"] || "").trim();
    const slipNo = String(saleRow["Slip No"] || "").trim();
    const nextBalance =
      ledgerByReference.get(`SALE:${saleId}`) ??
      ledgerByReference.get(slipNo);
    if (nextBalance === undefined) continue;

    await sheetsService.updateRow(SHEETS.SALES, saleRow.__rowNumber, HEADERS[SHEETS.SALES], {
      Date: saleRow.Date,
      "Slip No": saleRow["Slip No"],
      "Sale ID": saleRow["Sale ID"],
      Type: saleRow.Type || "SALE",
      "Customer ID": saleRow["Customer ID"],
      Product: saleRow.Product || "",
      Vehicle: saleRow.Vehicle || "",
      Material: saleRow.Material || "",
      Quantity: roundTo2(toNumber(saleRow.Quantity, 0)),
      Rate: roundTo2(toNumber(saleRow.Rate, 0)),
      Amount: roundTo2(toNumber(saleRow.Amount, 0)),
      GST: saleRow.GST === "" ? "" : roundTo2(toNumber(saleRow.GST, 0)),
      Total: roundTo2(toNumber(saleRow.Total, 0)),
      Balance: nextBalance
    });
  }
}

async function createSale(payload) {
  const date = formatDateISO(payload.date || new Date());
  if (!date) throw new ApiError(400, "Invalid date.");

  const [customers, vehicles, materials, salesRows] = await Promise.all([
    getCustomers(),
    getVehicles(),
    getMaterials(),
    sheetsService.readRows(SHEETS.SALES, HEADERS[SHEETS.SALES])
  ]);

  const transactionType = String(payload.transactionType || "sale").toLowerCase();
  if (!["sale", "purchase"].includes(transactionType)) {
    throw new ApiError(400, "transactionType must be either sale or purchase.");
  }

  const customer = customers.find((item) => item.customerId === payload.customerId);
  if (!customer) throw new ApiError(404, "Customer not found.");

  let vehicle = null;
  let material = null;
  if (transactionType === "sale") {
    vehicle = vehicles.find((item) => item.vehicleId === payload.vehicleId);
    if (!vehicle) throw new ApiError(404, "Vehicle not found.");

    material = materials.find((item) => item.materialId === payload.materialId && item.isActive);
    if (!material) throw new ApiError(404, "Material not found or inactive.");

  } else {
    if (payload.vehicleId) {
      vehicle = vehicles.find((item) => item.vehicleId === payload.vehicleId) || null;
    }
    if (payload.materialId) {
      material = materials.find((item) => item.materialId === payload.materialId && item.isActive) || null;
    }
  }
  const product = material?.name || "General Purchase";

  const quantity = roundTo2(toNumber(payload.quantity));
  const rate = roundTo2(toNumber(payload.rate));
  if (quantity <= 0 || rate <= 0) throw new ApiError(400, "Quantity and rate must be greater than 0.");

  const amount = roundTo2(quantity * rate);
  const gstProvided = payload.gst !== null && payload.gst !== undefined && payload.gst !== "";
  const gst = gstProvided ? roundTo2(toNumber(payload.gst, 0)) : null;
  const total = roundTo2(amount + (gst ?? 0));

  const oldBalance = roundTo2(toNumber(customer.balance));
  const balanceEffect = transactionType === "purchase" ? "subtract" : "add";
  const delta = transactionType === "purchase" ? -total : total;
  const { credit, debit } = mapDeltaToCreditDebit(delta);

  const newBalance = roundTo2(oldBalance + credit - debit);

  const saleId = String(payload.saleId || "").trim() || createId("SAL", salesRows, "Sale ID");

  await sheetsService.appendRow(SHEETS.SALES, HEADERS[SHEETS.SALES], {
    Date: date,
    "Slip No": payload.slipNo,
    "Sale ID": saleId,
    Type: transactionType.toUpperCase(),
    "Customer ID": customer.customerId,
    Product: product,
    Vehicle: vehicle?.vehicleNumber || "",
    Material: material?.name || "",
    Quantity: quantity,
    Rate: rate,
    Amount: amount,
    GST: gst === null ? "" : gst,
    Total: total,
    Balance: newBalance
  });

  await createLedgerEntry({
    date,
    customerId: customer.customerId,
    credit,
    debit,
    balance: newBalance,
    reference: `SALE:${saleId}`,
    type: transactionType.toUpperCase(),
    notes:
      transactionType === "sale"
        ? `${product} (${quantity} units)`
        : `Purchase: ${product} (${quantity} units)`
  });

  await recomputeCustomerBalanceFromLedger(customer.customerId);
  await syncSalesBalancesFromLedger(customer.customerId);

  return {
    saleId,
    type: transactionType,
    balanceEffect,
    date,
    slipNo: payload.slipNo,
    customerId: customer.customerId,
    customerName: customer.name,
    vehicle: vehicle?.vehicleNumber || "",
    product,
    material: material?.name || "",
    quantity,
    rate,
    amount,
    gst,
    total,
    previousBalance: oldBalance,
    balance: newBalance
  };
}

async function updateSale(saleId, payload) {
  const salesRows = await sheetsService.readRows(SHEETS.SALES, HEADERS[SHEETS.SALES]);
  const target = salesRows.find((row) => row["Sale ID"] === saleId);
  if (!target) throw new ApiError(404, "Sale not found.");

  await deleteSale(saleId);
  return createSale({
    saleId,
    date: payload.date ?? target.Date,
    slipNo: payload.slipNo ?? target["Slip No"],
    transactionType: String(payload.transactionType || target.Type || "SALE").toLowerCase(),
    customerId: payload.customerId ?? target["Customer ID"],
    vehicleId: payload.vehicleId || "",
    materialId: payload.materialId || "",
    quantity: payload.quantity ?? toNumber(target.Quantity, 0),
    rate: payload.rate ?? toNumber(target.Rate, 0),
    gst: payload.gst === undefined ? target.GST : payload.gst
  });
}

async function getSales(date) {
  const salesRows = await sheetsService.readRows(SHEETS.SALES, HEADERS[SHEETS.SALES]);
  const customers = await getCustomers();
  const customerMap = Object.fromEntries(customers.map((customer) => [customer.customerId, customer.name]));

  const filtered = date ? salesRows.filter((row) => row.Date === date) : salesRows;

  return filtered.map((row) => ({
    quantity: roundTo2(toNumber(row.Quantity)),
    rate: roundTo2(toNumber(row.Rate)),
    gst: row.GST === "" ? null : roundTo2(toNumber(row.GST, 0)),
    amount: roundTo2(toNumber(row.Quantity) * toNumber(row.Rate)),
    total: roundTo2(roundTo2(toNumber(row.Quantity) * toNumber(row.Rate)) + (row.GST === "" ? 0 : toNumber(row.GST, 0))),
    date: row.Date,
    slipNo: row["Slip No"],
    saleId: row["Sale ID"],
    type: row.Type || "SALE",
    customerId: row["Customer ID"],
    customerName: customerMap[row["Customer ID"]] || row["Customer ID"],
    product: row.Product || row.Material || "",
    vehicle: row.Vehicle,
    material: row.Material,
    balance: roundTo2(toNumber(row.Balance))
  }));
}

async function deleteSale(saleId) {
  const salesRows = await sheetsService.readRows(SHEETS.SALES, HEADERS[SHEETS.SALES]);
  const target = salesRows.find((row) => row["Sale ID"] === saleId);
  if (!target) throw new ApiError(404, "Sale not found.");

  const customerId = target["Customer ID"];
  const salesToDelete = salesRows
    .filter((row) => row["Sale ID"] === saleId)
    .sort((a, b) => b.__rowNumber - a.__rowNumber);

  const ledgerRows = await sheetsService.readRows(SHEETS.LEDGER, HEADERS[SHEETS.LEDGER]);
  let ledgerToDelete = ledgerRows
    .filter((row) => String(row.Reference || "").trim() === `SALE:${saleId}`)
    .sort((a, b) => b.__rowNumber - a.__rowNumber);

  // Backward compatibility: old rows used slip number as reference.
  if (!ledgerToDelete.length) {
    ledgerToDelete = ledgerRows
      .filter(
        (row) =>
          row["Customer ID"] === customerId &&
          String(row.Reference || "").trim() === String(target["Slip No"] || "").trim() &&
          ["SALE", "PURCHASE"].includes(String(row.Type || "").toUpperCase())
      )
      .sort((a, b) => b.__rowNumber - a.__rowNumber);
  }

  await sheetsService.deleteRows(
    SHEETS.SALES,
    salesToDelete.map((row) => row.__rowNumber)
  );
  await sheetsService.deleteRows(
    SHEETS.LEDGER,
    ledgerToDelete.map((row) => row.__rowNumber)
  );

  const balance = await recomputeCustomerBalanceFromLedger(customerId);
  await syncSalesBalancesFromLedger(customerId);
  return {
    saleId,
    customerId,
    deletedSalesRows: salesToDelete.length,
    deletedLedgerRows: ledgerToDelete.length,
    balance
  };
}

async function recordPayment(payload) {
  const date = formatDateISO(payload.date || new Date());
  if (!date) throw new ApiError(400, "Invalid date.");

  const customer = await getCustomerById(payload.customerId);
  if (!customer) throw new ApiError(404, "Customer not found.");

  const debit = roundTo2(toNumber(payload.amount));
  if (debit <= 0) throw new ApiError(400, "Payment amount must be greater than 0.");

  const oldBalance = roundTo2(toNumber(customer.balance));
  const newBalance = roundTo2(oldBalance - debit);

  await createLedgerEntry({
    date,
    customerId: payload.customerId,
    credit: 0,
    debit,
    balance: newBalance,
    reference: payload.reference || "PAYMENT",
    type: "PAYMENT",
    notes: payload.notes || ""
  });

  await updateCustomerBalance(payload.customerId, newBalance);

  return {
    customerId: payload.customerId,
    date,
    previousBalance: oldBalance,
    transactionAmount: debit,
    balance: newBalance
  };
}

async function addLedgerEntry(payload) {
  const date = formatDateISO(payload.date || new Date());
  if (!date) throw new ApiError(400, "Invalid date.");

  const customer = await getCustomerById(payload.customerId);
  if (!customer) throw new ApiError(404, "Customer not found.");

  const amount = roundTo2(toNumber(payload.amount));
  if (amount <= 0) throw new ApiError(400, "Amount must be greater than 0.");

  const entryType = String(payload.entryType || "").toLowerCase();
  if (!["credit", "debit"].includes(entryType)) {
    throw new ApiError(400, "entryType must be either 'credit' or 'debit'.");
  }

  const delta = entryType === "credit" ? amount : -amount;
  const { credit, debit } = mapDeltaToCreditDebit(delta);

  const oldBalance = roundTo2(toNumber(customer.balance));
  const newBalance = roundTo2(oldBalance + credit - debit);

  await createLedgerEntry({
    date,
    customerId: payload.customerId,
    credit,
    debit,
    balance: newBalance,
    reference: payload.reference || (entryType === "credit" ? "CREDIT" : "DEBIT"),
    type: entryType.toUpperCase(),
    notes: payload.notes || ""
  });

  await updateCustomerBalance(payload.customerId, newBalance);

  return {
    customerId: payload.customerId,
    date,
    entryType,
    previousBalance: oldBalance,
    transactionAmount: amount,
    balance: newBalance
  };
}

async function getLedger(customerId) {
  const rows = await sheetsService.readRows(SHEETS.LEDGER, HEADERS[SHEETS.LEDGER]);
  const customers = await getCustomers();
  const customerMap = Object.fromEntries(customers.map((customer) => [customer.customerId, customer.name]));

  const filtered = customerId ? rows.filter((row) => row["Customer ID"] === customerId) : rows;

  const transactions = filtered
    .map((row) => ({
      date: row.Date,
      ledgerId: row["Ledger ID"],
      customerId: row["Customer ID"],
      customerName: customerMap[row["Customer ID"]] || row["Customer ID"],
      credit: roundTo2(toNumber(row.Credit)),
      debit: roundTo2(toNumber(row.Debit)),
      balance: roundTo2(toNumber(row.Balance)),
      reference: row.Reference,
      type: row.Type,
      notes: row.Notes
    }))
    .sort((a, b) => {
      if (a.date === b.date) return a.ledgerId.localeCompare(b.ledgerId);
      return a.date.localeCompare(b.date);
    });

  let previousBalance = 0;
  const withPrevious = transactions.map((entry) => {
    const item = {
      ...entry,
      previousBalance,
      transactionAmount: entry.credit > 0 ? entry.credit : entry.debit
    };
    previousBalance = entry.balance;
    return item;
  });

  return withPrevious;
}

function rangeFromType(type, dateRef) {
  const baseDate = dateRef ? new Date(dateRef) : new Date();
  if (Number.isNaN(baseDate.getTime())) throw new ApiError(400, "Invalid report date.");

  if (type === "daily") {
    const day = formatDateISO(baseDate);
    return { start: day, end: day };
  }

  if (type === "weekly") return getWeekBounds(baseDate);
  if (type === "monthly") return getMonthBounds(baseDate);

  throw new ApiError(400, "Invalid report type.");
}

async function getReport(type, dateRef, filters = {}) {
  const defaultRange = rangeFromType(type, dateRef);
  const start = filters.from || defaultRange.start;
  const end = filters.to || defaultRange.end;
  const [sales, ledgerRows] = await Promise.all([
    getSales(),
    sheetsService.readRows(SHEETS.LEDGER, HEADERS[SHEETS.LEDGER])
  ]);

  const ledgerByReference = new Map();
  for (const row of ledgerRows) {
    const reference = String(row.Reference || "").trim();
    if (!reference) continue;
    ledgerByReference.set(reference, {
      credit: roundTo2(toNumber(row.Credit, 0)),
      debit: roundTo2(toNumber(row.Debit, 0))
    });
  }

  const filtered = sales.filter((row) => {
    if (!isWithinRange(row.date, start, end)) return false;
    if (filters.customerId && row.customerId !== filters.customerId) return false;
    return true;
  }).sort((a, b) => {
    const dateCompare = String(a.date || "").localeCompare(String(b.date || ""));
    if (dateCompare !== 0) return dateCompare;
    return String(a.saleId || "").localeCompare(String(b.saleId || ""));
  });

  const statementRows = filtered.map((row) => {
    const ledgerEntry =
      ledgerByReference.get(`SALE:${row.saleId}`) ||
      ledgerByReference.get(String(row.slipNo || "").trim()) ||
      null;
    const fallbackCredit = String(row.type || "SALE").toUpperCase() === "PURCHASE" ? 0 : roundTo2(toNumber(row.total, 0));
    const fallbackDebit = String(row.type || "SALE").toUpperCase() === "PURCHASE" ? roundTo2(toNumber(row.total, 0)) : 0;
    return {
      date: row.date,
      reference: row.slipNo,
      description: row.product || row.material,
      vehicle: row.vehicle || "",
      quantity: row.quantity,
      rate: row.rate,
      amount: row.amount,
      gst: row.gst ?? "",
      total: row.total,
      credit: ledgerEntry ? ledgerEntry.credit : fallbackCredit,
      debit: ledgerEntry ? ledgerEntry.debit : fallbackDebit,
      balance: row.balance
    };
  });

  const totals = filtered.reduce(
    (acc, row) => {
      acc.amount += row.amount;
      acc.gst += row.gst ?? 0;
      acc.total += row.total;
      return acc;
    },
    { amount: 0, gst: 0, total: 0 }
  );
  const creditDebitTotals = statementRows.reduce(
    (acc, row) => {
      acc.credit += row.credit;
      acc.debit += row.debit;
      return acc;
    },
    { credit: 0, debit: 0 }
  );

  const firstRow = filtered[0] || null;
  const manualOpeningTypes = new Set(["CREDIT", "DEBIT", "PAYMENT"]);
  const filteredCustomerIds = Array.from(new Set(filtered.map((row) => String(row.customerId || "").trim()).filter(Boolean)));
  const openingCustomerId = filters.customerId || (filteredCustomerIds.length === 1 ? filteredCustomerIds[0] : "");

  let manualOpeningDelta = 0;
  if (openingCustomerId) {
    const manualRows = ledgerRows
      .filter((row) => {
        const cid = String(row["Customer ID"] || "").trim();
        const rowType = String(row.Type || "").trim().toUpperCase();
        return cid === openingCustomerId && manualOpeningTypes.has(rowType);
      })
      .sort((a, b) => {
        const dateCompare = String(a.Date || "").localeCompare(String(b.Date || ""));
        if (dateCompare !== 0) return dateCompare;
        return String(a["Ledger ID"] || "").localeCompare(String(b["Ledger ID"] || ""));
      });
    manualOpeningDelta = roundTo2(
      manualRows.reduce((acc, row) => acc + toNumber(row.Credit, 0) - toNumber(row.Debit, 0), 0)
    );
  }

  const openingOverride = process.env.REPORT_OPENING_BALANCE_OVERRIDE;
  let openingBalance = openingOverride !== undefined && openingOverride !== ""
    ? roundTo2(toNumber(openingOverride, 0) + manualOpeningDelta)
    : 0;
  if ((openingOverride === undefined || openingOverride === "") && firstRow) {
    const sign = String(firstRow.type || "SALE").toUpperCase() === "PURCHASE" ? -1 : 1;
    openingBalance = roundTo2(toNumber(firstRow.balance, 0) - sign * toNumber(firstRow.total, 0));
  }

  let runningBalance = openingBalance;
  for (const row of statementRows) {
    runningBalance = roundTo2(runningBalance + toNumber(row.credit, 0) - toNumber(row.debit, 0));
    row.balance = runningBalance;
  }
  const closingBalance = statementRows.length ? runningBalance : openingBalance;

  // Keep report table rows in sync with recalculated running balance.
  // This avoids stale/incorrect stored balances appearing in UI.
  const balanceBySaleId = new Map();
  statementRows.forEach((row, index) => {
    const saleId = filtered[index]?.saleId;
    if (saleId) {
      balanceBySaleId.set(saleId, row.balance);
    }
  });

  const normalizedRows = filtered.map((row) => ({
    ...row,
    balance: balanceBySaleId.get(row.saleId) ?? row.balance
  }));

  const statement = {
    companyName: "Saravana Blue Metals",
    statementType: `${type.toUpperCase()} STATEMENT`,
    partyName: "All Customers",
    period: `${start} to ${end}`,
    openingBalance,
    closingBalance,
    rows: statementRows,
    totals: {
      amount: roundTo2(totals.amount),
      gst: roundTo2(totals.gst),
      total: roundTo2(totals.total),
      credit: roundTo2(creditDebitTotals.credit),
      debit: roundTo2(creditDebitTotals.debit)
    }
  };

  return {
    range: { start, end },
    rows: normalizedRows,
    totals: {
      amount: roundTo2(totals.amount),
      gst: roundTo2(totals.gst),
      total: roundTo2(totals.total)
    },
    statement
  };
}

async function getCustomerStatement(customerId, fromDate, toDate) {
  const customer = await getCustomerById(customerId);
  if (!customer) throw new ApiError(404, "Customer not found.");

  const rows = await sheetsService.readRows(SHEETS.LEDGER, HEADERS[SHEETS.LEDGER]);
  const ledgerRows = rows
    .filter((row) => row["Customer ID"] === customerId)
    .sort((a, b) => {
      const dateCompare = String(a.Date || "").localeCompare(String(b.Date || ""));
      if (dateCompare !== 0) return dateCompare;
      return String(a["Ledger ID"] || "").localeCompare(String(b["Ledger ID"] || ""));
    });

  const start = fromDate || (ledgerRows[0]?.Date || formatDateISO(new Date()));
  const end = toDate || (ledgerRows[ledgerRows.length - 1]?.Date || formatDateISO(new Date()));

  const filtered = ledgerRows.filter((row) => row.Date >= start && row.Date <= end);
  const openingRows = ledgerRows.filter((row) => row.Date < start);
  const openingBalance = openingRows.length ? roundTo2(toNumber(openingRows[openingRows.length - 1].Balance, 0)) : 0;

  let running = openingBalance;
  const statementRows = filtered.map((row) => {
    const credit = roundTo2(toNumber(row.Credit, 0));
    const debit = roundTo2(toNumber(row.Debit, 0));
    running = roundTo2(running + credit - debit);
    return {
      date: row.Date,
      reference: row.Reference || row["Ledger ID"],
      description: row.Notes || row.Type || "",
      credit,
      debit,
      balance: running
    };
  });

  const totals = statementRows.reduce(
    (acc, row) => {
      acc.credit += row.credit;
      acc.debit += row.debit;
      return acc;
    },
    { credit: 0, debit: 0 }
  );

  const closingBalance = statementRows.length ? statementRows[statementRows.length - 1].balance : openingBalance;

  return {
    customerId,
    customerName: customer.name,
    range: { start, end },
    rows: statementRows,
    totals: {
      credit: roundTo2(totals.credit),
      debit: roundTo2(totals.debit)
    },
    statement: {
      companyName: "Saravana Blue Metals",
      statementType: "CUSTOMER STATEMENT",
      partyName: customer.name,
      period: `${start} to ${end}`,
      openingBalance,
      closingBalance,
      rows: statementRows,
      totals: {
        credit: roundTo2(totals.credit),
        debit: roundTo2(totals.debit)
      }
    }
  };
}

async function getDashboardSummary() {
  const today = formatDateISO(new Date());
  const [sales, customers] = await Promise.all([getSales(), getCustomers()]);

  const dailyRevenue = roundTo2(
    sales.filter((row) => row.date === today).reduce((acc, row) => acc + row.total, 0)
  );

  const totalSales = roundTo2(sales.reduce((acc, row) => acc + row.total, 0));
  const outstandingBalance = roundTo2(customers.reduce((acc, customer) => acc + customer.balance, 0));

  const revenueByDayMap = {};
  sales.forEach((row) => {
    revenueByDayMap[row.date] = roundTo2((revenueByDayMap[row.date] || 0) + row.total);
  });

  const revenueByDay = Object.entries(revenueByDayMap)
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);

  return {
    dailyRevenue,
    totalSales,
    outstandingBalance,
    totalTransactions: sales.length,
    revenueByDay
  };
}

module.exports = {
  getCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  getMaterials,
  addMaterial,
  updateMaterial,
  deleteMaterial,
  createSale,
  updateSale,
  deleteSale,
  getSales,
  recordPayment,
  addLedgerEntry,
  getLedger,
  getReport,
  getCustomerStatement,
  getDashboardSummary
};
