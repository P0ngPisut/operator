## 11.5 Road

```js
{
	id, name, type: 'highway|primary|secondary|local', nodes: [],
	speedLimitKph, widthClass, restrictions: []
}
```

Road node มี `{ id, x, y, connectedRoadIds: [] }`; road edge มี `{ id, fromNode, toNode, distanceM, travelTimeSec, allowedDepartments, restrictions }` โดย `travelTimeSec` คำนวณจาก distance และ effective vehicle speed ห้าม hard-code arrival timeout เช่น 4 วินาทีเป็น gameplay logic
