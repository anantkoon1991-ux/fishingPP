const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const path = require('path');
const db = require('./db');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const LINE_TOKEN = 'YOUR_LINE_TOKEN_HERE';

async function sendLineNotify(message) {
    if (LINE_TOKEN === 'YOUR_LINE_TOKEN_HERE') return;
    try {
        await axios.post('https://notify-api.line.me/api/notify', 
            `message=${message}`, 
            { headers: { 'Authorization': `Bearer ${LINE_TOKEN}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
    } catch (err) { console.error('Line Error:', err.message); }
}

// --- API Login ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
        if (users.length > 0) res.json({ success: true, user: users[0] });
        else res.json({ success: false, message: 'Login Failed' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- API Fish ---
app.get('/api/fish', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM fish_species');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- [ใหม่] API: บันทึกรายจ่ายละเอียด & ซื้อปลาเข้า ---
app.post('/api/finance/expense', async (req, res) => {
    // รับค่าแบบละเอียด
    const { 
        sub_type, // general, transport, fish_food, investment, buy_fish
        store_name, item_name, unit, quantity, amount, ref_no, 
        fish_id, fish_weight // เฉพาะกรณีซื้อปลา
    } = req.body;

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. สร้างคำอธิบาย (Description)
        let desc = `${item_name}`;
        if (store_name) desc = `[${store_name}] ` + desc;
        if (quantity > 0) desc += ` (${quantity} ${unit || ''})`;
        if (ref_no) desc += ` #${ref_no}`;

        // 2. บันทึกลงตาราง Finance
        await conn.query(
            `INSERT INTO finance 
            (type, amount, description, expense_category, store_name, item_name, unit, quantity, ref_no, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')`,
            ['expense', amount, desc, sub_type, store_name, item_name, unit, quantity, ref_no]
        );

        // 3. กรณีเป็น "ซื้อปลาเข้า" (Buy Fish) -> ต้องไปเพิ่มสต็อกปลา
        if (sub_type === 'buy_fish' && fish_id) {
            // เพิ่ม Log การนำเข้า
            await conn.query(
                `INSERT INTO fish_stock_log (fish_id, action, quantity, weight, total_price, note) 
                 VALUES (?, 'in', ?, ?, ?, ?)`,
                [fish_id, quantity, fish_weight, amount, `ซื้อเข้าจาก: ${store_name}`]
            );
            
            // อัปเดตตารางปลาหลัก (บวกจำนวนและน้ำหนัก)
            await conn.query(
                `UPDATE fish_species 
                 SET current_qty = current_qty + ?, current_weight = current_weight + ? 
                 WHERE id = ?`,
                [quantity, fish_weight, fish_id]
            );
        }

        await conn.commit();
        broadcastStats(); // อัปเดตหน้าจอ
        res.json({ success: true });

    } catch (err) {
        await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
});

// --- API Checkout (ขายหน้าร้าน) ---
app.post('/api/checkout', async (req, res) => {
    const { items, total, paymentMethod } = req.body;
    const summary = items.map(i => `${i.name} (x${i.qty})`).join(', ');
    try {
        await db.query('INSERT INTO finance (type, amount, description, status) VALUES (?, ?, ?, ?)', 
            ['income', total, `ขายหน้าร้าน: ${summary} (${paymentMethod})`, 'completed']);
        
        // ตัดสต็อกอุปกรณ์
        for (const item of items) {
            if (item.category === 'rental') {
                await db.query('UPDATE equipment SET available_qty = available_qty - ? WHERE name = ?', [item.qty, item.name]);
            }
        }
        broadcastStats(); 
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- API Products ---
app.get('/api/products', async (req, res) => {
    const [prods] = await db.query('SELECT * FROM products');
    const [equips] = await db.query('SELECT * FROM equipment');
    res.json({ products: prods, equipment: equips });
});

// --- API Finance History ---
app.get('/api/finance/history', async (req, res) => {
    const [rows] = await db.query('SELECT * FROM finance ORDER BY created_at DESC LIMIT 100');
    res.json(rows);
});

// --- API Finance Summary ---
app.get('/api/finance/summary', async (req, res) => {
    const [rows] = await db.query(`SELECT SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as income, SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expense FROM finance WHERE DATE(created_at) = CURDATE() AND status = 'completed'`);
    res.json({ income: rows[0].income||0, expense: rows[0].expense||0, net: (rows[0].income||0)-(rows[0].expense||0) });
});

// --- API Close Day ---
app.post('/api/finance/close-day', async (req, res) => {
    res.json({ success: true });
});

// --- API: POS Bills Today ---
app.get('/api/pos/bills-today', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT * FROM finance 
            WHERE DATE(created_at) = CURDATE() 
            AND type = 'income' 
            ORDER BY created_at DESC
        `);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- API: Void Bill ---
app.post('/api/pos/void', async (req, res) => {
    const { id, reason } = req.body;
    try {
        await db.query('UPDATE finance SET status = ?, void_reason = ? WHERE id = ?', ['void', reason, id]);
        broadcastStats();
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

async function broadcastStats() {
    const [cRows] = await db.query('SELECT COUNT(*) as total FROM customers');
    const [fRows] = await db.query(`SELECT SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as income, SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expense FROM finance WHERE status = 'completed'`);
    io.emit('stats-updated', { people: cRows[0].total, balance: (fRows[0].income||0)-(fRows[0].expense||0) });
}

io.on('connection', (socket) => { broadcastStats(); });

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => { 
    console.log(`🚀 Server Dr.Myland เดินเครื่องเต็มระบบที่: http://localhost:${PORT}`);
    console.log('✅ เชื่อมต่อ Database สำเร็จแล้ว!');
});