import { CITY, findDistrict } from '../data/map/city.js';
import ROAD_NETWORK from '../data/map/roadNetwork.js';

// Road network traced from public/nightwatch-city-map.jpg (see scripts/extractRoadNetwork.mjs).
const ROAD_TYPES = ['local', 'arterial', 'highway'];
const SPATIAL_BUCKET_M = 250;

function getRoadProperties(type) {
  if (type === 'highway') return { speedLimitKph: 100, widthM: 36, speedMultiplier: 1, lanes: 6 };
  if (type === 'arterial') return { speedLimitKph: 60, widthM: 20, speedMultiplier: 0.92, lanes: 4 };
  return { speedLimitKph: 30, widthM: 8, speedMultiplier: 0.8, lanes: 2 };
}

function polylineLength(points) {
  let length = 0;
  for (let index = 1; index < points.length; index += 1) {
    length += Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y);
  }
  return length;
}

function bucketKey(x, y) {
  return `${Math.floor(x / SPATIAL_BUCKET_M)}:${Math.floor(y / SPATIAL_BUCKET_M)}`;
}

function buildSpatialIndex(nodes, adjacency) {
  const buckets = new Map();
  for (const node of nodes.values()) {
    if (!adjacency.get(node.id)?.length) continue;
    const key = bucketKey(node.x, node.y);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(node);
  }
  return buckets;
}

function addRoad(graph, { roadId, fromNodeId, toNodeId, type, isBridge, controlPoints, bridgeId }) {
  const { nodes, adjacency, roads, bridges } = graph;
  const from = nodes.get(fromNodeId);
  const to = nodes.get(toNodeId);
  const properties = getRoadProperties(type);
  const distanceM = polylineLength([from, ...controlPoints, to]);
  const edgeData = {
    roadId,
    fromNodeId,
    toNodeId,
    distanceM,
    type,
    districtId: from.districtId || to.districtId,
    restricted: false,
    isBridge,
    curvature: controlPoints.length ? 'POLYLINE' : 'STRAIGHT',
    restrictions: type === 'local' ? ['NARROW'] : [],
    allowedDepartments: ['police', 'fire', 'medical'],
    ...properties,
    ...(isBridge ? { bridgeId, riverId: 'RIVER_MAIN' } : {}),
  };
  roads.set(roadId, { id: roadId, ...edgeData, controlPoints, from: fromNodeId, to: toNodeId, length: distanceM, speedLimit: properties.speedLimitKph });
  from.roads.push(roadId);
  to.roads.push(roadId);
  adjacency.get(fromNodeId).push({ ...edgeData, id: `${roadId}:${fromNodeId}>${toNodeId}`, controlPoints: [...controlPoints] });
  adjacency.get(toNodeId).push({ ...edgeData, id: `${roadId}:${toNodeId}>${fromNodeId}`, fromNodeId: toNodeId, toNodeId: fromNodeId, controlPoints: [...controlPoints].reverse() });
  if (isBridge) bridges.set(bridgeId, { id: bridgeId, type: type.toUpperCase(), roadId, riverId: 'RIVER_MAIN', length: distanceM, restricted: false });
}

function createGraphShell(widthM, heightM, cellSizeM) {
  return { nodes: new Map(), adjacency: new Map(), roads: new Map(), bridges: new Map(), cellSizeM, widthM, heightM };
}

function addNode(graph, id, x, y) {
  graph.nodes.set(id, { id, x, y, type: 'INTERSECTION', districtId: findDistrict(x, y)?.id ?? null, roads: [] });
  graph.adjacency.set(id, []);
}

export function buildRoadGraphFromNetwork(network = ROAD_NETWORK) {
  const graph = createGraphShell(network.widthM, network.heightM, CITY.cellSizeM);
  network.nodes.forEach(([x, y], index) => addNode(graph, `N-${index}`, x, y));
  network.edges.forEach(([fromIndex, toIndex, typeCode, flags, flatControlPoints = []], index) => {
    const controlPoints = [];
    for (let offset = 0; offset < flatControlPoints.length; offset += 2) {
      controlPoints.push({ x: flatControlPoints[offset], y: flatControlPoints[offset + 1] });
    }
    const type = ROAD_TYPES[typeCode] || 'local';
    addRoad(graph, {
      roadId: `${type.toUpperCase()}-${index}`,
      fromNodeId: `N-${fromIndex}`,
      toNodeId: `N-${toIndex}`,
      type,
      isBridge: Boolean(flags & 1),
      controlPoints,
      bridgeId: `BRIDGE-${index}`,
    });
  });
  graph.spatialIndex = buildSpatialIndex(graph.nodes, graph.adjacency);
  graph.network = network;
  return graph;
}

// Plain orthogonal grid, used for synthetic test cities (node ids are N-<column>-<row>).
export function createGridRoadGraph(city) {
  const nodeCountX = Math.floor(city.widthM / city.cellSizeM) + 1;
  const nodeCountY = Math.floor(city.heightM / city.cellSizeM) + 1;
  const graph = createGraphShell(city.widthM, city.heightM, city.cellSizeM);
  for (let row = 0; row < nodeCountY; row += 1) {
    for (let column = 0; column < nodeCountX; column += 1) addNode(graph, `N-${column}-${row}`, column * city.cellSizeM, row * city.cellSizeM);
  }
  for (let row = 0; row < nodeCountY; row += 1) {
    for (let column = 0; column < nodeCountX; column += 1) {
      const fromNodeId = `N-${column}-${row}`;
      if (column + 1 < nodeCountX) addRoad(graph, { roadId: `LOCAL-${column}-${row}-${column + 1}-${row}`, fromNodeId, toNodeId: `N-${column + 1}-${row}`, type: 'local', isBridge: false, controlPoints: [] });
      if (row + 1 < nodeCountY) addRoad(graph, { roadId: `LOCAL-${column}-${row}-${column}-${row + 1}`, fromNodeId, toNodeId: `N-${column}-${row + 1}`, type: 'local', isBridge: false, controlPoints: [] });
    }
  }
  return graph;
}

export function createRoadGraph(city = CITY) {
  if (city === CITY || city.roadNetwork) return buildRoadGraphFromNetwork(city.roadNetwork || ROAD_NETWORK);
  return createGridRoadGraph(city);
}

function findNearestIndexedNode(point, roadGraph) {
  const centerColumn = Math.floor(point.x / SPATIAL_BUCKET_M);
  const centerRow = Math.floor(point.y / SPATIAL_BUCKET_M);
  const maxRings = Math.ceil(Math.max(roadGraph.widthM, roadGraph.heightM) / SPATIAL_BUCKET_M) + 1;
  let nearest = null;
  let nearestDistance = Infinity;
  for (let ring = 0; ring <= maxRings; ring += 1) {
    if (nearest && (ring - 1) * SPATIAL_BUCKET_M >= nearestDistance) break;
    for (let row = centerRow - ring; row <= centerRow + ring; row += 1) {
      for (let column = centerColumn - ring; column <= centerColumn + ring; column += 1) {
        if (Math.abs(row - centerRow) !== ring && Math.abs(column - centerColumn) !== ring) continue;
        for (const node of roadGraph.spatialIndex.get(`${column}:${row}`) || []) {
          const distance = Math.hypot(node.x - point.x, node.y - point.y);
          if (distance < nearestDistance) { nearest = node; nearestDistance = distance; }
        }
      }
    }
  }
  return nearest;
}

export function snapToRoadNode(point, roadGraph) {
  if (roadGraph.spatialIndex) return findNearestIndexedNode(point, roadGraph)?.id ?? null;
  const maxCol = Math.floor((roadGraph.widthM ?? CITY.widthM) / roadGraph.cellSizeM);
  const maxRow = Math.floor((roadGraph.heightM ?? CITY.heightM) / roadGraph.cellSizeM);
  const column = Math.min(maxCol, Math.max(0, Math.round(point.x / roadGraph.cellSizeM)));
  const row = Math.min(maxRow, Math.max(0, Math.round(point.y / roadGraph.cellSizeM)));
  const candidate = `N-${column}-${row}`;
  if (roadGraph.adjacency.get(candidate)?.length) return candidate;
  let nearestId = null;
  let nearestDistance = Infinity;
  for (const [id, edges] of roadGraph.adjacency) {
    if (!edges.length) continue;
    const node = roadGraph.nodes.get(id);
    const distance = Math.hypot(node.x - point.x, node.y - point.y);
    if (distance < nearestDistance) { nearestId = id; nearestDistance = distance; }
  }
  return nearestId;
}

export const CITY_ROAD_GRAPH = createRoadGraph();

// Moves an arbitrary world point onto the nearest road node of the painted map.
export function snapWorldPointToRoad(point, roadGraph = CITY_ROAD_GRAPH) {
  const nodeId = snapToRoadNode(point, roadGraph);
  const node = nodeId ? roadGraph.nodes.get(nodeId) : null;
  return node ? { x: node.x, y: node.y, nodeId } : { ...point, nodeId: null };
}
