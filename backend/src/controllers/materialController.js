const asyncHandler = require("../utils/asyncHandler");
const { getMaterials, addMaterial, updateMaterial, deleteMaterial } = require("../services/erpService");

const listMaterials = asyncHandler(async (_req, res) => {
  const materials = await getMaterials();
  res.status(200).json({ success: true, materials });
});

const createMaterial = asyncHandler(async (req, res) => {
  const material = await addMaterial(req.body);
  res.status(201).json({ success: true, message: "Material created.", material });
});

const editMaterial = asyncHandler(async (req, res) => {
  const material = await updateMaterial(req.params.materialId, req.body);
  res.status(200).json({ success: true, message: "Material updated.", material });
});

const removeMaterial = asyncHandler(async (req, res) => {
  await deleteMaterial(req.params.materialId);
  res.status(200).json({ success: true, message: "Material deleted." });
});

module.exports = { listMaterials, createMaterial, editMaterial, removeMaterial };