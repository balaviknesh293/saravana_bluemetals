const express = require("express");

const { login, me } = require("../controllers/authController");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const { loginValidator } = require("../validators/authValidators");

const router = express.Router();

router.post("/login", loginValidator, validateRequest, login);
router.post("/auth/login", loginValidator, validateRequest, login);
router.get("/auth/me", requireAuth, requireAdmin, me);

module.exports = router;