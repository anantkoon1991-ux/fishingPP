const express = require('express');
const router = express.Router();

// GET /api/finance/search - Date-based search for daily reports
router.get('/search', async (req, res) => {
  try {
    const db = require('../db');
    const { date, start, end } = req.query;
    let sql = 'SELECT id, type, amount, description, created_at FROM finance WHERE 1=1';
    let params = [];

    if(date) {
      sql += ' AND DATE(created_at) = ?';
      params.push(date);
    } else if(start && end) {
      sql += ' AND DATE(created_at) BETWEEN ? AND ?';
      params.push(start, end);
    }

    sql += ' ORDER BY created_at DESC';

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});
router.get('/fish', async (req, res) => {
  try {
    const db = require('../db');
    const [rows] = await db.query('SELECT id, name, species, qty FROM fish ORDER BY name');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// GET /api/finance/summary
router.get('/summary', async (req, res) => {
  try {
    const db = require('../db');
    // Example: compute today's income and expense - adjust queries to your schema
    const [[inc]] = await db.query("SELECT IFNULL(SUM(total),0) AS income FROM bills WHERE DATE(created_at)=CURDATE() AND status!='void'");
    const [[exp]] = await db.query("SELECT IFNULL(SUM(amount),0) AS expense FROM finance WHERE DATE(created_at)=CURDATE()");
    res.json({ income: inc.income || 0, expense: exp.expense || 0, balance: (inc.income || 0) - (exp.expense || 0) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// GET /api/finance/history
router.get('/history', async (req, res) => {
  try {
    const db = require('../db');
    const [rows] = await db.query('SELECT * FROM finance ORDER BY created_at DESC LIMIT 100');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// GET /api/finance/search - Date-based search for daily reports
router.get('/search', async (req, res) => {
  try {
    const db = require('../db');
    const { date, start, end } = req.query;
    let sql = 'SELECT id, type, amount, description, created_at FROM finance WHERE 1=1';
    let params = [];

    if(date) {
      sql += ' AND DATE(created_at) = ?';
      params.push(date);
    } else if(start && end) {
      sql += ' AND DATE(created_at) BETWEEN ? AND ?';
      params.push(start, end);
    }

    sql += ' ORDER BY created_at DESC';

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// POST /api/finance/expense
router.post('/expense', async (req, res) => {
  try {
    const db = require('../db');
    const { category, amount, note } = req.body;
    await db.query('INSERT INTO finance (type, category, amount, note, created_at) VALUES (?, ?, ?, ?, NOW())', ['expense', category, amount, note]);
    res.json({ message: 'saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// POST /api/finance (generic quick entry)
router.post('/', async (req, res) => {
  try {
    const db = require('../db');
    const { type, category, amount, note } = req.body;
    await db.query('INSERT INTO finance (type, category, amount, note, created_at) VALUES (?, ?, ?, ?, NOW())', [type || 'income', category || '', amount || 0, note || '']);
    res.json({ message: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// POST /api/finance/close-day
router.post('/close-day', async (req, res) => {
  try {
    const db = require('../db');
    // Implement your close-day logic here: snapshot totals, create a record, etc.
    await db.query('INSERT INTO day_close (closed_at, note) VALUES (NOW(), ?)', [req.body.note || '']);
    res.json({ message: 'closed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;
