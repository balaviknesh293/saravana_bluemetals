const asyncHandler = require("../utils/asyncHandler");
const { createSale, getSales } = require("../services/erpService");
const { formatDateISO } = require("../utils/date");

const addSale = asyncHandler(async (req, res) => {
  const sale = await createSale(req.body);
  res.status(201).json({ success: true, message: "Sale recorded.", sale });
});

const listSales = asyncHandler(async (_req, res) => {
  const sales = await getSales();
  res.status(200).json({ success: true, sales });
});

const listSalesByDate = asyncHandler(async (req, res) => {
  const date = formatDateISO(req.params.date);
  if (!date) {
    return res.status(400).json({ success: false, message: "Invalid date format." });
  }

  const sales = await getSales(date);
  res.status(200).json({ success: true, sales, date });
});

module.exports = { addSale, listSales, listSalesByDate };