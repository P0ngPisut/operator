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