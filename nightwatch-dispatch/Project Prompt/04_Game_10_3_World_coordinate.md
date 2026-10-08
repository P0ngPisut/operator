## 10.3 World coordinate

ใช้ coordinate system ของเกมเอง หน่วยเป็นเมตร:

```text
worldX: 0 → 10000
worldY: 0 → 10000
map center: (5000, 5000)
```

ตัวอย่าง `{ x: 6340, y: 4890 }` เป็นตำแหน่งในโลกจำลอง ไม่ใช่ latitude/longitude จริง ห้ามผูก gameplay logic โดยตรงกับ pixel coordinate ของ SVG หรือ CSS
