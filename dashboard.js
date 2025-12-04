const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/checkin
router.post('/checkin', async (req, res) => {
  try {
    const { customer_name, table_no } = req.body;
    const [r] = await db.query('INSERT INTO checkins (customer_name, table_no, created_at) VALUES (?, ?, NOW())', [customer_name, table_no]);
    res.json({ id: r.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// POST /api/catch (record fish caught/arrived)
router.post('/catch', async (req, res) => {
  try {
    const { fish_id, qty, note } = req.body;
    await db.query('INSERT INTO fish_movements (fish_id, qty, note, created_at) VALUES (?, ?, ?, NOW())', [fish_id, qty, note]);
    // Optionally update fish qty
    await db.query('UPDATE fish SET qty = qty + ? WHERE id = ?', [qty, fish_id]);
    res.json({ message: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;
