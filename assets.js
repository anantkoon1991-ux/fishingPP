const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/assets
router.get('/assets', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM assets ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// POST /api/assets (create)
router.post('/assets', async (req, res) => {
  try {
    const { name, type, location, note } = req.body;
    const [r] = await db.query('INSERT INTO assets (name, type, location, note, created_at) VALUES (?, ?, ?, ?, NOW())', [name, type, location, note]);
    res.json({ id: r.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// POST /api/assets/action (repair / dispose)
router.post('/assets/action', async (req, res) => {
  try {
    const { asset_id, action_type, note } = req.body;
    await db.query('INSERT INTO asset_actions (asset_id, action_type, note, created_at) VALUES (?, ?, ?, NOW())', [asset_id, action_type, note]);
    // Optionally update asset status
    if (action_type === 'dispose') {
      await db.query('UPDATE assets SET status = ? WHERE id = ?', ['disposed', asset_id]);
    }
    res.json({ message: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;
