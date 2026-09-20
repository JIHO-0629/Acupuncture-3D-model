/** Press the lung surfaces back inside this body's chest wall.
 *
 * The lung lobes come from BodyParts3D 3.0; the rib cage is 4.0. The axis transform
 * puts 3.0 structures on the 4.0 skeleton to within a millimetre - quadratus lumborum
 * lands 0.6 mm from the twelfth rib - but a lung is soft tissue reconstructed
 * differently between the two releases, and on this cage it does not fit. Measured
 * against an envelope of the wall's outer surface, the apex of each upper lobe stands
 * 26 mm proud of the cage, the middle lobe 8 mm, and the lower lobes 3-5 mm. Drawn
 * translucent, that reads as lung spilling over the clavicles and through the ribs.
 *
 * The wall's outer surface is sampled as a radius per (azimuth, height) sector. Ribs
 * leave gaps, so a sector's missing heights are interpolated from the heights that do
 * carry bone: the envelope is the cage as a solid shell, which is what the lung has to
 * stay inside.
 *
 * Vertices beyond the envelope are moved radially in. A bare projection would crease
 * the surface, so the displacement is grown into a smooth skirt first: each vertex
 * takes the larger of its own requirement and its neighbours' average, repeatedly.
 * Normals are rebuilt from the moved faces.
 *
 * Usage: node scripts/fit-lungs-to-chest-wall.mjs [--check]
 *
 * Re-running is safe: once every vertex is inside the envelope, nothing moves.
 */
import fs from 'node:fs';
import zlib from 'node:zlib';
import * as T from 'three';
import { loadAtlas } from './atlas-geometry.mjs';

const CLEARANCE = 0.0015;
const SECTOR = Math.PI / 36, BAND = 0.005;
const AXIS_X = 0, AXIS_Z = 0.02;
const SMOOTHING = 14;

const check = process.argv.includes('--check');
const dir = new URL('../public/models/', import.meta.url);
const manifestPath = new URL('atlas.json', dir);
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const atlas = loadAtlas();

const isWall = (name) => /\brib$/i.test(name) || /costal cartilage/i.test(name) || /sternum|manubrium|xiphoid/i.test(name);
const isLung = (name) => /lobe of( right| left)? lung/i.test(name);

const sectorOf = (x, z) => Math.round(Math.atan2(z - AXIS_Z, x - AXIS_X) / SECTOR);
const radiusOf = (x, z) => Math.hypot(x - AXIS_X, z - AXIS_Z);

// Outer radius of the chest wall, per sector and height band.
const outer = new Map();
for (const part of atlas.parts) {
  if (!isWall(part.name)) continue;
  for (let i = 0; i < part.vertexCount; i++) {
    const x = part.positions[i * 3], y = part.positions[i * 3 + 1], z = part.positions[i * 3 + 2];
    const key = sectorOf(x, z) + ':' + Math.round(y / BAND);
    const r = radiusOf(x, z);
    if (r > (outer.get(key) ?? 0)) outer.set(key, r);
  }
}
const sectors = new Map();
for (const [key, r] of outer) {
  const parts = key.split(':');
  const sector = Number(parts[0]), band = Number(parts[1]);
  let list = sectors.get(sector);
  if (!list) sectors.set(sector, (list = []));
  list.push([band, r]);
}
for (const list of sectors.values()) list.sort((a, b) => a[0] - b[0]);

/** The cage as a closed shell: gaps between ribs are bridged along height. */
const envelope = (sector, band) => {
  const list = sectors.get(sector);
  if (!list) return null;
  if (band <= list[0][0]) return list[0][1];
  if (band >= list[list.length - 1][0]) return list[list.length - 1][1];
  for (let i = 1; i < list.length; i++) {
    if (list[i][0] < band) continue;
    const before = list[i - 1], after = list[i];
    if (after[0] === before[0]) return after[1];
    return before[1] + (after[1] - before[1]) * (band - before[0]) / (after[0] - before[0]);
  }
  return null;
};

const buffers = new Map(), touched = new Set();
let movedTotal = 0;

for (const part of atlas.parts) {
  if (!isLung(part.name)) continue;
  const required = new Float64Array(part.vertexCount);
  let count = 0, worst = 0;
  for (let i = 0; i < part.vertexCount; i++) {
    const x = part.positions[i * 3], y = part.positions[i * 3 + 1], z = part.positions[i * 3 + 2];
    const limit = envelope(sectorOf(x, z), Math.round(y / BAND));
    if (limit === null) continue;
    const excess = radiusOf(x, z) - (limit - CLEARANCE);
    if (excess <= 0) continue;
    required[i] = excess;
    count++;
    if (excess > worst) worst = excess;
  }
  console.log(part.name + ': ' + count + '/' + part.vertexCount + ' vertices beyond the chest wall, worst ' + (worst * 1000).toFixed(1) + ' mm');
  movedTotal += count;
  if (!count || check) continue;

  // Neighbour lists from the index buffer, so the dent can be spread over the surface.
  const neighbours = Array.from({ length: part.vertexCount }, () => new Set());
  for (let t = 0; t < part.indexCount; t += 3) {
    const a = part.indices[t], b = part.indices[t + 1], c = part.indices[t + 2];
    neighbours[a].add(b); neighbours[a].add(c);
    neighbours[b].add(a); neighbours[b].add(c);
    neighbours[c].add(a); neighbours[c].add(b);
  }
  let field = Float64Array.from(required);
  for (let pass = 0; pass < SMOOTHING; pass++) {
    const next = new Float64Array(part.vertexCount);
    for (let i = 0; i < part.vertexCount; i++) {
      let sum = 0, n = 0;
      for (const j of neighbours[i]) { sum += field[j]; n++; }
      // Never fall below what this vertex needs; only grow the skirt around it.
      next[i] = Math.max(required[i], n ? (sum / n) * 0.85 : 0);
    }
    field = next;
  }
  for (let i = 0; i < part.vertexCount; i++) {
    if (field[i] <= 0) continue;
    const x = part.positions[i * 3], z = part.positions[i * 3 + 2];
    const dx = x - AXIS_X, dz = z - AXIS_Z, length = Math.hypot(dx, dz);
    if (length < 1e-8) continue;
    part.positions[i * 3] = x - (dx / length) * field[i];
    part.positions[i * 3 + 2] = z - (dz / length) * field[i];
  }

  // Rebuild normals from the moved faces; the old ones describe a surface that has gone.
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
  // Winding order may put the rebuilt normals inward; keep the source mesh's own sense.
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

if (check || !movedTotal) {
  console.log(check ? '\n(check only, nothing written)' : '\nnothing to do');
  process.exitCode = check && movedTotal ? 1 : 0;
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
  console.log('\n' + movedTotal + ' vertices pressed inside the chest wall; rewrote ' + touched.size + ' chunks');
}
