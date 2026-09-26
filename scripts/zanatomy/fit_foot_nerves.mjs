/** Fit the Z-Anatomy foot nerves to the BodyParts3D foot.
 *
 * segment_register.mjs registers the lower limb by bone segment down to the tibia and fibula;
 * there is no foot segment, so the nerves of the foot rode on the lower-leg fit. The two models
 * stand with different ankle angles and toe-out, which left the plantar and digital nerves 4-5 cm
 * above the sole and fanned in the air past the toes.
 *
 * The FBX source is not in the repository, so the foot is fitted in the atlas frame: a rotation
 * about the ankle (talus centre) plus a translation, found by descent, that brings the foot nerves
 * onto the bones and muscles of the same foot. The move is blended in from the ankle forward, so
 * the nerves stay joined to the tibial, sural and fibular nerves the leg fit already placed.
 *
 *   node scripts/zanatomy/fit_foot_nerves.mjs --check   report only
 *   node scripts/zanatomy/fit_foot_nerves.mjs           rewrite zanatomy-*.bin and zanatomy.json
 */
import fs from 'node:fs';
import { atlas, T, REPO } from '../needling/path-geometry.mjs';
import { rebuildNormals } from '../mesh-edit.mjs';

const check = process.argv.includes('--check');
const supplementDir = new URL('public/models/zanatomy/', REPO), supplementPath = new URL('zanatomy.json', supplementDir);
const supplementManifest = JSON.parse(fs.readFileSync(supplementPath, 'utf8'));
const FOOT_BONE = /(metatarsal|phalanx|cuneiform|cuboid|navicular|talus|calcaneus|sesamoid)/i;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** Nearest-point queries against a cloud, bucketed on a 4 mm grid. */
function cloud(points) {
  const cell = 0.004, buckets = new Map(), key = (x, y, z) => `${x},${y},${z}`;
  for (const p of points) {
    const k = key(Math.floor(p.x / cell), Math.floor(p.y / cell), Math.floor(p.z / cell));
    (buckets.get(k) ?? buckets.set(k, []).get(k)).push(p);
  }
  return (p, cap = 0.03) => {
    const cx = Math.floor(p.x / cell), cy = Math.floor(p.y / cell), cz = Math.floor(p.z / cell);
    let best = cap * cap;
    for (let r = 0; r * cell <= Math.sqrt(best) + cell && r <= 8; r++)
      for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) for (let dz = -r; dz <= r; dz++) {
        if (Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz)) !== r) continue;
        for (const q of buckets.get(key(cx + dx, cy + dy, cz + dz)) ?? []) best = Math.min(best, p.distanceToSquared(q));
      }
    return Math.sqrt(best);
  };
}

const report = [];
for (const side of ['right', 'left']) {
  const sign = side === 'right' ? -1 : 1, onSide = (part) => (part.bounds[0][0] + part.bounds[1][0]) * sign > 0;
  const bones = atlas.parts.filter((p) => !p.supplement && p.system === 'skeletal' && onSide(p) && FOOT_BONE.test(p.name) && p.bounds[1][1] < 0.11);
  const muscles = atlas.parts.filter((p) => !p.supplement && p.system === 'muscular' && onSide(p) && p.bounds[1][1] < 0.09);
  const nerves = atlas.parts.filter((p) => p.supplement && p.system === 'nervous' && onSide(p) && p.bounds[0][1] < 0.1);
  const talus = bones.find((p) => /talus/i.test(p.name));
  const pivot = new T.Vector3(...talus.bounds[0]).add(new T.Vector3(...talus.bounds[1])).multiplyScalar(0.5);
  const targetPoints = [];
  for (const part of [...bones, ...muscles]) for (let i = 0; i < part.positions.length; i += 6) targetPoints.push(new T.Vector3(part.positions[i], part.positions[i + 1], part.positions[i + 2]));
  const nearest = cloud(targetPoints);
  // Blend weight: nothing at and behind the ankle, the full move over the forefoot, and nothing
  // up the leg, where the segment fit already holds.
  const weight = (v) => smooth(pivot.z - 0.02, pivot.z + 0.035, v.z) * (1 - smooth(0.1, 0.14, v.y));
  const samples = [];
  for (const part of nerves) for (let i = 0; i < part.positions.length; i += 9) {
    const v = new T.Vector3(part.positions[i], part.positions[i + 1], part.positions[i + 2]), w = weight(v);
    if (w > 0.05) samples.push({ v, w });
  }
  const transform = ([yaw, pitch, roll, tx, ty, tz]) => {
    const rotation = new T.Matrix4().makeRotationFromEuler(new T.Euler(pitch, yaw, roll, 'YXZ'));
    return (v, w) => {
      const moved = v.clone().sub(pivot).applyMatrix4(rotation).add(pivot).add(new T.Vector3(tx, ty, tz));
      return v.clone().lerp(moved, w);
    };
  };
  const score = (params) => {
    const move = transform(params);
    let total = 0;
    for (const { v, w } of samples) {
      const p = move(v, w);
      total += nearest(p) + Math.max(0, 0.004 - p.y) * 8; // below the sole is outside the body
    }
    return total / samples.length;
  };
  const params = [0, 0, 0, 0, 0, 0], steps = [0.12, 0.12, 0.06, 0.01, 0.01, 0.01];
  const before = score(params);
  let best = before;
  for (let round = 0; round < 7; round++) {
    let improved = true;
    while (improved) {
      improved = false;
      for (let k = 0; k < params.length; k++) for (const direction of [-1, 1]) {
        const trial = params.slice(); trial[k] += direction * steps[k];
        const value = score(trial);
        if (value < best - 1e-7) { best = value; params.splice(0, params.length, ...trial); improved = true; }
      }
    }
    for (let k = 0; k < steps.length; k++) steps[k] /= 2;
  }
  const deg = (r) => (r * 180 / Math.PI).toFixed(1), mm = (m) => (m * 1000).toFixed(1);
  report.push(`${side}: ${nerves.length} nerves, ${samples.length} samples · mean distance to foot bone/muscle ${mm(before)} → ${mm(best)} mm · yaw ${deg(params[0])}° pitch ${deg(params[1])}° roll ${deg(params[2])}° · shift ${params.slice(3).map(mm).join(', ')} mm`);
  if (check) continue;
  const move = transform(params);
  for (const part of nerves) {
    const a = part.positions;
    for (let i = 0; i < a.length; i += 3) {
      const v = new T.Vector3(a[i], a[i + 1], a[i + 2]), w = weight(v);
      if (w <= 0) continue;
      const p = move(v, w);
      a[i] = p.x; a[i + 1] = p.y; a[i + 2] = p.z;
    }
    const record = supplementManifest.parts.find((p) => p.id === part.id);
    rebuildNormals({ ...part, normals: new Int16Array(a.buffer, record.normals, part.vertexCount * 3) });
    const low = [Infinity, Infinity, Infinity], high = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < a.length; i++) { const k = i % 3; low[k] = Math.min(low[k], a[i]); high[k] = Math.max(high[k], a[i]); }
    record.bounds = [low, high];
  }
}
console.log(report.join('\n'));
if (!check) {
  const chunks = new Set(atlas.parts.filter((p) => p.supplement).map((p) => p.chunk));
  for (const index of chunks) {
    const part = atlas.parts.find((p) => p.supplement && p.chunk === index);
    fs.writeFileSync(new URL(supplementManifest.chunks[index].url.split('/').pop(), supplementDir), Buffer.from(part.positions.buffer));
  }
  fs.writeFileSync(supplementPath, JSON.stringify(supplementManifest));
  console.log('wrote', chunks.size, 'chunks');
}
