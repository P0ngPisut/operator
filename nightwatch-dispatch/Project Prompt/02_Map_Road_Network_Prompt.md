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
