## Psychological Evaluator

ใช้ `evaluateDispatcherInput` เป็นจุดประเมินข้อความภาษาไทยแบบ deterministic และทำงานในเครื่อง ไม่เรียก external AI/API โดยปริยาย

ผลประเมินประกอบด้วย `panicDelta`, `newPanic`, `toneEvaluated`, `callerResponse`, `revealedCoords`, `isLostCase`, `systemLog`

จำแนกโทนหลัก:
- EMPATHETIC: ปลอบใจ ชวนหายใจช้า ๆ ยืนยันความปลอดภัย หรือแสดงความเห็นอกเห็นใจ; ลด Panic
- FIRM_INSTRUCTION: คำสั่งที่ชัดและปลอดภัย เช่น ล็อกประตู กดแผล หรือไม่เคลื่อนย้ายผู้บาดเจ็บ; ลด Panic
- PRESSURING: ตะคอก บังคับ เค้นพิกัด หรือเร่งรัด; เพิ่ม Panic
- VAGUE: ข้อความไม่ชัด ไม่เกี่ยวข้อง หรือไม่ช่วยเหลือ; เพิ่ม Panic เล็กน้อย

กติกา:
- `newPanic = clamp(currentPanic + panicDelta, 0, 100)`
- เมื่อ Panic ต่ำกว่า 60% และยังมีพิกัดที่ไม่เปิด ให้ Caller เผยพิกัดที่ยังไม่ทราบทีละหนึ่งช่อง และเติมช่องที่ตรงกันใน Coordinate Console
- เมื่อ Panic ตั้งแต่ 60% ขึ้นไป ให้ตอบแบบสับสน/สะอื้นและไม่เผยพิกัดใหม่
- เมื่อ Panic ถึง 100% ให้ `isLostCase: true`, ปิดการสนทนา และเรียก lost-case penalty ตาม reducer
- เก็บ dispatcher text, caller response และ system evaluation log ลง chat history
- ใช้ค่าประเมินและข้อความ response ที่สอดคล้องกับ incident type และ history; อย่าให้ keyword matching สร้างคำแนะนำทางการแพทย์/ความปลอดภัยที่อันตราย
- ทำให้ parser ทนต่อ input ว่าง, whitespace และอักขระไทย พร้อม unit tests สำหรับทุก tone, clamp, threshold และการเปิดพิกัดทีละช่อง
