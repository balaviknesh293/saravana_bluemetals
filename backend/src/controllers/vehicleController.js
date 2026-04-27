const asyncHandler = require("../utils/asyncHandler");
const { getVehicles, addVehicle, updateVehicle, deleteVehicle } = require("../services/erpService");

const listVehicles = asyncHandler(async (_req, res) => {
  const vehicles = await getVehicles();
  res.status(200).json({ success: true, vehicles });
});

const createVehicle = asyncHandler(async (req, res) => {
  const vehicle = await addVehicle(req.body);
  res.status(201).json({ success: true, message: "Vehicle created.", vehicle });
});

const editVehicle = asyncHandler(async (req, res) => {
  const vehicle = await updateVehicle(req.params.vehicleId, req.body);
  res.status(200).json({ success: true, message: "Vehicle updated.", vehicle });
});

const removeVehicle = asyncHandler(async (req, res) => {
  await deleteVehicle(req.params.vehicleId);
  res.status(200).json({ success: true, message: "Vehicle deleted." });
});

module.exports = { listVehicles, createVehicle, editVehicle, removeVehicle };