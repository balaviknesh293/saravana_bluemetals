const { body, param } = require("express-validator");

const customerIdValidator = [param("customerId").notEmpty().withMessage("Customer ID is required.")];

const customerCreateValidator = [
  body("name").trim().notEmpty().withMessage("Customer name is required."),
  body("phone").optional({ values: "falsy" }).trim(),
  body("address").optional({ values: "falsy" }).trim(),
  body("vehicleNumber").optional({ values: "falsy" }).trim(),
  body("vehicleType").optional({ values: "falsy" }).trim(),
  body("balance").optional({ values: "falsy" }).isNumeric().withMessage("Balance must be numeric.")
];

const customerUpdateValidator = [
  ...customerIdValidator,
  body("name").optional({ values: "falsy" }).trim(),
  body("phone").optional({ values: "falsy" }).trim(),
  body("address").optional({ values: "falsy" }).trim(),
  body("vehicleNumber").optional({ values: "falsy" }).trim(),
  body("vehicleType").optional({ values: "falsy" }).trim(),
  body("balance").optional({ values: "falsy" }).isNumeric().withMessage("Balance must be numeric.")
];

module.exports = { customerIdValidator, customerCreateValidator, customerUpdateValidator };
