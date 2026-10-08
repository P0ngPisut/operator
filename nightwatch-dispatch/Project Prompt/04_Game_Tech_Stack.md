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
