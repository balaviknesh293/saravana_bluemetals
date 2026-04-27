const asyncHandler = require("../utils/asyncHandler");
const { loginAdmin } = require("../services/authService");

const login = asyncHandler(async (req, res) => {
  const result = await loginAdmin(req.body);
  res.status(200).json({ success: true, message: "Login successful.", ...result });
});

const me = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user.sub,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
});

module.exports = { login, me };