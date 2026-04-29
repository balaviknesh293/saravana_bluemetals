const express = require("express");

const { postPayment, postLedgerEntry, customerLedger } = require("../controllers/ledgerController");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const { paymentValidator, ledgerEntryValidator, ledgerCustomerValidator } = require("../validators/ledgerValidators");

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.post("/payment", paymentValidator, validateRequest, postPayment);
router.post("/ledger/entry", ledgerEntryValidator, validateRequest, postLedgerEntry);
router.get("/ledger/:customerId", ledgerCustomerValidator, validateRequest, customerLedger);

module.exports = router;
