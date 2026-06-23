const pool = require("../config/db");

// CREATE a new company
const createCompany = async (req, res) => {
  const { name, address, gstin } = req.body;
  const userId = req.userId; // set by the protect middleware

  if (!name) {
    return res.status(400).json({ message: "Company name is required" });
  }

  try {
    // Check how many companies this user already has
    const existing = await pool.query(
      "SELECT * FROM companies WHERE user_id = $1",
      [userId]
    );

    if (existing.rows.length >= 5) {
      return res
        .status(400)
        .json({ message: "Maximum of 5 companies allowed per user" });
    }

    const newCompany = await pool.query(
      "INSERT INTO companies (user_id, name, address, gstin) VALUES ($1, $2, $3, $4) RETURNING *",
      [userId, name, address || null, gstin || null]
    );

    res.status(201).json({
      message: "Company created successfully",
      company: newCompany.rows[0],
    });
  } catch (error) {
    console.error("Create company error:", error);
    res.status(500).json({ message: "Server error creating company" });
  }
};

// GET all companies belonging to the logged-in user
const getCompanies = async (req, res) => {
  const userId = req.userId;

  try {
    const result = await pool.query(
      "SELECT * FROM companies WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get companies error:", error);
    res.status(500).json({ message: "Server error fetching companies" });
  }
};

// UPDATE a company (only if it belongs to the logged-in user)
const updateCompany = async (req, res) => {
  const userId = req.userId;
  const companyId = req.params.id;
  const { name, address, gstin } = req.body;

  try {
    // Confirm this company belongs to this user before allowing edits
    const existing = await pool.query(
      "SELECT * FROM companies WHERE id = $1 AND user_id = $2",
      [companyId, userId]
    );

    if (existing.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Company not found or access denied" });
    }

    const updated = await pool.query(
      "UPDATE companies SET name = $1, address = $2, gstin = $3 WHERE id = $4 RETURNING *",
      [name, address || null, gstin || null, companyId]
    );

    res.json({
      message: "Company updated successfully",
      company: updated.rows[0],
    });
  } catch (error) {
    console.error("Update company error:", error);
    res.status(500).json({ message: "Server error updating company" });
  }
};

// DELETE a company (only if it belongs to the logged-in user)
const deleteCompany = async (req, res) => {
  const userId = req.userId;
  const companyId = req.params.id;

  try {
    const existing = await pool.query(
      "SELECT * FROM companies WHERE id = $1 AND user_id = $2",
      [companyId, userId]
    );

    if (existing.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Company not found or access denied" });
    }

    await pool.query("DELETE FROM companies WHERE id = $1", [companyId]);

    res.json({ message: "Company deleted successfully" });
  } catch (error) {
    console.error("Delete company error:", error);
    res.status(500).json({ message: "Server error deleting company" });
  }
};

module.exports = { createCompany, getCompanies, updateCompany, deleteCompany };