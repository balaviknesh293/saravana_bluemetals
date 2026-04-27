const express = require("express");

const { postPayment, customerLedger } = require("../controllers/ledgerController");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const { paymentValidator, ledgerCustomerValidator } = require("../validators/ledgerValidators");

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.post("/payment", paymentValidator, validateRequest, postPayment);
router.get("/ledger/:customerId", ledgerCustomerValidator, validateRequest, customerLedger);

module.exports = router;