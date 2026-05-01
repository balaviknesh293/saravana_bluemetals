const { body } = require("express-validator");

const loginValidator = [
  body("email").trim().notEmpty().withMessage("Email or username is required."),
  body("password").isLength({ min: 4 }).withMessage("Password is required.")
];

module.exports = { loginValidator };
