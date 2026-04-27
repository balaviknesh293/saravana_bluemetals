const DEFAULT_MATERIALS = [
  "1/4 Jalli",
  "1/2 Jalli",
  "3/4 Jalli",
  "1 1/2 Jalli",
  "M Sand",
  "P Sand",
  "Dust",
  "Cool Dust",
  "Boulder",
  "Soling"
];

const SHEETS = {
  CUSTOMERS: "Customers",
  VEHICLES: "Vehicles",
  MATERIALS: "Materials",
  SALES: "Sales",
  LEDGER: "Ledger"
};

const HEADERS = {
  [SHEETS.CUSTOMERS]: ["Customer ID", "Name", "Phone", "Address", "Balance"],
  [SHEETS.VEHICLES]: ["Vehicle ID", "Vehicle Number"],
  [SHEETS.MATERIALS]: ["Material ID", "Name", "Is Active"],
  [SHEETS.SALES]: [
    "Date",
    "Slip No",
    "Sale ID",
    "Customer ID",
    "Vehicle",
    "Material",
    "Quantity",
    "Rate",
    "Amount",
    "GST",
    "Total",
    "Balance"
  ],
  [SHEETS.LEDGER]: ["Date", "Ledger ID", "Customer ID", "Credit", "Debit", "Balance", "Reference", "Type", "Notes"]
};

module.exports = { DEFAULT_MATERIALS, SHEETS, HEADERS };