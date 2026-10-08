export function getEdgeTravelTimeSec(edge, vehicle, department) {
  if (edge.closed || edge.restricted) return Infinity;
  if (!edge.allowedDepartments.includes(department)) return Infinity;
  if (vehicle.widthM && vehicle.widthM > edge.widthM) return Infinity;

  const speedKph = Math.min(vehicle.speedKph, edge.speedLimitKph) * edge.speedMultiplier;
  if (speedKph <= 0) return Infinity;

  return edge.distanceM / (speedKph * 1000 / 3600);
}
