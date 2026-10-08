## 14.4 Unit movement

สถานะ unit อย่างน้อย: IDLE, DISPATCHED, EN_ROUTE, ARRIVED, ON_SCENE, RETURNING, UNAVAILABLE

ระหว่าง EN_ROUTE มี current edge, progress 0..1 และ world position ที่คำนวณจาก road segment; UI marker เคลื่อนตาม route ใช้ simulation tick หรือ requestAnimationFrame สำหรับ visual interpolation และใช้ simulation time สำหรับ gameplay state ไม่ใช้ `setTimeout(4000)` บอกว่าถึงแล้ว
