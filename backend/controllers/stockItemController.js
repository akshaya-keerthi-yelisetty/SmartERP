const pool = require("../config/db");

const verifyCompanyOwnership = async (companyId, userId) => {
  const result = await pool.query(
    "SELECT * FROM companies WHERE id = $1 AND user_id = $2",
    [companyId, userId]
  );
  return result.rows.length > 0;
};

const createStockItem = async (req, res) => {
  const userId = req.userId;
  const { companyId, stockGroupId, name, unit, rate, quantity } = req.body;

  if (!companyId || !name || !unit) {
    return res.status(400).json({ message: "companyId, name, and unit are required" });
  }

  try {
    const ownsCompany = await verifyCompanyOwnership(companyId, userId);
    if (!ownsCompany) {
      return res.status(403).json({ message: "Access denied to this company" });
    }

    const newItem = await pool.query(
      `INSERT INTO stock_items (company_id, stock_group_id, name, unit, rate, quantity)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [companyId, stockGroupId || null, name, unit, rate || 0, quantity || 0]
    );

    res.status(201).json({
      message: "Stock item created successfully",
      stockItem: newItem.rows[0],
    });
  } catch (error) {
    console.error("Create stock item error:", error);
    res.status(500).json({ message: "Server error creating stock item" });
  }
};

const getStockItems = async (req, res) => {
  const userId = req.userId;
  const { companyId, stockGroupId } = req.query;

  if (!companyId) {
    return res.status(400).json({ message: "companyId is required" });
  }

  try {
    const ownsCompany = await verifyCompanyOwnership(companyId, userId);
    if (!ownsCompany) {
      return res.status(403).json({ message: "Access denied to this company" });
    }

    let query = "SELECT * FROM stock_items WHERE company_id = $1";
    const params = [companyId];

    if (stockGroupId) {
      query += " AND stock_group_id = $2";
      params.push(stockGroupId);
    }

    query += " ORDER BY name ASC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get stock items error:", error);
    res.status(500).json({ message: "Server error fetching stock items" });
  }
};

const updateStockItem = async (req, res) => {
  const userId = req.userId;
  const itemId = req.params.id;
  const { stockGroupId, name, unit, rate, quantity } = req.body;

  try {
    const existing = await pool.query(
      `SELECT si.* FROM stock_items si
       JOIN companies c ON si.company_id = c.id
       WHERE si.id = $1 AND c.user_id = $2`,
      [itemId, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Stock item not found or access denied" });
    }

    const updated = await pool.query(
      `UPDATE stock_items SET stock_group_id = $1, name = $2, unit = $3, rate = $4, quantity = $5
       WHERE id = $6 RETURNING *`,
      [stockGroupId || null, name, unit, rate, quantity, itemId]
    );

    res.json({ message: "Stock item updated successfully", stockItem: updated.rows[0] });
  } catch (error) {
    console.error("Update stock item error:", error);
    res.status(500).json({ message: "Server error updating stock item" });
  }
};

const deleteStockItem = async (req, res) => {
  const userId = req.userId;
  const itemId = req.params.id;

  try {
    const existing = await pool.query(
      `SELECT si.* FROM stock_items si
       JOIN companies c ON si.company_id = c.id
       WHERE si.id = $1 AND c.user_id = $2`,
      [itemId, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Stock item not found or access denied" });
    }

    await pool.query("DELETE FROM stock_items WHERE id = $1", [itemId]);
    res.json({ message: "Stock item deleted successfully" });
  } catch (error) {
    console.error("Delete stock item error:", error);
    res.status(500).json({ message: "Server error deleting stock item" });
  }
};

module.exports = { createStockItem, getStockItems, updateStockItem, deleteStockItem };