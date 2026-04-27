const { body } = require("express-validator");

const loginValidator = [
  body("email").isEmail().withMessage("A valid email is required."),
  body("password").isLength({ min: 4 }).withMessage("Password is required.")
];

module.exports = { loginValidator };