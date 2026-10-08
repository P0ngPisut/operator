## 12.2 Logical tables / collections

ออกแบบ schema ที่รองรับอย่างน้อย:

- PLAYER: id, funds, reputation, level, xp, livesSaved, livesLost
- UNITS: id, department, vehicleId, status, crewIds, worldX, worldY, currentNodeId, targetIncidentId
- PERSONNEL: id, department, rank, equipmentIds, status
- VEHICLES: id, department, catalogId, status, crewIds, equipmentState
- INCIDENTS: id, type, department, severity, worldX, worldY, status, createdAt, resolvedAt, outcome
- ROADS: id, nodes, edges, restrictions
- LOCATIONS: id, type, worldX, worldY, districtId, sectorId
- GAME_EVENTS: id, timestamp, type, payload
- SETTINGS: key, value

ไม่จำเป็นต้อง implement relational database server ใน prototype
