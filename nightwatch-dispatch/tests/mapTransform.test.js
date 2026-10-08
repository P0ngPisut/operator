import test from 'node:test';
import assert from 'node:assert/strict';
import * as transforms from '../src/systems/map/mapTransform.js';

const { panViewport, screenToWorld, worldToScreen, zoomViewportAtPoint } = transforms;

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

test('viewport clamps keep the painted map in view at any panel shape', () => {
  const { clampViewportToMap, getVisibleWorldSize, MAP_WORLD } = transforms;
  const wide = { x: -5000, y: 99999, zoom: 1, width: 1600, height: 1200 };
  const clamped = clampViewportToMap(wide);
  assert.equal(clamped.x, MAP_WORLD.widthM / 2);
  // Visible height exceeds the map height, so the map is vertically centred.
  assert.ok(getVisibleWorldSize(wide).height > MAP_WORLD.heightM);
  assert.equal(clamped.y, MAP_WORLD.heightM / 2);

  const zoomed = clampViewportToMap({ x: 0, y: 0, zoom: 4, width: 1600, height: 900 });
  const visible = getVisibleWorldSize({ zoom: 4, width: 1600, height: 900 });
  assert.equal(zoomed.x, visible.width / 2);
  assert.equal(zoomed.y, visible.height / 2);
});

test('city map matches the painted base map and its logical grid', async () => {
  const { CITY, DISTRICTS, getMapLocation } = await import('../src/data/map/city.js');
  const { BASE_LOCATIONS } = await import('../src/data/vehicles.js');
  const { snapToRoadNode, CITY_ROAD_GRAPH } = await import('../src/pathfinding/graph.js');

  assert.equal(CITY.widthM, CITY.gridColumns * CITY.cellSizeM);
  assert.equal(CITY.gridRows, Math.ceil(CITY.heightM / CITY.cellSizeM));
  assert.equal(CITY_ROAD_GRAPH.widthM, CITY.widthM);
  assert.equal(CITY_ROAD_GRAPH.heightM, CITY.heightM);

  assert.ok(DISTRICTS.every((d) => d.minX >= 0 && d.maxX <= CITY.widthM && d.minY >= 0 && d.maxY <= CITY.heightM));
  assert.ok(DISTRICTS.every((d) => d.sectors.every((s) => s.minX >= 0 && s.maxX <= CITY.widthM && s.minY >= 0 && s.maxY <= CITY.heightM)));

  // Base stations sit exactly on road nodes of the painted map.
  for (const station of Object.values(BASE_LOCATIONS)) {
    const node = CITY_ROAD_GRAPH.nodes.get(snapToRoadNode(station, CITY_ROAD_GRAPH));
    assert.equal(node.x, station.x);
    assert.equal(node.y, station.y);
  }

  const loc = getMapLocation(CITY.widthM / 2, CITY.heightM / 2);
  assert.equal(loc.cellColumn, 50);
  assert.equal(loc.cellRow, 27);
  assert.ok(loc.district);
  assert.ok(loc.sector);
});