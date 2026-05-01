const express = require("express");

const { dailyReport, weeklyReport, monthlyReport, customerStatement } = require("../controllers/reportController");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/daily", dailyReport);
router.get("/weekly", weeklyReport);
router.get("/monthly", monthlyReport);
router.get("/customer/:customerId", customerStatement);

module.exports = router;
