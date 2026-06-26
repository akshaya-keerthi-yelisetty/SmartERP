const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createPurchaseVoucher,
  getVouchers,
  getVoucherById,
} = require("../controllers/voucherController");

router.post("/purchase", protect, createPurchaseVoucher);
router.get("/", protect, getVouchers);
router.get("/:id", protect, getVoucherById);

module.exports = router;