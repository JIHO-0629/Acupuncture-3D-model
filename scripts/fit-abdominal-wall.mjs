/** Register the anterior abdominal wall so a needle meets its layers in anatomical order.
 *
 * The wall is assembled from two BodyParts3D releases. Skin, external oblique and the
 * linea alba are 4.0; rectus abdominis, internal oblique and transversus abdominis
 * came back from 3.0 (scripts/add-bp3-structures.mjs, restore-bp3-trunk-wall.mjs).
 * Measured along straight anterior rays, the two sets do not agree:
 *
 *  - the rectus lies behind the linea alba instead of flush with it: its front is
 *    10 mm deeper above the umbilicus and 12-16 mm deeper below it, where it reaches
 *    41 mm under the skin at KI11/KI12 while the linea alba beside it starts at 26 mm;
 *  - the aponeuroses of the obliques that form the rectus sheath float in the fat,
 *    1-15 mm under the skin and 10-25 mm in front of the muscle they should wrap;
 *  - the linea alba is 10-13 mm thick (a real one is 1-3 mm);
 *  - small bowel, transverse colon and liver reach in front of the wall's inner
 *    surface, so an abdominal needle met ileum before rectus at KI14 and transverse
 *    colon before rectus at KI17.
 *
 * Neither release is the reference here. The rectus and the linea alba are brought
 * to meet halfway at each height, which keeps the skin-to-organ depth at CV12 close to
 * the one ultrasound series we hold (Chu 2022, 25.3 +/- 10.2 mm). The linea alba is
 * thinned to 2.5 mm behind its front. Each oblique/transversus sheet that lies over the
 * rectus is laid onto it as the sheath - anterior laminae in front, posterior laminae
 * behind, in the order external, internal, transversus - keeping at most 0.8 mm of
 * its thickness; the lateral muscle bellies follow through a smooth skirt. Finally
 * every visceral vertex in front of the wall's inner surface is pressed 2 mm behind it.
 *
 * Usage: node scripts/fit-abdominal-wall.mjs [--check]
 * Re-running converges: once the layers agree, nothing moves.
 */
import fs from 'node:fs';
import * as T from 'three';
import { loadAtlas, threeMesh } from './atlas-geometry.mjs';
import { chunkWriter, grid, manifestPath, skirt } from './mesh-edit.mjs';

const check = process.argv.includes('--check');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const atlas = loadAtlas();
const writer = chunkWriter(manifest);
const named = (name) => { const p = atlas.parts.find((q) => q.name === name); if (!p) throw new Error(`missing ${name}`); return p; };
const LA = named('Linea alba');
const SIDES = ['Right', 'Left'].map((side) => ({
  side, sign: side === 'Right' ? -1 : 1,
  RA: named(`${side} rectus abdominis`),
  sheets: [[named(`${side} external oblique`), 0], [named(`${side} internal oblique`), 1], [named(`${side} transversus abdominis`), 2]],
}));
const BIN = 0.002, LA_THICKNESS = 0.0025, SHEET_MAX = 0.0008, VISCERA_CLEARANCE = 0.002;
const raycaster = new T.Raycaster();
const objects = new Map();
const object = (part) => { let o = objects.get(part); if (!o) { o = threeMesh(part); objects.set(part, o); } return o; };
/** Entry/exit z pairs of `part` on the anterior ray through (x, y), front first. */
const sheetsAt = (part, x, y) => {
  raycaster.set(new T.Vector3(x, y, 0.4), new T.Vector3(0, 0, -1)); raycaster.far = 0.6;
  const z = raycaster.intersectObject(object(part), false).map((h) => h.point.z).sort((a, b) => b - a);
  const out = [];
  for (let i = 0; i + 1 < z.length; i += 2) out.push([z[i], z[i + 1]]);
  return out;
};
const reset = (part) => objects.delete(part);
const report = [];

// ---------------------------------------------------------------- 1. rectus and linea alba meet halfway
const bins = new Map();
const binOf = (y) => Math.round(y / BIN);
const laFront = new Map();
for (let i = 0; i < LA.vertexCount; i++) {
  const b = binOf(LA.positions[i * 3 + 1]), z = LA.positions[i * 3 + 2];
  if (!(laFront.get(b) >= z)) laFront.set(b, z);
}
const smoothAlong = (map, radius) => {
  const out = new Map();
  for (const b of map.keys()) {
    let sum = 0, n = 0;
    for (let k = -radius; k <= radius; k++) if (map.has(b + k)) { sum += map.get(b + k); n++; }
    out.set(b, sum / n);
  }
  return out;
};
const laF = smoothAlong(laFront, 3);
const meet = new Map(); // per side: bin -> z shift of the rectus
for (const S of SIDES) {
  const { RA } = S;
  const medialEdge = new Map(), front = new Map();
  for (let i = 0; i < RA.vertexCount; i++) {
    const b = binOf(RA.positions[i * 3 + 1]), ax = Math.abs(RA.positions[i * 3]);
    if (!(medialEdge.get(b) <= ax)) medialEdge.set(b, ax);
  }
  for (let i = 0; i < RA.vertexCount; i++) {
    const b = binOf(RA.positions[i * 3 + 1]), ax = Math.abs(RA.positions[i * 3]), z = RA.positions[i * 3 + 2];
    if (ax > medialEdge.get(b) + 0.012) continue;
    if (!(front.get(b) >= z)) front.set(b, z);
  }
  const raF = smoothAlong(front, 3);
  const [yLow, yHigh] = [RA.box.min.y, RA.box.max.y];
  const shift = new Map();
  for (const [b, zRA] of raF) {
    if (!laF.has(b)) continue;
    const target = (laF.get(b) + zRA) / 2;
    // Taper to the bony attachments: pubic crest below, costal cartilages above.
    const y = b * BIN, taper = Math.min(1, Math.max(0, (y - yLow) / 0.02), Math.max(0, (yHigh - y) / 0.04));
    shift.set(b, (target - zRA) * taper);
  }
  const smooth = smoothAlong(shift, 6);
  meet.set(S.side, { shift: smooth, target: (b) => (laF.get(b) + raF.get(b)) / 2 });
  const values = [...smooth.values()];
  report.push(`${S.side} rectus: moved ${(Math.min(...values) * 1000).toFixed(1)} to ${(Math.max(...values) * 1000).toFixed(1)} mm along z`);
  if (!check) {
    const sample = (y) => { const b = y / BIN, lo = Math.floor(b), hi = lo + 1; const a = smooth.get(lo), c = smooth.get(hi);
      if (a === undefined && c === undefined) return 0; if (a === undefined) return c; if (c === undefined) return a; return a + (c - a) * (b - lo); };
    for (let i = 0; i < RA.vertexCount; i++) RA.positions[i * 3 + 2] += sample(RA.positions[i * 3 + 1]);
    writer.mark(RA); reset(RA);
  }
}

// The linea alba keeps its front on the meeting surface and is thinned behind it.
{
  const meetFront = new Map();
  for (const b of laF.keys()) {
    const r = meet.get('Right'), l = meet.get('Left');
    const vals = [r, l].map((m) => (m.shift.has(b) ? m.target(b) : undefined)).filter((v) => v !== undefined && !Number.isNaN(v));
    meetFront.set(b, vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : laF.get(b));
  }
  const front = smoothAlong(meetFront, 4);
  const back = new Map();
  for (let i = 0; i < LA.vertexCount; i++) {
    const b = binOf(LA.positions[i * 3 + 1]), z = LA.positions[i * 3 + 2];
    if (!(back.get(b) <= z)) back.set(b, z);
  }
  let worst = 0;
  for (let i = 0; i < LA.vertexCount; i++) {
    const b = binOf(LA.positions[i * 3 + 1]), z = LA.positions[i * 3 + 2];
    const f0 = laF.get(b), b0 = back.get(b);
    const t = f0 - b0 > 1e-6 ? Math.min(1, Math.max(0, (f0 - z) / (f0 - b0))) : 0;
    const next = front.get(b) - t * LA_THICKNESS;
    worst = Math.max(worst, Math.abs(next - z));
    if (!check) LA.positions[i * 3 + 2] = next;
  }
  report.push(`linea alba: thinned to ${LA_THICKNESS * 1000} mm, largest move ${(worst * 1000).toFixed(1)} mm`);
  if (!check) { writer.mark(LA); reset(LA); }
}

// ---------------------------------------------------------------- 2. oblique aponeuroses become the rectus sheath
const STEP = 0.003;
for (const S of SIDES) {
  const { RA, sign } = S;
  // Rectus front/back on a grid of anterior rays (after the move above).
  const front = grid({ x0: -0.1, x1: 0.1, y0: 0.82, y1: 1.3, step: STEP }), back = grid({ x0: -0.1, x1: 0.1, y0: 0.82, y1: 1.3, step: STEP });
  for (let j = 0; j < front.ny; j++) for (let i = 0; i < front.nx; i++) {
    const x = front.x(i), y = front.y(j);
    if (Math.sign(x) !== sign || y < RA.box.min.y || y > RA.box.max.y) continue;
    const s = sheetsAt(RA, x, y);
    if (!s.length) continue;
    front.put(x, y, s[0][0]); back.put(x, y, s[s.length - 1][1]);
  }
  for (const [part, order] of S.sheets) {
    const required = new Float64Array(part.vertexCount), fixed = new Uint8Array(part.vertexCount);
    // Per-cell sheet intervals of this mesh, so a vertex maps onto its own lamina.
    const cellSheets = new Map();
    const sheetsFor = (x, y) => {
      const i = Math.round((x + 0.1) / STEP), j = Math.round((y - 0.82) / STEP), key = j * 1000 + i;
      if (!cellSheets.has(key)) cellSheets.set(key, sheetsAt(part, -0.1 + i * STEP, 0.82 + j * STEP));
      return cellSheets.get(key);
    };
    let count = 0, worst = 0;
    for (let v = 0; v < part.vertexCount; v++) {
      const x = part.positions[v * 3], y = part.positions[v * 3 + 1], z = part.positions[v * 3 + 2];
      const f = front.at(x, y), b = back.at(x, y);
      if (Number.isNaN(f) || Number.isNaN(b)) continue;
      const lamina = sheetsFor(x, y).find(([zf, zb]) => z <= zf + 0.0015 && z >= zb - 0.0015);
      if (!lamina) continue;
      const [zf, zb] = lamina, centre = (zf + zb) / 2, thickness = zf - zb;
      // Only laminae of the anterior wall: the same sheets wrap round the flank to the back.
      if (centre > f + 0.03 || centre < b - 0.012) continue;
      const anterior = centre > (f + b) / 2;
      // Anterior laminae stack outward from the rectus front: transversus, internal, external.
      const targetCentre = anterior ? f + 0.0004 + (2 - order) * 0.0007 + SHEET_MAX / 2 : b - 0.0004 - (order - 1) * 0.0007 - SHEET_MAX / 2;
      const scale = thickness > SHEET_MAX ? SHEET_MAX / thickness : 1;
      const next = targetCentre + (z - centre) * scale;
      required[v] = next - z; fixed[v] = 1; count++;
      worst = Math.max(worst, Math.abs(next - z));
    }
    report.push(`${part.name}: ${count} vertices laid on the rectus sheath, largest move ${(worst * 1000).toFixed(1)} mm`);
    if (check || !count) continue;
    const field = skirt(part, required, fixed, 14, 0.88);
    for (let v = 0; v < part.vertexCount; v++) part.positions[v * 3 + 2] += field[v];
    writer.mark(part); reset(part);
  }
}

// ---------------------------------------------------------------- 3. viscera stay behind the wall
{
  // The inner surface is taken only where the rectus or the linea alba is present: the
  // back of the rectus (or of the linea alba), extended by any posterior lamina lying on it.
  // At the flank an anterior ray runs along the oblique muscles and would report the back.
  const inner = grid({ x0: -0.1, x1: 0.1, y0: 0.84, y1: 1.26, step: STEP });
  for (let j = 0; j < inner.ny; j++) for (let i = 0; i < inner.nx; i++) {
    const x = inner.x(i), y = inner.y(j);
    const S = SIDES.find((side) => Math.sign(x) === side.sign);
    const core = [...sheetsAt(LA, x, y), ...(S ? sheetsAt(S.RA, x, y) : [])];
    if (!core.length) continue;
    let limit = Math.min(...core.map(([, zb]) => zb));
    for (const [part] of S ? S.sheets : []) for (const [zf, zb] of sheetsAt(part, x, y)) if (zf <= limit + 0.001 && zf > limit - 0.008) limit = Math.min(limit, zb);
    inner.put(x, y, limit, Math.min);
  }
  const viscera = atlas.parts.filter((p) => (p.system === 'digestive' || /^Hepatovenous segment/i.test(p.name))
    && p.box.max.z > 0 && p.box.max.y > 0.84 && p.box.min.y < 1.26);
  for (const part of viscera) {
    const required = new Float64Array(part.vertexCount), fixed = new Uint8Array(part.vertexCount);
    let count = 0, worst = 0;
    for (let v = 0; v < part.vertexCount; v++) {
      const x = part.positions[v * 3], y = part.positions[v * 3 + 1], z = part.positions[v * 3 + 2];
      const limit = inner.sample(x, y);
      if (Number.isNaN(limit) || z < 0) continue;
      const excess = z - (limit - VISCERA_CLEARANCE);
      if (excess <= 0) continue;
      required[v] = -excess; fixed[v] = 1; count++; worst = Math.max(worst, excess);
    }
    if (!count) continue;
    report.push(`${part.name}: ${count} vertices in front of the wall, deepest ${(worst * 1000).toFixed(1)} mm`);
    if (check) continue;
    const field = skirt(part, required, fixed, 16, 0.9);
    for (let v = 0; v < part.vertexCount; v++) part.positions[v * 3 + 2] += Math.min(0, field[v]);
    writer.mark(part);
  }
}

console.log(report.join('\n'));
if (check) console.log('\n(check only, nothing written)');
else { writer.write(); console.log(`\nrewrote ${writer.count} chunks`); }
