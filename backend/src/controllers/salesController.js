const asyncHandler = require("../utils/asyncHandler");
const { createSale, getSales, deleteSale, updateSale } = require("../services/erpService");
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

const removeSale = asyncHandler(async (req, res) => {
  const result = await deleteSale(req.params.saleId);
  res.status(200).json({ success: true, message: "Sale deleted and balances recomputed.", result });
});

const editSale = asyncHandler(async (req, res) => {
  const sale = await updateSale(req.params.saleId, req.body);
  res.status(200).json({ success: true, message: "Sale updated.", sale });
});

module.exports = { addSale, listSales, listSalesByDate, removeSale, editSale };
