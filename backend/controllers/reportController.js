const pool = require("../config/db");

const verifyCompanyOwnership = async (companyId, userId) => {
  const result = await pool.query(
    "SELECT * FROM companies WHERE id = $1 AND user_id = $2",
    [companyId, userId]
  );
  return result.rows.length > 0;
};

// GET Stock Summary report: every stock item with its current quantity, rate, and value
const getStockSummary = async (req, res) => {
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

    // We calculate "value" (quantity * rate) directly in SQL using AS,
    // so the database does the math rather than JavaScript looping over rows
    const result = await pool.query(
      `SELECT
         si.id,
         si.name,
         si.unit,
         si.quantity,
         si.rate,
         (si.quantity * si.rate) AS value,
         COALESCE(sg.name, 'Ungrouped') AS group_name
       FROM stock_items si
       LEFT JOIN stock_groups sg ON si.stock_group_id = sg.id
       WHERE si.company_id = $1
       ORDER BY si.name ASC`,
      [companyId]
    );

    // Calculate the grand total across all items
    const grandTotal = result.rows.reduce(
      (sum, row) => sum + parseFloat(row.value),
      0
    );

    res.json({
      items: result.rows,
      grandTotal: grandTotal.toFixed(2),
    });
  } catch (error) {
    console.error("Get stock summary error:", error);
    res.status(500).json({ message: "Server error fetching stock summary" });
  }
};

module.exports = { getStockSummary };