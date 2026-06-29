const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { getStockSummary } = require("../controllers/reportController");

router.get("/stock-summary", protect, getStockSummary);

module.exports = router;