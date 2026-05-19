const express = require("express");

const { postPayment, postLedgerEntry, customerLedger, removeLedgerEntry } = require("../controllers/ledgerController");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const { paymentValidator, ledgerEntryValidator, ledgerCustomerValidator, ledgerIdValidator } = require("../validators/ledgerValidators");

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.post("/payment", paymentValidator, validateRequest, postPayment);
router.post("/ledger/entry", ledgerEntryValidator, validateRequest, postLedgerEntry);
router.get("/ledger/all", customerLedger);
router.get("/ledger/:customerId", ledgerCustomerValidator, validateRequest, customerLedger);
router.delete("/ledger/:ledgerId", ledgerIdValidator, validateRequest, removeLedgerEntry);

module.exports = router;
