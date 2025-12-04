const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/service/request
router.post('/service/request', async (req, res) => {
  try {
    const { table_no, type, note } = req.body;
    const [r] = await db.query('INSERT INTO service_requests (table_no, type, note, status, created_at) VALUES (?, ?, ?, ?, NOW())', [table_no, type || 'call', note || '', 'pending']);
    res.json({ id: r.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// GET /api/service/pending
router.get('/service/pending', async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM service_requests WHERE status='pending' ORDER BY created_at ASC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// POST /api/service/complete
router.post('/service/complete', async (req, res) => {
  try {
    const { id } = req.body;
    await db.query('UPDATE service_requests SET status = ?, completed_at = NOW() WHERE id = ?', ['done', id]);
    res.json({ message: 'done' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;
