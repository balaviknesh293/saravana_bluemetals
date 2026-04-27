const Item = require("../models/Item");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const createItem = asyncHandler(async (req, res) => {
  const item = await Item.create({
    user: req.user._id,
    title: req.body.title,
    description: req.body.description || "",
    date: req.body.date,
    status: req.body.status
  });

  res.status(201).json({
    success: true,
    message: "Item created successfully.",
    item
  });
});

const getItems = asyncHandler(async (req, res) => {
  const { search = "", status = "all" } = req.query;

  const query = { user: req.user._id };
  if (status !== "all") query.status = status;
  if (search.trim()) {
    const safeSearch = escapeRegExp(search.trim());
    query.$or = [
      { title: { $regex: safeSearch, $options: "i" } },
      { description: { $regex: safeSearch, $options: "i" } }
    ];
  }

  const items = await Item.find(query).sort({ date: 1, createdAt: -1 });
  res.status(200).json({ success: true, items });
});

const getStats = asyncHandler(async (req, res) => {
  const matchStage = { $match: { user: req.user._id } };

  const grouped = await Item.aggregate([
    matchStage,
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);

  const stats = {
    total: 0,
    todo: 0,
    "in-progress": 0,
    done: 0
  };

  grouped.forEach((entry) => {
    stats[entry._id] = entry.count;
    stats.total += entry.count;
  });

  res.status(200).json({ success: true, stats });
});

const updateItem = asyncHandler(async (req, res) => {
  const item = await Item.findOne({ _id: req.params.itemId, user: req.user._id });
  if (!item) {
    throw new ApiError(404, "Item not found.");
  }

  item.title = req.body.title;
  item.description = req.body.description || "";
  item.date = req.body.date;
  item.status = req.body.status;
  await item.save();

  res.status(200).json({
    success: true,
    message: "Item updated successfully.",
    item
  });
});

const deleteItem = asyncHandler(async (req, res) => {
  const item = await Item.findOneAndDelete({ _id: req.params.itemId, user: req.user._id });
  if (!item) {
    throw new ApiError(404, "Item not found.");
  }

  res.status(200).json({ success: true, message: "Item deleted successfully." });
});

module.exports = { createItem, getItems, getStats, updateItem, deleteItem };
