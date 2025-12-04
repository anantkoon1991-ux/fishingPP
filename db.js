const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ เชื่อมต่อ Database ไม่สำเร็จ:', err.code);
        if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('👉 เช็ค Username/Password ในไฟล์ .env อีกทีนะครับ');
        } else if (err.code === 'ER_BAD_DB_ERROR') {
            console.error('👉 เช็คชื่อ Database ว่าตรงกับที่สร้างใน Workbench ไหม');
        }
    } else {
        console.log('✅ เชื่อมต่อ Database สำเร็จแล้ว!');
        connection.release();
    }
});

module.exports = pool.promise();
