const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createLedger,
  getLedgers,
  updateLedger,
  deleteLedger,
} = require("../controllers/ledgerController");

router.post("/", protect, createLedger);
router.get("/", protect, getLedgers);
router.put("/:id", protect, updateLedger);
router.delete("/:id", protect, deleteLedger);

module.exports = router;