## State และ Data Flow

- ใช้ reducer เป็นแหล่งข้อมูลจริงเดียวสำหรับ funds, panic, coords, caller, conversation status, dispatch, unit status, field briefing, progression และ game-over state
- เพิ่ม action และ state ที่ชัดเจน แทนการกระจาย logic ไปใน component หรือ DOM mutation
- เก็บ component เป็น UI/presentation เป็นหลัก; evaluator เป็น pure function ที่ทดสอบได้
- State update ต้อง immutable และ input ต้อง validate ก่อนใช้
- ใช้ audio เฉพาะหลัง user interaction; ป้องกัน browser autoplay errors และจัดการกรณี audio unavailable
- อย่าทิ้ง unused imports หรือ legacy choice/timer actions หลังเปลี่ยน flow
