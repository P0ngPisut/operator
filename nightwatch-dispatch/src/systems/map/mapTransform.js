import { CITY } from '../../data/map/city.js';

export const MAP_WORLD = Object.freeze({
  widthM: CITY.widthM,
  heightM: CITY.heightM,
  minZoom: 1,
  maxZoom: 5,
  defaultZoom: 1.3,
});

function getPixelsPerMeter(viewport) {
  return (viewport.width / MAP_WORLD.widthM) * viewport.zoom;
}

export function worldToScreen(point, viewport) {
  const pixelsPerMeter = getPixelsPerMeter(viewport);

  return {
    x: viewport.width / 2 + (point.x - viewport.x) * pixelsPerMeter,
    y: viewport.height / 2 + (point.y - viewport.y) * pixelsPerMeter,
  };
}

export function screenToWorld(point, viewport) {
  const pixelsPerMeter = getPixelsPerMeter(viewport);

  return {
    x: viewport.x + (point.x - viewport.width / 2) / pixelsPerMeter,
    y: viewport.y + (point.y - viewport.height / 2) / pixelsPerMeter,
  };
}

export function zoomViewportAtPoint(viewport, screenPoint, requestedZoom) {
  const zoom = Math.min(MAP_WORLD.maxZoom, Math.max(MAP_WORLD.minZoom, requestedZoom));
  const anchorWorld = screenToWorld(screenPoint, viewport);
  const nextPixelsPerMeter = (viewport.width / MAP_WORLD.widthM) * zoom;

  return {
    ...viewport,
    zoom,
    x: anchorWorld.x - (screenPoint.x - viewport.width / 2) / nextPixelsPerMeter,
    y: anchorWorld.y - (screenPoint.y - viewport.height / 2) / nextPixelsPerMeter,
  };
}

export function panViewport(viewport, deltaX, deltaY) {
  const pixelsPerMeter = getPixelsPerMeter(viewport);

  return {
    ...viewport,
    x: viewport.x - deltaX / pixelsPerMeter,
    y: viewport.y - deltaY / pixelsPerMeter,
  };
}

export function clampViewportToMap(viewport) {
  const visibleWidth = MAP_WORLD.widthM / viewport.zoom;
  const visibleHeight = viewport.height / getPixelsPerMeter(viewport);
  const halfWidth = Math.min(MAP_WORLD.widthM / 2, visibleWidth / 2);
  const halfHeight = Math.min(MAP_WORLD.heightM / 2, visibleHeight / 2);

  return {
    ...viewport,
    x: Math.min(MAP_WORLD.widthM - halfWidth, Math.max(halfWidth, viewport.x)),
    y: Math.min(MAP_WORLD.heightM - halfHeight, Math.max(halfHeight, viewport.y)),
  };
}
