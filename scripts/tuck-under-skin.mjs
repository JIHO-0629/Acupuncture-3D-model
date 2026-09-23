/** Put back under the body surface every vertex that broke through it.
 *
 * With the surface shown together with the other layers, structures stand out of the
 * skin in patches: over the sternum, along the neck, down the thigh and the leg. They
 * are not misplaced. The atlas is simplified with a 0.2% error budget per mesh, and
 * where a structure is subcutaneous that budget is wider than the gap to the skin, so
 * the two surfaces cross.
 *
 * Inflating the rendered skin would cover it, but the ear and nail presentations sit on
 * the skin and would be buried, so the crossings are corrected in the geometry instead.
 * Which vertices are out is decided by visibility (scripts/skin-clearance.mjs), not by
 * the skin mesh's normals, which this mesh cannot supply reliably. Each one is moved
 * back along the mean of the directions it escapes through, as far as the first surface
 * that way plus a margin, the displacement is grown into a smooth skirt so the surface
 * does not crease, and normals are rebuilt from the moved faces.
 *
 * Usage: node scripts/tuck-under-skin.mjs [--check] [--only=<regex on mesh name>]
 *
 * Re-running is safe: once every vertex is enclosed, nothing moves.
 */
import fs from 'node:fs';
import zlib from 'node:zlib';
import * as T from 'three';
import { loadAtlas } from './atlas-geometry.mjs';
import { buildSurface, buildGate, OUTSIDE } from './skin-clearance.mjs';

const CLEARANCE = 0.0004, MAX_DEPTH = 0.05, SMOOTHING = 10;
const check = process.argv.includes('--check');
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7);
const selected = only ? new RegExp(only, 'i') : null;
const dir = new URL('../public/models/', import.meta.url);
const manifestPath = new URL('atlas.json', dir);
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const atlas = loadAtlas();
const surface = buildSurface(atlas);
const gate = buildGate(atlas);
const started = Date.now();
console.log('body surface: ' + surface.parts.map((p) => p.name).join(', '));

const point = new T.Vector3();
const buffers = new Map(), touched = new Set(), report = [];
let gated = 0, confirmed = 0;

for (const part of atlas.parts) {
  if (part.system === 'integumentary' || (selected && !selected.test(part.name))) continue;
  const required = new Float64Array(part.vertexCount);
  const outward = new Map();
  let count = 0, worst = 0;
  for (let i = 0; i < part.vertexCount; i++) {
    point.set(part.positions[i * 3], part.positions[i * 3 + 1], part.positions[i * 3 + 2]);
    if (!gate(point)) continue;
    if (!surface.mayBeOutside(point)) continue;
    gated++;
    const out = surface.outward(point);
    if (!out || out.escape < OUTSIDE) continue;
    // How far back the surface is along the way out, plus a margin to sit under it.
    const back = surface.reentry(point, out.direction, MAX_DEPTH);
    if (back === null) continue;
    const depth = back + CLEARANCE;
    confirmed++;
    required[i] = depth;
    outward.set(i, out.direction.clone());
    count++;
    if (depth > worst) worst = depth;
  }
  if (!count) continue;
  report.push([worst, count, part]);
  if (check) continue;

  const neighbours = Array.from({ length: part.vertexCount }, () => new Set());
  for (let t = 0; t < part.indexCount; t += 3) {
    const a = part.indices[t], b = part.indices[t + 1], c = part.indices[t + 2];
    neighbours[a].add(b); neighbours[a].add(c);
    neighbours[b].add(a); neighbours[b].add(c);
    neighbours[c].add(a); neighbours[c].add(b);
  }
  // Spread each correction over its neighbourhood, never below what a vertex needs.
  let field = Float64Array.from(required);
  for (let pass = 0; pass < SMOOTHING; pass++) {
    const next = new Float64Array(part.vertexCount);
    for (let i = 0; i < part.vertexCount; i++) {
      let sum = 0, n = 0;
      for (const j of neighbours[i]) { sum += field[j]; n++; }
      next[i] = Math.max(required[i], n ? (sum / n) * 0.8 : 0);
    }
    field = next;
  }
  // A vertex inside the skin has no escape direction of its own, so it follows the
  // nearest corrected neighbour's.
  const direction = new T.Vector3();
  for (let i = 0; i < part.vertexCount; i++) {
    if (field[i] <= 0) continue;
    let chosen = outward.get(i);
    if (!chosen) {
      direction.set(0, 0, 0);
      for (const j of neighbours[i]) {
        const near = outward.get(j);
        if (near) direction.add(near);
      }
      if (direction.lengthSq() < 1e-12) continue;
      chosen = direction.clone().normalize();
    }
    part.positions[i * 3] -= chosen.x * field[i];
    part.positions[i * 3 + 1] -= chosen.y * field[i];
    part.positions[i * 3 + 2] -= chosen.z * field[i];
  }

  const rebuilt = new Float64Array(part.vertexCount * 3);
  const a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3();
  const ab = new T.Vector3(), ac = new T.Vector3(), face = new T.Vector3();
  const at = (i, v) => v.set(part.positions[i * 3], part.positions[i * 3 + 1], part.positions[i * 3 + 2]);
  for (let t = 0; t < part.indexCount; t += 3) {
    const i0 = part.indices[t], i1 = part.indices[t + 1], i2 = part.indices[t + 2];
    at(i0, a); at(i1, b); at(i2, c);
    face.crossVectors(ab.subVectors(b, a), ac.subVectors(c, a));
    for (const i of [i0, i1, i2]) {
      rebuilt[i * 3] += face.x; rebuilt[i * 3 + 1] += face.y; rebuilt[i * 3 + 2] += face.z;
    }
  }
  let agree = 0;
  for (let i = 0; i < part.vertexCount; i += 17) {
    const dot = rebuilt[i * 3] * part.normals[i * 3]
      + rebuilt[i * 3 + 1] * part.normals[i * 3 + 1]
      + rebuilt[i * 3 + 2] * part.normals[i * 3 + 2];
    agree += dot > 0 ? 1 : -1;
  }
  const sign = agree >= 0 ? 1 : -1;
  for (let i = 0; i < part.vertexCount; i++) {
    const length = Math.hypot(rebuilt[i * 3], rebuilt[i * 3 + 1], rebuilt[i * 3 + 2]) || 1;
    for (let k = 0; k < 3; k++) {
      const value = Math.round((rebuilt[i * 3 + k] / length) * sign * 32767);
      part.normals[i * 3 + k] = Math.max(-32767, Math.min(32767, value));
    }
  }
  const low = [Infinity, Infinity, Infinity], high = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < part.positions.length; i++) {
    const axis = i % 3, value = part.positions[i];
    if (value < low[axis]) low[axis] = value;
    if (value > high[axis]) high[axis] = value;
  }
  manifest.parts[part.index].bounds = [low, high];
  buffers.set(part.chunk, part.positions.buffer);
  touched.add(part.chunk);
}

report.sort((x, y) => y[0] - x[0]);
for (const [worst, count, part] of report)
  console.log((worst * 1000).toFixed(1).padStart(6) + ' mm  ' + String(count).padStart(5) + '  ' + part.name + ' [' + part.system + ']');
console.log('\n' + confirmed + ' vertices outside the body surface across ' + report.length + ' structures'
  + ' (' + gated + ' reached the visibility test, ' + ((Date.now() - started) / 1000).toFixed(1) + 's)');

if (check || !confirmed) {
  console.log(check ? '(check only, nothing written)' : 'nothing to do');
  process.exitCode = check && confirmed ? 1 : 0;
} else {
  for (const index of touched) {
    const chunk = manifest.chunks[index];
    const data = Buffer.from(buffers.get(index));
    fs.writeFileSync(new URL(chunk.url.split('/').pop(), dir), data);
    if (chunk.gzip) {
      const packed = zlib.gzipSync(data, { level: 9 });
      fs.writeFileSync(new URL(chunk.gzip.split('/').pop(), dir), packed);
      chunk.gzipBytes = packed.length;
    }
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  console.log('rewrote ' + touched.size + ' chunks');
}
