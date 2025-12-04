const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/products
router.get('/products', async (req, res) => {
  try {
    // Adjust table names/columns to match your schema
    const [rows] = await db.query('SELECT id, name, type, price, stock FROM products ORDER BY name');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// POST /api/checkout
router.post('/checkout', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { items, total, payment_method } = req.body;
    // Create a sale (simple example)
    const [r] = await conn.query('INSERT INTO bills (total, payment_method, created_at) VALUES (?, ?, NOW())', [total, payment_method || 'cash']);
    const billId = r.insertId;
    // items = [{ product_id, qty, price }]
    for (const it of items || []) {
      await conn.query('INSERT INTO bill_items (bill_id, product_id, qty, price) VALUES (?, ?, ?, ?)', [billId, it.product_id, it.qty, it.price]);
      // Decrease stock if applicable
      await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [it.qty, it.product_id]);
    }
    await conn.commit();
    res.json({ message: 'ok', billId });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Checkout failed' });
  } finally {
    conn.release();
  }
});

// GET /api/pos/bills-today
router.get('/pos/bills-today', async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM bills WHERE DATE(created_at) = CURDATE() ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// POST /api/pos/void
router.post('/pos/void', async (req, res) => {
  const { bill_id } = req.body;
  try {
    await db.query('UPDATE bills SET status = ? WHERE id = ?', ['void', bill_id]);
    // Optionally restore stock - depends on your business logic
    // For safety, not automatically restoring stock here unless you want it.
    res.json({ message: 'voided' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;
