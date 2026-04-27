const { body, param, query } = require("express-validator");

const itemBodyValidator = [
  body("title")
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("Title must be between 2 and 120 characters."),
  body("description")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description can be at most 2000 characters."),
  body("date").isISO8601().withMessage("Please provide a valid date."),
  body("status")
    .isIn(["todo", "in-progress", "done"])
    .withMessage("Status must be todo, in-progress, or done.")
];

const itemQueryValidator = [
  query("search")
    .optional()
    .isString()
    .isLength({ max: 120 })
    .withMessage("Search text is too long."),
  query("status")
    .optional()
    .isIn(["all", "todo", "in-progress", "done"])
    .withMessage("Invalid status filter.")
];

const itemIdValidator = [param("itemId").isMongoId().withMessage("Invalid item id.")];

module.exports = { itemBodyValidator, itemQueryValidator, itemIdValidator };
