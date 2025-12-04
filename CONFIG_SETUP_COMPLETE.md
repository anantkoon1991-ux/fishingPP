# 🛠️ Config.js Integration - Complete

## ✅ สิ่งที่ทำเสร็จแล้ว

### 1. **สร้างไฟล์ config.js**
   - 📍 ตำแหน่ง: `public/config.js`
   - ✨ ฟีเจอร์:
     - Auto-detect port (3000 vs อื่น)
     - Helper function `AppConfig.fetch()` 
     - Auto-inject Authorization header
     - Auto-redirect to login on 401/403

### 2. **อัปเดต HTML files ทั้งหมด**
   เพิ่ม `<script src="config.js"></script>` ลงใน:
   - ✅ admin.html
   - ✅ dashboard.html
   - ✅ assets.html
   - ✅ pos.html
   - ✅ manager.html
   - ✅ service.html
   - ✅ finance.html
   - ✅ fish.html
   - ✅ login.html (อัปเดตเพื่อใช้ AppConfig.fetch)

### 3. **สร้างไฟล์ Usage Guide**
   - 📍 ตำแหน่ง: `public/CONFIG_USAGE_GUIDE.js`
   - 📝 ประกอบด้วยตัวอย่าง 8 แบบ พร้อม CHECKLIST

---

## 📖 ตัวอย่างการใช้งาน

### 🔹 ตัวอย่าง 1: ดึงข้อมูล (GET)
```javascript
// ❌ เดิม
const res = await fetch('http://localhost:3000/api/assets');

// ✅ ใหม่
const res = await AppConfig.fetch('/api/assets');
const data = await res.json();
```

### 🔹 ตัวอย่าง 2: เพิ่มข้อมูล (POST)
```javascript
const res = await AppConfig.fetch('/api/assets', {
    method: 'POST',
    body: JSON.stringify(assetData)
});

if (res.ok) {
    const result = await res.json();
    console.log('Success:', result);
}
```

### 🔹 ตัวอย่าง 3: Fish Stock API
```javascript
// บันทึกปลาเข้า
const res = await AppConfig.fetch('/api/fish-stock/in', {
    method: 'POST',
    body: JSON.stringify({
        fish_id: 1,
        pond: 'บ่อ A',
        quantity: 100,
        staff: 'admin',
        reason: 'ซื้อเพิ่ม'
    })
});

const result = await res.json();
if (result.success) {
    console.log('Fish recorded:', result.data);
}
```

---

## 🎯 ขั้นตอนถัดไป

### สำหรับ Developer ที่ต้องการอัปเดต JavaScript:

1. **เปิดไฟล์ HTML** ที่มี JavaScript เรียก fetch
   
2. **หาบรรทัด fetch** (บน Google วิธีค้นหา: `Ctrl+F` ค้นหา "fetch")
   
3. **เปลี่ยนจาก:**
   ```javascript
   const res = await fetch(`http://localhost:3000/api/...`, {...})
   ```
   **เป็น:**
   ```javascript
   const res = await AppConfig.fetch('/api/...', {...})
   ```

4. **ลบออก:**
   ```javascript
   headers: { 'Content-Type': 'application/json' }  // config.js จัดการให้แล้ว
   ```

5. **ทดสอบ:**
   - เปิด browser DevTools (F12)
   - ไปที่ Console tab
   - ค้นหา error
   - ตรวจสอบ Network tab เพื่อดู API calls

---

## 💡 ข้อดีของ config.js

| ข้อดี | รายละเอียด |
|------|-----------|
| 🔒 **Secure** | ไม่ต้อง hardcode URL ใน JavaScript |
| 🚀 **ง่าย** | เรียก `AppConfig.fetch()` แทน `fetch()` |
| 🔐 **Token Auto** | ใส่ Authorization header อัตโนมัติ |
| ⏰ **Session** | Auto-logout เมื่อ token หมดอายุ |
| 🌐 **Portable** | ใช้ได้ทั้ง localhost:3000 และ live server |

---

## 🧪 ตรวจสอบในส่วน Console

```javascript
// ลอง paste ใน DevTools Console:

// 1. ตรวจสอบ config.js โหลด
console.log(AppConfig);  // ควรเห็น Object { API_BASE_URL, fetch }

// 2. ตรวจสอบ API_BASE_URL
console.log(AppConfig.API_BASE_URL);  // '' or 'http://localhost:3000'

// 3. ลองเรียก fetch ตัวจริง
AppConfig.fetch('/api/assets')
    .then(res => res.json())
    .then(data => console.log(data))
    .catch(err => console.error(err));
```

---

## 📋 CHECKLIST - ต้องทำต่อ

- [ ] ทดสอบ login.html ว่า Login ได้ปกติ
- [ ] ทดสอบอีก 1-2 หน้า (assets, dashboard)
- [ ] หาบรรทัด fetch ทั้งหมดในทุก .html
- [ ] เปลี่ยน fetch เป็น AppConfig.fetch
- [ ] ลบ hardcode URL ออก
- [ ] ทดสอบ API calls ใน DevTools Network tab
- [ ] ตรวจสอบ localStorage มี token หลัง login
- [ ] ทดสอบ logout / session timeout

---

## 🆘 ปัญหาที่อาจเจอ

### Problem: `AppConfig is not defined`
**วิธีแก้:** 
- ตรวจสอบว่า `<script src="config.js"></script>` อยู่ในไฟล์ HTML
- ต้องใส่ **ก่อน** script ที่ใช้ AppConfig

### Problem: API call ล้มเหลว 404
**วิธีแก้:**
- เช็ค endpoint path ถูกต้องไหม
- ใช้ DevTools Network tab ดู request URL
- Server ยังไม่ start ไหม

### Problem: Token ไม่ติด Authorization header
**วิธีแก้:**
- ตรวจสอบ localStorage มี 'token' ไหม
- เรียก `localStorage.getItem('token')` ใน Console

---

## 📚 ไฟล์ที่เกี่ยวข้อง

- ✅ `public/config.js` — Config file หลัก
- 📖 `public/CONFIG_USAGE_GUIDE.js` — ตัวอย่างใช้งาน
- 🔧 `public/login.html` — ตัวอย่างการอัปเดต
- 📄 ไฟล์ HTML อื่นๆ — มี `<script src="config.js"></script>` แล้ว

---

**สร้างเมื่อ:** December 3, 2025  
**สถานะ:** ✅ Complete
