## Definition of Done

1. ผู้เล่นเริ่มกะและตอบ Caller ได้ด้วย free-text เท่านั้น ไม่มี countdown และไม่มี preset answer choices
2. การตอบเปลี่ยน tone/Panic, Caller response, system log และ revealed coordinates ตามกฎ
3. Panic 100% ทำให้ Lost Case/penalty และปิดช่องตอบจริง
4. พิกัดที่เปิดเผยเติม Coordinate Console; VERIFY ถูก/ผิดให้ผลตามกติกาและข้อมูลไม่สูญหาย
5. Dispatch flow ทำงานครบและ unit เดินทางตามถนนบนแผนที่โดยไม่ผ่านสิ่งกีดขวาง
6. Radio briefing มีผลต่อ mission outcome และ economy ตาม risk ที่เลือก
7. UI อ่านง่ายใน desktop viewport และไม่มีข้อความ/controls ทับกัน
8. รัน `npm run build`; รัน lint/test ที่เกี่ยวข้องและรายงานข้อผิดพลาดเดิมแยกจากข้อผิดพลาดใหม่ ห้ามอ้างว่าผ่านถ้ายังไม่ได้รัน
9. ไม่แก้ไฟล์หรือ refactor ส่วนที่ไม่เกี่ยวข้อง และไม่เพิ่ม dependency หากของเดิมเพียงพอ
