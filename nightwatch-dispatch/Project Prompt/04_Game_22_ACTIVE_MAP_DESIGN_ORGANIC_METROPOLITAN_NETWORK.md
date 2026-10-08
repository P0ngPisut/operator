# 22. ACTIVE MAP DESIGN — ORGANIC METROPOLITAN NETWORK

สร้างและแสดง tactical map ตาม `Project Prompt/02_Very_Large_City_Road_Network_Urban_Geography.md` โดยใช้ `public/nightwatch-city-map.svg` เป็นภาพฐานในหน้าเกม ซ้อน incident, station, unit และ dispatch route บนภาพตาม world coordinates; ลบการวาด city fabric/ถนนกริดแบบเก่าออกจาก React component
4. Road graph: nodes, edges, restrictions และ validation
5. A*: shortest travel time, vehicle-aware route, blocked-road handling
6. Unit simulation: position, route progress, EN_ROUTE, ARRIVED, RETURNING
7. Incident Spawner: weighted templates, valid locations, district-aware spawn
8. Dispatch integration: Police, Fire, Medical
9. Persistence: save/load, settings, event log
10. Optimization/tests: LOD, spatial lookup, build, lint และ unit tests

ห้ามกระโดดไป Phase 8 หาก Phase 2–5 ยังทดสอบไม่ได้
