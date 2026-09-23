/** Restore the outside-to-inside order of the trunk wall muscles at the flank and back.
 *
 * Internal oblique, transversus abdominis and latissimus dorsi came back from
 * BodyParts3D 3.0; external oblique and the erector spinae are 4.0. Measured along
 * radial rays from the trunk axis the two sets cross:
 *
 *  - at the flank, transversus abdominis lies outside the external oblique (GB25:
 *    transversus at 5 mm, external oblique at 15 mm; LR13 and SP13 likewise);
 *  - over the lumbar and lower thoracic back, latissimus dorsi lies under the
 *    iliocostalis instead of over it (BL22, BL52), although its aponeurosis is the
 *    most superficial layer there.
 *
 * Each rule names an outer and an inner mesh and which of the two moves - always the
 * 3.0 one, since skin and the 4.0 muscles agree with each other. Per radial column the
 * moving mesh is shifted along the ray just far enough to restore the order with a
 * 1 mm gap, never further than the room left against the next layer (or the skin),
 * and the shift is blurred over neighbouring columns so the sheet stays smooth.
 * The rectus zone is left alone; scripts/fit-abdominal-wall.mjs orders the sheath.
 *
 * Usage: node scripts/fit-layer-order.mjs [--check]
 */
import fs from 'node:fs';
import * as T from 'three';
import { loadAtlas, threeMesh } from './atlas-geometry.mjs';
import { chunkWriter, grid, manifestPath } from './mesh-edit.mjs';

const check = process.argv.includes('--check');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const atlas = loadAtlas();
const writer = chunkWriter(manifest);
const named = (name) => atlas.parts.find((p) => p.name === name);
const AXIS = new T.Vector3(0, 0, 0.02), GAP = 0.001, A_STEP = 1.5, Y_STEP = 0.003;
// Azimuth in degrees on the right side: 0 = straight ahead, 90 = lateral, 180 = straight back.
const RULES = [
  { outer: 'external oblique', inner: 'transversus abdominis', move: 'inner', az: [45, 150], y: [0.86, 1.2], room: [] },
  { outer: 'external oblique', inner: 'internal oblique', move: 'inner', az: [45, 150], y: [0.86, 1.2], room: ['transversus abdominis'] },
  { outer: 'internal oblique', inner: 'transversus abdominis', move: 'inner', az: [45, 150], y: [0.86, 1.2], room: [] },
  { outer: 'latissimus dorsi', inner: 'iliocostalis lumborum', move: 'outer', az: [110, 178], y: [0.95, 1.3], room: [] },
  { outer: 'latissimus dorsi', inner: 'iliocostalis thoracis', move: 'outer', az: [110, 178], y: [0.95, 1.3], room: [] },
  { outer: 'latissimus dorsi', inner: 'longissimus thoracis', move: 'outer', az: [110, 178], y: [0.95, 1.3], room: [] },
  { outer: 'latissimus dorsi', inner: 'serratus posterior inferior', move: 'outer', az: [110, 178], y: [0.95, 1.3], room: [] },
];
const raycaster = new T.Raycaster();
const objects = new Map();
const object = (part) => { let o = objects.get(part); if (!o) { o = threeMesh(part); objects.set(part, o); } return o; };
const skin = atlas.parts.filter((p) => p.system === 'integumentary');
const viscera = atlas.parts.filter((p) => ['digestive', 'urinary'].includes(p.system));
const direction = (az, sign) => { const r = az * Math.PI / 180; return new T.Vector3(sign * Math.sin(r), 0, Math.cos(r)); };
/** Radii (from the axis, in the ray's plane) at which `parts` are crossed on the inward ray. */
const radii = (parts, az, y, sign) => {
  const out = direction(az, sign), origin = new T.Vector3(AXIS.x, y, AXIS.z).addScaledVector(out, 0.4);
  raycaster.set(origin, out.clone().negate()); raycaster.far = 0.4;
  return parts.flatMap((p) => raycaster.intersectObject(object(p), false).map((h) => 0.4 - h.distance)).sort((a, b) => b - a);
};
const azimuthOf = (x, z, sign) => Math.atan2(sign * x, z - AXIS.z) * 180 / Math.PI;

const log = [];
for (const rule of RULES) for (const [side, sign] of [['Right', -1], ['Left', 1]]) {
  const outer = named(`${side} ${rule.outer}`), inner = named(`${side} ${rule.inner}`);
  if (!outer || !inner) continue;
  const moving = rule.move === 'inner' ? inner : outer;
  const roomParts = rule.move === 'inner' ? [...rule.room.map((n) => named(`${side} ${n}`)).filter(Boolean), ...viscera] : skin;
  // The grid's second axis is height, rescaled so one cell is Y_STEP tall.
  const yCell = (y) => rule.y[0] + (y - rule.y[0]) * A_STEP / Y_STEP;
  const shift = grid({ x0: rule.az[0], x1: rule.az[1], y0: rule.y[0], y1: yCell(rule.y[1]), step: A_STEP });
  let violations = 0;
  for (let az = rule.az[0]; az <= rule.az[1]; az += A_STEP) for (let y = rule.y[0]; y <= rule.y[1]; y += Y_STEP) {
    const o = radii([outer], az, y, sign), i = radii([inner], az, y, sign);
    if (!o.length || !i.length) continue;
    // Outer mesh's inner surface vs inner mesh's outer surface, both on the first crossing.
    const outerIn = o[Math.min(1, o.length - 1)], innerOut = i[0];
    if (innerOut > outerIn + 0.02 || innerOut < outerIn - 0.03) continue; // different sheets of the same muscles
    const overlap = innerOut - (outerIn - GAP);
    let value = 0;
    if (overlap > 0) {
      violations++;
      if (rule.move === 'inner') {
        const beyond = radii(roomParts, az, y, sign).filter((r) => r < i[Math.min(1, i.length - 1)]);
        const room = beyond.length ? i[Math.min(1, i.length - 1)] - beyond[0] - GAP : Infinity;
        value = -Math.min(overlap, Math.max(0, room));
      } else {
        // The nearest skin sheet outside the muscle: the outermost one can be the arm's.
        const skinR = radii(roomParts, az, y, sign).filter((r) => r > o[0]).pop();
        const room = skinR === undefined ? Infinity : skinR - GAP - o[0];
        value = Math.min(overlap, Math.max(0, room));
      }
    }
    shift.put(az, yCell(y), value, (a, b) => (Math.abs(a) > Math.abs(b) ? a : b));
  }
  shift.blur(2, 2);
  let moved = 0, worst = 0;
  const radial = new Float64Array(moving.vertexCount);
  for (let v = 0; v < moving.vertexCount; v++) {
    const x = moving.positions[v * 3], y = moving.positions[v * 3 + 1], z = moving.positions[v * 3 + 2];
    const value = shift.sample(azimuthOf(x, z, sign), yCell(y));
    if (Number.isNaN(value) || Math.abs(value) < 1e-5) continue;
    radial[v] = value; moved++; worst = Math.max(worst, Math.abs(value));
  }
  log.push(`${side} ${rule.inner} under ${rule.outer}: ${violations} crossed columns, moved ${moving.name} ${moved} vertices, up to ${(worst * 1000).toFixed(1)} mm`);
  if (check || !moved) continue;
  for (let v = 0; v < moving.vertexCount; v++) {
    if (!radial[v]) continue;
    const x = moving.positions[v * 3], z = moving.positions[v * 3 + 2];
    const dx = x - AXIS.x, dz = z - AXIS.z, length = Math.hypot(dx, dz) || 1;
    moving.positions[v * 3] += (dx / length) * radial[v];
    moving.positions[v * 3 + 2] += (dz / length) * radial[v];
  }
  writer.mark(moving); objects.delete(moving);
}
console.log(log.join('\n'));
if (check) console.log('\n(check only, nothing written)');
else if (writer.count) { writer.write(); console.log(`rewrote ${writer.count} chunks`); }
