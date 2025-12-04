// config.js - USAGE GUIDE & EXAMPLES
// ====================================

// ✅ ตัวอย่าง 1: ใช้ AppConfig.fetch ในหน้า assets.html
// ----------------------------------------------
// จากเดิม (Hardcode URL - ❌ อันตราย):
/*
async function loadAssets() {
    const res = await fetch('http://localhost:3000/api/assets');
    const data = await res.json();
    console.log(data);
}
*/

// ✅ เปลี่ยนเป็น (ใช้ config.js - ปลอดภัย):
/*
async function loadAssets() {
    try {
        const res = await AppConfig.fetch('/api/assets');
        const data = await res.json();
        console.log(data);
    } catch (error) {
        console.error('Failed to load assets:', error);
    }
}
*/

// ✅ ตัวอย่าง 2: POST request (เช่น เพิ่มทรัพยากรใหม่)
/*
async function createAsset(assetData) {
    try {
        const res = await AppConfig.fetch('/api/assets', {
            method: 'POST',
            body: JSON.stringify(assetData)
        });
        
        if (res.ok) {
            const result = await res.json();
            console.log('Asset created:', result);
        } else {
            console.error('Error:', res.status);
        }
    } catch (error) {
        console.error('Failed to create asset:', error);
    }
}
*/

// ✅ ตัวอย่าง 3: ใช้ AppConfig.API_BASE_URL เพื่อสร้าง URL
/*
async function fetchUserProfile() {
    try {
        const url = `${AppConfig.API_BASE_URL}/api/users/profile`;
        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch profile:', error);
    }
}
*/

// ✅ ตัวอย่าง 4: Fish Stock API (เพิ่มปลาเข้า)
/*
async function recordFishIn(fishData) {
    try {
        const res = await AppConfig.fetch('/api/fish-stock/in', {
            method: 'POST',
            body: JSON.stringify(fishData)
        });
        
        const result = await res.json();
        if (result.success) {
            console.log('Fish in recorded:', result.data);
            return result.data;
        } else {
            console.error('Error:', result.error);
        }
    } catch (error) {
        console.error('Failed to record fish in:', error);
    }
}

// เรียกใช้:
recordFishIn({
    fish_id: 1,
    pond: 'บ่อ A',
    quantity: 100,
    staff: 'admin',
    reason: 'ซื้อเพิ่ม',
    note: 'จากผู้ขาย ABC'
});
*/

// ✅ ตัวอย่าง 5: ดึงข้อมูล Fish Stock Dashboard
/*
async function getFishDashboard() {
    try {
        const res = await AppConfig.fetch('/api/fish-stock/dashboard');
        const data = await res.json();
        console.log('Dashboard:', data.summary);
        console.log('By Fish:', data.by_fish);
        console.log('By Pond:', data.by_pond);
    } catch (error) {
        console.error('Failed to fetch dashboard:', error);
    }
}
*/

// ✅ ตัวอย่าง 6: Handle 401/403 responses
// (config.js จัดการให้อัตโนมัติ - ลบ token และไปหน้า login)
/*
async function protectedOperation() {
    try {
        const res = await AppConfig.fetch('/api/protected-endpoint');
        
        if (res.status === 401 || res.status === 403) {
            // config.js จัดการให้แล้ว: ลบ token, แสดง alert, ไปหน้า login
            return;
        }
        
        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
    }
}
*/

// ✅ ตัวอย่าง 7: ตรวจสอบ Token ตัวจริง
/*
window.addEventListener('load', () => {
    const token = localStorage.getItem('token');
    if (!token && !window.location.href.includes('login.html')) {
        // ไม่มี token, ไปหน้า login
        window.location.href = 'login.html';
    }
});
*/

// ✅ ตัวอย่าง 8: Logout
/*
function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}
*/

// 📝 CHECKLIST - ต้องทำในแต่ละ HTML FILE:
// ============================================
// [ ] 1. เพิ่ม <script src="config.js"></script> ในส่วน <head>
// [ ] 2. หาบรรทัด fetch ที่ Hardcode URL (เช่น 'http://localhost:3000/api/...')
// [ ] 3. เปลี่ยนเป็น AppConfig.fetch('/api/...')
// [ ] 4. ทดสอบว่าทำงานได้ (เปิด DevTools > Console)
// [ ] 5. ตรวจสอบ localStorage มี token ถ้า login สำเร็จ

// 💡 TIPS:
// - AppConfig.fetch จัดการ Authorization header อัตโนมัติ (ไม่ต้องเพิ่มเอง)
// - ถ้า Token หมดอายุ (401/403) config.js จะเด้งไปหน้า login อัตโนมัติ
// - AppConfig.API_BASE_URL = '' (port 3000) หรือ 'http://localhost:3000' (port อื่น)
// - ใช้ res.ok แทน res.status === 200 เพื่อเช็คว่า request สำเร็จ

console.log('✅ config.js loaded successfully');
console.log('📚 Available: AppConfig.API_BASE_URL, AppConfig.fetch()');
