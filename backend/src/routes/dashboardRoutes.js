const express = require("express");

const { summary } = require("../controllers/dashboardController");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth, requireAdmin);
router.get("/summary", summary);

module.exports = router;