const pool = require("../config/db");

// Helper function: confirms a company exists AND belongs to the logged-in user.
// Reused by every ledger function below to prevent cross-user data access.
const verifyCompanyOwnership = async (companyId, userId) => {
  const result = await pool.query(
    "SELECT * FROM companies WHERE id = $1 AND user_id = $2",
    [companyId, userId]
  );
  return result.rows.length > 0;
};

// CREATE a new ledger
const createLedger = async (req, res) => {
  const userId = req.userId;
  const { companyId, name, type, openingBalance, balanceType } = req.body;

  if (!companyId || !name || !type) {
    return res
      .status(400)
      .json({ message: "companyId, name, and type are required" });
  }

  try {
    const ownsCompany = await verifyCompanyOwnership(companyId, userId);
    if (!ownsCompany) {
      return res.status(403).json({ message: "Access denied to this company" });
    }

    const newLedger = await pool.query(
      `INSERT INTO ledgers (company_id, name, type, opening_balance, balance_type)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [companyId, name, type, openingBalance || 0, balanceType || "debit"]
    );

    res.status(201).json({
      message: "Ledger created successfully",
      ledger: newLedger.rows[0],
    });
  } catch (error) {
    console.error("Create ledger error:", error);
    res.status(500).json({ message: "Server error creating ledger" });
  }
};

// GET all ledgers for a specific company (optionally filtered by type)
const getLedgers = async (req, res) => {
  const userId = req.userId;
  const { companyId, type } = req.query; // query params, e.g. ?companyId=1&type=customer

  if (!companyId) {
    return res.status(400).json({ message: "companyId is required" });
  }

  try {
    const ownsCompany = await verifyCompanyOwnership(companyId, userId);
    if (!ownsCompany) {
      return res.status(403).json({ message: "Access denied to this company" });
    }

    let query = "SELECT * FROM ledgers WHERE company_id = $1";
    const params = [companyId];

    // If a type filter was provided (e.g., just "customer" ledgers), add it to the query
    if (type) {
      query += " AND type = $2";
      params.push(type);
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get ledgers error:", error);
    res.status(500).json({ message: "Server error fetching ledgers" });
  }
};

// UPDATE a ledger
const updateLedger = async (req, res) => {
  const userId = req.userId;
  const ledgerId = req.params.id;
  const { name, type, openingBalance, balanceType } = req.body;

  try {
    // Find the ledger and join to companies to confirm ownership in one query
    const existing = await pool.query(
      `SELECT l.* FROM ledgers l
       JOIN companies c ON l.company_id = c.id
       WHERE l.id = $1 AND c.user_id = $2`,
      [ledgerId, userId]
    );

    if (existing.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Ledger not found or access denied" });
    }

    const updated = await pool.query(
      `UPDATE ledgers SET name = $1, type = $2, opening_balance = $3, balance_type = $4
       WHERE id = $5 RETURNING *`,
      [name, type, openingBalance, balanceType, ledgerId]
    );

    res.json({
      message: "Ledger updated successfully",
      ledger: updated.rows[0],
    });
  } catch (error) {
    console.error("Update ledger error:", error);
    res.status(500).json({ message: "Server error updating ledger" });
  }
};

// DELETE a ledger
const deleteLedger = async (req, res) => {
  const userId = req.userId;
  const ledgerId = req.params.id;

  try {
    const existing = await pool.query(
      `SELECT l.* FROM ledgers l
       JOIN companies c ON l.company_id = c.id
       WHERE l.id = $1 AND c.user_id = $2`,
      [ledgerId, userId]
    );

    if (existing.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Ledger not found or access denied" });
    }

    await pool.query("DELETE FROM ledgers WHERE id = $1", [ledgerId]);

    res.json({ message: "Ledger deleted successfully" });
  } catch (error) {
    console.error("Delete ledger error:", error);
    res.status(500).json({ message: "Server error deleting ledger" });
  }
};

module.exports = { createLedger, getLedgers, updateLedger, deleteLedger };