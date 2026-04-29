const asyncHandler = require("../utils/asyncHandler");
const { recordPayment, addLedgerEntry, getLedger } = require("../services/erpService");

const postPayment = asyncHandler(async (req, res) => {
  const payment = await recordPayment(req.body);
  res.status(201).json({ success: true, message: "Payment recorded.", payment });
});

const customerLedger = asyncHandler(async (req, res) => {
  const ledger = await getLedger(req.params.customerId);
  res.status(200).json({ success: true, ledger });
});

const postLedgerEntry = asyncHandler(async (req, res) => {
  const entry = await addLedgerEntry(req.body);
  res.status(201).json({ success: true, message: "Ledger entry recorded.", entry });
});

module.exports = { postPayment, customerLedger, postLedgerEntry };
