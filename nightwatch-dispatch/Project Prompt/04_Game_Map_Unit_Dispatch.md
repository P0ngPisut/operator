## Map และ Unit Dispatch

- ใช้ `public/nightwatch-city-map.svg` เป็นแผนที่จริงในหน้าจอ แล้ววาง incident, route, station และ unit markers บน world coordinates ชุดเดียวกัน
- เป็นแผนที่เมืองจำลองที่วาดขึ้นใหม่ในสไตล์ satellite/vector hybrid ไม่ใช่ Google Maps tiles และไม่ควรอ้างว่าเป็นแผนที่จริง
- React SVG overlay แสดงฐาน Police/Fire/Medical, จุด incident, signal radius, route, unit marker และสถานะเดินทาง
- Coordinate Console มี BLOCK / SECTOR / UNIT ช่องละ 3 หลัก; VERIFY ต้องเทียบพิกัดเป้าหมายและบันทึกผล
- เมื่อพิกัดถูกต้อง ผู้เล่นเลือก department และ vehicle, จัดจำนวนกำลังพล, ยืนยันทีม และส่งหน่วย
- รถควรวิ่งตาม road path ไม่ตัดผ่านอาคาร; ให้เส้นทางสอดคล้องกับถนนและข้อจำกัดรถใน incident
- เมื่อถึงจุดเกิดเหตุให้เปิด Field Radio Briefing 3 ตัวเลือก แล้ว outcome ต้องกระทบผลภารกิจ, เงิน, XP, ผู้รอดชีวิต/ผู้บาดเจ็บอย่างมีความหมาย
- **ข้อเท็จจริงปัจจุบัน:** map marker และเส้นทางยังมีพิกัด hard-coded; arrival จำลองด้วย timeout ประมาณ 4 วินาที จึงควรระวังการ sync ระหว่างตำแหน่งบนภาพกับ target coords จริง
