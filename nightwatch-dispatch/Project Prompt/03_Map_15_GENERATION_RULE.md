# 15. GENERATION RULE

Road generation ต้องเป็น **structured procedural generation**

ห้ามใช้ random generation แบบไร้ข้อจำกัด

Generation pipeline:

1. Generate city boundary
2. Generate Main River
3. Generate Secondary Rivers
4. Generate Districts
5. Assign District Type
6. Generate Highway
7. Generate Arterial
8. Generate District road structure
9. Generate Local Roads
10. Generate Bridges
11. Validate connectivity
12. Validate road hierarchy
13. Validate emergency accessibility
14. Build Road Graph
15. Generate spatial index

---
