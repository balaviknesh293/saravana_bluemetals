const { body, param } = require("express-validator");

const paymentValidator = [
  body("date").optional({ values: "falsy" }).isISO8601().withMessage("Date must be valid."),
  body("customerId").trim().notEmpty().withMessage("Customer ID is required."),
  body("amount").isFloat({ gt: 0 }).withMessage("Amount must be greater than 0."),
  body("reference").optional({ values: "falsy" }).trim(),
  body("notes").optional({ values: "falsy" }).trim()
];

const ledgerCustomerValidator = [
  param("customerId").trim().notEmpty().withMessage("Customer ID is required.")
];

module.exports = { paymentValidator, ledgerCustomerValidator };