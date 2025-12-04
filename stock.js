const express = require('express');
const router = express.Router();

// ========================================================
// 1. API: บันทึกรายจ่าย + อัปเดตสต็อกปลา (Expense with Fish Stock Update)
// ========================================================
router.post('/expense', async (req, res) => {
    const { sub_type, fish_id, fish_weight, quantity, amount, store_name, item_name } = req.body;
    
    const db = require('../db');
    const conn = await db.getConnection();
    
    try {
        await conn.beginTransaction();

        // 1.1 บันทึกลงบัญชีรายจ่าย (Finance Table)
        const desc = sub_type === 'buy_fish' 
            ? `ซื้อปลาเข้า: ${item_name} (${fish_weight}kg)` 
            : item_name;
        
        await conn.query(
            "INSERT INTO finance (type, amount, category, description, created_at) VALUES (?, ?, ?, ?, NOW())",
            ['expense', amount, sub_type, desc]
        );

        // 1.2 ถ้าเป็นการ "ซื้อปลา" ให้ไปอัปเดตสต็อก
        if (sub_type === 'buy_fish' && fish_id) {
            // ดึงข้อมูลเก่าเพื่อคำนวณต้นทุนเฉลี่ย (Weighted Average Cost)
            const [fish] = await conn.query(
                "SELECT current_weight, current_qty, avg_cost FROM fish_species WHERE id = ?", 
                [fish_id]
            );
            
            if (fish.length === 0) {
                throw new Error('Fish species not found');
            }

            const oldWeight = parseFloat(fish[0].current_weight || 0);
            const oldQty = parseFloat(fish[0].current_qty || 0);
            const oldCost = parseFloat(fish[0].avg_cost || 0);
            const newWeight = parseFloat(fish_weight || 0);
            const newQty = parseInt(quantity || 0);
            const newCostTotal = parseFloat(amount || 0);

            // สูตร: (ทุนเดิม + ทุนใหม่) / น้ำหนักรวมใหม่
            const totalWeight = oldWeight + newWeight;
            const newAvgCost = totalWeight > 0 
                ? ((oldWeight * oldCost) + newCostTotal) / totalWeight 
                : 0;

            // อัปเดตตารางแม่ (fish_species)
            await conn.query(
                "UPDATE fish_species SET current_qty = current_qty + ?, current_weight = current_weight + ?, avg_cost = ? WHERE id = ?",
                [newQty, newWeight, newAvgCost, fish_id]
            );

            // บันทึก Log การเข้า (fish_stock_logs) - สร้างตาราหากไม่มี
            try {
                await conn.query(
                    "INSERT INTO fish_stock_logs (fish_id, action_type, quantity, weight, amount, note, created_at) VALUES (?, 'in', ?, ?, ?, ?, NOW())",
                    [fish_id, newQty, newWeight, newCostTotal, `ซื้อจาก ${store_name}`]
                );
            } catch (logErr) {
                console.log('Log table may not exist, continuing without log entry');
            }
        }

        await conn.commit();
        res.json({ success: true, message: "บันทึกรายจ่ายและอัปเดตสต็อกแล้ว" });

    } catch (err) {
        await conn.rollback();
        console.error('Expense error:', err);
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
});

// ========================================================
// 2. API: เช็คบิล (Checkout - ขายปลาออก + ตัดสต็อก)
// ========================================================
router.post('/checkout', async (req, res) => {
    const { items, total, paymentMethod, note } = req.body;
    
    const db = require('../db');
    const conn = await db.getConnection();
    
    try {
        await conn.beginTransaction();

        // 2.1 บันทึกรายรับ (Finance Table)
        await conn.query(
            "INSERT INTO finance (type, amount, category, description, created_at) VALUES (?, ?, 'pos_sales', ?, NOW())",
            ['income', total, `ขายหน้าร้าน (${items.length} รายการ)`]
        );

        // 2.2 วนลูปสินค้า เพื่อตัดสต็อก
        for (const item of items) {
            // กรณีเป็นปลา (ขายออก)
            if (item.category === 'fish_out' && item.fish_id) {
                const weight = parseFloat(item.weight || 0);
                
                if (weight > 0) {
                    // ดึง avg_cost ก่อนตัดสต็อก เพื่อบันทึกต้นทุน
                    const [fish] = await conn.query(
                        "SELECT avg_cost FROM fish_species WHERE id = ?",
                        [item.fish_id]
                    );
                    
                    const costPerKg = fish.length > 0 ? parseFloat(fish[0].avg_cost || 0) : 0;
                    const totalCost = weight * costPerKg;

                    // ตัดสต็อก
                    await conn.query(
                        "UPDATE fish_species SET current_weight = GREATEST(current_weight - ?, 0) WHERE id = ?",
                        [weight, item.fish_id]
                    );

                    // บันทึก Log การออก (fish_stock_logs)
                    try {
                        await conn.query(
                            "INSERT INTO fish_stock_logs (fish_id, action_type, weight, amount, cost, note, created_at) VALUES (?, 'out', ?, ?, ?, ?, NOW())",
                            [item.fish_id, weight, item.price, totalCost, 'ขายหน้าร้าน']
                        );
                    } catch (logErr) {
                        console.log('Log entry skipped');
                    }
                }
            }
            // สินค้าทั่วไป (อื่นๆ) - ตัดสต็อก products หากจำเป็น
            else if (item.id && item.qty) {
                try {
                    await conn.query(
                        "UPDATE products SET stock = GREATEST(stock - ?, 0) WHERE id = ?",
                        [item.qty, item.id]
                    );
                } catch (prodErr) {
                    console.log('Product stock update skipped for:', item.id);
                }
            }
        }

        await conn.commit();
        res.json({ success: true, message: "Checkout สำเร็จ" });

    } catch (err) {
        await conn.rollback();
        console.error('Checkout error:', err);
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
});

// ========================================================
// 3. API: รายงานสถานะปลา (Fish Report - Real-time)
// ========================================================
router.get('/fish-report', async (req, res) => {
    try {
        const db = require('../db');
        const [rows] = await db.query(`
            SELECT 
                fs.id, fs.name_th, 
                fs.current_qty, fs.current_weight, fs.avg_cost,
                ROUND(fs.current_weight * fs.avg_cost, 2) as total_value_cost,
                
                -- หาจำนวนที่ขายออกไปวันนี้
                IFNULL((SELECT SUM(amount) FROM fish_stock_logs 
                    WHERE fish_id = fs.id AND action_type = 'out' AND DATE(created_at) = CURDATE()), 0) as sales_today,
                IFNULL((SELECT SUM(weight) FROM fish_stock_logs 
                    WHERE fish_id = fs.id AND action_type = 'out' AND DATE(created_at) = CURDATE()), 0) as weight_sold_today
            FROM fish_species fs
            ORDER BY fs.name_th
        `);
        res.json(rows);
    } catch (err) { 
        console.error('Fish report error:', err);
        res.status(500).json({ error: err.message }); 
    }
});

// ========================================================
// 4. API: ดึงข้อมูลปลาทั้งหมด (สำหรับ Dropdown ใน POS/Manager)
// ========================================================
router.get('/fish-list', async (req, res) => {
    try {
        const db = require('../db');
        const [rows] = await db.query(`
            SELECT id, name_th, current_qty, current_weight, avg_cost 
            FROM fish_species 
            ORDER BY name_th
        `);
        res.json(rows);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

module.exports = router;
