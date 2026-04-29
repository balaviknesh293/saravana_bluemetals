const { body, param } = require("express-validator");

const saleCreateValidator = [
  body("date").optional({ values: "falsy" }).isISO8601().withMessage("Date must be valid."),
  body("transactionType")
    .optional({ values: "falsy" })
    .isIn(["sale", "purchase", "SALE", "PURCHASE"])
    .withMessage("transactionType must be sale or purchase."),
  body("slipNo").trim().notEmpty().withMessage("Slip number is required."),
  body("customerId").trim().notEmpty().withMessage("Customer ID is required."),
  body("vehicleId").optional({ values: "falsy" }).trim(),
  body("materialId").optional({ values: "falsy" }).trim(),
  body("product").optional({ values: "falsy" }).trim(),
  body("quantity").isFloat({ gt: 0 }).withMessage("Quantity must be greater than 0."),
  body("rate").isFloat({ gt: 0 }).withMessage("Rate must be greater than 0."),
  body("gst")
    .optional({ values: "falsy" })
    .isFloat({ min: 0 })
    .withMessage("GST must be numeric when provided.")
];

const salesByDateValidator = [
  param("date").isISO8601().withMessage("Date should be in YYYY-MM-DD format.")
];

module.exports = { saleCreateValidator, salesByDateValidator };
