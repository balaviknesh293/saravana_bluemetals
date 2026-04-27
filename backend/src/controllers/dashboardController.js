const asyncHandler = require("../utils/asyncHandler");
const { getDashboardSummary } = require("../services/erpService");

const summary = asyncHandler(async (_req, res) => {
  const data = await getDashboardSummary();
  res.status(200).json({ success: true, ...data });
});

module.exports = { summary };