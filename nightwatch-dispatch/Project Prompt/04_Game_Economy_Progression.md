## Economy, Progression และแพ้เกม

- เริ่มต้นมี funds, reputation, lives saved/lost และ Level/XP ตาม reducer
- ใช้ตารางราคาข้างต้นเป็น baseline และปรับ shop เดิมให้สอดคล้อง อย่าปล่อยให้ราคา SWAT/รถขั้นสูงถูกกว่ารถพื้นฐานโดยไม่มี trade-off; คำนึงถึง starting funds และรถเริ่มต้นที่แจกฟรี
- ค่าปรับพิกัดผิดและ Lost Case หักเงิน; หาก funds ต่ำกว่า 0 ให้จบเกมด้วย BANKRUPTCY
- Lost Case ลด reputation; ปัจจุบัน reducer จบเกมเมื่อ reputation หมดหรือ lost cases ถึงเกณฑ์ที่กำหนด
- รองรับ Level 1–10, XP และ unlock สำหรับอุปกรณ์/เหตุรุนแรงตาม progression
- ใช้ purchase cost แยกจากค่าปฏิบัติการ/ค่ารักษา/เติมอุปกรณ์สิ้นเปลือง; แสดงราคาและผลกระทบก่อนยืนยันซื้อ
- ให้ Field Briefing ประเมิน injury/death risk ตาม department, severity, crew และคำสั่งที่เลือก
- คำนวณ reward/penalty และชีวิตที่ช่วยได้/สูญเสียอย่างสอดคล้องกัน หลีกเลี่ยงการเพิ่ม `livesSaved` ให้ทุก outcome หาก briefing ล้มเหลว
- หากทำ Shift Summary หรือ shift loop ให้แสดง cases completed, success rate, lives saved/lost, fines, net revenue และ XP ที่ได้รับก่อนเข้าสู่กะถัดไป
