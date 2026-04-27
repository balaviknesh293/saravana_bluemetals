const jwt = require("jsonwebtoken");

const ApiError = require("../utils/apiError");

function requireAuth(req, _res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    throw new ApiError(401, "Authentication token is required.");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (_error) {
    throw new ApiError(401, "Invalid or expired token.");
  }
}

function requireAdmin(req, _res, next) {
  if (req.user?.role !== "admin") {
    throw new ApiError(403, "Access denied.");
  }
  next();
}

module.exports = { requireAuth, requireAdmin };