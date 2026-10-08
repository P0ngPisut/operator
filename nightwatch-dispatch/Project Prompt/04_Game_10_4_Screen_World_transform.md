## 10.4 Screen ↔ World transform

สร้าง utility กลาง เช่น `screenToWorld(screenX, screenY, viewport)` และ `worldToScreen(worldX, worldY, viewport)` โดย viewport มีอย่างน้อย `{ x, y, zoom, width, height }` ทุก marker, road, incident, unit และ selection ต้องอ้างอิง world coordinates แล้วค่อย transform เป็น screen coordinates ห้ามกระจายสูตร transform ไปหลาย component
