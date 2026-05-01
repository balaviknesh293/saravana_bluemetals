const asyncHandler = require("../utils/asyncHandler");
const { getReport, getCustomerStatement } = require("../services/erpService");

const dailyReport = asyncHandler(async (req, res) => {
  const report = await getReport("daily", req.query.date, {
    customerId: req.query.customerId,
    from: req.query.from,
    to: req.query.to
  });
  res.status(200).json({ success: true, type: "daily", ...report });
});

const weeklyReport = asyncHandler(async (req, res) => {
  const report = await getReport("weekly", req.query.date, {
    customerId: req.query.customerId,
    from: req.query.from,
    to: req.query.to
  });
  res.status(200).json({ success: true, type: "weekly", ...report });
});

const monthlyReport = asyncHandler(async (req, res) => {
  const report = await getReport("monthly", req.query.date, {
    customerId: req.query.customerId,
    from: req.query.from,
    to: req.query.to
  });
  res.status(200).json({ success: true, type: "monthly", ...report });
});

const customerStatement = asyncHandler(async (req, res) => {
  const report = await getCustomerStatement(req.params.customerId, req.query.from, req.query.to);
  res.status(200).json({ success: true, type: "customer", ...report });
});

module.exports = { dailyReport, weeklyReport, monthlyReport, customerStatement };
