// config.js
const AppConfig = {
    // ตรวจสอบอัตโนมัติ: ถ้าเปิดผ่าน Node server (port 3000) ให้ใช้ path ปัจจุบัน
    // แต่ถ้าเปิดผ่าน Live Server หรือ Double Click ไฟล์ (port อื่น) ให้ยิงไป localhost:3000
    API_BASE_URL: (window.location.port === '3000') ? '' : 'http://localhost:3000',
    
    // ฟังก์ชันช่วยเรียก API (จะได้ไม่ต้องพิมพ์ headers บ่อยๆ)
    async fetch(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        
        // เตรียม Headers พื้นฐาน
        const defaultHeaders = {
            'Content-Type': 'application/json'
        };

        // ถ้ามี Token ให้แนบไปด้วย
        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        };

        const url = `${this.API_BASE_URL}${endpoint}`;
        
        try {
            const response = await fetch(url, config);
            
            // กรณี Token หมดอายุ (401) หรือ 403 ให้เด้งไปหน้า Login
            if (response.status === 401 || response.status === 403) {
                // เช็คว่าไม่ได้อยู่ที่หน้า login อยู่แล้ว เพื่อกัน Loop
                if (!window.location.href.includes('login.html')) {
                    alert('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
                    localStorage.removeItem('token');
                    window.location.href = 'login.html';
                }
            }
            
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
};
