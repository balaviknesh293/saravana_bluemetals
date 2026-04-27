const express = require("express");

const { addSale, listSales, listSalesByDate } = require("../controllers/salesController");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const { saleCreateValidator, salesByDateValidator } = require("../validators/salesValidators");

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.post("/", saleCreateValidator, validateRequest, addSale);
router.get("/", listSales);
router.get("/:date", salesByDateValidator, validateRequest, listSalesByDate);

module.exports = router;