const asyncHandler = require("../utils/asyncHandler");
const { recordPayment, addLedgerEntry, getLedger, deleteLedgerEntry } = require("../services/erpService");

const postPayment = asyncHandler(async (req, res) => {
  const payment = await recordPayment(req.body);
  res.status(201).json({ success: true, message: "Payment recorded.", payment });
});

const customerLedger = asyncHandler(async (req, res) => {
  const customerId = req.params.customerId || req.query.customerId || "";
  const ledger = await getLedger(customerId);
  res.status(200).json({ success: true, ledger });
});

const postLedgerEntry = asyncHandler(async (req, res) => {
  const entry = await addLedgerEntry(req.body);
  res.status(201).json({ success: true, message: "Ledger entry recorded.", entry });
});

const removeLedgerEntry = asyncHandler(async (req, res) => {
  const result = await deleteLedgerEntry(req.params.ledgerId);
  res.status(200).json({ success: true, message: "Ledger entry deleted.", result });
});

module.exports = { postPayment, customerLedger, postLedgerEntry, removeLedgerEntry };
