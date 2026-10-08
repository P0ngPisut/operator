// Extracts a routable road network from the painted city map.
//
// Pipeline: classify pixels by colour -> build road mask -> thin to centerlines ->
// trace junctions/paths -> simplify polylines -> subdivide long edges -> emit JSON.
//
// Usage:
//   powershell -File scripts/dumpMapPixels.ps1 <map.jpg> <work>/map
//   node scripts/extractRoadNetwork.mjs <work>/map.rgb <work>/map.json src/data/map/roadNetwork.json [debug.rgb] [x0,y0,w,h]
//   powershell -File scripts/renderRgb.ps1 debug.rgb <w> <h> debug.png

import fs from 'node:fs';

const [rgbPath, metaPath, outPath, debugPath, cropArg] = process.argv.slice(2);
if (!rgbPath || !metaPath || !outPath) {
  console.error('usage: node scripts/extractRoadNetwork.mjs <pixels.rgb> <meta.json> <out.json> [debug.rgb] [x0,y0,w,h]');
  process.exit(1);
}

const WORLD_WIDTH_M = 10000;
const NODE_SPACING_M = 60;
const SPUR_MIN_PX = 14;
const SIMPLIFY_TOLERANCE_PX = 1.4;
const ARTERIAL_MIN_WIDTH_PX = 5.5;

const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
const { width: W, height: H } = meta;
const pixels = fs.readFileSync(rgbPath);
const metersPerPixel = WORLD_WIDTH_M / W;
const WORLD_HEIGHT_M = Math.round(H * metersPerPixel / 10) * 10;

// ---------- 1. pixel classification ----------
const CLASS = { NONE: 0, ROAD: 1, HIGHWAY: 2, WATER: 3, GREEN: 4 };
function classify(r, g, b) {
  if (g > 180 && b > 180 && r < 100 && g - r > 100) return CLASS.HIGHWAY;
  if (r + g + b > 290 && g >= 100 && b >= r + 30 && g >= r + 15) return CLASS.ROAD;
  if (r <= 50 && g >= 50 && g - r >= 24 && b - g >= 22 && b >= 80) return CLASS.WATER;
  if (g >= 52 && g > r + 14 && g >= b) return CLASS.GREEN;
  return CLASS.NONE;
}
const classes = new Uint8Array(W * H);
for (let i = 0, p = 0; i < W * H; i += 1, p += 3) classes[i] = classify(pixels[p + 2], pixels[p + 1], pixels[p]);

// ---------- 2. morphology helpers (separable square kernels) ----------
function dilate(mask, radius) {
  const tmp = new Uint8Array(W * H);
  const out = new Uint8Array(W * H);
  for (let y = 0; y < H; y += 1) {
    const row = y * W;
    for (let x = 0; x < W; x += 1) {
      let v = 0;
      for (let k = Math.max(0, x - radius); k <= Math.min(W - 1, x + radius) && !v; k += 1) v = mask[row + k];
      tmp[row + x] = v;
    }
  }
  for (let x = 0; x < W; x += 1) {
    for (let y = 0; y < H; y += 1) {
      let v = 0;
      for (let k = Math.max(0, y - radius); k <= Math.min(H - 1, y + radius) && !v; k += 1) v = tmp[k * W + x];
      out[y * W + x] = v;
    }
  }
  return out;
}
function erode(mask, radius) {
  const inverted = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i += 1) inverted[i] = mask[i] ? 0 : 1;
  const grown = dilate(inverted, radius);
  const out = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i += 1) out[i] = grown[i] ? 0 : 1;
  return out;
}
const close = (mask, radius) => erode(dilate(mask, radius), radius);
const open = (mask, radius) => dilate(erode(mask, radius), radius);
const fromClass = (cls) => { const m = new Uint8Array(W * H); for (let i = 0; i < W * H; i += 1) m[i] = classes[i] === cls ? 1 : 0; return m; };

function removeSmallComponents(mask, minSize) {
  const seen = new Uint8Array(W * H);
  const stack = [];
  for (let start = 0; start < W * H; start += 1) {
    if (!mask[start] || seen[start]) continue;
    const component = [];
    stack.push(start); seen[start] = 1;
    while (stack.length) {
      const i = stack.pop(); component.push(i);
      const x = i % W; const y = (i - x) / W;
      for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) {
        const nx = x + dx; const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx;
        if (mask[j] && !seen[j]) { seen[j] = 1; stack.push(j); }
      }
    }
    if (component.length < minSize) for (const i of component) mask[i] = 0;
  }
}

// ---------- 3. road / water masks ----------
const highwayMask = close(fromClass(CLASS.HIGHWAY), 4);
const waterMask = open(fromClass(CLASS.WATER), 3);
const waterBand = dilate(waterMask, 7);
const waterFilled = close(waterMask, 7); // river with bridge gaps filled in
const roadMask = new Uint8Array(W * H);
for (let i = 0; i < W * H; i += 1) {
  const dimRoad = classes[i] === CLASS.WATER && !waterBand[i];
  roadMask[i] = classes[i] === CLASS.ROAD || highwayMask[i] || dimRoad ? 1 : 0;
}
const closedRoads = close(roadMask, 1);
removeSmallComponents(closedRoads, 40);
const roadSolid = closedRoads; // used for width measurement

// ---------- 4. Zhang-Suen thinning ----------
const skeleton = new Uint8Array(closedRoads);
for (let x = 0; x < W; x += 1) { skeleton[x] = 0; skeleton[(H - 1) * W + x] = 0; }
for (let y = 0; y < H; y += 1) { skeleton[y * W] = 0; skeleton[y * W + W - 1] = 0; }
{
  const toDelete = [];
  let changed = true;
  let iterations = 0;
  while (changed) {
    changed = false;
    iterations += 1;
    for (let step = 0; step < 2; step += 1) {
      toDelete.length = 0;
      for (let y = 1; y < H - 1; y += 1) {
        for (let x = 1; x < W - 1; x += 1) {
          const i = y * W + x;
          if (!skeleton[i]) continue;
          const p2 = skeleton[i - W]; const p3 = skeleton[i - W + 1]; const p4 = skeleton[i + 1]; const p5 = skeleton[i + W + 1];
          const p6 = skeleton[i + W]; const p7 = skeleton[i + W - 1]; const p8 = skeleton[i - 1]; const p9 = skeleton[i - W - 1];
          const b = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
          if (b < 2 || b > 6) continue;
          let a = 0;
          if (!p2 && p3) a += 1; if (!p3 && p4) a += 1; if (!p4 && p5) a += 1; if (!p5 && p6) a += 1;
          if (!p6 && p7) a += 1; if (!p7 && p8) a += 1; if (!p8 && p9) a += 1; if (!p9 && p2) a += 1;
          if (a !== 1) continue;
          if (step === 0 ? (p2 * p4 * p6 !== 0 || p4 * p6 * p8 !== 0) : (p2 * p4 * p8 !== 0 || p2 * p6 * p8 !== 0)) continue;
          toDelete.push(i);
        }
      }
      for (const i of toDelete) skeleton[i] = 0;
      if (toDelete.length) changed = true;
    }
  }
  console.log(`thinning: ${iterations} iterations`);
}

const NEIGHBOR_OFFSETS = [-W - 1, -W, -W + 1, -1, 1, W - 1, W, W + 1];
const neighborCount = (i) => { let n = 0; for (const o of NEIGHBOR_OFFSETS) n += skeleton[i + o]; return n; };

// ---------- 5. spur pruning ----------
for (let pass = 0; pass < 3; pass += 1) {
  let pruned = 0;
  for (let i = W; i < W * (H - 1); i += 1) {
    if (!skeleton[i] || neighborCount(i) !== 1) continue;
    const path = [i];
    let prev = -1; let cur = i; let reachedJunction = false;
    while (path.length <= SPUR_MIN_PX) {
      let next = -1;
      for (const o of NEIGHBOR_OFFSETS) { const j = cur + o; if (skeleton[j] && j !== prev && !path.includes(j)) { next = j; break; } }
      if (next < 0) break;
      if (neighborCount(next) >= 3) { reachedJunction = true; break; }
      path.push(next); prev = cur; cur = next;
    }
    if (reachedJunction && path.length <= SPUR_MIN_PX) { for (const j of path) skeleton[j] = 0; pruned += 1; }
  }
  console.log(`spur pass ${pass + 1}: removed ${pruned}`);
}
removeSmallComponents(skeleton, 20);

// ---------- 6. junction clustering and path tracing ----------
const nodeOf = new Int32Array(W * H).fill(-1);
const nodePixels = [];
for (let i = W; i < W * (H - 1); i += 1) {
  if (!skeleton[i] || nodeOf[i] !== -1) continue;
  const n = neighborCount(i);
  if (n === 2) continue;
  const cluster = [i]; nodeOf[i] = nodePixels.length;
  if (n >= 3) {
    const stack = [i];
    while (stack.length) {
      const c = stack.pop();
      for (const o of NEIGHBOR_OFFSETS) {
        const j = c + o;
        if (skeleton[j] && nodeOf[j] === -1 && neighborCount(j) >= 3) { nodeOf[j] = nodePixels.length; cluster.push(j); stack.push(j); }
      }
    }
  }
  nodePixels.push(cluster);
}
const nodes = nodePixels.map((cluster) => {
  let sx = 0; let sy = 0;
  for (const i of cluster) { sx += i % W; sy += Math.floor(i / W); }
  return { x: sx / cluster.length, y: sy / cluster.length, edges: [] };
});

const visited = new Uint8Array(W * H);
const rawEdges = [];
for (let nodeIndex = 0; nodeIndex < nodePixels.length; nodeIndex += 1) {
  for (const startPixel of nodePixels[nodeIndex]) {
    for (const o of NEIGHBOR_OFFSETS) {
      const first = startPixel + o;
      if (!skeleton[first] || nodeOf[first] !== -1 || visited[first]) continue;
      const path = [startPixel, first];
      visited[first] = 1;
      let cur = first; let endNode = -1;
      while (endNode === -1) {
        let next = -1;
        for (const o2 of NEIGHBOR_OFFSETS) {
          const j = cur + o2;
          if (!skeleton[j]) continue;
          if (nodeOf[j] !== -1 && (nodeOf[j] !== nodeIndex || path.length > 3)) { endNode = nodeOf[j]; path.push(j); break; }
          if (nodeOf[j] === -1 && !visited[j]) next = j;
        }
        if (endNode !== -1) break;
        if (next < 0) { // dangling path: create an endpoint node here
          nodeOf[cur] = nodes.length; nodePixels.push([cur]); nodes.push({ x: cur % W, y: Math.floor(cur / W), edges: [] }); endNode = nodes.length - 1; break;
        }
        visited[next] = 1; path.push(next); cur = next;
      }
      if (endNode === nodeIndex && path.length < 6) continue; // tiny self loop
      rawEdges.push({ a: nodeIndex, b: endNode, points: path.map((i) => ({ x: i % W, y: Math.floor(i / W) })) });
    }
  }
}
console.log(`skeleton graph: ${nodes.length} nodes, ${rawEdges.length} edges`);

// ---------- 7. contract degree-2 nodes, then simplify ----------
for (const edge of rawEdges) { nodes[edge.a].edges.push(edge); nodes[edge.b].edges.push(edge); }
const removedEdges = new Set();
for (let n = 0; n < nodes.length; n += 1) {
  const live = nodes[n].edges.filter((e) => !removedEdges.has(e));
  if (live.length !== 2 || live[0] === live[1]) continue;
  const [e1, e2] = live;
  if (e1.a === e1.b || e2.a === e2.b) continue;
  const p1 = e1.a === n ? [...e1.points].reverse() : e1.points; // ends at n
  const p2 = e2.a === n ? e2.points : [...e2.points].reverse(); // starts at n
  const a = e1.a === n ? e1.b : e1.a;
  const b = e2.a === n ? e2.b : e2.a;
  const merged = { a, b, points: [...p1, ...p2.slice(1)] };
  removedEdges.add(e1); removedEdges.add(e2);
  nodes[a].edges = nodes[a].edges.filter((e) => e !== e1 && e !== e2); nodes[a].edges.push(merged);
  nodes[b].edges = nodes[b].edges.filter((e) => e !== e1 && e !== e2); nodes[b].edges.push(merged);
  nodes[n].edges = [];
}
let edges = [];
for (const node of nodes) for (const e of node.edges) if (!edges.includes(e)) edges.push(e);

function simplify(points, tolerance) {
  if (points.length < 3) return points;
  const first = points[0]; const last = points.at(-1);
  let maxDist = 0; let index = 0;
  const dx = last.x - first.x; const dy = last.y - first.y; const len = Math.hypot(dx, dy) || 1;
  for (let i = 1; i < points.length - 1; i += 1) {
    const d = len ? Math.abs(dy * points[i].x - dx * points[i].y + last.x * first.y - last.y * first.x) / len : Math.hypot(points[i].x - first.x, points[i].y - first.y);
    if (d > maxDist) { maxDist = d; index = i; }
  }
  if (maxDist <= tolerance) return [first, last];
  return [...simplify(points.slice(0, index + 1), tolerance).slice(0, -1), ...simplify(points.slice(index), tolerance)];
}
for (const edge of edges) {
  const pts = edge.points.map((p) => ({ ...p }));
  pts[0] = { x: nodes[edge.a].x, y: nodes[edge.a].y };
  pts[pts.length - 1] = { x: nodes[edge.b].x, y: nodes[edge.b].y };
  edge.points = simplify(pts, SIMPLIFY_TOLERANCE_PX);
}

// ---------- 8. attributes: type, width, bridge ----------
function localHalfWidth(x, y) {
  for (let r = 1; r <= 14; r += 1) {
    for (let dy = -r; dy <= r; dy += 1) for (let dx = -r; dx <= r; dx += 1) {
      if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
      const nx = x + dx; const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || !roadSolid[ny * W + nx]) return r;
    }
  }
  return 15;
}
function samplePolyline(points, stepPx) {
  const samples = [];
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1]; const b = points[i];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.round(len / stepPx));
    for (let s = 0; s < steps; s += 1) { const t = s / steps; samples.push({ x: Math.round(a.x + (b.x - a.x) * t), y: Math.round(a.y + (b.y - a.y) * t) }); }
  }
  samples.push({ x: Math.round(points.at(-1).x), y: Math.round(points.at(-1).y) });
  return samples;
}
const nearWater = (x, y) => waterFilled[y * W + x] === 1;
const widthHistogram = new Map();
for (const edge of edges) {
  const samples = samplePolyline(edge.points, 3);
  let highwayHits = 0; let waterHits = 0; const widths = [];
  for (const s of samples) {
    if (highwayMask[s.y * W + s.x]) highwayHits += 1;
    if (nearWater(s.x, s.y)) waterHits += 1;
    widths.push(localHalfWidth(s.x, s.y) * 2 - 1);
  }
  widths.sort((p, q) => p - q);
  const medianWidth = widths[Math.floor(widths.length / 2)];
  widthHistogram.set(medianWidth, (widthHistogram.get(medianWidth) || 0) + 1);
  edge.type = highwayHits / samples.length > 0.5 ? 'highway' : medianWidth >= ARTERIAL_MIN_WIDTH_PX ? 'arterial' : 'local';
  edge.isBridge = waterHits >= 2;
  edge.widthPx = medianWidth;
}
console.log('median width histogram:', [...widthHistogram.entries()].sort((p, q) => p[0] - q[0]).map(([w, c]) => `${w}px:${c}`).join(' '));

// ---------- 9. subdivide long edges, convert to world metres ----------
const toWorld = (p) => ({ x: Math.round(Math.min(WORLD_WIDTH_M, p.x * metersPerPixel)), y: Math.round(Math.min(WORLD_HEIGHT_M, p.y * metersPerPixel)) });
const worldNodes = nodes.map(toWorld);
const worldEdges = [];
for (const edge of edges) {
  const pts = edge.points.map(toWorld);
  const cumulative = [0];
  for (let i = 1; i < pts.length; i += 1) cumulative.push(cumulative[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = cumulative.at(-1);
  const pieces = Math.max(1, Math.round(total / NODE_SPACING_M));
  let fromNode = edge.a;
  let segmentPoints = [pts[0]];
  let pieceIndex = 1;
  for (let i = 1; i < pts.length; i += 1) {
    while (pieceIndex < pieces && cumulative[i] >= (total * pieceIndex) / pieces) {
      const target = (total * pieceIndex) / pieces;
      const t = (target - cumulative[i - 1]) / Math.max(1e-9, cumulative[i] - cumulative[i - 1]);
      const cut = { x: Math.round(pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t), y: Math.round(pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t) };
      const cutNode = worldNodes.length; worldNodes.push(cut);
      segmentPoints.push(cut);
      worldEdges.push({ a: fromNode, b: cutNode, type: edge.type, isBridge: edge.isBridge, points: segmentPoints });
      fromNode = cutNode; segmentPoints = [cut]; pieceIndex += 1;
    }
    segmentPoints.push(pts[i]);
  }
  worldEdges.push({ a: fromNode, b: edge.b, type: edge.type, isBridge: edge.isBridge, points: segmentPoints });
}

// ---------- 10. keep the largest connected component ----------
const adjacency = worldNodes.map(() => []);
worldEdges.forEach((e, i) => { adjacency[e.a].push(i); adjacency[e.b].push(i); });
const component = new Int32Array(worldNodes.length).fill(-1);
const componentSizes = [];
for (let start = 0; start < worldNodes.length; start += 1) {
  if (component[start] !== -1) continue;
  const id = componentSizes.length; let size = 0; const stack = [start]; component[start] = id;
  while (stack.length) {
    const n = stack.pop(); size += 1;
    for (const ei of adjacency[n]) { const e = worldEdges[ei]; const m = e.a === n ? e.b : e.a; if (component[m] === -1) { component[m] = id; stack.push(m); } }
  }
  componentSizes.push(size);
}
const mainComponent = componentSizes.indexOf(Math.max(...componentSizes));
console.log(`components: ${componentSizes.length}, largest ${componentSizes[mainComponent]} of ${worldNodes.length} nodes; top sizes ${[...componentSizes].sort((p, q) => q - p).slice(0, 12).join(' ')}`);
const strayEdges = worldEdges.filter((e) => component[e.a] !== mainComponent);
const remap = new Int32Array(worldNodes.length).fill(-1);
const finalNodes = [];
worldNodes.forEach((n, i) => { if (component[i] === mainComponent) { remap[i] = finalNodes.length; finalNodes.push([n.x, n.y]); } });
const TYPE_CODE = { local: 0, arterial: 1, highway: 2 };
const finalEdges = worldEdges
  .filter((e) => remap[e.a] !== -1 && remap[e.b] !== -1 && remap[e.a] !== remap[e.b])
  .map((e) => [remap[e.a], remap[e.b], TYPE_CODE[e.type], e.isBridge ? 1 : 0, e.points.slice(1, -1).flatMap((p) => [p.x, p.y])]);

const typeCounts = finalEdges.reduce((acc, e) => { acc[e[2]] = (acc[e[2]] || 0) + 1; return acc; }, {});
console.log(`final: ${finalNodes.length} nodes, ${finalEdges.length} edges (local ${typeCounts[0] || 0}, arterial ${typeCounts[1] || 0}, highway ${typeCounts[2] || 0}, bridges ${finalEdges.filter((e) => e[3]).length})`);

const output = {
  source: 'nightwatch-city-map.jpg',
  imageWidthPx: W,
  imageHeightPx: H,
  widthM: WORLD_WIDTH_M,
  heightM: WORLD_HEIGHT_M,
  nodeSpacingM: NODE_SPACING_M,
  nodes: finalNodes,
  edges: finalEdges,
};
const serialized = JSON.stringify(output);
fs.writeFileSync(outPath, outPath.endsWith('.js')
  ? `// Generated by scripts/extractRoadNetwork.mjs from ${output.source}. Do not edit by hand.\nexport default ${serialized};\n`
  : `${serialized}\n`);
console.log(`wrote ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(0)} KB), world ${WORLD_WIDTH_M} x ${WORLD_HEIGHT_M} m`);

// ---------- 11. optional debug render ----------
function renderDebug(path, crop) {
  const [cx0, cy0, cw, ch] = crop || [0, 0, W, H];
  const scale = crop ? 1 : 0.5;
  const ow = Math.round(cw * scale); const oh = Math.round(ch * scale);
  const out = Buffer.alloc(ow * oh * 3);
  for (let y = 0; y < oh; y += 1) for (let x = 0; x < ow; x += 1) {
    const sx = Math.min(W - 1, cx0 + Math.floor(x / scale)); const sy = Math.min(H - 1, cy0 + Math.floor(y / scale));
    const p = (sy * W + sx) * 3; const o = (y * ow + x) * 3;
    out[o] = pixels[p] * 0.45; out[o + 1] = pixels[p + 1] * 0.45; out[o + 2] = pixels[p + 2] * 0.45;
  }
  const plot = (x, y, r, g, b) => {
    const px = Math.round((x / metersPerPixel - cx0) * scale); const py = Math.round((y / metersPerPixel - cy0) * scale);
    if (px < 0 || py < 0 || px >= ow || py >= oh) return;
    const o = (py * ow + px) * 3; out[o] = b; out[o + 1] = g; out[o + 2] = r;
  };
  const drawLine = (p, q, color) => {
    const steps = Math.max(1, Math.ceil(Math.hypot(q.x - p.x, q.y - p.y) / (metersPerPixel / scale)));
    for (let s = 0; s <= steps; s += 1) plot(p.x + (q.x - p.x) * s / steps, p.y + (q.y - p.y) * s / steps, ...color);
  };
  const colors = [[255, 170, 60], [255, 255, 255], [0, 255, 255]];
  for (const e of strayEdges) for (let i = 1; i < e.points.length; i += 1) drawLine(e.points[i - 1], e.points[i], [255, 0, 255]);
  for (const [a, b, type, bridge, ctrl] of finalEdges) {
    const pts = [{ x: finalNodes[a][0], y: finalNodes[a][1] }];
    for (let i = 0; i < ctrl.length; i += 2) pts.push({ x: ctrl[i], y: ctrl[i + 1] });
    pts.push({ x: finalNodes[b][0], y: finalNodes[b][1] });
    for (let i = 1; i < pts.length; i += 1) drawLine(pts[i - 1], pts[i], bridge ? [255, 60, 60] : colors[type]);
  }
  for (const [x, y] of finalNodes) plot(x, y, 0, 255, 0);
  fs.writeFileSync(path, out);
  console.log(`debug render ${ow} x ${oh} -> ${path}`);
}
if (debugPath) {
  const crops = cropArg ? cropArg.split(';').map((c) => c.split(',').map(Number)) : [null];
  crops.forEach((crop, index) => renderDebug(crops.length > 1 ? debugPath.replace(/\.rgb$/, `-${index}.rgb`) : debugPath, crop));
}
