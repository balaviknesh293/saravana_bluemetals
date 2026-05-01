const { body, param } = require("express-validator");

const vehicleIdValidator = [param("vehicleId").notEmpty().withMessage("Vehicle ID is required.")];

const vehicleCreateValidator = [
  body("vehicleNumber").trim().notEmpty().withMessage("Vehicle number is required."),
  body("customerId").optional({ values: "falsy" }).trim(),
  body("type").optional({ values: "falsy" }).trim()
];

const vehicleUpdateValidator = [
  ...vehicleIdValidator,
  body("vehicleNumber").optional({ values: "falsy" }).trim().notEmpty().withMessage("Vehicle number is required."),
  body("customerId").optional({ values: "falsy" }).trim(),
  body("type").optional({ values: "falsy" }).trim()
];

module.exports = { vehicleIdValidator, vehicleCreateValidator, vehicleUpdateValidator };
