const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createCompany,
  getCompanies,
  updateCompany,
  deleteCompany,
} = require("../controllers/companyController");

// All routes below require a valid JWT (protect middleware runs first)
router.post("/", protect, createCompany);
router.get("/", protect, getCompanies);
router.put("/:id", protect, updateCompany);
router.delete("/:id", protect, deleteCompany);

module.exports = router;