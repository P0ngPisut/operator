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
