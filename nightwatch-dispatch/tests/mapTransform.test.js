import test from 'node:test';
import assert from 'node:assert/strict';
import {
  panViewport,
  screenToWorld,
  worldToScreen,
  zoomViewportAtPoint,
} from '../src/systems/map/mapTransform.js';

const initialViewport = {
  x: 5000,
  y: 5000,
  zoom: 1,
  width: 1600,
  height: 900,
};

test('world and screen transforms round-trip', () => {
  const worldPoint = { x: 6340, y: 4890 };
  const screenPoint = worldToScreen(worldPoint, initialViewport);
  const convertedPoint = screenToWorld(screenPoint, initialViewport);

  assert.ok(Math.abs(convertedPoint.x - worldPoint.x) < 1e-9);
  assert.ok(Math.abs(convertedPoint.y - worldPoint.y) < 1e-9);
});

test('cursor-anchored zoom keeps the world point under the cursor', () => {
  const cursor = { x: 1120, y: 280 };
  const anchorBeforeZoom = screenToWorld(cursor, initialViewport);
  const zoomedViewport = zoomViewportAtPoint(initialViewport, cursor, 2.5);
  const anchorAfterZoom = screenToWorld(cursor, zoomedViewport);

  assert.ok(Math.abs(anchorAfterZoom.x - anchorBeforeZoom.x) < 1e-9);
  assert.ok(Math.abs(anchorAfterZoom.y - anchorBeforeZoom.y) < 1e-9);
});

test('drag pan moves the map in the drag direction', () => {
  const screenPointBefore = worldToScreen({ x: 5000, y: 5000 }, initialViewport);
  const pannedViewport = panViewport(initialViewport, 120, -40);
  const screenPointAfter = worldToScreen({ x: 5000, y: 5000 }, pannedViewport);

  assert.equal(screenPointAfter.x - screenPointBefore.x, 120);
  assert.equal(screenPointAfter.y - screenPointBefore.y, -40);
});

test('city map is configured as 50x50 logical grid within valid boundaries', async () => {
  const { CITY, DISTRICTS, getMapLocation } = await import('../src/data/map/city.js');
  const { BASE_LOCATIONS } = await import('../src/data/vehicles.js');
  const { snapToRoadNode, CITY_ROAD_GRAPH } = await import('../src/pathfinding/graph.js');

  assert.equal(CITY.gridColumns, 50);
  assert.equal(CITY.gridRows, 50);
  assert.equal(CITY.widthM, 5000);
  assert.equal(CITY.heightM, 5000);

  // All districts fit in 5000x5000
  assert.ok(DISTRICTS.every((d) => d.minX >= 0 && d.maxX <= 5000 && d.minY >= 0 && d.maxY <= 5000));
  // All sectors fit
  assert.ok(DISTRICTS.every((d) => d.sectors.every((s) => s.minX >= 0 && s.maxX <= 5000 && s.minY >= 0 && s.maxY <= 5000)));

  // Base stations inside 50x50 bounds
  assert.ok(Object.values(BASE_LOCATIONS).every((loc) => loc.x >= 0 && loc.x <= 5000 && loc.y >= 0 && loc.y <= 5000));

  // Snapping at corner snaps to N-50-50
  assert.equal(snapToRoadNode({ x: 5000, y: 5000 }, CITY_ROAD_GRAPH), 'N-50-50');

  // getMapLocation at center
  const loc = getMapLocation(2500, 2500);
  assert.equal(loc.cellColumn, 25);
  assert.equal(loc.cellRow, 25);
  assert.ok(loc.district);
  assert.ok(loc.sector);
});