const pool = require("../config/db");

const verifyCompanyOwnership = async (companyId, userId) => {
  const result = await pool.query(
    "SELECT * FROM companies WHERE id = $1 AND user_id = $2",
    [companyId, userId]
  );
  return result.rows.length > 0;
};

// CREATE a Purchase Voucher
const createPurchaseVoucher = async (req, res) => {
  const userId = req.userId;
  const { companyId, ledgerId, voucherDate, notes, items, gstPercent } = req.body;

  if (!companyId || !ledgerId || !items || items.length === 0) {
    return res
      .status(400)
      .json({ message: "companyId, ledgerId, and at least one item are required" });
  }

  const ownsCompany = await verifyCompanyOwnership(companyId, userId);
  if (!ownsCompany) {
    return res.status(403).json({ message: "Access denied to this company" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let totalAmount = 0;
    for (const item of items) {
      totalAmount += item.quantity * item.rate;
    }

    const gstRate = gstPercent || 0;
    const gstAmount = (totalAmount * gstRate) / 100;
    const grandTotal = totalAmount + gstAmount;

    const voucherResult = await client.query(
      `INSERT INTO vouchers (company_id, voucher_type, ledger_id, voucher_date, total_amount, gst_percent, gst_amount, grand_total, notes)
       VALUES ($1, 'purchase', $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [companyId, ledgerId, voucherDate || new Date(), totalAmount, gstRate, gstAmount, grandTotal, notes || null]
    );
    const voucher = voucherResult.rows[0];

    for (const item of items) {
      const amount = item.quantity * item.rate;

      await client.query(
        `INSERT INTO voucher_items (voucher_id, stock_item_id, quantity, rate, amount)
         VALUES ($1, $2, $3, $4, $5)`,
        [voucher.id, item.stockItemId, item.quantity, item.rate, amount]
      );

      await client.query(
        `UPDATE stock_items SET quantity = quantity + $1 WHERE id = $2`,
        [item.quantity, item.stockItemId]
      );
    }

    await client.query(
      `UPDATE ledgers SET opening_balance = opening_balance + $1 WHERE id = $2`,
      [grandTotal, ledgerId]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Purchase voucher created successfully",
      voucher,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create purchase voucher error:", error);
    res.status(500).json({ message: "Server error creating purchase voucher" });
  } finally {
    client.release();
  }
};

// CREATE a Sales Voucher
const createSalesVoucher = async (req, res) => {
  const userId = req.userId;
  const { companyId, ledgerId, voucherDate, notes, items, gstPercent } = req.body;

  if (!companyId || !ledgerId || !items || items.length === 0) {
    return res
      .status(400)
      .json({ message: "companyId, ledgerId, and at least one item are required" });
  }

  const ownsCompany = await verifyCompanyOwnership(companyId, userId);
  if (!ownsCompany) {
    return res.status(403).json({ message: "Access denied to this company" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const item of items) {
      const stockResult = await client.query(
        "SELECT quantity, name FROM stock_items WHERE id = $1",
        [item.stockItemId]
      );

      if (stockResult.rows.length === 0) {
        throw new Error(`Stock item ${item.stockItemId} not found`);
      }

      const availableQuantity = parseFloat(stockResult.rows[0].quantity);
      if (availableQuantity < item.quantity) {
        throw new Error(
          `Not enough stock for "${stockResult.rows[0].name}". Available: ${availableQuantity}, Requested: ${item.quantity}`
        );
      }
    }

    let totalAmount = 0;
    for (const item of items) {
      totalAmount += item.quantity * item.rate;
    }

    const gstRate = gstPercent || 0;
    const gstAmount = (totalAmount * gstRate) / 100;
    const grandTotal = totalAmount + gstAmount;

    const voucherResult = await client.query(
      `INSERT INTO vouchers (company_id, voucher_type, ledger_id, voucher_date, total_amount, gst_percent, gst_amount, grand_total, notes)
       VALUES ($1, 'sales', $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [companyId, ledgerId, voucherDate || new Date(), totalAmount, gstRate, gstAmount, grandTotal, notes || null]
    );
    const voucher = voucherResult.rows[0];

    for (const item of items) {
      const amount = item.quantity * item.rate;

      await client.query(
        `INSERT INTO voucher_items (voucher_id, stock_item_id, quantity, rate, amount)
         VALUES ($1, $2, $3, $4, $5)`,
        [voucher.id, item.stockItemId, item.quantity, item.rate, amount]
      );

      await client.query(
        `UPDATE stock_items SET quantity = quantity - $1 WHERE id = $2`,
        [item.quantity, item.stockItemId]
      );
    }

    await client.query(
      `UPDATE ledgers SET opening_balance = opening_balance - $1 WHERE id = $2`,
      [grandTotal, ledgerId]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Sales voucher created successfully",
      voucher,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create sales voucher error:", error);
    res.status(400).json({ message: error.message || "Server error creating sales voucher" });
  } finally {
    client.release();
  }
};

// GET all vouchers for a company (optionally filtered by type)
const getVouchers = async (req, res) => {
  const userId = req.userId;
  const { companyId, voucherType } = req.query;

  if (!companyId) {
    return res.status(400).json({ message: "companyId is required" });
  }

  try {
    const ownsCompany = await verifyCompanyOwnership(companyId, userId);
    if (!ownsCompany) {
      return res.status(403).json({ message: "Access denied to this company" });
    }

    let query = `
      SELECT v.*, l.name AS ledger_name
      FROM vouchers v
      JOIN ledgers l ON v.ledger_id = l.id
      WHERE v.company_id = $1
    `;
    const params = [companyId];

    if (voucherType) {
      query += " AND v.voucher_type = $2";
      params.push(voucherType);
    }

    query += " ORDER BY v.voucher_date DESC, v.created_at DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get vouchers error:", error);
    res.status(500).json({ message: "Server error fetching vouchers" });
  }
};

// GET a single voucher with its line items
const getVoucherById = async (req, res) => {
  const userId = req.userId;
  const voucherId = req.params.id;

  try {
    const voucherResult = await pool.query(
      `SELECT v.*, l.name AS ledger_name, c.name AS company_name
       FROM vouchers v
       JOIN ledgers l ON v.ledger_id = l.id
       JOIN companies c ON v.company_id = c.id
       WHERE v.id = $1 AND c.user_id = $2`,
      [voucherId, userId]
    );

    if (voucherResult.rows.length === 0) {
      return res.status(404).json({ message: "Voucher not found or access denied" });
    }

    const itemsResult = await pool.query(
      `SELECT vi.*, si.name AS item_name, si.unit
       FROM voucher_items vi
       JOIN stock_items si ON vi.stock_item_id = si.id
       WHERE vi.voucher_id = $1`,
      [voucherId]
    );

    res.json({
      voucher: voucherResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (error) {
    console.error("Get voucher by id error:", error);
    res.status(500).json({ message: "Server error fetching voucher" });
  }
};

module.exports = { createPurchaseVoucher, createSalesVoucher, getVouchers, getVoucherById };