import { CITY_ROAD_GRAPH, snapToRoadNode } from './graph.js';
import { getEdgeTravelTimeSec } from './routeCost.js';

class MinHeap {
  values = [];

  get size() {
    return this.values.length;
  }

  push(value) {
    this.values.push(value);
    let index = this.values.length - 1;

    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.values[parentIndex].score <= value.score) break;
      this.values[index] = this.values[parentIndex];
      index = parentIndex;
    }

    this.values[index] = value;
  }

  pop() {
    if (this.values.length === 0) return null;

    const minimum = this.values[0];
    const last = this.values.pop();
    if (this.values.length === 0) return minimum;

    let index = 0;
    while (true) {
      const leftIndex = index * 2 + 1;
      const rightIndex = leftIndex + 1;
      if (leftIndex >= this.values.length) break;

      const childIndex = rightIndex < this.values.length
        && this.values[rightIndex].score < this.values[leftIndex].score
        ? rightIndex
        : leftIndex;
      if (this.values[childIndex].score >= last.score) break;
      this.values[index] = this.values[childIndex];
      index = childIndex;
    }

    this.values[index] = last;
    return minimum;
  }
}

function estimateTravelTime(fromNode, toNode, vehicle) {
  const distanceM = Math.hypot(toNode.x - fromNode.x, toNode.y - fromNode.y);
  return distanceM / (vehicle.speedKph * 1000 / 3600);
}

export function findRoute({
  startNodeId,
  targetNodeId,
  vehicle,
  department,
  roadGraph = CITY_ROAD_GRAPH,
}) {
  if (!roadGraph.nodes.has(startNodeId) || !roadGraph.nodes.has(targetNodeId)) return null;
  if (startNodeId === targetNodeId) {
    const node = roadGraph.nodes.get(startNodeId);
    return { nodeIds: [startNodeId], edgeIds: [], points: [{ x: node.x, y: node.y }], distanceM: 0, travelTimeSec: 0 };
  }

  const openSet = new MinHeap();
  const travelTimes = new Map([[startNodeId, 0]]);
  const previous = new Map();
  const start = roadGraph.nodes.get(startNodeId);
  const target = roadGraph.nodes.get(targetNodeId);
  openSet.push({ nodeId: startNodeId, score: estimateTravelTime(start, target, vehicle) });

  while (openSet.size > 0) {
    const current = openSet.pop();
    const currentTime = travelTimes.get(current.nodeId);
    if (current.nodeId === targetNodeId) break;

    for (const edge of roadGraph.adjacency.get(current.nodeId) || []) {
      const edgeTime = getEdgeTravelTimeSec(edge, vehicle, department);
      if (!Number.isFinite(edgeTime)) continue;

      const candidateTime = currentTime + edgeTime;
      if (candidateTime >= (travelTimes.get(edge.toNodeId) ?? Infinity)) continue;

      travelTimes.set(edge.toNodeId, candidateTime);
      previous.set(edge.toNodeId, { nodeId: current.nodeId, edge });
      const neighbor = roadGraph.nodes.get(edge.toNodeId);
      openSet.push({
        nodeId: edge.toNodeId,
        score: candidateTime + estimateTravelTime(neighbor, target, vehicle),
      });
    }
  }

  if (!previous.has(targetNodeId)) return null;

  const nodeIds = [targetNodeId];
  const edgeIds = [];
  let distanceM = 0;
  let cursor = targetNodeId;

  while (cursor !== startNodeId) {
    const step = previous.get(cursor);
    if (!step) return null;
    nodeIds.push(step.nodeId);
    edgeIds.push(step.edge.id);
    distanceM += step.edge.distanceM;
    cursor = step.nodeId;
  }

  nodeIds.reverse();
  edgeIds.reverse();

  return {
    nodeIds,
    edgeIds,
    points: nodeIds.map((nodeId) => {
      const node = roadGraph.nodes.get(nodeId);
      return { x: node.x, y: node.y };
    }),
    distanceM,
    travelTimeSec: travelTimes.get(targetNodeId),
  };
}

export function findRouteBetweenWorldPoints({ start, target, vehicle, department, roadGraph }) {
  const graph = roadGraph || CITY_ROAD_GRAPH;
  return findRoute({
    startNodeId: snapToRoadNode(start, graph),
    targetNodeId: snapToRoadNode(target, graph),
    vehicle,
    department,
    roadGraph: graph,
  });
}