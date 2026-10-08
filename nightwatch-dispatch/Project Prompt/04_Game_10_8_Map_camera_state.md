## 10.8 Map camera state

เก็บ state ที่สำคัญใน reducer/context กลาง:

```js
mapViewport: { x, y, zoom }
mapSelection: { districtId, sectorId, blockId, incidentId, unitId }
```

ห้ามใช้ local component state เป็นแหล่งข้อมูลหลักสำหรับ selection ที่มีผลต่อ gameplay; local transient state ใช้กับ animation/drag ได้ แต่ state สำคัญต้อง sync กลับ reducer
