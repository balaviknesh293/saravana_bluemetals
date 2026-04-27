const asyncHandler = require("../utils/asyncHandler");
const sheetsService = require("../services/sheetsService");
const { HEADERS } = require("../constants/masterData");

const storageStatus = asyncHandler(async (_req, res) => {
  const status = await sheetsService.getStorageStatus();
  res.status(200).json({ success: true, status });
});

const syncLocalToGoogle = asyncHandler(async (_req, res) => {
  const result = await sheetsService.syncLocalToGoogle(HEADERS);
  res.status(200).json({ success: true, message: "Local data synced to Google Sheets.", ...result });
});

module.exports = { storageStatus, syncLocalToGoogle };