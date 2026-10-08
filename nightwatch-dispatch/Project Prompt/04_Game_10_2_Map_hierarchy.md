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
