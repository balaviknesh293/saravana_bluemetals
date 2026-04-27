const { validationResult } = require("express-validator");

module.exports = function validateRequest(req, _res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }

  const first = result.array({ onlyFirstError: true })[0];
  const error = new Error(first.msg || "Validation failed");
  error.statusCode = 400;
  return next(error);
};