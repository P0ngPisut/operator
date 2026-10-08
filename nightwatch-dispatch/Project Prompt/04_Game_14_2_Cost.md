## 14.2 Cost

ใช้ `travelTimeSec` เป็น edge cost หลัก ไม่ใช้ระยะทางอย่างเดียว เพราะรถแต่ละประเภทความเร็วต่างกัน:

```text
effectiveSpeed = baseVehicleSpeed × roadModifier × restrictionModifier
```

Highway มี modifier สูง, local road ต่ำ, narrow road ลดความเร็วรถใหญ่ และ restricted road ตัด edge ออกจาก route ได้ Heuristic ใช้ `remainingDistance / maxVehicleSpeed` และต้อง admissible
