const express = require("express");

const { listVehicles, createVehicle, editVehicle, removeVehicle } = require("../controllers/vehicleController");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const {
  vehicleIdValidator,
  vehicleCreateValidator,
  vehicleUpdateValidator
} = require("../validators/vehicleValidators");

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/", listVehicles);
router.post("/", vehicleCreateValidator, validateRequest, createVehicle);
router.put("/:vehicleId", vehicleUpdateValidator, validateRequest, editVehicle);
router.delete("/:vehicleId", vehicleIdValidator, validateRequest, removeVehicle);

module.exports = router;