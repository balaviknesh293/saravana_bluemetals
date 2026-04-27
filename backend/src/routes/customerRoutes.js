const express = require("express");

const {
  listCustomers,
  createCustomer,
  editCustomer,
  removeCustomer
} = require("../controllers/customerController");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const {
  customerIdValidator,
  customerCreateValidator,
  customerUpdateValidator
} = require("../validators/customerValidators");

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/", listCustomers);
router.post("/", customerCreateValidator, validateRequest, createCustomer);
router.put("/:customerId", customerUpdateValidator, validateRequest, editCustomer);
router.delete("/:customerId", customerIdValidator, validateRequest, removeCustomer);

module.exports = router;