const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createPurchaseVoucher,
  createSalesVoucher,
  getVouchers,
  getVoucherById,
} = require("../controllers/voucherController");

router.post("/purchase", protect, createPurchaseVoucher);
router.post("/sales", protect, createSalesVoucher);
router.get("/", protect, getVouchers);
router.get("/:id", protect, getVoucherById);

module.exports = router;