## Incident Data

`src/data/incidents.js` มี generator สำหรับสร้างข้อมูลเหตุการณ์ 3 เคส มี `INC-####`, `deptCategory` (police/fire/medical), severity, minLevel, caller name, risk, street restriction, พิกัด 3 ชุด, เวลาตอบเดิม และ field briefing

แต่ละ scenario ควรมี narrative ที่แตกต่างกัน เช่น บุกรุกเคหสถาน/เหตุคุกคาม, เพลิงไหม้/สารเคมี และผู้ป่วยฉุกเฉิน/อุบัติเหตุ ต้องระบุพิกัดเป็น string 3 หลักทุกช่อง และมี field briefing 3 แบบพร้อม risk LOW/MEDIUM/HIGH และ outcome ที่เกมนำไปใช้ได้จริง

**ข้อเท็จจริงของ implementation ปัจจุบัน:** UI โหลด incident ตัวแรกจาก `INCIDENTS` ตอนเริ่มแอป ยังไม่ได้สุ่มหมุนเวียนครบทั้ง 3 เคสหรือทำ shift queue 15–20 เคส อย่าอ้างว่ามีระบบหมุนเวียนครบแล้ว เว้นแต่ได้ implement และตรวจ behavior จริง
