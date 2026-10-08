import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoadGraph } from '../src/pathfinding/graph.js';
import { findRoute, findRouteBetweenWorldPoints } from '../src/pathfinding/astar.js';
import { CITY_ROAD_GRAPH, snapWorldPointToRoad } from '../src/pathfinding/graph.js';
import { BASE_LOCATIONS } from '../src/data/vehicles.js';

const smallCity = { widthM: 200, heightM: 200, cellSizeM: 100 };
const testVehicle = { speedKph: 60, widthM: 2 };

test('A* returns a connected route with distance and travel time', () => {
  const graph = createRoadGraph(smallCity);
  const route = findRoute({
    startNodeId: 'N-0-0',
    targetNodeId: 'N-2-2',
    vehicle: testVehicle,
    department: 'police',
    roadGraph: graph,
  });

  assert.ok(route);
  assert.equal(route.points.length, route.nodeIds.length);
  assert.equal(route.distanceM, 400);
  assert.ok(route.travelTimeSec > 0);
});

test('A* avoids closed road edges', () => {
  const graph = createRoadGraph(smallCity);
  const edge = graph.adjacency.get('N-0-0').find((road) => road.toNodeId === 'N-1-0');
  const reverseEdge = graph.adjacency.get('N-1-0').find((road) => road.toNodeId === 'N-0-0');
  edge.closed = true;
  reverseEdge.closed = true;
  const route = findRoute({
    startNodeId: 'N-0-0',
    targetNodeId: 'N-1-0',
    vehicle: testVehicle,
    department: 'police',
    roadGraph: graph,
  });

  assert.ok(route);
  assert.ok(route.nodeIds.length > 2);
  assert.ok(!route.edgeIds.includes(edge.id));
});

test('A* rejects roads that are too narrow for the vehicle', () => {
  const graph = createRoadGraph(smallCity);
  for (const edges of graph.adjacency.values()) {
    for (const edge of edges) edge.widthM = 12;
  }
  const narrowForwardEdge = graph.adjacency.get('N-0-0').find((road) => road.toNodeId === 'N-1-0');
  const narrowReverseEdge = graph.adjacency.get('N-1-0').find((road) => road.toNodeId === 'N-0-0');
  narrowForwardEdge.widthM = 4;
  narrowReverseEdge.widthM = 4;
  const heavyVehicle = { speedKph: 40, widthM: 9 };
  const route = findRoute({
    startNodeId: 'N-0-0',
    targetNodeId: 'N-1-0',
    vehicle: heavyVehicle,
    department: 'fire',
    roadGraph: graph,
  });

  assert.ok(route);
  assert.ok(route.nodeIds.length > 2);
});

test('painted-map road network is a single connected graph with bridges and road classes', () => {
  assert.ok(CITY_ROAD_GRAPH.nodes.size > 1000);
  assert.ok(CITY_ROAD_GRAPH.bridges.size > 0);
  const types = new Set([...CITY_ROAD_GRAPH.roads.values()].map((road) => road.type));
  assert.deepEqual([...types].sort(), ['arterial', 'highway', 'local']);

  const visited = new Set([CITY_ROAD_GRAPH.nodes.keys().next().value]);
  const stack = [...visited];
  while (stack.length) {
    const nodeId = stack.pop();
    for (const edge of CITY_ROAD_GRAPH.adjacency.get(nodeId)) {
      if (!visited.has(edge.toNodeId)) { visited.add(edge.toNodeId); stack.push(edge.toNodeId); }
    }
  }
  assert.equal(visited.size, CITY_ROAD_GRAPH.nodes.size);
});

test('every base station can reach a point across the river on the painted map', () => {
  const target = snapWorldPointToRoad({ x: 8600, y: 4400 });
  for (const [department, station] of Object.entries(BASE_LOCATIONS)) {
    const route = findRouteBetweenWorldPoints({ start: station, target, vehicle: testVehicle, department });
    assert.ok(route, `${department} route`);
    assert.ok(route.distanceM > 1000);
    assert.ok(route.geometryPoints.length >= route.points.length);
    assert.deepEqual(route.geometryPoints[0], route.points[0]);
    assert.deepEqual(route.geometryPoints.at(-1), route.points.at(-1));
  }
});
