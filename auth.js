const express = require('express');
const router = express.Router();
// POST /api/login
router.post('/login', async (req, res) => {
  const db = require('../db');
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing username/password' });
  try {
    const [rows] = await db.query('SELECT id, username, password_hash, role FROM users WHERE username = ? LIMIT 1', [username]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    // NOTE: password verification (bcrypt) is placeholder - if your DB stores plain passwords adjust accordingly.
    const user = rows[0];
    // If using bcrypt hashed password:
    // const bcrypt = require('bcrypt');
    // const ok = await bcrypt.compare(password, user.password_hash);
    const ok = (password === user.password_hash) || (password === user.password); // fallback
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    // Return simple user object (no JWT implemented here)
    res.json({ id: user.id, username: user.username, role: user.role || 'staff' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
