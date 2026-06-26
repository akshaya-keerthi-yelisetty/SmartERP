const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createStockGroup,
  getStockGroups,
  updateStockGroup,
  deleteStockGroup,
} = require("../controllers/stockGroupController");

router.post("/", protect, createStockGroup);
router.get("/", protect, getStockGroups);
router.put("/:id", protect, updateStockGroup);
router.delete("/:id", protect, deleteStockGroup);

module.exports = router;