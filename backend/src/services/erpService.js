const { HEADERS, SHEETS } = require("../constants/masterData");
const sheetsService = require("./sheetsService");
const { createId } = require("./bootstrapService");
const ApiError = require("../utils/apiError");
const { toNumber, roundTo2 } = require("../utils/number");
const { formatDateISO, getMonthBounds, getWeekBounds, isWithinRange } = require("../utils/date");

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

  await sheetsService.appendRow(SHEETS.CUSTOMERS, HEADERS[SHEETS.CUSTOMERS], {
    "Customer ID": customerId,
    Name: payload.name,
    Phone: payload.phone || "",
    Address: payload.address || "",
    Balance: balance
  });

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

async function deleteCustomer(customerId) {
  const rows = await sheetsService.readRows(SHEETS.CUSTOMERS, HEADERS[SHEETS.CUSTOMERS]);
  const target = rows.find((row) => row["Customer ID"] === customerId);
  if (!target) throw new ApiError(404, "Customer not found.");

  const matches = rows
    .filter((row) => row["Customer ID"] === customerId)
    .sort((a, b) => b.__rowNumber - a.__rowNumber);

  for (const row of matches) {
    await sheetsService.deleteRow(SHEETS.CUSTOMERS, row.__rowNumber);
  }
}

async function getVehicles() {
  const rows = await sheetsService.readRows(SHEETS.VEHICLES, HEADERS[SHEETS.VEHICLES]);
  return rows.map((row) => ({
    rowNumber: row.__rowNumber,
    vehicleId: row["Vehicle ID"],
    vehicleNumber: row["Vehicle Number"]
  }));
}

async function addVehicle(payload) {
  const rows = await sheetsService.readRows(SHEETS.VEHICLES, HEADERS[SHEETS.VEHICLES]);
  const duplicate = rows.find(
    (row) => String(row["Vehicle Number"]).toLowerCase() === String(payload.vehicleNumber).toLowerCase()
  );
  if (duplicate) throw new ApiError(409, "Vehicle number already exists.");

  const vehicleId = createId("VEH", rows, "Vehicle ID");
  await sheetsService.appendRow(SHEETS.VEHICLES, HEADERS[SHEETS.VEHICLES], {
    "Vehicle ID": vehicleId,
    "Vehicle Number": payload.vehicleNumber
  });

  return { vehicleId, vehicleNumber: payload.vehicleNumber };
}

async function updateVehicle(vehicleId, payload) {
  const rows = await sheetsService.readRows(SHEETS.VEHICLES, HEADERS[SHEETS.VEHICLES]);
  const target = rows.find((row) => row["Vehicle ID"] === vehicleId);
  if (!target) throw new ApiError(404, "Vehicle not found.");

  const row = {
    "Vehicle ID": vehicleId,
    "Vehicle Number": payload.vehicleNumber ?? target["Vehicle Number"]
  };

  await sheetsService.updateRow(SHEETS.VEHICLES, target.__rowNumber, HEADERS[SHEETS.VEHICLES], row);
  return { vehicleId, vehicleNumber: row["Vehicle Number"] };
}

async function deleteVehicle(vehicleId) {
  const rows = await sheetsService.readRows(SHEETS.VEHICLES, HEADERS[SHEETS.VEHICLES]);
  const target = rows.find((row) => row["Vehicle ID"] === vehicleId);
  if (!target) throw new ApiError(404, "Vehicle not found.");

  const normalizedVehicle = String(target["Vehicle Number"] || "").trim().toLowerCase();
  const matches = rows
    .filter((row) => {
      if (row["Vehicle ID"] === vehicleId) return true;
      return String(row["Vehicle Number"] || "").trim().toLowerCase() === normalizedVehicle;
    })
    .sort((a, b) => b.__rowNumber - a.__rowNumber);

  for (const row of matches) {
    await sheetsService.deleteRow(SHEETS.VEHICLES, row.__rowNumber);
  }
}

async function getMaterials() {
  const rows = await sheetsService.readRows(SHEETS.MATERIALS, HEADERS[SHEETS.MATERIALS]);
  const mapped = rows.map((row) => ({
    rowNumber: row.__rowNumber,
    materialId: row["Material ID"],
    name: row.Name,
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
    "Is Active": payload.isActive === false ? "FALSE" : "TRUE"
  };

  await sheetsService.appendRow(SHEETS.MATERIALS, HEADERS[SHEETS.MATERIALS], material);
  return { materialId, name: payload.name, isActive: payload.isActive !== false };
}

async function updateMaterial(materialId, payload) {
  const rows = await sheetsService.readRows(SHEETS.MATERIALS, HEADERS[SHEETS.MATERIALS]);
  const target = rows.find((row) => row["Material ID"] === materialId);
  if (!target) throw new ApiError(404, "Material not found.");

  const row = {
    "Material ID": materialId,
    Name: payload.name ?? target.Name,
    "Is Active": payload.isActive === undefined ? target["Is Active"] : payload.isActive ? "TRUE" : "FALSE"
  };

  await sheetsService.updateRow(SHEETS.MATERIALS, target.__rowNumber, HEADERS[SHEETS.MATERIALS], row);
  return {
    materialId,
    name: row.Name,
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

  for (const row of matches) {
    await sheetsService.deleteRow(SHEETS.MATERIALS, row.__rowNumber);
  }
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
  let product = String(payload.product || "").trim();

  if (transactionType === "sale") {
    vehicle = vehicles.find((item) => item.vehicleId === payload.vehicleId);
    if (!vehicle) throw new ApiError(404, "Vehicle not found.");

    material = materials.find((item) => item.materialId === payload.materialId && item.isActive);
    if (!material) throw new ApiError(404, "Material not found or inactive.");

    if (!product) {
      product = material.name;
    }
  } else {
    if (payload.vehicleId) {
      vehicle = vehicles.find((item) => item.vehicleId === payload.vehicleId) || null;
    }
    if (payload.materialId) {
      material = materials.find((item) => item.materialId === payload.materialId && item.isActive) || null;
    }
    if (!product) {
      product = material?.name || "General Purchase";
    }
  }

  const quantity = roundTo2(toNumber(payload.quantity));
  const rate = roundTo2(toNumber(payload.rate));
  if (quantity <= 0 || rate <= 0) throw new ApiError(400, "Quantity and rate must be greater than 0.");

  const amount = roundTo2(quantity * rate);
  const gstProvided = payload.gst !== null && payload.gst !== undefined && payload.gst !== "";
  const gst = gstProvided ? roundTo2(toNumber(payload.gst, 0)) : null;
  const total = roundTo2(amount + (gst ?? 0));

  const oldBalance = roundTo2(toNumber(customer.balance));
  const balanceEffect = String(payload.balanceEffect || (transactionType === "purchase" ? "add" : "add")).toLowerCase();
  let credit = 0;
  let debit = 0;

  if (transactionType === "sale") {
    credit = total;
  } else if (balanceEffect === "subtract") {
    debit = total;
  } else {
    credit = total;
  }

  const newBalance = roundTo2(oldBalance + credit - debit);

  const saleId = createId("SAL", salesRows, "Sale ID");

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
    reference: payload.slipNo,
    type: transactionType.toUpperCase(),
    notes:
      transactionType === "sale"
        ? `${product} (${quantity} units)`
        : `Purchase: ${product} (${quantity} units)`
  });

  await updateCustomerBalance(customer.customerId, newBalance);

  return {
    saleId,
    type: transactionType,
    balanceEffect,
    date,
    slipNo: payload.slipNo,
    customerId: customer.customerId,
    customerName: customer.name,
    vehicle: vehicle.vehicleNumber,
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

async function getSales(date) {
  const salesRows = await sheetsService.readRows(SHEETS.SALES, HEADERS[SHEETS.SALES]);
  const customers = await getCustomers();
  const customerMap = Object.fromEntries(customers.map((customer) => [customer.customerId, customer.name]));

  const filtered = date ? salesRows.filter((row) => row.Date === date) : salesRows;

  return filtered.map((row) => ({
    date: row.Date,
    slipNo: row["Slip No"],
    saleId: row["Sale ID"],
    type: row.Type || "SALE",
    customerId: row["Customer ID"],
    customerName: customerMap[row["Customer ID"]] || row["Customer ID"],
    product: row.Product || row.Material || "",
    vehicle: row.Vehicle,
    material: row.Material,
    quantity: roundTo2(toNumber(row.Quantity)),
    rate: roundTo2(toNumber(row.Rate)),
    amount: roundTo2(toNumber(row.Amount)),
    gst: row.GST === "" ? null : roundTo2(toNumber(row.GST, 0)),
    total: roundTo2(toNumber(row.Total)),
    balance: roundTo2(toNumber(row.Balance))
  }));
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

  const credit = entryType === "credit" ? amount : 0;
  const debit = entryType === "debit" ? amount : 0;

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

async function getReport(type, dateRef) {
  const { start, end } = rangeFromType(type, dateRef);
  const sales = await getSales();

  const filtered = sales.filter((row) => isWithinRange(row.date, start, end));
  const totals = filtered.reduce(
    (acc, row) => {
      acc.amount += row.amount;
      acc.gst += row.gst ?? 0;
      acc.total += row.total;
      return acc;
    },
    { amount: 0, gst: 0, total: 0 }
  );

  return {
    range: { start, end },
    rows: filtered,
    totals: {
      amount: roundTo2(totals.amount),
      gst: roundTo2(totals.gst),
      total: roundTo2(totals.total)
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
  getSales,
  recordPayment,
  addLedgerEntry,
  getLedger,
  getReport,
  getDashboardSummary
};
