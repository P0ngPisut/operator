import { CITY } from '../data/map/city.js';

function getRoadType(column, row) {
  if (column % 12 === 0 || row % 12 === 0) return 'highway';
  if (column % 5 === 0 || row % 5 === 0) return 'arterial';
  return 'local';
}

function getRoadProperties(type) {
  if (type === 'highway') return { speedLimitKph: 100, widthM: 36, speedMultiplier: 1 };
  if (type === 'arterial') return { speedLimitKph: 60, widthM: 20, speedMultiplier: 0.92 };
  return { speedLimitKph: 30, widthM: 8, speedMultiplier: 0.8 };
}

export function createRoadGraph(city = CITY) {
  const nodeCountX = Math.floor(city.widthM / city.cellSizeM) + 1;
  const nodeCountY = Math.floor(city.heightM / city.cellSizeM) + 1;
  const nodes = new Map();
  const adjacency = new Map();

  for (let row = 0; row < nodeCountY; row += 1) {
    for (let column = 0; column < nodeCountX; column += 1) {
      const id = `N-${column}-${row}`;
      nodes.set(id, { id, x: column * city.cellSizeM, y: row * city.cellSizeM });
      adjacency.set(id, []);
    }
  }

  const addRoad = (fromColumn, fromRow, toColumn, toRow) => {
    const fromNodeId = `N-${fromColumn}-${fromRow}`;
    const toNodeId = `N-${toColumn}-${toRow}`;
    const roadType = getRoadType(Math.min(fromColumn, toColumn), Math.min(fromRow, toRow));
    const properties = getRoadProperties(roadType);
    const distanceM = city.cellSizeM;
    const roadPrefix = roadType === 'highway' ? 'H' : roadType === 'arterial' ? 'A' : 'L';
    const baseId = `${roadPrefix}-${fromColumn}-${fromRow}-${toColumn}-${toRow}`;
    const restrictions = roadType === 'local' ? ['NARROW'] : [];

    adjacency.get(fromNodeId).push({
      id: `${baseId}:${fromNodeId}>${toNodeId}`,
      roadId: baseId,
      fromNodeId,
      toNodeId,
      distanceM,
      type: roadType,
      restrictions,
      allowedDepartments: ['police', 'fire', 'medical'],
      ...properties,
    });
    adjacency.get(toNodeId).push({
      id: `${baseId}:${toNodeId}>${fromNodeId}`,
      roadId: baseId,
      fromNodeId: toNodeId,
      toNodeId: fromNodeId,
      distanceM,
      type: roadType,
      restrictions,
      allowedDepartments: ['police', 'fire', 'medical'],
      ...properties,
    });
  };

  for (let row = 0; row < nodeCountY; row += 1) {
    for (let column = 0; column < nodeCountX; column += 1) {
      if (column + 1 < nodeCountX) addRoad(column, row, column + 1, row);
      if (row + 1 < nodeCountY) addRoad(column, row, column, row + 1);
    }
  }

  return { nodes, adjacency, cellSizeM: city.cellSizeM, widthM: city.widthM, heightM: city.heightM };
}

export function snapToRoadNode(point, roadGraph) {
  const maxCol = Math.floor((roadGraph.widthM ?? CITY.widthM) / roadGraph.cellSizeM);
  const maxRow = Math.floor((roadGraph.heightM ?? CITY.heightM) / roadGraph.cellSizeM);
  const column = Math.min(maxCol, Math.max(0, Math.round(point.x / roadGraph.cellSizeM)));
  const row = Math.min(maxRow, Math.max(0, Math.round(point.y / roadGraph.cellSizeM)));
  return `N-${column}-${row}`;
}

export const CITY_ROAD_GRAPH = createRoadGraph();
