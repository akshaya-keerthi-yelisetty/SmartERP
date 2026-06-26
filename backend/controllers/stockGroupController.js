const pool = require("../config/db");

const verifyCompanyOwnership = async (companyId, userId) => {
  const result = await pool.query(
    "SELECT * FROM companies WHERE id = $1 AND user_id = $2",
    [companyId, userId]
  );
  return result.rows.length > 0;
};

const createStockGroup = async (req, res) => {
  const userId = req.userId;
  const { companyId, name } = req.body;

  if (!companyId || !name) {
    return res.status(400).json({ message: "companyId and name are required" });
  }

  try {
    const ownsCompany = await verifyCompanyOwnership(companyId, userId);
    if (!ownsCompany) {
      return res.status(403).json({ message: "Access denied to this company" });
    }

    const newGroup = await pool.query(
      "INSERT INTO stock_groups (company_id, name) VALUES ($1, $2) RETURNING *",
      [companyId, name]
    );

    res.status(201).json({
      message: "Stock group created successfully",
      stockGroup: newGroup.rows[0],
    });
  } catch (error) {
    console.error("Create stock group error:", error);
    res.status(500).json({ message: "Server error creating stock group" });
  }
};

const getStockGroups = async (req, res) => {
  const userId = req.userId;
  const { companyId } = req.query;

  if (!companyId) {
    return res.status(400).json({ message: "companyId is required" });
  }

  try {
    const ownsCompany = await verifyCompanyOwnership(companyId, userId);
    if (!ownsCompany) {
      return res.status(403).json({ message: "Access denied to this company" });
    }

    const result = await pool.query(
      "SELECT * FROM stock_groups WHERE company_id = $1 ORDER BY name ASC",
      [companyId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get stock groups error:", error);
    res.status(500).json({ message: "Server error fetching stock groups" });
  }
};

const updateStockGroup = async (req, res) => {
  const userId = req.userId;
  const groupId = req.params.id;
  const { name } = req.body;

  try {
    const existing = await pool.query(
      `SELECT sg.* FROM stock_groups sg
       JOIN companies c ON sg.company_id = c.id
       WHERE sg.id = $1 AND c.user_id = $2`,
      [groupId, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Stock group not found or access denied" });
    }

    const updated = await pool.query(
      "UPDATE stock_groups SET name = $1 WHERE id = $2 RETURNING *",
      [name, groupId]
    );

    res.json({ message: "Stock group updated successfully", stockGroup: updated.rows[0] });
  } catch (error) {
    console.error("Update stock group error:", error);
    res.status(500).json({ message: "Server error updating stock group" });
  }
};

const deleteStockGroup = async (req, res) => {
  const userId = req.userId;
  const groupId = req.params.id;

  try {
    const existing = await pool.query(
      `SELECT sg.* FROM stock_groups sg
       JOIN companies c ON sg.company_id = c.id
       WHERE sg.id = $1 AND c.user_id = $2`,
      [groupId, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Stock group not found or access denied" });
    }

    await pool.query("DELETE FROM stock_groups WHERE id = $1", [groupId]);
    res.json({ message: "Stock group deleted successfully" });
  } catch (error) {
    console.error("Delete stock group error:", error);
    res.status(500).json({ message: "Server error deleting stock group" });
  }
};

module.exports = { createStockGroup, getStockGroups, updateStockGroup, deleteStockGroup };