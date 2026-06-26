const pool = require("../config/db");

const verifyCompanyOwnership = async (companyId, userId) => {
  const result = await pool.query(
    "SELECT * FROM companies WHERE id = $1 AND user_id = $2",
    [companyId, userId]
  );
  return result.rows.length > 0;
};

// CREATE a Purchase Voucher
// Body shape: { companyId, ledgerId, voucherDate, notes, items: [{ stockItemId, quantity, rate }] }
const createPurchaseVoucher = async (req, res) => {
  const userId = req.userId;
  const { companyId, ledgerId, voucherDate, notes, items } = req.body;

  if (!companyId || !ledgerId || !items || items.length === 0) {
    return res
      .status(400)
      .json({ message: "companyId, ledgerId, and at least one item are required" });
  }

  const ownsCompany = await verifyCompanyOwnership(companyId, userId);
  if (!ownsCompany) {
    return res.status(403).json({ message: "Access denied to this company" });
  }

  // Get a single dedicated connection from the pool for this whole transaction.
  // We can't use pool.query() for transactions because each pool.query() call
  // might run on a DIFFERENT connection — we need ONE connection for all the
  // steps below, so they're treated as a single unit by Postgres.
  const client = await pool.connect();

  try {
    // Start the transaction
    await client.query("BEGIN");

    // Calculate the total amount across all items
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += item.quantity * item.rate;
    }

    // 1. Create the voucher record itself
    const voucherResult = await client.query(
      `INSERT INTO vouchers (company_id, voucher_type, ledger_id, voucher_date, total_amount, notes)
       VALUES ($1, 'purchase', $2, $3, $4, $5) RETURNING *`,
      [companyId, ledgerId, voucherDate || new Date(), totalAmount, notes || null]
    );
    const voucher = voucherResult.rows[0];

    // 2. Create each voucher_item, AND increase that stock item's quantity
    for (const item of items) {
      const amount = item.quantity * item.rate;

      await client.query(
        `INSERT INTO voucher_items (voucher_id, stock_item_id, quantity, rate, amount)
         VALUES ($1, $2, $3, $4, $5)`,
        [voucher.id, item.stockItemId, item.quantity, item.rate, amount]
      );

      // Purchases INCREASE stock on hand
      await client.query(
        `UPDATE stock_items SET quantity = quantity + $1 WHERE id = $2`,
        [item.quantity, item.stockItemId]
      );
    }

    // 3. Update the supplier's ledger balance (purchase = we owe them more = increase their balance)
    await client.query(
      `UPDATE ledgers SET opening_balance = opening_balance + $1 WHERE id = $2`,
      [totalAmount, ledgerId]
    );

    // Everything succeeded — make all the changes permanent
    await client.query("COMMIT");

    res.status(201).json({
      message: "Purchase voucher created successfully",
      voucher,
    });
  } catch (error) {
    // Something failed — undo EVERYTHING from this transaction, as if none of it happened
    await client.query("ROLLBACK");
    console.error("Create purchase voucher error:", error);
    res.status(500).json({ message: "Server error creating purchase voucher" });
  } finally {
    // Always release the connection back to the pool, whether we succeeded or failed
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

// GET a single voucher with its line items (for viewing/printing an invoice later)
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
// CREATE a Sales Voucher
// Body shape: { companyId, ledgerId, voucherDate, notes, items: [{ stockItemId, quantity, rate }] }
const createSalesVoucher = async (req, res) => {
  const userId = req.userId;
  const { companyId, ledgerId, voucherDate, notes, items } = req.body;

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

    // SAFETY CHECK: before doing anything, confirm enough stock exists for EVERY item.
    // We check all items first, so if item #3 of 5 fails, we haven't already
    // partially modified items #1 and #2.
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

    // 1. Create the voucher record
    const voucherResult = await client.query(
      `INSERT INTO vouchers (company_id, voucher_type, ledger_id, voucher_date, total_amount, notes)
       VALUES ($1, 'sales', $2, $3, $4, $5) RETURNING *`,
      [companyId, ledgerId, voucherDate || new Date(), totalAmount, notes || null]
    );
    const voucher = voucherResult.rows[0];

    // 2. Create each voucher_item, AND decrease that stock item's quantity
    for (const item of items) {
      const amount = item.quantity * item.rate;

      await client.query(
        `INSERT INTO voucher_items (voucher_id, stock_item_id, quantity, rate, amount)
         VALUES ($1, $2, $3, $4, $5)`,
        [voucher.id, item.stockItemId, item.quantity, item.rate, amount]
      );

      // Sales DECREASE stock on hand (opposite of purchases)
      await client.query(
        `UPDATE stock_items SET quantity = quantity - $1 WHERE id = $2`,
        [item.quantity, item.stockItemId]
      );
    }

    // 3. Update the customer's ledger balance (sale = they owe us less, or we've recorded income)
    //    Simplified MVP logic: decrease their balance
    await client.query(
      `UPDATE ledgers SET opening_balance = opening_balance - $1 WHERE id = $2`,
      [totalAmount, ledgerId]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Sales voucher created successfully",
      voucher,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create sales voucher error:", error);
    // If our own stock-check threw the error, show that specific message;
    // otherwise show a generic one
    res.status(400).json({ message: error.message || "Server error creating sales voucher" });
  } finally {
    client.release();
  }
};

module.exports = { createPurchaseVoucher, createSalesVoucher, getVouchers, getVoucherById };