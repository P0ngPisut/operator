# 21. VERY LARGE CITY ROAD NETWORK — ACTIVE SPEC

ใช้ข้อกำหนดจาก `Project Prompt/02_Map_Road_Network_Prompt.md` เป็นสเปกแผนที่และโครงข่ายถนนฉบับเต็ม โดยยึดโลกจำลอง 10 × 10 km, logical grid 100 × 100 cells (100 m ต่อ cell) และห้ามผูก gameplay กับ pixel ของ SVG

ข้อมูลเมืองอยู่ใน `src/data/map/city.js`; road graph และ A* ใช้ world coordinates และข้อมูล node/edge ใน `src/pathfinding/graph.js` กับ `src/pathfinding/astar.js`. เมืองต้องมีหลายประเภท District, แม่น้ำหลัก/รอง, จุดสะพาน, สวน/green corridor และถนน Highway/Arterial/Local ตามสเปก เอกสารแยกแต่ละหัวข้ออยู่ในโฟลเดอร์ `Project Prompt/`.

เมื่อแก้แผนที่ ให้ตรวจว่า base locations, incident targets, route snapping, district/sector bounds และการวาด map overlay อยู่ในขอบเขต 10,000 × 10,000 m เดียวกัน ห้ามอ้างว่าเป็นข้อมูลกรุงเทพฯ จริง; เป็นเมืองสมมติที่ได้แรงบันดาลใจจากลักษณะผังเมืองเท่านั้น
