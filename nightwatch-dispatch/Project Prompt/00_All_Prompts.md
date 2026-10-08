# NIGHTWATCH / DISPATCH 04 — Master Project Prompt

คุณคือ Senior Game Developer, Software Architect และ Narrative Designer ที่รับผิดชอบพัฒนาเกมเว็บ **NIGHTWATCH / DISPATCH 04: Emergency Psychological Dispatcher** ซึ่งเป็นเกม 2D real-time tactical dispatch และ psychological simulation สำหรับ Desktop Browser

## เป้าหมายของโปรเจกต์

พัฒนาต่อจาก codebase ปัจจุบันให้เป็นเกม dispatcher ที่เล่นได้จริง มีวงจรรับแจ้งเหตุ ประเมินสภาพจิตใจผู้แจ้งเหตุ เปิดเผยพิกัด ส่งหน่วยผ่านแผนที่ และจัดการผลภารกิจ โดยรักษารูปแบบ tactical command terminal และโครงสร้าง React ที่มีอยู่

ก่อนแก้โค้ด ให้อ่าน implementation และตรวจ flow ที่เกี่ยวข้องก่อนเสมอ ห้ามสมมติว่าฟีเจอร์ใดทำงานแล้วเพียงเพราะมีข้อมูลหรือ state รองรับ ให้แยกชัดเจนระหว่างของที่มีอยู่ ของที่ยังเป็น prototype และสิ่งที่กำลังจะเพิ่ม แก้เฉพาะขอบเขตที่จำเป็น รักษา API และ convention เดิม และตรวจ build หรือ behavior หลังแก้ทุกครั้ง

## โทนและภาพรวม

- สถานที่: ศูนย์บัญชาการฉุกเฉินในช่วงกลางคืน
- อารมณ์: ตึงเครียด เร่งด่วน กดดัน แต่ไม่เน้นความรุนแรงโจ่งแจ้ง
- ภาษา: UI ผสมไทย/อังกฤษ; บทพูดผู้แจ้งเหตุและ Dispatcher เป็นภาษาไทยที่เป็นธรรมชาติ
- ภาพ: tactical urban map แบบ top-down, dark satellite/vector hybrid, ถนนและอาคารอ่านง่าย, grid overlay, พื้นที่สีเขียว/แม่น้ำ และเครื่องหมายหน่วยที่มี contrast สูง
- สีสถานะ: cyan สำหรับข้อมูล/พิกัด/trace, red สำหรับเหตุและ panic วิกฤต, orange สำหรับข้อจำกัดพื้นที่, green สำหรับสถานะปลอดภัย/ยืนยันสำเร็จ
- ใช้ monospace กับรหัส พิกัด สถานะ และเวลา; ใช้ฟอนต์อ่านภาษาไทยได้ดี
- UI เป็นเครื่องมือปฏิบัติงานที่หนาแน่นแต่สแกนได้รวดเร็ว ไม่ทำเป็น landing page หรือ marketing cards

## Tech Stack และโครงสร้างปัจจุบัน

- React 19 + Vite, JavaScript, Tailwind CSS v4
- lucide-react สำหรับไอคอน
- Howler.js อยู่ใน dependencies; มี procedural Web Audio implementation ใน audio utility
- State หลักจัดการด้วย `useReducer`
- จุดเริ่ม UI: `src/App.jsx`
- State transitions และ economy: `src/context/gameReducer.js`
- ข้อมูลเหตุการณ์แบบสุ่ม: `src/data/incidents.js`
- ประเมิน free-text: `src/utils/psychologicalEvaluator.js`
- แผนที่และ overlay: `src/components/MapPanel.jsx`
- ภาพฐานแผนที่: `public/nightwatch-city-map.svg`; React SVG overlay ใช้พิกัดจากข้อมูลเมืองและ road graph ใน `src/data/map/city.js` และ `src/pathfinding/graph.js`
- เสียงวิทยุ: `src/utils/audio.js`
- คำสั่งที่ใช้ตรวจ: `npm run dev`, `npm run build`, `npm run lint`

## โครงหน้าเกม

### Header

แสดงแบรนด์ NIGHTWATCH / DISPATCH 04, หมายเลข Shift, Level/XP, Reputation, เงินทุน และเวลาในระบบ พร้อมสถานะ network หากมีข้อมูลรองรับ

### Pre-Shift Shop

ก่อนเริ่มกะ แสดงยอดเงินและรายการอุปกรณ์ที่ซื้อได้ เช่น Patrol Sedan ราคา $1,200, SWAT Carrier ราคา $2,800 ที่ปลดล็อกเมื่อ Level 4 และ Tactical Vest ราคา $800 มีปุ่มเริ่มกะ ห้ามแสดงปุ่มซื้อที่ทำงานไม่ได้หรือให้ผู้เล่นซื้อของซ้ำโดยไม่มีเหตุผล

### Active Dispatch Screen

- จัด layout เป็น Caller/chat panel ประมาณ 25% ทางซ้าย และ map/fleet area ทางขวา
- Incident header แสดงสถานะ live, incident ID และ severity
- chat แยกข้อความ Caller, Dispatcher และ System ให้สแกนได้ทันที
- แสดง Caller name, risk, location/coordinates และ incident type
- แสดงค่า Caller Panic 0–100%
- **วิธีตอบ Caller คือพิมพ์ข้อความ free-text เท่านั้น** มีช่องข้อความและปุ่มส่ง; ห้ามนำ preset dialogue choices หรือ countdown timer กลับมา
- ปิด input หลัง Lost Case หรือ conversation จบ และคง keyboard shortcuts สำหรับ fleet โดยไม่รบกวนตอนพิมพ์ใน input

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

## Incident Data

`src/data/incidents.js` มี generator สำหรับสร้างข้อมูลเหตุการณ์ 3 เคส มี `INC-####`, `deptCategory` (police/fire/medical), severity, minLevel, caller name, risk, street restriction, พิกัด 3 ชุด, เวลาตอบเดิม และ field briefing

แต่ละ scenario ควรมี narrative ที่แตกต่างกัน เช่น บุกรุกเคหสถาน/เหตุคุกคาม, เพลิงไหม้/สารเคมี และผู้ป่วยฉุกเฉิน/อุบัติเหตุ ต้องระบุพิกัดเป็น string 3 หลักทุกช่อง และมี field briefing 3 แบบพร้อม risk LOW/MEDIUM/HIGH และ outcome ที่เกมนำไปใช้ได้จริง

**ข้อเท็จจริงของ implementation ปัจจุบัน:** UI โหลด incident ตัวแรกจาก `INCIDENTS` ตอนเริ่มแอป ยังไม่ได้สุ่มหมุนเวียนครบทั้ง 3 เคสหรือทำ shift queue 15–20 เคส อย่าอ้างว่ามีระบบหมุนเวียนครบแล้ว เว้นแต่ได้ implement และตรวจ behavior จริง

## Map และ Unit Dispatch

- ใช้ `public/nightwatch-city-map.svg` เป็นแผนที่จริงในหน้าจอ แล้ววาง incident, route, station และ unit markers บน world coordinates ชุดเดียวกัน
- เป็นแผนที่เมืองจำลองที่วาดขึ้นใหม่ในสไตล์ satellite/vector hybrid ไม่ใช่ Google Maps tiles และไม่ควรอ้างว่าเป็นแผนที่จริง
- React SVG overlay แสดงฐาน Police/Fire/Medical, จุด incident, signal radius, route, unit marker และสถานะเดินทาง
- Coordinate Console มี BLOCK / SECTOR / UNIT ช่องละ 3 หลัก; VERIFY ต้องเทียบพิกัดเป้าหมายและบันทึกผล
- เมื่อพิกัดถูกต้อง ผู้เล่นเลือก department และ vehicle, จัดจำนวนกำลังพล, ยืนยันทีม และส่งหน่วย
- รถควรวิ่งตาม road path ไม่ตัดผ่านอาคาร; ให้เส้นทางสอดคล้องกับถนนและข้อจำกัดรถใน incident
- เมื่อถึงจุดเกิดเหตุให้เปิด Field Radio Briefing 3 ตัวเลือก แล้ว outcome ต้องกระทบผลภารกิจ, เงิน, XP, ผู้รอดชีวิต/ผู้บาดเจ็บอย่างมีความหมาย
- **ข้อเท็จจริงปัจจุบัน:** map marker และเส้นทางยังมีพิกัด hard-coded; arrival จำลองด้วย timeout ประมาณ 4 วินาที จึงควรระวังการ sync ระหว่างตำแหน่งบนภาพกับ target coords จริง

## Fleet และการควบคุม

- Department shortcuts: Q = Police, W = Fire, E = Medical
- Vehicle shortcuts: A / S / D ภายใน department ที่เลือก
- แสดง vehicle name, role/description, level/equipment, capacity, crew slots และ readiness
- กำหนดเจ้าหน้าที่ไม่เกิน capacity ของรถ; แสดง crew count และสถานะทีมอย่างถูกต้อง
- Dispatch ต้องทำตามลำดับ: เลือกแผนก/รถ → จัดกำลังพล → ยืนยันทีม → ยืนยันพิกัดและเลือกเป้าหมาย → ส่งหน่วย
- ห้ามส่งหน่วยซ้ำหรือ dispatch เมื่อพิกัดไม่ verified, ทีมไม่พร้อม หรือรถกำลังปฏิบัติภารกิจ

## Fleet, เจ้าหน้าที่ และไอเท็ม

ออกแบบข้อมูลรถ เจ้าหน้าที่ และอุปกรณ์เป็น catalog แยกตาม department มี `id`, `name`, `tier`, `purchaseCost`, `speedKph`, `crewMin`, `crewMax`, `capacity`, `equipmentSlots`, `compatibleVehicles` และข้อจำกัดที่จำเป็น ห้าม hard-code ราคา/ความจุซ้ำในหลาย component

### ราคากลางสำหรับ balance

ราคาต่อไปนี้เป็น **ราคาเสนอในหน่วยเงินเกม** เพื่อแสดงความก้าวหน้าที่ชัดเจน ไม่ใช่ราคาซื้อขายจริงของรถ/อุปกรณ์ ทุกการซื้อให้ตรวจเงิน ปลดล็อก และ ownership ก่อนหักเงิน

| หมวด | รุ่น/ระดับ | ราคาเสนอ | เหตุผลด้านราคา |
|---|---|---:|---|
| ตำรวจ มอเตอร์ไซค์ | L1 Patrol Bike | $800 | รถเริ่มต้น เร็วและบรรทุกกำลังพล/อุปกรณ์ได้น้อย |
| ตำรวจ มอเตอร์ไซค์ | L2 Interceptor Bike | $1,500 | เร็วขึ้น เหมาะเข้าถึงเหตุในเมือง |
| ตำรวจ มอเตอร์ไซค์ | L3 Tactical Bike | $2,600 | อุปกรณ์/ความทนทานสูงสุดของกลุ่ม แต่ยังจำกัดกำลังพล |
| ตำรวจ รถยนต์ | L1 Patrol Sedan | $4,500 | รถพื้นฐาน เกราะบาง กำลังพล 2 นาย |
| ตำรวจ รถยนต์ | L2 Pursuit Sedan | $6,500 | เร็วขึ้น อุปกรณ์พื้นฐานดีขึ้น |
| ตำรวจ รถยนต์ | L3 Armored Patrol | $10,500 | เกราะหนาขึ้น รองรับกำลังพล 3 นาย |
| ตำรวจ รถยนต์ | L4 Prisoner Pickup | $18,000 | รถกระบะมีห้องควบคุมผู้ต้องหาและความจุจับกุมสูง |
| ตำรวจ รถยนต์ | L5 Prisoner Transport | $30,000 | รถขนผู้ต้องหาขนาดใหญ่ กำลังพลและความจุสูงสุด |
| แพทย์ รถพยาบาล | L1 Rapid Ambulance | $7,000 | คล่องตัว เข้าซอยแคบ รับผู้ป่วย 2 คน |
| แพทย์ รถพยาบาล | L2 Response Van | $10,000 | สมดุลด้านความเร็ว/กำลังพล แต่ยังรับผู้ป่วย 2 คน |
| แพทย์ รถพยาบาล | L3 Mass Casualty Unit | $18,000 | ใหญ่และช้ากว่า รับผู้ป่วยได้ 4 คน |
| ดับเพลิง Pumper | Mini Pumper | $6,000 | ขนาดเล็ก เข้าชุมชนแคบได้ |
| ดับเพลิง Pumper | Standard / Type 1 | $10,000 | ความจุน้ำและกำลังพลระดับกลาง |
| ดับเพลิง Pumper | Heavy-Duty / Industrial | $14,000 | น้ำมากขึ้นและเหมาะกับไฟอุตสาหกรรม แต่คล่องตัวต่ำ |
| ดับเพลิง Water Tanker | 5,000 gal | $8,000 | เริ่มต้น ราคาต่ำสุด ความจุน้ำต่ำสุด |
| ดับเพลิง Water Tanker | 7,000 gal | $11,000 | สมดุลราคา/ความจุ |
| ดับเพลิง Water Tanker | 12,000 gal | $18,000 | ความจุสูงสุด แต่ช้าและต้องใช้เส้นทางรองรับรถใหญ่ |
| ดับเพลิง Rescue Vehicle | Urban Rescue | $8,000 | อุปกรณ์กู้ภัยและเข้าถึงเหตุได้เร็ว |
| ดับเพลิง Rescue Vehicle | Heavy Rescue | $14,000 | เครื่องมืองัด/กู้ภัยหนัก ราคาสูงขึ้นตามอุปกรณ์ |
| ดับเพลิง Aerial/Ladder | Ladder Truck | $22,000 | ราคาและต้นทุนปฏิบัติการสูง ใช้กับอาคารสูง/พื้นที่กว้าง |

ใช้ตัวเลขเหล่านี้เป็น baseline ที่ปรับได้: ราคาเพิ่มตามความเร็วที่ใช้งานได้จริง, crew capacity, ผู้ป่วย/ผู้ต้องหาที่รองรับ, เกราะ, ความจุน้ำ, อุปกรณ์เฉพาะทาง และข้อจำกัดถนน; รถเฉพาะทางขนาดใหญ่ไม่ควรถูกกว่ารถพื้นฐานโดยไม่มีข้อแลกเปลี่ยนชัดเจน เริ่มเกมให้มีรถพื้นฐานประจำหน่วยตาม inventory เดิม เพื่อให้ผู้เล่น dispatch ได้โดยไม่ต้องซื้อรถราคาแพงก่อนเริ่มกะ

### รถพยาบาลและแพทย์

- มีรถพยาบาล 3 แบบตามตาราง: Rapid Ambulance, Response Van, Mass Casualty Unit; แต่ละรุ่นมี `speedKph` ต่างกันตามขนาด/บทบาท และมี crew range 1–2, 1–4, 1–6 คนตามลำดับ
- ความจุรับผู้ป่วยตาม vehicle tier: L1 = 2, L2 = 2, L3 = 4 คน
- แพทย์แต่ละคนรักษาผู้ป่วยได้สูงสุด 2 คนต่อภารกิจ และพก medical kit ได้ไม่เกิน 2 ชิ้น; อย่านับความจุผู้ป่วยซ้ำจนเกินทั้งความจุรถและกำลังรักษารวม
- แพทย์ระดับ 1–3 เพิ่มความเร็วรักษาและโอกาสรอดตามทักษะ แต่ทุกคนยังมีขีดจำกัดรักษา 2 คน
- ค่าอ้างอิงรับสมัครแพทย์: L1 $600, L2 $1,100, L3 $1,900 ต่อคน; Advanced Care Specialist L4 $3,200 และ Critical Care Specialist L5 $5,200 เป็น **ระดับเสนอเพิ่ม** หากยืนยันให้มีแพทย์ 5 ระดับ โดย L4–L5 เพิ่มความเร็ว/ความสามารถดูแลผู้ป่วยวิกฤต ไม่เพิ่มขีดจำกัด medical kits เกิน 2

### รถตำรวจและเจ้าหน้าที่

- มีมอเตอร์ไซค์ 3 แบบและรถยนต์ 5 แบบตามตารางราคา
- ความเร็วรถต้องมีผลต่อเวลาเดินทาง; มอเตอร์ไซค์เข้าถึงถนนแคบได้ดีแต่มี crew/capture capacity ต่ำ รถหุ้มเกราะและรถขนผู้ต้องหาช้ากว่าแต่ปลอดภัย/บรรทุกได้มากกว่า
- ใช้ระดับเจ้าหน้าที่ 4 สาย: Police L1, Police L2, Police L3, SWAT. L1–L2 ใส่เกราะปกติ/บาง ใช้กระบองและ taser; L2 เพิ่มปืนพกและช่องอุปกรณ์; L3 ใช้เกราะกลางและอาวุธยาว; SWAT ใช้เกราะหนาและอุปกรณ์ยุทธวิธี
- จำนวนช่องอุปกรณ์: L1 = 2, L2 = 3, L3 = 3, SWAT = 5; ตรวจ compatibility ของอาวุธ/เกราะกับระดับเจ้าหน้าที่ก่อนยืนยันทีม
- ความสามารถจับกุม: L1 จับ/ควบคุมผู้ต้องหาได้ 1 คน, L2 ได้ 2 คน, L3 ได้ 2–4 คนตาม crew/capacity รถ, SWAT ได้ 1–4 คนต่อทีม; ความจุขนย้ายให้ยึด vehicle capacity ด้วย
- Police L1/L2 รับมือผู้ต้องหาโดยใช้อาวุธระดับต่ำ; L3 และ SWAT เพิ่มโอกาสหยุดเหตุแต่ยังมีความเสี่ยงบาดเจ็บ/หลบหนี
- ในเหตุที่มีผู้ต้องหาเท่านั้น ให้สุ่มผลการจับกุม/หลบหนี/ผู้ต้องหารอดการควบคุม โดยอิง severity, ขนาดทีม, rank, equipment และ tactical briefing; แยก RNG ออกจาก pure calculation หรือรองรับ seeded RNG เพื่อทดสอบซ้ำได้
- ราคาเสนอรับสมัคร: Police L1 $500, L2 $900, L3 $1,600, SWAT $3,500 ต่อคน

### รถดับเพลิงและเจ้าหน้าที่

- กลุ่มรถต้องมี Water Tanker 3 ความจุ (5,000 / 7,000 / 12,000 gallons), Pumper 3 แบบ, Rescue Vehicle และ Aerial/Ladder Truck
- Mini Pumper: crew 2–5 คน, ห้องโดยสาร 4 ประตู, ใช้พื้นที่แคบได้
- Standard / Type 1 Pumper: crew 4–6 คน, น้ำ 800 gallons
- Heavy-Duty / Industrial Pumper: crew 2–4 คน, น้ำ 3,000 gallons, เหมาะกับเหตุอุตสาหกรรม
- กำหนดความเร็วในเกมตามขนาด/น้ำหนัก/การใช้งานจริงเป็น **ค่าจำลองสำหรับ gameplay** ไม่ใช่การรับรองความเร็วตามกฎหมาย: รถ rescue คล่องตัวที่สุด, mini pumper รองลงมา, standard pumper/tanker อยู่ระดับกลาง และ heavy tanker/aerial ladder ช้าที่สุด; ใช้ road restriction ปรับความเร็วเพิ่มเติม
- Firefighter L1: ดับไฟ/ช่วยเหลือภายในอาคาร, 2 equipment slots, ขับ Water Tanker และ Mini Pumper ได้
- Firefighter L2: ดับเพลิงจากรถ, 2 equipment slots, ขับ Mini และ Standard Pumper ได้
- Firefighter L3: ดับเพลิงจากรถ/งานเฉพาะทาง, 2 equipment slots, ขับได้ทุกชนิดยกเว้น Water Tanker
- อุปกรณ์ดับเพลิงที่รองรับอย่างน้อย: ถังดับเพลิง, กล่องเครื่องมือ/เครื่องมืองัด, ชุดป้องกัน/SCBA และอุปกรณ์เฉพาะรถ ตรวจ crew certification ก่อน dispatch
- ราคาเสนอรับสมัคร: Firefighter L1 $450, L2 $800, L3 $1,350 ต่อคน

### Item Catalog และช่องอุปกรณ์

| Item | ราคาเสนอ | ข้อจำกัด/ผล |
|---|---:|---|
| Baton | $100 | ตำรวจระดับพื้นฐาน ใช้ควบคุมเหตุใกล้ตัว |
| Taser | $350 | ตำรวจ L1 ขึ้นไป; ลดความเสี่ยงบาดเจ็บเมื่อจับกุมระยะใกล้ |
| Sidearm | $700 | ตำรวจ L2 ขึ้นไป; เพิ่มความพร้อมรับเหตุอันตราย |
| SMG | $1,600 | ตำรวจ L3/SWAT; ใช้เฉพาะ incident ระดับสูงตาม policy ของเกม |
| Standard Armor | $500 | เกราะพื้นฐาน ลด injury risk เล็กน้อย |
| Medium Armor | $1,000 | ต้องเป็น L3 หรือ SWAT ลด injury risk ปานกลาง |
| Heavy Armor | $1,800 | SWAT เท่านั้น ลด injury risk สูงแต่มีผลลด mobility |
| Medical Kit | $250 / ชิ้น | แพทย์พกได้ไม่เกิน 2 ชิ้น; ใช้รักษาผู้ป่วยตาม skill/capacity |
| AED | $700 | แพทย์; ใช้กับ cardiac emergency เท่านั้น |
| Trauma Kit | $600 | แพทย์; เพิ่มโอกาสรอดในอุบัติเหตุ/เลือดออก |
| Fire Extinguisher | $300 | นักดับเพลิง; ใช้เหตุไฟขนาดเล็ก/ไฟเริ่มต้น |
| Rescue Tool Kit | $900 | นักดับเพลิงที่ผ่านการฝึก; ใช้งัด/ช่วยผู้ติดค้าง |
| SCBA / Fire Protection Set | $1,400 | นักดับเพลิง; ลดผลกระทบควันและความร้อน |

ไอเท็มแต่ละชิ้นใช้ช่องของเจ้าหน้าที่ตามจริง: ตำรวจ L1/L2/L3 มี 2/3/3 ช่อง และ SWAT มี 5 ช่อง; แพทย์จำกัด medical kit 2 ชิ้นต่อคน; นักดับเพลิงมี 2 ช่อง ห้ามติดตั้งอาวุธให้แพทย์/นักดับเพลิงหรืออุปกรณ์ที่ rank ใช้ไม่ได้

### ข้อกำหนดที่ต้องรักษา/จุดขัดกันในสเปก

- สเปกระบุแพทย์ทั้ง “5 แบบ/5 เลเวล” และ “แพทย์ 3 ระดับ”; ใช้ L1–L3 เป็นค่าที่ระบุชัดและทดสอบได้ ส่วน L4–L5 ในตารางเป็นตัวเลือกเสนอเพิ่มสำหรับให้ครบ 5 ระดับ ต้องแยกเป็น specialist tiers และปรับค่าก่อนเปิดใช้จริง ห้ามลด kit limit หรือ patient-treatment limit โดยไม่มีข้อมูลรองรับ
- สเปกระบุ Firefighter L2 ซ้ำสองครั้ง; ให้ตีความรายการที่สองเป็น Firefighter L3 ตามลำดับ แต่บันทึกสมมติฐานนี้ใน data/config
- ข้อความ “จำนวนผู้ต้องหาที่จับได้” ต้องแยกจาก “ความจุผู้ต้องหาที่รถขนได้”; หน่วยจะจับได้มากเท่าใดต้องไม่เกิน crew capture capacity และรถที่ dispatch
- ความเร็วรถในเกมเป็น speed model แบบสมดุลภายในเกม ไม่ควรนำเสนอว่าเป็นข้อมูลความเร็วใช้งานจริงที่รับรองแล้ว

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

## State และ Data Flow

- ใช้ reducer เป็นแหล่งข้อมูลจริงเดียวสำหรับ funds, panic, coords, caller, conversation status, dispatch, unit status, field briefing, progression และ game-over state
- เพิ่ม action และ state ที่ชัดเจน แทนการกระจาย logic ไปใน component หรือ DOM mutation
- เก็บ component เป็น UI/presentation เป็นหลัก; evaluator เป็น pure function ที่ทดสอบได้
- State update ต้อง immutable และ input ต้อง validate ก่อนใช้
- ใช้ audio เฉพาะหลัง user interaction; ป้องกัน browser autoplay errors และจัดการกรณี audio unavailable
- อย่าทิ้ง unused imports หรือ legacy choice/timer actions หลังเปลี่ยน flow

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

# ============================================================
# 10. MAP / CITY SCALE / ZOOM SYSTEM — IMPLEMENTATION SPEC
# ============================================================

## 10.1 เป้าหมาย

ขยายระบบ Map เดิมของ NIGHTWATCH / DISPATCH 04 ให้เป็น tactical emergency-dispatch map สำหรับเมืองขนาดใหญ่ โดยใช้กรุงเทพมหานครเป็นต้นแบบเชิงโครงสร้าง แต่ **ห้ามใช้ Google Maps tiles หรือข้อมูลแผนที่จริงที่มีข้อจำกัดด้าน license โดยปริยาย** หากยังไม่มี map-data provider ที่ได้รับอนุญาต

เป้าหมายหลัก:

1. Map หลักมีขนาดจำลอง **10 × 10 km = 100 km²**
2. แบ่งพื้นที่ภายในเป็น **100 × 100 logical grid**
3. 1 grid cell = **100 × 100 m**; ไม่จำเป็นต้องวาดเส้น grid ทุกช่องตลอดเวลา
4. มี hierarchy: CITY → DISTRICT → SECTOR → BLOCK / CELL
5. Zoom เข้า/ออกด้วย mouse wheel โดยใช้ตำแหน่ง cursor เป็นจุดยึด; จุดใต้ cursor ต้องคงตำแหน่งบนหน้าจอขณะ zoom
6. รองรับ pan ด้วย mouse drag, เลือก District/Sector และ focus ไปยังพื้นที่นั้น
7. แสดง breadcrumb เช่น `BANGKOK > DISTRICT > SECTOR > BLOCK`
8. เพิ่ม/ลดรายละเอียดตามระดับ zoom และรักษา performance

## 10.2 Map hierarchy

```text
CITY
└── DISTRICT
		└── SECTOR
				└── BLOCK
						└── ROAD / BUILDING / POI / INCIDENT / UNIT
```

ตัวอย่าง:

```text
BANGKOK
└── DISTRICT-01
		├── SECTOR-01
		│   ├── BLOCK-001
		│   ├── BLOCK-002
		│   └── BLOCK-003
		├── SECTOR-02
		└── SECTOR-03
```

Prototype ไม่จำเป็นต้องสร้างกรุงเทพฯ ครบทุกเขตตั้งแต่วันแรก แต่ต้องเป็น data-driven architecture ที่เพิ่ม District ได้โดยไม่ต้องแก้ component หลัก

## 10.3 World coordinate

ใช้ coordinate system ของเกมเอง หน่วยเป็นเมตร:

```text
worldX: 0 → 10000
worldY: 0 → 10000
map center: (5000, 5000)
```

ตัวอย่าง `{ x: 6340, y: 4890 }` เป็นตำแหน่งในโลกจำลอง ไม่ใช่ latitude/longitude จริง ห้ามผูก gameplay logic โดยตรงกับ pixel coordinate ของ SVG หรือ CSS

## 10.4 Screen ↔ World transform

สร้าง utility กลาง เช่น `screenToWorld(screenX, screenY, viewport)` และ `worldToScreen(worldX, worldY, viewport)` โดย viewport มีอย่างน้อย `{ x, y, zoom, width, height }` ทุก marker, road, incident, unit และ selection ต้องอ้างอิง world coordinates แล้วค่อย transform เป็น screen coordinates ห้ามกระจายสูตร transform ไปหลาย component

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

## 10.6 Zoom level of detail

- ZOOM 0.5–0.9: city/district boundary, major roads, major stations, active incidents, simplified units
- ZOOM 1.0–1.9: district/sector, primary/secondary roads, bases, incidents, routes และ unit labels
- ZOOM 2.0–3.9: block/cell, local roads, POI, building footprints, traffic/road restrictions
- ZOOM 4.0–8.0: detailed roads, individual buildings/POI, exact incident marker, unit movement และ route nodes เมื่อเปิด debug mode

LOD ต้องเป็น logic/data filtering ไม่ใช่สร้าง DOM/SVG objects จำนวนมากแล้วซ่อนด้วย CSS

## 10.7 District navigation

แสดง breadcrumb เช่น `BANGKOK > PATHUM WAN > SECTOR-03`

- คลิก District: center map ไป district bounds, ตั้ง zoom ให้พอดีกับ district และ update `selectedDistrict`
- คลิก Sector: center map ไป sector bounds, zoom เข้าอีกระดับและ update `selectedSector`
- มี controls: BACK TO CITY, FOCUS DISTRICT, FOCUS INCIDENT, FOCUS SELECTED UNIT และ RESET VIEW

## 10.8 Map camera state

เก็บ state ที่สำคัญใน reducer/context กลาง:

```js
mapViewport: { x, y, zoom }
mapSelection: { districtId, sectorId, blockId, incidentId, unitId }
```

ห้ามใช้ local component state เป็นแหล่งข้อมูลหลักสำหรับ selection ที่มีผลต่อ gameplay; local transient state ใช้กับ animation/drag ได้ แต่ state สำคัญต้อง sync กลับ reducer

# ============================================================
# 11. MAP DATA MODEL
# ============================================================

## 11.1 City

```js
{ id: 'BKK', name: 'Bangkok', widthM: 10000, heightM: 10000, districts: [] }
```

## 11.2 District

```js
{
	id: 'D01', cityId: 'BKK', name: 'District 01',
	bounds: { minX, minY, maxX, maxY }, sectors: []
}
```

## 11.3 Sector

```js
{ id: 'D01-S01', districtId: 'D01', name: 'Sector 01', bounds: {}, blocks: [] }
```

## 11.4 Block

```js
{
	id: 'D01-S01-B001', sectorId: 'D01-S01', minX, minY, maxX, maxY,
	roads: [], buildings: [], pois: []
}
```

## 11.5 Road

```js
{
	id, name, type: 'highway|primary|secondary|local', nodes: [],
	speedLimitKph, widthClass, restrictions: []
}
```

Road node มี `{ id, x, y, connectedRoadIds: [] }`; road edge มี `{ id, fromNode, toNode, distanceM, travelTimeSec, allowedDepartments, restrictions }` โดย `travelTimeSec` คำนวณจาก distance และ effective vehicle speed ห้าม hard-code arrival timeout เช่น 4 วินาทีเป็น gameplay logic

# ============================================================
# 12. DATABASE / PERSISTENCE ARCHITECTURE
# ============================================================

## 12.1 หลักการ

เกมเป็น Desktop Browser React/Vite และยังไม่มี backend/database server:

- Static game catalog → JS/JSON data
- Runtime state → React reducer
- Persistent player save → local persistence
- ห้ามสร้าง server/database infrastructure ใหญ่โดยไม่จำเป็น

เริ่มด้วย repository abstraction ใน `src/data/`, `src/services/` และ `src/repositories/` โดยมี API เช่น `saveGame(state)`, `loadGame()`, `deleteSave()`, `saveSettings(settings)`, `loadSettings()`

- localStorage ใช้กับ settings และ save data ขนาดเล็ก
- IndexedDB ผ่าน abstraction layer เมื่อ save มีข้อมูลมากหรือมี map state/telemetry มาก
- ห้ามให้ component เรียก localStorage/IndexedDB โดยตรง

## 12.2 Logical tables / collections

ออกแบบ schema ที่รองรับอย่างน้อย:

- PLAYER: id, funds, reputation, level, xp, livesSaved, livesLost
- UNITS: id, department, vehicleId, status, crewIds, worldX, worldY, currentNodeId, targetIncidentId
- PERSONNEL: id, department, rank, equipmentIds, status
- VEHICLES: id, department, catalogId, status, crewIds, equipmentState
- INCIDENTS: id, type, department, severity, worldX, worldY, status, createdAt, resolvedAt, outcome
- ROADS: id, nodes, edges, restrictions
- LOCATIONS: id, type, worldX, worldY, districtId, sectorId
- GAME_EVENTS: id, timestamp, type, payload
- SETTINGS: key, value

ไม่จำเป็นต้อง implement relational database server ใน prototype

# ============================================================
# 13. PROJECT ARCHITECTURE
# ============================================================

รักษา React + Vite + JavaScript + Tailwind CSS v4 เดิม และตรวจ codebase จริงก่อนเปลี่ยนชื่อไฟล์

โครงสร้างเป้าหมาย:

```text
src/
├── App.jsx
├── components/
│   ├── TopNav.jsx
│   ├── LeftPanel.jsx
│   ├── MapPanel.jsx
│   ├── FleetPanel.jsx
│   ├── map/
│   │   ├── MapViewport.jsx
│   │   ├── MapLayers.jsx
│   │   ├── DistrictLayer.jsx
│   │   ├── RoadLayer.jsx
│   │   ├── BuildingLayer.jsx
│   │   ├── IncidentLayer.jsx
│   │   ├── UnitLayer.jsx
│   │   └── MapControls.jsx
│   ├── dispatch/
│   │   ├── DispatchPanel.jsx
│   │   ├── UnitSelector.jsx
│   │   ├── CrewSelector.jsx
│   │   └── DispatchConfirmation.jsx
│   └── incident/
│       ├── IncidentPanel.jsx
│       └── IncidentDetails.jsx
├── context/
│   ├── GameContext.jsx
│   └── gameReducer.js
├── data/
│   ├── map/
│   │   ├── city.js
│   │   ├── districts.js
│   │   ├── sectors.js
│   │   ├── roads.js
│   │   ├── buildings.js
│   │   └── pois.js
│   ├── incidents.js
│   ├── vehicles.js
│   ├── personnel.js
│   └── equipment.js
├── systems/
│   ├── map/{mapTransform.js,mapNavigation.js,mapLod.js,spatialIndex.js}
│   ├── dispatch/{dispatchSystem.js,unitRouting.js}
│   ├── incidents/incidentSpawner.js
│   └── simulation/simulationClock.js
├── pathfinding/{astar.js,graph.js,routeCost.js}
├── repositories/{saveRepository.js,settingsRepository.js,eventRepository.js}
├── utils/{audio.js,validation.js}
└── tests/{astar.test.js,mapTransform.test.js,incidentSpawner.test.js,dispatch.test.js}
```

โครงสร้างนี้เป็น target architecture ไม่ใช่คำสั่งให้สร้างไฟล์ทั้งหมดทันที สร้างเฉพาะ module ที่จำเป็นต่อ feature ที่กำลัง implement ห้ามสร้างไฟล์เปล่าหรือ abstraction ที่ยังไม่มี consumer

# ============================================================
# 14. A* PATHFINDING
# ============================================================

## 14.1 เป้าหมาย

ทุก unit ต้องเดินทางตาม Road Graph ห้าม teleport จากฐานไป incident และห้ามใช้ timeout จำลองแทนการเดินทางใน production gameplay

```js
findRoute({ startNodeId, targetNodeId, vehicle, roadGraph })
// { nodeIds: [], edgeIds: [], distanceM, travelTimeSec }
```

## 14.2 Cost

ใช้ `travelTimeSec` เป็น edge cost หลัก ไม่ใช้ระยะทางอย่างเดียว เพราะรถแต่ละประเภทความเร็วต่างกัน:

```text
effectiveSpeed = baseVehicleSpeed × roadModifier × restrictionModifier
```

Highway มี modifier สูง, local road ต่ำ, narrow road ลดความเร็วรถใหญ่ และ restricted road ตัด edge ออกจาก route ได้ Heuristic ใช้ `remainingDistance / maxVehicleSpeed` และต้อง admissible

## 14.3 Dynamic road restrictions

รองรับ road closed, fire restriction, vehicle size restriction, department restriction และ temporary incident blockage เมื่อ restriction เปลี่ยน route ที่กำลังวิ่ง re-route ได้ ห้าม unit ค้างโดยไม่มี state transition และให้ log เหตุผลการ re-route

## 14.4 Unit movement

สถานะ unit อย่างน้อย: IDLE, DISPATCHED, EN_ROUTE, ARRIVED, ON_SCENE, RETURNING, UNAVAILABLE

ระหว่าง EN_ROUTE มี current edge, progress 0..1 และ world position ที่คำนวณจาก road segment; UI marker เคลื่อนตาม route ใช้ simulation tick หรือ requestAnimationFrame สำหรับ visual interpolation และใช้ simulation time สำหรับ gameplay state ไม่ใช้ `setTimeout(4000)` บอกว่าถึงแล้ว

# ============================================================
# 15. INCIDENT SPAWNER
# ============================================================

สร้าง Incident Spawner แบบ data-driven โดย incident template รองรับ `id`, `type`, `department`, `severity`, `minLevel`, `spawnWeight`, `allowedDistricts`, `allowedRoadTypes`, `locationRules`, `cooldownSec`

Spawner ต้องเลือก template และตำแหน่ง valid, ตรวจ map bounds/district/sector/restricted locations, สร้าง incident ID, แจ้งผู้เล่น, เพิ่ม incident ลง reducer และบันทึก event log

Spawn rules:
- ไม่ spawn ซ้อนกันใน radius ที่กำหนดมากเกินไป
- ปรับความถี่ตาม Level
- severity สูงมี weight ต่ำกว่าเหตุปกติ
- district ต่างกันมี incident profile ต่างกันได้
- รองรับ seeded RNG เพื่อ test/replay
- ตัวอย่างน้ำหนัก police/fire/medical = 40/30/30
- ห้าม hard-code spawn logic ใน MapPanel

# ============================================================
# 16. POLICE / FIRE / MEDICAL DISPATCH SYSTEM
# ============================================================

ใช้ unified dispatch interface:

```js
dispatchUnit({ unitId, incidentId })
```

ตรวจ unit มีอยู่จริง, department รองรับ incident, unit AVAILABLE, crew พร้อม, incident ACTIVE, พิกัด verified, vehicle restrictions, route มีจริง และ dispatch cost/requirements ผ่าน จากนั้นเปลี่ยนสถานะ:

```text
AVAILABLE → DISPATCHED → route calculated → EN_ROUTE → ARRIVED
→ ON_SCENE → outcome → RETURNING → AVAILABLE
```

ถ้าหา route ไม่ได้ให้เป็น DISPATCH_FAILED พร้อม system log ระบุเหตุผล

Department behavior:
- POLICE: pursuit/arrest/threat control, road restrictions และ vehicle capacity จำกัดจำนวนผู้ต้องหา
- FIRE: fire suppression/rescue, tanker water capacity และ heavy vehicle restrictions
- MEDICAL: patient treatment/hospital transport, patient capacity และ medical treatment capacity
- ทุก department ใช้ routing infrastructure ร่วมกัน แต่แยก mission resolver

# ============================================================
# 17. MAP PERFORMANCE
# ============================================================

ข้อห้าม:
- render อาคารทุกหลังในพื้นที่ 10×10 km แบบละเอียดพร้อมกัน
- สร้าง SVG DOM nodes หลายหมื่นตัวโดยไม่มี LOD
- คำนวณ A* ใหม่ทุก frame
- update reducer ทุก animation frame สำหรับ visual-only movement

หลักการ:
1. Static map layers render เฉพาะ visible bounds
2. Dynamic unit movement ใช้ visual interpolation
3. A* คำนวณเมื่อ dispatch/re-route เท่านั้น
4. Incident spawn เป็น event-based
5. Spatial lookup ใช้ spatial index/grid lookup
6. Zoom out ลดรายละเอียด; zoom in เพิ่มรายละเอียด
7. React state เก็บเฉพาะ gameplay state ที่จำเป็น

ถ้า SVG เดิมไม่เหมาะกับ 10×10 km ให้เก็บไว้เป็น prototype/fallback, แยก world-data layer จาก rendering layer และอย่าลบของเดิมจนกว่าระบบใหม่ทำงานเทียบเท่า

# ============================================================
# 18. ACTUAL CODEBASE RECONCILIATION
# ============================================================

ก่อน implement ให้ตรวจ codebase จริงเสมอ และตรวจไฟล์ที่มีอยู่ เช่น App.jsx, App.css, index.css, components, context, constants และ utils ห้ามสมมติว่า path จาก prompt รุ่นเก่า (`src/data/incidents.js`, `src/utils/psychologicalEvaluator.js`, `public/nightwatch-tactical-map.svg`) มีอยู่จริงใน ZIP หากยังไม่ได้ตรวจ

เมื่อ architecture ปัจจุบันต่างจาก prompt:
- รักษาของที่ใช้งานอยู่และ migrate ทีละส่วน
- ห้าม rename/refactor ครั้งใหญ่โดยไม่มีเหตุผล
- อธิบายไฟล์ที่เลือกแก้และ dependency ที่เพิ่ม
- ตรวจ build หลังแก้

# ============================================================
# 19. MAP INPUT / UX
# ============================================================

Mouse: wheel = zoom, left drag = pan, click = select, double click = zoom in/focus; ปิด browser context menu บน map เฉพาะเมื่อใช้ right click เป็น tactical interaction

Keyboard:
- Q = Police, W = Fire, E = Medical
- A/S/D = vehicle selection ใน department ที่เลือก
- F = focus selected incident
- R = reset map view
- Esc = cancel selection/dispatch mode
- shortcuts ต้องไม่รบกวน free-text caller input

Map controls: [+] zoom in, [-] zoom out, [⟳] reset, [⌖] focus incident, [CITY] return city view รองรับ trackpad/high-resolution wheel โดย normalize wheel delta

# ============================================================
# 20. DEFINITION OF DONE — MAP / ARCHITECTURE
# ============================================================

ถือว่า feature เสร็จเมื่อ:
1. Map มี world coordinate 10×10 km
2. District → Sector → Block hierarchy ทำงาน
3. Mouse-wheel zoom ลื่นและ centered on cursor
4. Pan ทำงาน; marker ไม่ drift หลัง pan/zoom
5. Breadcrumb CITY > DISTRICT > SECTOR ทำงาน
6. Focus incident/unit ทำงาน
7. Road graph ใช้ world coordinates และ A* หา route ตามถนนได้
8. Unit ไม่วิ่งทะลุอาคารและ movement แสดงตาม route
9. Arrival ไม่ใช้ fixed 4-second timeout เป็น gameplay logic
10. Incident Spawner เลือกตำแหน่ง valid
11. Police/Fire/Medical ใช้ routing ระบบเดียวกันและ vehicle restrictions มีผล
12. Map LOD ลดรายละเอียดเมื่อ zoom out และไม่ overload rendering
13. Save/load architecture ไม่ผูกกับ UI
14. `npm run build` ผ่าน; `npm run lint` ผ่านหรือระบุ lint errors เดิมแยกจาก error ใหม่
15. มี unit tests สำหรับ screen/world transform, cursor-centered zoom, A*, route restriction, incident spawning และ dispatch validation

# ============================================================
# 21. IMPLEMENTATION ORDER
# ============================================================

ทำตามลำดับเพื่อจำกัด blast radius:

1. Audit codebase: สำรวจ files, state/actions, map rendering และ incident/unit model
2. World coordinate + viewport: transform, pan, wheel zoom, cursor-centered zoom
3. Map hierarchy: City, District, Sector, Block, breadcrumb และ focus navigation

# 21. VERY LARGE CITY ROAD NETWORK — ACTIVE SPEC

ใช้ข้อกำหนดจาก `Project Prompt/02_Map_Road_Network_Prompt.md` เป็นสเปกแผนที่และโครงข่ายถนนฉบับเต็ม โดยยึดโลกจำลอง 10 × 10 km, logical grid 100 × 100 cells (100 m ต่อ cell) และห้ามผูก gameplay กับ pixel ของ SVG

ข้อมูลเมืองอยู่ใน `src/data/map/city.js`; road graph และ A* ใช้ world coordinates และข้อมูล node/edge ใน `src/pathfinding/graph.js` กับ `src/pathfinding/astar.js`. เมืองต้องมีหลายประเภท District, แม่น้ำหลัก/รอง, จุดสะพาน, สวน/green corridor และถนน Highway/Arterial/Local ตามสเปก เอกสารแยกแต่ละหัวข้ออยู่ในโฟลเดอร์ `Project Prompt/`.

เมื่อแก้แผนที่ ให้ตรวจว่า base locations, incident targets, route snapping, district/sector bounds และการวาด map overlay อยู่ในขอบเขต 10,000 × 10,000 m เดียวกัน ห้ามอ้างว่าเป็นข้อมูลกรุงเทพฯ จริง; เป็นเมืองสมมติที่ได้แรงบันดาลใจจากลักษณะผังเมืองเท่านั้น

# 22. ACTIVE MAP DESIGN — ORGANIC METROPOLITAN NETWORK

สร้างและแสดง tactical map ตาม `Project Prompt/02_Very_Large_City_Road_Network_Urban_Geography.md` โดยใช้ `public/nightwatch-city-map.svg` เป็นภาพฐานในหน้าเกม ซ้อน incident, station, unit และ dispatch route บนภาพตาม world coordinates; ลบการวาด city fabric/ถนนกริดแบบเก่าออกจาก React component
4. Road graph: nodes, edges, restrictions และ validation
5. A*: shortest travel time, vehicle-aware route, blocked-road handling
6. Unit simulation: position, route progress, EN_ROUTE, ARRIVED, RETURNING
7. Incident Spawner: weighted templates, valid locations, district-aware spawn
8. Dispatch integration: Police, Fire, Medical
9. Persistence: save/load, settings, event log
10. Optimization/tests: LOD, spatial lookup, build, lint และ unit tests

ห้ามกระโดดไป Phase 8 หาก Phase 2–5 ยังทดสอบไม่ได้

# ============================================================
# 22. REQUIRED DEVELOPER OUTPUT WHEN MODIFYING THE PROJECT
# ============================================================

ทุกครั้งที่แก้ codebase ให้รายงาน:
1. Files changed
2. Files added
3. Files deleted (ถ้ามี)
4. Architecture change
5. New data structures
6. New reducer actions/state
7. New dependencies
8. Tests run
9. Build result
10. Known limitations
11. สิ่งที่ยังเป็น prototype
12. วิธีทดสอบ feature ด้วยตนเอง

ห้ามกล่าวว่า feature ทำเสร็จและทำงานแล้วหากยังไม่ได้รัน build/test หรือไม่ได้ตรวจ behavior จริง

---

# Earlier Map Road Network Prompt

# MAP — VERY LARGE CITY ROAD NETWORK

สร้างระบบ **ผังถนนเมืองขนาดใหญ่มาก (Very Large Urban Road Network)** สำหรับแผนที่เกม NIGHTWATCH โดยต้องยึดขนาดโลกตาม `PROJECT_PROMPT.md`

## 1. WORLD SCALE

* ขนาดเมืองทั้งหมด: **10 × 10 km**
* World Coordinate:

  * X = 0–10,000 m
  * Y = 0–10,000 m
* Logical Grid:

  * **100 × 100 cells**
  * 1 cell = **100 × 100 m**
* Grid นี้ใช้เป็น logical/world coordinate เท่านั้น
* **ห้ามผูก gameplay หรือ road network เข้ากับ pixel ของ SVG โดยตรง**
* ถนนทั้งหมดต้องถูกสร้างเป็นข้อมูลเชิงโครงสร้าง เช่น nodes / edges / roads / intersections เพื่อรองรับระบบ routing และ A* ในอนาคต

---

# 2. CITY STRUCTURE

สร้างเมืองให้มีลักษณะเป็น **มหานครขนาดใหญ่ที่มีหลายย่านและมีรูปแบบถนนแตกต่างกัน**

อย่าใช้รูปแบบถนนเดียวทั้งเมือง

แบ่งเมืองออกเป็นหลาย District และแต่ละ District สามารถมีลักษณะผังเมืองแตกต่างกัน เช่น:

1. **Super Grid District**
2. **Curvy Grid District**
3. **Five Finger Plan District**
4. **City in a Garden District**
5. **Central Urban Core**
6. **Industrial / Logistics District**
7. **Suburban / Residential District**
8. **Mixed Urban District**

แต่ละย่านต้องเชื่อมต่อกันด้วยถนนระดับสูงอย่างสมเหตุสมผล

---

# 3. ROAD HIERARCHY

ใช้ Road Hierarchy หลัก 3 ระดับ:

## Highway

หน้าที่:

* เชื่อมพื้นที่ขนาดใหญ่ของเมือง
* เป็นเส้นทางหลักสำหรับการเดินทางระยะไกล
* เชื่อม District สำคัญ
* เชื่อมเมืองกับพื้นที่รอบนอก

ลักษณะ:

* ถนนขนาดใหญ่
* จำนวนช่องจราจรมากกว่า Arterial
* ทางแยกน้อยกว่า
* มีทางเชื่อม/ทางขึ้นลงเป็นจุด ๆ
* ไม่ควรตัดผ่านย่าน residential ขนาดเล็กโดยตรงมากเกินไป

สร้าง Highway อย่างน้อย:

* แนวเหนือ–ใต้
* แนวตะวันออก–ตะวันตก
* และแนว Diagonal บางส่วน

---

## Arterial Road

หน้าที่:

* เชื่อม District → District
* เชื่อมย่านสำคัญเข้ากับ Highway
* เป็นโครงกระดูกหลักของแต่ละ District

ลักษณะ:

* ขนาดกลางถึงใหญ่
* มี intersection มากกว่า Highway
* สามารถวิ่งผ่านย่านเมืองได้
* ใช้เป็นเส้นทางหลักสำหรับรถ Emergency

Arterial ไม่ควรเป็น grid ที่สมบูรณ์ทุกพื้นที่

ให้มีทั้ง:

* แนวตรง
* แนวโค้ง
* แนว diagonal
* แนวตามแม่น้ำ
* แนวตามขอบ District

---

## Local Road

หน้าที่:

* เชื่อม Block
* เข้าถึงอาคารและพื้นที่ย่อย
* สร้าง network ภายใน District

ลักษณะ:

* ถนนขนาดเล็ก
* intersection จำนวนมาก
* ความหนาแน่นแตกต่างกันตามประเภทของย่าน
* บางพื้นที่เป็น grid
* บางพื้นที่เป็นถนนโค้ง
* บางพื้นที่เป็น cul-de-sac หรือถนนย่อยที่ไม่ทะลุทุกเส้น

Local Road ต้องเชื่อมเข้าสู่ Arterial อย่างเป็นธรรมชาติ

---

# 4. DISTRICT TYPE — SUPER GRID

สร้างบาง District เป็น **Super Grid**

ลักษณะ:

* Block ขนาดใหญ่
* ถนนหลักตัดกันเป็นระเบียบ
* มีแกน North–South และ East–West ชัดเจน
* Arterial ทำหน้าที่เป็นแกนหลัก
* Local Road แบ่ง block ใหญ่เป็น block ย่อย

ตัวอย่างโครงสร้าง:

HIGHWAY
│
├── ARTERIAL ────────────────
│   │     │     │     │
│   ├─────┼─────┼─────┤
│   │     │     │     │
│   ├─────┼─────┼─────┤
│   │     │     │     │
│   └─────┴─────┴─────┘

แต่ไม่ต้องให้ทุก block มีขนาดเท่ากัน 100%

ให้มี variation เพื่อให้ดูเป็นเมืองจริง

---

# 5. DISTRICT TYPE — CURVY GRID

สร้างบาง District เป็น **Curvy Grid**

หลักการ:

* ยังคงมีโครงสร้างคล้าย grid
* แต่ถนนไม่จำเป็นต้องเป็นเส้นตรงทั้งหมด
* ให้ถนนโค้งตามภูมิประเทศ แม่น้ำ หรือการพัฒนาเมือง

ลักษณะ:

* Arterial โค้งเล็กน้อย
* Local Road มี curvature มากกว่า
* intersection ไม่จำเป็นต้องเป็นมุม 90°
* มี block รูปร่างไม่เท่ากัน

ต้องหลีกเลี่ยง:

* ถนนซิกแซกแบบสุ่ม
* ถนนโค้งจน routing ไม่มีเหตุผล
* random noise ที่ทำให้เมืองดูเหมือน procedural map ที่ไม่มีการวางแผน

เป้าหมายคือ **planned but organic**

---

# 6. DISTRICT TYPE — FIVE FINGER PLAN

สร้างบาง District เป็น **Five Finger Plan**

แนวคิด:

* มีแกนเมืองหลัก 1 แกนหรือหลายแกน
* มี Arterial หลักแตกแขนงออกเป็นประมาณ 5 แนว
* พื้นที่ระหว่างแนวถนนกลายเป็น green corridor / residential / mixed-use areas
* Local Road เชื่อมพื้นที่ระหว่าง finger

รูปแบบโดยรวม:

```
             FINGER
               │
               │
          ─────┤
               │
               │
```

MAIN AXIS ─────────┼────────────
│
─────┤
│
│
FINGER

เพิ่ม:

* Green corridor
* Park
* Residential clusters
* Mixed-use nodes

อย่าให้ Five Finger Plan เป็นรูปมือที่ชัดเจนจนดู artificial

ต้องให้ดูเหมือนผังเมืองจริง

---

# 7. DISTRICT TYPE — CITY IN A GARDEN

สร้างบาง District เป็น **City in a Garden**

ลักษณะ:

* ถนนไม่หนาแน่นเท่า Central Urban Core
* มีพื้นที่สีเขียวแทรกอยู่ระหว่างย่าน
* มีสวนขนาดใหญ่
* Green corridor
* Tree-lined roads
* Residential clusters
* Local roads โค้งและกระจายตัว

Road network ต้องหลบ:

* สวน
* พื้นที่สีเขียว
* water features

แต่ยังคงมี Arterial เชื่อม District อย่างมีประสิทธิภาพ

อย่าสร้างถนนจำนวนมากจนพื้นที่สีเขียวหายไป

---

# 8. MAIN RIVER

สร้าง **แม่น้ำสายหลัก 1 สาย** ตัดผ่านเมือง

แม่น้ำต้องมีขนาดใหญ่พอที่จะเป็นองค์ประกอบหลักของเมือง

แนวแม่น้ำ:

* ไม่ต้องเป็นเส้นตรง
* ให้คดเคี้ยวเล็กน้อย
* ตัดผ่านหลาย District
* แบ่งเมืองออกเป็นสองฝั่ง
* สามารถมีบางช่วงที่โค้งมากขึ้น

ตัวอย่าง:

┌─────────────────────────┐
│          CITY           │
│       ╭───────╮         │
│       │ RIVER │         │
│───────╯       ╰─────────│
│                         │
│          CITY           │
└─────────────────────────┘

แม่น้ำต้องส่งผลต่อ Road Network:

* Highway ต้องมีสะพานข้ามแม่น้ำในจุดสำคัญ
* Arterial ต้องมีสะพานหลายจุด
* Local Road มีสะพานเฉพาะบางพื้นที่
* อย่าสร้างสะพานถี่เกินไป
* สะพานต้องกลายเป็น strategic crossing points

---

# 9. SECONDARY RIVERS

สร้าง **แม่น้ำสายย่อยจำนวนเล็กน้อย**

จำนวนไม่ต้องเยอะ

หน้าที่:

* เพิ่มความสมจริงให้เมือง
* ทำให้บางถนนต้องโค้งตามแนวน้ำ
* สร้างพื้นที่สีเขียวริมแม่น้ำ
* สร้างข้อจำกัดในการสร้างถนน

Secondary rivers:

* สามารถแยกออกจาก Main River
* หรือไหลเข้าหา Main River
* ไม่ควรตัดเมืองจน network ขาดออกจากกันมากเกินไป

ให้มีประมาณ **2–5 สายหลักย่อย** ตามความเหมาะสมของพื้นที่

---

# 10. BRIDGES

สะพานต้องเป็นส่วนหนึ่งของ Road Network จริง

สร้าง Bridge Node/Edge สำหรับ:

* Highway
* Arterial
* Local Road บางจุด

ทุกสะพานต้อง:

* เชื่อม road node ทั้งสองฝั่ง
* มีความยาวตามระยะข้ามแม่น้ำ
* มี travel cost
* รองรับ A* pathfinding
* สามารถถูก restriction หรือปิดใช้งานในอนาคตได้

ห้ามใช้เพียง visual bridge ที่รถสามารถ teleport ข้ามแม่น้ำได้

---

# 11. DISTRICT CONNECTIVITY

ทุก District ต้องเชื่อมต่อกัน

โครงสร้างโดยรวม:

HIGHWAY
↓
ARTERIAL
↓
DISTRICT ROAD
↓
LOCAL ROAD
↓
BLOCK
↓
BUILDING / LOCATION

ต้องไม่มี District ที่ถูกสร้างเป็นเกาะโดยไม่มีทางเชื่อม

แต่บางพื้นที่สามารถมี:

* River
* Park
* Restricted Area
* Industrial Zone

เป็น natural barrier ได้

---

# 12. ROAD DENSITY

ความหนาแน่นของถนนต้องแตกต่างกันตาม District

Central Urban Core:

* Very High density

Mixed Urban:

* High density

Super Grid:

* Medium–High density

Curvy Grid:

* Medium density

Five Finger:

* Medium density + green corridors

City in a Garden:

* Low–Medium density

Industrial:

* Medium density
* เน้นถนนกว้างและเส้นทางรถขนาดใหญ่

Suburban:

* Low–Medium density

---

# 13. EMERGENCY ROUTING REQUIREMENT

Road network ต้องออกแบบโดยคำนึงถึงระบบ Emergency Dispatch ของเกม

Police / Fire / Medical ต้องสามารถเดินทางผ่าน road graph ได้

ดังนั้น:

* ห้ามให้ Local Road เป็น dead end มากเกินไป
* Arterial ต้องมี alternate routes
* Highway ต้องเชื่อม District หลายแห่ง
* River crossing ต้องมีหลายจุด
* ทุก District ต้องมีอย่างน้อย 2 เส้นทางเชื่อมกับพื้นที่อื่นเมื่อเป็นไปได้

รองรับอนาคต:

* Road restriction
* Road closure
* Traffic modifier
* Emergency priority
* Dynamic rerouting

---

# 14. DATA STRUCTURE

อย่าสร้างถนนเป็นเพียง visual lines

Road ต้องเป็น data model เช่น:

```js
{
  id: "ROAD_001",
  type: "ARTERIAL",
  from: "NODE_001",
  to: "NODE_002",
  length: 850,
  speedLimit: 60,
  districtId: "DISTRICT_03",
  lanes: 4,
  restricted: false
}
```

Intersection:

```js
{
  id: "NODE_001",
  x: 4250,
  y: 3150,
  type: "INTERSECTION",
  roads: [
    "ROAD_001",
    "ROAD_004",
    "ROAD_008"
  ]
}
```

River:

```js
{
  id: "RIVER_MAIN",
  type: "MAIN_RIVER",
  geometry: [...],
  width: 180
}
```

Bridge:

```js
{
  id: "BRIDGE_001",
  type: "HIGHWAY",
  roadId: "ROAD_021",
  riverId: "RIVER_MAIN"
}
```

---

# 15. GENERATION RULE

Road generation ต้องเป็น **structured procedural generation**

ห้ามใช้ random generation แบบไร้ข้อจำกัด

Generation pipeline:

1. Generate city boundary
2. Generate Main River
3. Generate Secondary Rivers
4. Generate Districts
5. Assign District Type
6. Generate Highway
7. Generate Arterial
8. Generate District road structure
9. Generate Local Roads
10. Generate Bridges
11. Validate connectivity
12. Validate road hierarchy
13. Validate emergency accessibility
14. Build Road Graph
15. Generate spatial index

---

# 16. VISUAL TARGET

ภาพรวมต้องให้ความรู้สึกเหมือน:

**"มหานครขนาดใหญ่ที่ถูกวางผังโดยมนุษย์จริง"**

ไม่ใช่:

* random procedural roads
* perfect square grid ทั้งเมือง
* SimCity-style repetitive grid
* ถนนที่สุ่มคดไปมา
* เมืองที่ทุก District มีรูปแบบเดียวกัน

ต้องเห็นความแตกต่างของแต่ละย่านอย่างชัดเจนเมื่อ Zoom เข้าออก

ระดับ Zoom:

CITY
→ เห็น Highway + Main River + District structure

DISTRICT
→ เห็น Arterial + major roads

SECTOR
→ เห็น Local Road + Blocks

BLOCK
→ เห็นรายละเอียดถนนย่อยและพื้นที่โดยรอบ

---

# 17. FINAL REQUIREMENT

สร้าง Road Network สำหรับเมืองขนาด **10 × 10 km** ที่มี:

* 1 Main River
* 2–5 Secondary Rivers
* Highway Network
* Arterial Network
* Local Road Network
* Super Grid Districts
* Curvy Grid Districts
* Five Finger Plan Districts
* City in a Garden Districts
* Central Urban Core
* Industrial District
* Residential/Suburban District
* Bridges
* Green Corridors
* Parks
* Connected Road Graph
* Emergency-compatible routing

Road network ต้องพร้อมสำหรับระบบ **A* Pathfinding + Emergency Dispatch + Dynamic Road Restriction + Unit Simulation** ในขั้นตอนถัดไป

**เป้าหมายสำคัญที่สุด: เมืองต้องดูใหญ่ มีเอกลักษณ์ และมีตรรกะการวางผังเมือง โดยที่ทุกถนนยังสามารถนำไปใช้เป็นข้อมูลจริงสำหรับระบบ Routing ของเกมได้**

---

# Latest Organic City Road Network Prompt

# MAP — VERY LARGE CITY ROAD NETWORK & URBAN GEOGRAPHY

ปรับปรุงระบบ **ผังเมืองและโครงข่ายถนนขนาดใหญ่มาก (Very Large Urban Road Network)** สำหรับแผนที่เกม NIGHTWATCH โดยยึดความเป็นธรรมชาติของเมือง (Urban Realism & Organic Growth) โทนสีแผนที่ศูนย์สั่งการ (Tactical Color Palette) และข้อจำกัดทางภูมิประเทศจริง

---

## 1. VISUAL PALETTE & MAP TONE (โทนสีและอารมณ์ของแผนที่)

แผนที่ต้องถ่ายทอดบรรยากาศศูนย์สั่งการฉุกเฉินระดับมหานคร (Tactical Dispatch Console) ที่เน้นความสบายตา อ่านง่าย และสะท้อนย่านความหนาแน่นของเมืองผ่านโทนสี:

### 1.1 Base & Land Theme (พื้นหลังและผืนดิน)
* **Background / Void:** สีน้ำเงินเข้มเกือบดำ (`#0B101D` หรือ `#0D1322`) ให้ความรู้สึกเป็นจอมอนิเตอร์ศูนย์ควบคุม nocturne 
* **Landmass / Ground:** สีน้ำเงินอมเทาเข้ม (`#121929` - `#182235`)
* **Parks & Green Corridors:** สีเขียวหม่นเรืองแสงลึก (`#112923` หรือ Muted Cyan-Green `#16382F`) ไม่ฉูดฉาดจนกวนสายตา
* **Water Bodies (Rivers/Lakes):** สีฟ้าครามเข้มลึกพร้อมเส้นขอบเรืองแสงอ่อน (`#081D33` / Edge `#1B4965`)

### 1.2 Road Hierarchy Colors & Opacity (โทนสีเส้นถนน)
* **Highway:** สีฟ้าสว่าง/ไซแอนเรืองแสง (`#00E5FF` หรือ `#00BCFF`) ความหนาเส้น 3–4px เพื่อแสดงแกนหลัก
* **Arterial Road:** สีฟ้าอ่อน/เทาสว่าง (`#70A6C8` หรือ `#A3C7DE`) ความหนาเส้น 2px 
* **Local Road:** สีน้ำเงินหม่น/เทาเข้ม (`#2A3F5A` ถึง `#3E5675`) ความหนาเส้น 1px และมีความโปร่งแสง (Opacity ~60–80%) เพื่อไม่ให้สายตาลายเมื่อสเกลเมืองใหญ่
* **Bridges:** ไฮไลต์จุดขอบสะพานด้วยสีส้มอ่อน/ขาวเรืองแสง (`#FF9E00` หรือ `#E2F1FF`) เพื่อให้เห็นจุดข้ามแม่น้ำยุทธศาสตร์ชัดเจน

---

## 2. WORLD SCALE & TOPOGRAPHY (ขนาดโลกและภูมิประเทศ)

* **World Scale:** 10 × 10 km (X: 0–10,000m, Y: 0–10,000m)
* **Logical Grid:** 100 × 100 cells (1 cell = 100 × 100m)
* **Organic Elevation & Terrain Constraints (ภูมิประเทศที่มีผลต่อเมือง):**
  * เมืองต้องไม่ใช่มุมราบเรียบ 100% แต่ละย่านมี **ศูนย์กลางประวัติศาสตร์ (Historic Core)** และ **จุดเติบโตตามธรรมชาติ**
  * ถนนต้องโค้งเลียบตามแนวแม่น้ำ เลียบแนวเนินเขา/พื้นที่ชุ่มน้ำ หรือแนวกำแพงเมืองเก่า (Historical Trace) ก่อนที่จะขยายตัวออกเป็น Grid สมัยใหม่

---

## 3. NATURAL CITY STRUCTURE & ORGANIC DYNAMICS (ความเป็นธรรมชาติของผังเมือง)

ให้ยกเลิกการวาง District แบบสี่เหลี่ยมเป๊ะๆ แต่ใช้แนวคิด **Metropolitan Evolution (การเติบโตตามกาลเวลาของเมืองจริง)**:

### 3.1 Historic Urban Core (ย่านเมืองเก่า/ศูนย์กลางประวัติศาสตร์)
* ถนนมีลักษณะเป็น Organic Network คล้ายใยสไปเดอร์หรือวงแหวนรัศมี (Radial-Ring Pattern)
* ถนนแคบ ตรอกซอกซอยมาก ซอยมักตัดกันเป็นมุมเฉียง (Non-90° Intersections) เช่น 45°, 60°, 120°

### 3.2 Sprawl & Urban Transition (การขยายตัวสู่ย่านใหม่)
* เมื่อขยายออกจากศูนย์กลาง เมืองจะปรับเปลี่ยนจาก Organic → Super Grid → Curvy Suburban ตามยุคสมัยการพัฒนา
* รอยต่อระหว่าง District ต้องมีความกลมกลืน (Organic Transition Zone) ไม่ตัดขอบแข็งเป็นเส้นตรง

### 3.3 District Types (ประเภทเขตเมือง):
1. **Old Town / Central Core:** Radial / Irregular Ring pattern, ความหนาแน่นถนนสูงมาก
2. **Super Grid District:** ย่านธุรกิจใหม่ (CBD) ถนนขนานกันแต่มีความกว้างบล็อกไม่เท่ากัน (Irregular Block Sizes)
3. **Curvy Grid District:** ย่านที่อยู่อาศัยระดับกลาง ถนนโค้งตามสโลปและแนวต้นไม้
4. **Five Finger Plan District:** ถนนหลักกระจายตามแกนคมนาคมหลัก โดยมี Green Spines/Parks แทรกระหว่าง finger
5. **City in a Garden District:** ถนนความหนาแน่นต่ำ วงล้อถนนแบบ Loop และ Cul-de-sacs โค้งมน
6. **Industrial / Port Logistics:** บล็อกขนาดใหญ่พิเศษ (Superblocks) ถนนเส้นตรงกว้าง รองรับรถบรรทุก เชื่อมต่อ Highway/River
7. **Suburban Sprawl:** ถนนวงเลี้ยวโค้งมน ถนนย่อยซึมเข้าบล็อกบ้านเรือนอย่างเป็นธรรมชาติ

---

## 4. NATURAL ROAD HIERARCHY & GEOMETRY (โครงสร้างและรูปทรงถนนธรรมชาติ)

### 4.1 Road Geometry Variations (ห้ามใช้เส้นตรงทื่อ)
* **Micro-curvature:** แม้แต่ถนนที่เป็น Highway หรือ Arterial ในชีวิตจริงจะไม่เป็นเส้นตรงเป๊ะ 100% ให้เพิ่ม Bezier Curve เล็กน้อย (Slight Spline Curve) เพื่อความสมจริง
* **Intersection Angles:** เพิ่มความหลากหลายของมุมทางแยก (60° ถึง 120°) โดยเฉพาะในย่าน Old Town และ Curvy Grid
* **Natural Cul-de-sacs & Loops:** ในย่าน Residential ให้มีวงเวียนย่อย (Roundabouts) ถนนทางตันที่มีจุดกลับรถ และถนนวนลูปเพื่อลดปริมาณการจราจรผ่านย่าน (Traffic Calming)

### 4.2 Highway & Arterial Network
* **Ring Roads (ถนนวงแหวน):** สร้าง Inner Ring Road ล้อมรอบ Central Core และ Outer Highway ขอบเมือง
* **Organic Arterials:** เส้นทาง Arterial โค้งเลียบแม่น้ำ (Riverside Expressways) และเส้นทางเบี่ยงเมือง

---

## 5. WATERWAYS, BRIDGES & NATURAL OBSTACLES (ระบบสายน้ำและสะพาน)

### 5.1 Main River (แม่น้ำสายหลัก)
* ความกว้าง 150–250 เมตร คดเคี้ยวตามธรรมชาติ (Meandering River Pattern)
* มีเกาะกลางน้ำ (River Island / Delta) ในบางจุด ซึ่งส่งผลให้แม่น้ำแยกเป็น 2 ทางและเกิดสะพานคู่
* สองฝั่งแม่น้ำมีถนน Arterial วิ่งขนาน (Promenade / Riverside Drive)

### 5.2 Secondary Tributaries (แม่น้ำสายย่อย/คลองเมือง)
* แม่น้ำย่อย 2–4 สาย ไหลจากขอบเมืองมาเชื่อมกับ Main River
* ทำให้เกิดภูมิประเทศแบบ Peninsula (คาบสมุทรย่อย) ซึ่งเพิ่มความท้าทายให้ระบบ Routing ของรถฉุกเฉิน

### 5.3 Bridges Strategy (ยุทธศาสตร์สะพาน)
* **Highway Bridges:** สะพานขนาดใหญ่ข้ามแม่น้ำ เชื่อมต่อจุดสำคัญ
* **Arterial Bridges:** สะพานกระจายตัวตามระยะสมเหตุสมผล (ไม่ถี่เกินไป เช่น ห่างกันอย่างน้อย 800m - 1.5km)
* **Historical Bridges:** สะพานแคบในย่านเมืองเก่า สำหรับ Local Road

---

## 6. EMERGENCY ROUTING & MAP FUNCTIONALITY (การรองรับระบบฉุกเฉิน)

* **Graph Topology Integrity:** แม้ผังเมืองจะโค้งมนและมีความเป็นธรรมชาติสูง แต่ทุก Node และ Edge ต้องมี Connectivity ที่ถูกต้อง 100%
* **Alternative Routing:** ทางแยกสำคัญต้องมีจุดกลับรถ หรือเส้นทางเลี่ยง (Bypass) ในย่านที่มีความหนาแน่นสูง
* **Speed Limits & Travel Costs:**
  * Highway: 90–110 km/h (Cost ต่ำในการเดินทางไกล)
  * Arterial: 50–70 km/h
  * Local Road: 30–40 km/h (Cost สูงขึ้นตามความหนาแน่นของจุดตัด)
  * Historic / Narrow Streets: 20–30 km/h

---

## 7. DATA STRUCTURE & PROCEDURAL GENERATION RULES

### 7.1 Road Data Structure (เพิ่ม Property ด้าน Geometry)
```json
{
  "id": "ROAD_042",
  "type": "ARTERIAL",
  "from": "NODE_102",
  "to": "NODE_108",
  "length": 1240,
  "speedLimit": 60,
  "districtId": "DISTRICT_OLD_TOWN",
  "lanes": 4,
  "curvature": "BEZIER_SPLINE",
  "controlPoints": [{"x": 3200, "y": 4100}, {"x": 3350, "y": 4250}],
  "isBridge": false,
  "restricted": false
}

### รายละเอียดการปรับปรุงสำคัญที่เพิ่มเข้าไป:
1. **เพิ่มโทนสี (Visual Palette):** กำหนด Hex Code สีสไตล์จอมอนิเตอร์ศูนย์สั่งการฉุกเฉิน (Dark Blue / Neon Cyan / Muted Green / Amber Accent) เพื่อนำไปใช้งานกับ SVG/Canvas Render ได้ทันที
2. **เน้นความสมจริงของผังเมือง (Organic Evolution):** เพิ่มระบบ **Historic Core (เมืองเก่า)** ถนนวงแหวน (Ring Roads) และปรับรอยต่อระหว่างย่านให้เป็นธรรมชาติ
3. **ปรับแก้รูปทรงถนน (Road Geometry):** กำหนดให้มี Micro-curvature (ความโค้งมนเล็กน้อยของเส้นทาง), มุมตัดถนนที่ไม่จำเป็นต้องเป็น 90 องศา และระบบถนนลูป/จุดกลับรถ
4. **เพิ่มรายละเอียดภูมิประเทศ (Terrain Constraints):** เพิ่มส่วนคดเคี้ยวของแม่น้ำ (Meandering River) และเกาะกลางน้ำ ซึ่งส่งผลต่อการวางสะพานจริง
