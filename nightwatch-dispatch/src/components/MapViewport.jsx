import { useEffect, useMemo, useRef, useState } from 'react';
import { Ambulance, BellRing, Flame, LocateFixed, Minus, Plus, RotateCcw, Shield } from 'lucide-react';
import { CITY, DISTRICTS, getMapLocation } from '../data/map/city';
import { BASE_LOCATIONS } from '../data/vehicles';
import {
  clampViewportToMap,
  panViewport,
  zoomViewportAtPoint,
} from '../systems/map/mapTransform';

const DEPARTMENT_COLORS = { police: '#35c3d8', fire: '#f0932b', medical: '#3fb97a' };
function noise(index, salt) {
  let value = Math.imul(index + 1, 374761393) + Math.imul(salt + 1, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function makeBoundaries(count, extent, jitter, salt) {
  return Array.from({ length: count + 1 }, (_, index) => {
    if (index === 0) return 0;
    if (index === count) return extent;
    return Math.round((index * extent) / count + (noise(index, salt) - 0.5) * jitter * 2);
  });
}

const BLOCK_COLUMNS = 40;
const BLOCK_ROWS = 20;
const BLOCK_X = makeBoundaries(BLOCK_COLUMNS, CITY.widthM, 80, 11);
const BLOCK_Y = makeBoundaries(BLOCK_ROWS, CITY.heightM, 180, 29);
const CITY_BLOCKS = Array.from({ length: BLOCK_COLUMNS * BLOCK_ROWS }, (_, index) => {
  const column = index % BLOCK_COLUMNS;
  const row = Math.floor(index / BLOCK_COLUMNS);
  const x = BLOCK_X[column];
  const y = BLOCK_Y[row];
  const width = BLOCK_X[column + 1] - x;
  const height = BLOCK_Y[row + 1] - y;
  const typeRoll = noise(index, 47);
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const downtown = Math.hypot(centerX - CITY.widthM / 2, centerY - CITY.heightM / 2) < 7200;
  const type = typeRoll < 0.065 ? 'park' : !downtown && typeRoll < 0.16 ? 'industrial' : downtown && typeRoll > 0.34 ? 'highrise' : 'residential';
  return { index, x, y, width, height, type };
});

function offsetsInView(start, end, step) {
  const first = Math.max(0, Math.ceil(start / step) * step);
  const last = Math.min(CITY.widthM, end);
  const offsets = [];

  for (let offset = first; offset <= last; offset += step) offsets.push(offset);
  return offsets;
}

function getRoutePosition(points, progress) {
  if (!points?.length) return null;
  if (points.length === 1) return points[0];

  let totalLength = 0;
  const segmentLengths = [];
  for (let index = 1; index < points.length; index += 1) {
    const length = Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y);
    segmentLengths.push(length);
    totalLength += length;
  }

  let remaining = totalLength * Math.min(1, Math.max(0, progress));
  for (let index = 0; index < segmentLengths.length; index += 1) {
    const length = segmentLengths[index];
    if (remaining <= length) {
      const ratio = length === 0 ? 0 : remaining / length;
      return {
        x: points[index].x + (points[index + 1].x - points[index].x) * ratio,
        y: points[index].y + (points[index + 1].y - points[index].y) * ratio,
      };
    }
    remaining -= length;
  }

  return points.at(-1);
}

export default function MapViewport({ activeIncident, state, onViewportChange, onSelectionChange }) {
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const [viewportSize, setViewportSize] = useState({ width: 1, height: 1 });
  const camera = state.mapViewport;
  const cameraRef = useRef(camera);
  const viewportSizeRef = useRef(viewportSize);
  const onViewportChangeRef = useRef(onViewportChange);

  useEffect(() => {
    cameraRef.current = camera;
    viewportSizeRef.current = viewportSize;
    onViewportChangeRef.current = onViewportChange;
  }, [camera, onViewportChange, viewportSize]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;

    const observer = new ResizeObserver(([entry]) => {
      setViewportSize({
        width: Math.max(1, entry.contentRect.width),
        height: Math.max(1, entry.contentRect.height),
      });
    });
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  const viewBox = useMemo(() => {
    const width = CITY.widthM / camera.zoom;
    const height = width * viewportSize.height / viewportSize.width;
    return `${camera.x - width / 2} ${camera.y - height / 2} ${width} ${height}`;
  }, [camera.x, camera.y, camera.zoom, viewportSize.height, viewportSize.width]);

  const visibleWidth = CITY.widthM / camera.zoom;
  const visibleHeight = visibleWidth * viewportSize.height / viewportSize.width;
  const highwayStepM = CITY.cellSizeM * 12;
  const arterialStepM = CITY.cellSizeM * 5;
  const highwayX = offsetsInView(camera.x - visibleWidth / 2, camera.x + visibleWidth / 2, highwayStepM);
  const highwayY = offsetsInView(camera.y - visibleHeight / 2, camera.y + visibleHeight / 2, highwayStepM);
  const arterialX = offsetsInView(camera.x - visibleWidth / 2, camera.x + visibleWidth / 2, arterialStepM).filter((x) => x % highwayStepM !== 0);
  const arterialY = offsetsInView(camera.y - visibleHeight / 2, camera.y + visibleHeight / 2, arterialStepM).filter((y) => y % highwayStepM !== 0);
  const localX = BLOCK_X.filter((x) => x >= camera.x - visibleWidth / 2 && x <= camera.x + visibleWidth / 2);
  const localY = BLOCK_Y.filter((y) => y >= camera.y - visibleHeight / 2 && y <= camera.y + visibleHeight / 2);
  const location = getMapLocation(camera.x, camera.y);
  const incidentPosition = activeIncident?.worldPosition || { x: CITY.widthM / 2, y: CITY.heightM / 2 };
  const routePoints = state.dispatchedUnit?.route?.points || [];
  const vehiclePosition = getRoutePosition(routePoints, state.dispatchedUnit?.progress || 0);
  const unitWaitingForNewAddress = state.dispatchedUnit?.status === 'SEARCHING_RELOCATION';
  const lastSearchPosition = unitWaitingForNewAddress ? state.dispatchedUnit?.targetPosition : null;
  const urbanBlockElements = useMemo(() => CITY_BLOCKS.map(({ index, x, y, width, height, type }) => {
    const inset = Math.min(42, width * 0.08, height * 0.08);
    const innerX = x + inset;
    const innerY = y + inset;
    const innerWidth = width - inset * 2;
    const innerHeight = height - inset * 2;
    const green = type === 'park';
    const fill = type === 'highrise' ? '#35433a' : type === 'industrial' ? '#30352d' : '#29342c';
    const count = 2 + Math.floor(noise(index, 71) * 4);
    return (
      <g key={`city-block-${index}`}>
        <rect x={innerX} y={innerY} width={innerWidth} height={innerHeight} rx="18" fill={green ? '#1e3327' : type === 'industrial' ? '#242921' : '#19231d'} stroke="#29382e" strokeWidth="8" />
        {green ? (
          <g fill="#56734c" opacity=".7">
            {Array.from({ length: 7 }, (_, tree) => (
              <circle key={tree} cx={innerX + innerWidth * (0.15 + noise(index + tree, 83) * 0.7)} cy={innerY + innerHeight * (0.15 + noise(index + tree, 97) * 0.7)} r={Math.min(44, innerWidth * 0.07)} />
            ))}
          </g>
        ) : Array.from({ length: count }, (_, building) => {
          const bw = innerWidth * (type === 'industrial' ? 0.42 : 0.22 + noise(index + building, 107) * 0.18);
          const bh = innerHeight * (type === 'industrial' ? 0.28 : 0.22 + noise(index + building, 131) * 0.2);
          const bx = innerX + innerWidth * (0.08 + noise(index + building, 149) * 0.78);
          const by = innerY + innerHeight * (0.08 + noise(index + building, 173) * 0.76);
          return <rect key={building} x={Math.min(bx, innerX + innerWidth - bw)} y={Math.min(by, innerY + innerHeight - bh)} width={bw} height={bh} rx="6" fill={fill} stroke="#39443a" strokeWidth="7" />;
        })}
      </g>
    );
  }), []);

  const saveViewport = (nextViewport) => {
    const clamped = clampViewportToMap(nextViewport);
    onViewportChange({ x: clamped.x, y: clamped.y, zoom: clamped.zoom });
  };

  const focusPoint = (point, zoom = camera.zoom) => {
    saveViewport({ ...camera, x: point.x, y: point.y, zoom });
  };

  const focusDistrict = (district) => {
    if (!district) return;
    onSelectionChange({ districtId: district.id, sectorId: null, blockId: null });
    focusPoint({
      x: district.minX + (district.maxX - district.minX) / 2,
      y: district.minY + (district.maxY - district.minY) / 2,
    }, Math.max(2, camera.zoom));
  };

  const focusSector = (sector) => {
    if (!sector) return;
    onSelectionChange({ sectorId: sector.id, blockId: null });
    focusPoint({
      x: sector.minX + (sector.maxX - sector.minX) / 2,
      y: sector.minY + (sector.maxY - sector.minY) / 2,
    }, Math.max(4, camera.zoom));
  };

  const changeZoom = (zoom, screenPoint = { x: viewportSize.width / 2, y: viewportSize.height / 2 }) => {
    const nextViewport = zoomViewportAtPoint({ ...camera, ...viewportSize }, screenPoint, zoom);
    saveViewport(nextViewport);
  };

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;

    const handleWheel = (event) => {
      if (event.cancelable) event.preventDefault();
      const bounds = svg.getBoundingClientRect();
      const screenPoint = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
      const activeCamera = cameraRef.current;
      const activeSize = viewportSizeRef.current;
      const factor = Math.exp(-event.deltaY * 0.001);
      const nextViewport = zoomViewportAtPoint(
        { ...activeCamera, ...activeSize },
        screenPoint,
        activeCamera.zoom * factor,
      );
      const clampedViewport = clampViewportToMap(nextViewport);
      onViewportChangeRef.current({ x: clampedViewport.x, y: clampedViewport.y, zoom: clampedViewport.zoom });
    };

    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => svg.removeEventListener('wheel', handleWheel);
  }, []);

  const handlePointerDown = (event) => {
    if (event.button !== 0) return;
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - dragRef.current.x;
    const deltaY = event.clientY - dragRef.current.y;
    dragRef.current = { ...dragRef.current, x: event.clientX, y: event.clientY };
    saveViewport(panViewport({ ...camera, ...viewportSize }, deltaX, deltaY));
  };

  const handlePointerUp = (event) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  };

  const handleDoubleClick = (event) => {
    const bounds = svgRef.current.getBoundingClientRect();
    const screenPoint = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    changeZoom(camera.zoom * 1.5, screenPoint);
  };

  const handleReset = () => {
    onSelectionChange({ districtId: null, sectorId: null, blockId: null });
    saveViewport({ ...camera, x: CITY.widthM / 2, y: CITY.heightM / 2, zoom: 1 });
  };

  return (
    <div className="absolute inset-0">
      <svg
        ref={svgRef}
        viewBox={viewBox}
        preserveAspectRatio="none"
        role="img"
        aria-label="Interactive tactical city map"
        className="h-full w-full cursor-default"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        onContextMenu={(event) => event.preventDefault()}
      >
        <defs>
          <pattern id="world-grid" width={CITY.cellSizeM * 5} height={CITY.cellSizeM * 5} patternUnits="userSpaceOnUse">
            <path d={`M${CITY.cellSizeM * 5} 0H0V${CITY.cellSizeM * 5}`} fill="none" stroke="#9eb3a2" strokeWidth="8" opacity=".18" />
          </pattern>
          <pattern id="urban-fabric" width={CITY.widthM} height={CITY.heightM} patternUnits="userSpaceOnUse">
            <rect width={CITY.widthM} height={CITY.heightM} fill="#121a16" />
            {urbanBlockElements}
          </pattern>
          <filter id="marker-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="32" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <rect width={CITY.widthM} height={CITY.heightM} fill="url(#urban-fabric)" />
        <rect width={CITY.widthM} height={CITY.heightM} fill="url(#world-grid)" pointerEvents="none" />

        {DISTRICTS.map((district) => (
          <g key={district.id}>
            <rect
              x={district.minX}
              y={district.minY}
              width={district.maxX - district.minX}
              height={district.maxY - district.minY}
              fill={state.mapSelection.districtId === district.id ? 'rgba(53,195,216,.035)' : 'transparent'}
              stroke={state.mapSelection.districtId === district.id ? '#35c3d8' : '#9eafa1'}
              strokeWidth={state.mapSelection.districtId === district.id ? 16 : 8}
              strokeDasharray="40 32"
              opacity=".48"
              onClick={() => focusDistrict(district)}
            />
            {camera.zoom < 2 && (
              <text x={district.minX + 160} y={district.minY + 260} fontSize="170" fill="#c5d0c5" opacity=".7" fontFamily="ui-monospace, monospace">
                {district.name}
              </text>
            )}
          </g>
        ))}

        {highwayX.map((x) => <g key={`highway-x-${x}`} pointerEvents="none"><path d={`M${x} 0V${CITY.heightM}`} stroke="#343d39" strokeWidth="150" /><path d={`M${x} 0V${CITY.heightM}`} stroke="#b39b5c" strokeWidth="12" strokeDasharray="180 140" /></g>)}
        {highwayY.map((y) => <g key={`highway-y-${y}`} pointerEvents="none"><path d={`M0 ${y}H${CITY.widthM}`} stroke="#343d39" strokeWidth="150" /><path d={`M0 ${y}H${CITY.widthM}`} stroke="#b39b5c" strokeWidth="12" strokeDasharray="180 140" /></g>)}
        {arterialX.map((x) => <path key={`arterial-x-${x}`} d={`M${x} 0V${CITY.heightM}`} stroke="#465149" strokeWidth="72" opacity=".9" pointerEvents="none" />)}
        {arterialY.map((y) => <path key={`arterial-y-${y}`} d={`M0 ${y}H${CITY.widthM}`} stroke="#465149" strokeWidth="72" opacity=".9" pointerEvents="none" />)}
        {localX.map((x) => <path key={`local-x-${x}`} d={`M${x} 0V${CITY.heightM}`} stroke="#4a554c" strokeWidth="34" opacity=".78" pointerEvents="none" />)}
        {localY.map((y) => <path key={`local-y-${y}`} d={`M0 ${y}H${CITY.widthM}`} stroke="#4a554c" strokeWidth="34" opacity=".78" pointerEvents="none" />)}

        {Object.entries(BASE_LOCATIONS).map(([department, station]) => (
          <g key={department}>
            <path d={`M${station.x} ${station.y - 115}l115 115-115 115-115-115z`} fill="#101714" stroke={DEPARTMENT_COLORS[department]} strokeWidth="18" />
            <circle cx={station.x} cy={station.y} r="28" fill={DEPARTMENT_COLORS[department]} />
            <text x={station.x + 150} y={station.y + 28} fontSize="118" fill="#d1ddd2" fontFamily="ui-monospace, monospace">{station.label}</text>
          </g>
        ))}

        {state.coordStatus !== 'VERIFIED' && !state.callerData.coordsUnlocked && <circle cx={incidentPosition.x} cy={incidentPosition.y} r={2000 - (state.ipTraceProgress / 100) * 1500} fill="rgba(53,195,216,.12)" stroke="#35c3d8" strokeWidth="16" strokeDasharray="65 50" opacity=".85" />}

        {routePoints.length > 1 && (
          <path
            d={routePoints.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`).join(' ')}
            fill="none"
            stroke={unitWaitingForNewAddress ? '#facc15' : state.dispatchedUnit?.dept === 'fire' ? '#f0932b' : state.dispatchedUnit?.dept === 'medical' ? '#3fb97a' : '#35c3d8'}
            strokeWidth="90"
            strokeDasharray={unitWaitingForNewAddress ? '180 100' : '110 80'}
            opacity=".92"
            pointerEvents="none"
          />
        )}

        {lastSearchPosition && <g pointerEvents="none">
          <circle cx={lastSearchPosition.x} cy={lastSearchPosition.y} r="250" fill="rgba(250,204,21,.12)" stroke="#facc15" strokeWidth="18" strokeDasharray="45 35" />
          <text x={lastSearchPosition.x} y={lastSearchPosition.y - 310} fontSize="110" fill="#facc15" textAnchor="middle" fontFamily="ui-monospace, monospace">OFFICER WAITING · NEW ADDRESS REQUIRED</text>
        </g>}

        <g className="dispatch-target" onClick={() => onSelectionChange({ incidentId: activeIncident?.id })}>
          {state.coordStatus === 'VERIFIED' && <circle cx={incidentPosition.x} cy={incidentPosition.y} r="180" fill="rgba(229,72,77,.12)" filter="url(#marker-glow)" />}
          {state.coordStatus === 'VERIFIED' && <circle cx={incidentPosition.x} cy={incidentPosition.y} r="120" fill="rgba(229,72,77,.18)" stroke="#f16060" strokeWidth="18" />}
          {state.coordStatus !== 'VERIFIED' && <text x={incidentPosition.x} y={incidentPosition.y + 70} fontSize="190" fill="#35c3d8" textAnchor="middle" filter="url(#marker-glow)">{state.ipTraceProgress >= 100 || state.callerData.coordsUnlocked ? (activeIncident?.deptCategory === 'fire' ? '\u{1F525}' : activeIncident?.deptCategory === 'medical' ? '\u{1F691}' : '\u{1F6E1}') : '?'}</text>}
          {state.coordStatus === 'VERIFIED' && <text x={incidentPosition.x} y={incidentPosition.y + 55} fontSize="160" textAnchor="middle">{activeIncident?.deptCategory === 'fire' ? '\u{1F525}' : activeIncident?.deptCategory === 'medical' ? '\u{1F691}' : '\u{1F6E1}'}</text>}
          {state.coordStatus === 'VERIFIED' && <path d={`M${incidentPosition.x} ${incidentPosition.y - 260}v85m0 350v85m-260-260h85m350 0h85`} stroke="#ff7774" strokeWidth="18" />}
          <text x={incidentPosition.x + 230} y={incidentPosition.y - 80} fontSize="132" fill="#ff7975" fontFamily="ui-monospace, monospace">
            SEV {activeIncident?.severity || 1} · {activeIncident?.id || 'NO ACTIVE INCIDENT'}
          </text>
        </g>

        {vehiclePosition && (
          <g transform={`translate(${vehiclePosition.x} ${vehiclePosition.y})`}>
            <circle r="60" fill="#0b1210" stroke={unitWaitingForNewAddress ? '#facc15' : '#35c3d8'} strokeWidth="12" />
            <path d="M-18 22V-22L26 0z" fill={unitWaitingForNewAddress ? '#facc15' : '#35c3d8'} />
            <text x="78" y="22" fontSize="72" fill={unitWaitingForNewAddress ? '#fde68a' : '#bdeef2'} fontFamily="ui-monospace, monospace">
              {state.dispatchedUnit?.name || 'UNIT'}
              {unitWaitingForNewAddress ? ' · WAITING' : ''}
            </text>
          </g>
        )}
      </svg>

      <div className="absolute left-3 top-3 z-10 flex max-w-[75%] flex-wrap items-center gap-1 border border-neutral-700 bg-neutral-950/90 p-1 text-[9px] font-mono text-neutral-200">
        <button type="button" className="px-1 text-cyan-300 hover:bg-neutral-800" onClick={handleReset}>BANGKOK</button>
        <span className="text-neutral-500">&gt;</span>
        <button type="button" className="max-w-32 truncate px-1 hover:bg-neutral-800" onClick={() => focusDistrict(location.district)}>{location.district?.name || 'DISTRICT'}</button>
        <span className="text-neutral-500">&gt;</span>
        <button type="button" className="px-1 hover:bg-neutral-800" onClick={() => focusSector(location.sector)}>{location.sector?.name || 'SECTOR'}</button>
        <span className="text-cyan-300">{location.blockId}</span>
      </div>

      <div className="absolute right-3 top-3 z-10 flex items-center gap-1 border border-neutral-700 bg-neutral-950/90 p-1">
        <button type="button" className="p-1 text-neutral-200 hover:bg-neutral-800" aria-label="Zoom out" title="Zoom out" onClick={() => changeZoom(camera.zoom / 1.25)}><Minus className="h-3.5 w-3.5" /></button>
        <span className="min-w-9 text-center font-mono text-[9px] text-cyan-300">{camera.zoom.toFixed(1)}×</span>
        <button type="button" className="p-1 text-neutral-200 hover:bg-neutral-800" aria-label="Zoom in" title="Zoom in" onClick={() => changeZoom(camera.zoom * 1.25)}><Plus className="h-3.5 w-3.5" /></button>
        <button type="button" className="p-1 text-neutral-200 hover:bg-neutral-800" aria-label="Reset map view" title="Reset map view" onClick={handleReset}><RotateCcw className="h-3.5 w-3.5" /></button>
        <button type="button" className="p-1 text-red-300 hover:bg-neutral-800" aria-label="Focus incident" title="Focus incident" onClick={() => focusPoint(incidentPosition, Math.max(2, camera.zoom))}><LocateFixed className="h-3.5 w-3.5" /></button>
        {vehiclePosition && <button type="button" className="p-1 text-cyan-300 hover:bg-neutral-800" aria-label="Focus unit" title="Focus unit" onClick={() => focusPoint(vehiclePosition, Math.max(2, camera.zoom))}><LocateFixed className="h-3.5 w-3.5" /></button>}
      </div>

      {activeIncident && <button
        type="button"
        onClick={() => focusPoint(incidentPosition, Math.max(2, camera.zoom))}
        aria-label={`Incident alert: ${activeIncident.title}`}
        title={`${activeIncident.title} · SEV ${activeIncident.severity}`}
        className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-red-500/70 bg-neutral-950/95 text-red-300 shadow-lg hover:bg-red-950"
      >
        {activeIncident.deptCategory === 'fire' ? <Flame className="h-4 w-4" /> : activeIncident.deptCategory === 'medical' ? <Ambulance className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[8px] font-bold text-white">{activeIncident.severity}</span>
      </button>}

      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2 border border-neutral-700 bg-neutral-950/90 px-2 py-1 font-mono text-[8px] text-neutral-300">
        <span className="text-amber-300">━━ HIGHWAY</span><span className="text-slate-300">━━ ARTERIAL</span><span className="text-neutral-400">━ LOCAL</span>
      </div>

      <div className="absolute bottom-3 left-3 z-10 border border-neutral-700 bg-neutral-950/90 px-2 py-1 font-mono text-[9px] text-cyan-200">
        CITY GRID · {location.cellColumn + 1}/{CITY.gridColumns} : {location.cellRow + 1}/{CITY.gridRows}
      </div>
    </div>
  );
}
