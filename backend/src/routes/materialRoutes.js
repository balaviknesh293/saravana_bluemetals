const express = require("express");

const {
  listMaterials,
  createMaterial,
  editMaterial,
  removeMaterial
} = require("../controllers/materialController");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const {
  materialIdValidator,
  materialCreateValidator,
  materialUpdateValidator
} = require("../validators/materialValidators");

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/", listMaterials);
router.post("/", materialCreateValidator, validateRequest, createMaterial);
router.put("/:materialId", materialUpdateValidator, validateRequest, editMaterial);
router.delete("/:materialId", materialIdValidator, validateRequest, removeMaterial);

module.exports = router;