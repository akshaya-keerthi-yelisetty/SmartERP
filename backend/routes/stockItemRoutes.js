const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createStockItem,
  getStockItems,
  updateStockItem,
  deleteStockItem,
} = require("../controllers/stockItemController");

router.post("/", protect, createStockItem);
router.get("/", protect, getStockItems);
router.put("/:id", protect, updateStockItem);
router.delete("/:id", protect, deleteStockItem);

module.exports = router;