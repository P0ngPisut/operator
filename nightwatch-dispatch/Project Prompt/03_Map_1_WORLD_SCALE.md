## 1. WORLD SCALE

* ขนาดเมืองทั้งหมด: **10 × 10 km**
* World Coordinate:

  * X = 0–10,000 m
  * Y = 0–10,000 m
* Logical Grid:

  * **100 × 100 cells**
  * 1 cell = **100 × 100 m**
* Grid นี้ใช้เป็น logical/world coordinate เท่านั้น
* **ห้ามผูก gameplay หรือ road network เข้ากับ pixel ของ SVG โดยตรง**
* ถนนทั้งหมดต้องถูกสร้างเป็นข้อมูลเชิงโครงสร้าง เช่น nodes / edges / roads / intersections เพื่อรองรับระบบ routing และ A* ในอนาคต

---
