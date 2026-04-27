const express = require("express");

const { storageStatus, syncLocalToGoogle } = require("../controllers/systemController");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth, requireAdmin);
router.get("/storage-status", storageStatus);
router.post("/sync-local-to-google", syncLocalToGoogle);

module.exports = router;