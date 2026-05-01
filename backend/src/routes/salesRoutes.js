const express = require("express");

const { addSale, listSales, listSalesByDate, removeSale, editSale } = require("../controllers/salesController");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const { saleCreateValidator, salesByDateValidator, saleIdValidator } = require("../validators/salesValidators");

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.post("/", saleCreateValidator, validateRequest, addSale);
router.get("/", listSales);
router.put("/:saleId", saleCreateValidator, saleIdValidator, validateRequest, editSale);
router.delete("/:saleId", saleIdValidator, validateRequest, removeSale);
router.get("/:date", salesByDateValidator, validateRequest, listSalesByDate);

module.exports = router;
