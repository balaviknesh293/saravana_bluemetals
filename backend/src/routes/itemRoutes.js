const express = require("express");

const {
  createItem,
  getItems,
  getStats,
  updateItem,
  deleteItem
} = require("../controllers/itemController");
const { requireAuth } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const { itemBodyValidator, itemQueryValidator, itemIdValidator } = require("../validators/itemValidators");

const router = express.Router();

router.use(requireAuth);
router.get("/", itemQueryValidator, validateRequest, getItems);
router.get("/stats", getStats);
router.post("/", itemBodyValidator, validateRequest, createItem);
router.put("/:itemId", itemIdValidator, itemBodyValidator, validateRequest, updateItem);
router.delete("/:itemId", itemIdValidator, validateRequest, deleteItem);

module.exports = router;
