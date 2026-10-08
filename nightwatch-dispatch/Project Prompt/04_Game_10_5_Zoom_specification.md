## 10.5 Zoom specification

```text
MIN_ZOOM = 0.5
MAX_ZOOM = 8
DEFAULT_ZOOM = 1
newZoom = clamp(oldZoom * factor, MIN_ZOOM, MAX_ZOOM)
```

Wheel up = zoom in; wheel down = zoom out ใช้ factor ที่ smooth และป้องกันการกระโดด, marker drift, pan/zoom drift และ scroll หน้าเว็บแทน map เมื่อ cursor อยู่บน map

Cursor-anchored zoom:
1. อ่าน cursor position ใน Map viewport
2. แปลง cursor จาก screen → world ก่อน zoom
3. เปลี่ยน zoom
4. คำนวณ world point เดิมกลับเป็น screen
5. ปรับ camera x/y เพื่อให้ world point เดิมยังอยู่ใต้ cursor
