const express = require("express");

const { dailyReport, weeklyReport, monthlyReport } = require("../controllers/reportController");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/daily", dailyReport);
router.get("/weekly", weeklyReport);
router.get("/monthly", monthlyReport);

module.exports = router;