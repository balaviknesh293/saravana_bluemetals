const asyncHandler = require("../utils/asyncHandler");
const { getReport } = require("../services/erpService");

const dailyReport = asyncHandler(async (req, res) => {
  const report = await getReport("daily", req.query.date);
  res.status(200).json({ success: true, type: "daily", ...report });
});

const weeklyReport = asyncHandler(async (req, res) => {
  const report = await getReport("weekly", req.query.date);
  res.status(200).json({ success: true, type: "weekly", ...report });
});

const monthlyReport = asyncHandler(async (req, res) => {
  const report = await getReport("monthly", req.query.date);
  res.status(200).json({ success: true, type: "monthly", ...report });
});

module.exports = { dailyReport, weeklyReport, monthlyReport };