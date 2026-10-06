import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoadGraph } from '../src/pathfinding/graph.js';
import { findRoute } from '../src/pathfinding/astar.js';

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