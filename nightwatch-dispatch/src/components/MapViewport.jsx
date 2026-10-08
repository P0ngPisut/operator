import { useEffect, useRef, useState } from 'react';
import { LocateFixed, Minus, Plus, RotateCcw } from 'lucide-react';
import { CITY, getMapLocation } from '../data/map/city';
import { BASE_LOCATIONS } from '../data/vehicles';
import { clampViewportToMap, getVisibleWorldSize, panViewport, screenToWorld, zoomViewportAtPoint } from '../systems/map/mapTransform';

const DEPARTMENT_COLORS = { police: '#00d9f5', fire: '#ff9e00', medical: '#3fb97a' };

function getRoutePosition(points, progress) {
  if (!points?.length) return null;
  let totalLength = 0;
  const lengths = points.slice(1).map((point, index) => {
    const length = Math.hypot(point.x - points[index].x, point.y - points[index].y);
    totalLength += length;
    return length;
  });
  let remaining = totalLength * Math.max(0, Math.min(1, progress));
  for (let index = 0; index < lengths.length; index += 1) {
    if (remaining <= lengths[index]) {
      const ratio = lengths[index] ? remaining / lengths[index] : 0;
      return { x: points[index].x + (points[index + 1].x - points[index].x) * ratio, y: points[index].y + (points[index + 1].y - points[index].y) * ratio };
    }
    remaining -= lengths[index];
  }
  return points.at(-1);
}

export default function MapViewport({ activeIncident, state, language = 'en', onViewportChange, onSelectionChange }) {
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const [viewportSize, setViewportSize] = useState({ width: 1, height: 1 });
  const camera = state.mapViewport;
  const cameraRef = useRef(camera);
  const viewportRef = useRef(viewportSize);
  const changeRef = useRef(onViewportChange);
  const visible = getVisibleWorldSize({ ...camera, ...viewportSize });
  const viewBox = `${camera.x - visible.width / 2} ${camera.y - visible.height / 2} ${visible.width} ${visible.height}`;
  const location = getMapLocation(camera.x, camera.y);
  const incidentPosition = activeIncident?.worldPosition || { x: CITY.widthM / 2, y: CITY.heightM / 2 };
  const route = state.dispatchedUnit?.route?.geometryPoints || state.dispatchedUnit?.route?.points || [];
  const vehiclePosition = getRoutePosition(route, state.dispatchedUnit?.progress || 0);
  const unitColor = DEPARTMENT_COLORS[state.dispatchedUnit?.dept] || DEPARTMENT_COLORS.police;
  const thai = language === 'th';

  useEffect(() => { cameraRef.current = camera; viewportRef.current = viewportSize; changeRef.current = onViewportChange; }, [camera, viewportSize, onViewportChange]);
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;
    const observer = new ResizeObserver(([entry]) => setViewportSize({ width: Math.max(1, entry.contentRect.width), height: Math.max(1, entry.contentRect.height) }));
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;
    const handleWheel = (event) => {
      event.preventDefault();
      const rect = svg.getBoundingClientRect();
      const next = zoomViewportAtPoint({ ...cameraRef.current, ...viewportRef.current }, { x: event.clientX - rect.left, y: event.clientY - rect.top }, cameraRef.current.zoom * Math.exp(-event.deltaY * 0.001));
      const clamped = clampViewportToMap({ ...next, ...viewportRef.current });
      changeRef.current({ x: clamped.x, y: clamped.y, zoom: clamped.zoom });
    };
    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => svg.removeEventListener('wheel', handleWheel);
  }, []);

  const setCamera = (next) => {
    const clamped = clampViewportToMap({ ...next, ...viewportSize });
    onViewportChange({ x: clamped.x, y: clamped.y, zoom: clamped.zoom });
  };
  const focusIncident = () => {
    if (!activeIncident) return;
    onSelectionChange({ incidentId: activeIncident.id });
    setCamera({ ...camera, x: incidentPosition.x, y: incidentPosition.y, zoom: Math.max(2, camera.zoom) });
  };
  const handlePointerDown = (event) => {
    if (event.button !== 0) return;
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, dragged: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handlePointerMove = (event) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    dragRef.current = { ...dragRef.current, x: event.clientX, y: event.clientY, dragged: dragRef.current.dragged || Math.abs(dx) + Math.abs(dy) > 2 };
    if (dragRef.current.dragged) setCamera(panViewport({ ...camera, ...viewportSize }, dx, dy));
  };
  const handleClick = (event) => {
    if (dragRef.current?.dragged) { dragRef.current = null; return; }
    const rect = svgRef.current.getBoundingClientRect();
    const point = screenToWorld({ x: event.clientX - rect.left, y: event.clientY - rect.top }, { ...camera, ...viewportSize });
    const selected = getMapLocation(point.x, point.y);
    onSelectionChange({ districtId: selected.district?.id || null, sectorId: selected.sector?.id || null, blockId: selected.blockId });
  };
  const resetView = () => {
    onSelectionChange({ districtId: null, sectorId: null, blockId: null });
    setCamera({ ...camera, x: CITY.widthM / 2, y: CITY.heightM / 2, zoom: 1.3 });
  };

  return <div className="absolute inset-0 bg-[#0b101d]">
    <svg ref={svgRef} viewBox={viewBox} preserveAspectRatio="none" className="h-full w-full cursor-grab active:cursor-grabbing" role="img" aria-label="City emergency dispatch map" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={() => { if (!dragRef.current?.dragged) dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }} onClick={handleClick} onContextMenu={(event) => event.preventDefault()}>
      <defs>
        <filter id="map-marker-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="38" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <image href={CITY.baseMapUrl} x="0" y="0" width={CITY.widthM} height={CITY.heightM} preserveAspectRatio="none" />
      {Object.entries(BASE_LOCATIONS).map(([department, station]) => <g key={department} pointerEvents="none"><path d={`M${station.x} ${station.y - 105}l105 105-105 105-105-105z`} fill="#0b101d" stroke={DEPARTMENT_COLORS[department]} strokeWidth="22"/><circle cx={station.x} cy={station.y} r="28" fill={DEPARTMENT_COLORS[department]}/><text x={station.x + 145} y={station.y + 26} fontSize="118" fill="#e0edf7" fontFamily="monospace">{station.label}</text></g>)}
      {state.coordStatus !== 'VERIFIED' && !state.callerData.coordsUnlocked && <circle cx={incidentPosition.x} cy={incidentPosition.y} r={1900 - state.ipTraceProgress * 13} fill="#00bcff" fillOpacity=".07" stroke="#00bcff" strokeWidth="16" strokeDasharray="62 48" pointerEvents="none"/>}
      {route.length > 1 && <path d={route.map((point, index) => `${index ? 'L' : 'M'}${point.x} ${point.y}`).join(' ')} fill="none" stroke={state.dispatchedUnit?.dept === 'fire' ? '#ff9e00' : state.dispatchedUnit?.dept === 'medical' ? '#3fb97a' : '#00d9f5'} strokeWidth="58" strokeDasharray="72 36" strokeLinecap="butt" opacity=".96" pointerEvents="none"/>}
      {state.coordStatus === 'VERIFIED' && <g pointerEvents="none" filter="url(#map-marker-glow)"><circle cx={incidentPosition.x} cy={incidentPosition.y} r="180" fill="#e5484d" fillOpacity=".18" stroke="#ff7774" strokeWidth="22"/><text x={incidentPosition.x + 235} y={incidentPosition.y - 60} fill="#ff9292" fontSize="126" fontFamily="monospace">SEV {activeIncident?.severity} · {activeIncident?.id}</text></g>}
      {vehiclePosition && <g transform={`translate(${vehiclePosition.x} ${vehiclePosition.y})`} pointerEvents="none"><circle r="70" fill="#0b101d" stroke={unitColor} strokeWidth="18"/><path d="M-20 23V-23L28 0Z" fill={unitColor}/></g>}
    </svg>
    <div className="absolute left-3 top-3 z-10 flex max-w-[75%] flex-wrap items-center gap-1 border border-slate-700 bg-[#0b101d]/95 p-1 text-[9px] font-mono text-slate-200">
      <button type="button" className="px-1 text-cyan-300" onClick={resetView}>{thai ? 'เมือง' : 'CITY'}</button><span className="text-slate-600">›</span><span className="max-w-40 truncate px-1">{location.district?.name || (thai ? 'เขต' : 'DISTRICT')}</span><span className="text-slate-600">›</span><span>{location.sector?.name || (thai ? 'เซกเตอร์' : 'SECTOR')}</span><span className="text-cyan-300">{location.blockId}</span>
    </div>
    <div className="absolute right-3 top-3 z-10 flex items-center gap-1 border border-slate-700 bg-[#0b101d]/95 p-1">
      <button type="button" className="p-1 text-slate-200" aria-label={thai ? 'ซูมออก' : 'Zoom out'} onClick={() => setCamera({ ...camera, zoom: camera.zoom / 1.25 })}><Minus size={14}/></button><span className="min-w-9 text-center font-mono text-[9px] text-cyan-300">{camera.zoom.toFixed(1)}×</span><button type="button" className="p-1 text-slate-200" aria-label={thai ? 'ซูมเข้า' : 'Zoom in'} onClick={() => setCamera({ ...camera, zoom: camera.zoom * 1.25 })}><Plus size={14}/></button><button type="button" className="p-1 text-slate-200" aria-label={thai ? 'รีเซ็ตมุมมองแผนที่' : 'Reset map view'} onClick={resetView}><RotateCcw size={14}/></button>{activeIncident && <button type="button" className="p-1 text-red-300" aria-label={thai ? 'โฟกัสที่เกิดเหตุ' : 'Focus incident'} onClick={focusIncident}><LocateFixed size={14}/></button>}
    </div>
    <div className="absolute bottom-3 right-3 z-10 flex gap-3 border border-slate-700 bg-[#0b101d]/95 px-2 py-1 font-mono text-[8px] text-slate-200"><span className="text-cyan-300">━━ {thai ? 'ทางหลวง' : 'HIGHWAY'}</span><span className="text-sky-300">━━ {thai ? 'ถนนสายหลัก' : 'ARTERIAL'}</span><span className="text-slate-400">━ {thai ? 'ถนนท้องถิ่น' : 'LOCAL'}</span><span className="text-amber-400">━ {thai ? 'สะพาน' : 'BRIDGE'}</span></div>
    <div className="absolute bottom-3 left-3 z-10 border border-slate-700 bg-[#0b101d]/95 px-2 py-1 font-mono text-[9px] text-cyan-200">{thai ? 'ผังเมือง' : 'CITY GRID'} · {location.cellColumn + 1}/{CITY.gridColumns} : {location.cellRow + 1}/{CITY.gridRows}</div>
  </div>;
}
