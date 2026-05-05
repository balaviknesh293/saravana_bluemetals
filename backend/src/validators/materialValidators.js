const { body, param } = require("express-validator");

const materialIdValidator = [param("materialId").notEmpty().withMessage("Material ID is required.")];

const materialCreateValidator = [
  body("name").trim().notEmpty().withMessage("Material name is required."),
  body("price").optional({ values: "falsy" }).isFloat({ min: 0 }).withMessage("Price must be a non-negative number."),
  body("isActive").optional().isBoolean().withMessage("isActive must be boolean.")
];

const materialUpdateValidator = [
  ...materialIdValidator,
  body("name").optional({ values: "falsy" }).trim(),
  body("price").optional({ values: "falsy" }).isFloat({ min: 0 }).withMessage("Price must be a non-negative number."),
  body("isActive").optional().isBoolean().withMessage("isActive must be boolean.")
];

module.exports = { materialIdValidator, materialCreateValidator, materialUpdateValidator };
