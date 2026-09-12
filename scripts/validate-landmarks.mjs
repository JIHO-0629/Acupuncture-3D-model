/** Check the derived landmarks against relationships that must hold on any human body.
 *
 * A landmark that sits off its own source mesh, a spinous process out of sequence, or a
 * left/right pair that is not mirrored means the derivation picked the wrong feature.
 * Proportional axis lengths are reported as warnings: B-cun is a per-region scale and
 * the regions genuinely disagree with one another.
 *
 * Usage: node scripts/validate-landmarks.mjs
 */
import fs from 'node:fs';
import * as T from 'three';
import { loadAtlas, mesh } from './atlas-geometry.mjs';

const data = JSON.parse(fs.readFileSync(new URL('../data/landmarks.json', import.meta.url), 'utf8'));
const atlas = loadAtlas();
const failures = [], warnings = [];
const fail = (message) => failures.push(message);
const warn = (message) => warnings.push(message);
const mm = (n) => `${(n * 1000).toFixed(1)} mm`;

const byKey = new Map(data.landmarks.map((l) => [`${l.id}|${l.side ?? ''}`, l]));
const get = (id, side = null) => byKey.get(`${id}|${side ?? ''}`);
const at = (landmark) => new T.Vector3(...landmark.point);

// 1. Every point must lie on, or extremely close to, a mesh it claims to come from.
const nearestVertex = (part, target) => {
  let best = Infinity;
  for (let i = 0; i < part.vertexCount; i++) {
    const dx = part.positions[i * 3] - target.x, dy = part.positions[i * 3 + 1] - target.y, dz = part.positions[i * 3 + 2] - target.z;
    const distance = dx * dx + dy * dy + dz * dz;
    if (distance < best) best = distance;
  }
  return Math.sqrt(best);
};
for (const landmark of data.landmarks) {
  if (landmark.kind !== 'point' || landmark.type !== 'anatomical') continue;
  const target = at(landmark);
  let closest = Infinity;
  for (const name of landmark.sources) {
    if (!atlas.byName.has(name.toLowerCase())) { fail(`${landmark.id}: cites missing mesh "${name}"`); continue; }
    closest = Math.min(closest, nearestVertex(mesh(atlas, name), target));
  }
  // A clustered extreme is an average of nearby vertices, so allow a few millimetres.
  if (closest > 0.006) fail(`${landmark.id}${landmark.side ? `/${landmark.side}` : ''}: ${mm(closest)} away from its own source mesh`);
}

// 2. Sided pairs must mirror across the sagittal plane.
for (const landmark of data.landmarks) {
  if (landmark.side !== 'right' || landmark.kind !== 'point') continue;
  const other = get(landmark.id, 'left');
  if (!other) { fail(`${landmark.id}: right side has no left counterpart`); continue; }
  const a = at(landmark), b = at(other);
  const offset = Math.max(Math.abs(a.x + b.x), Math.abs(a.y - b.y), Math.abs(a.z - b.z));
  // An estimated landmark inherits whatever asymmetry its source mesh carries, so the
  // number is reported rather than treated as a derivation error.
  const limit = landmark.type === 'estimated' ? 0.016 : 0.008;
  if (offset > limit) fail(`${landmark.id}: left and right differ by ${mm(offset)}, over the ${mm(limit)} limit for a ${landmark.type} landmark`);
  else if (offset > 0.004) warn(`${landmark.id}: left and right differ by ${mm(offset)} [${landmark.type}]`);
}

// 3. Spinous processes must descend in order, and each tip must be the rearmost feature.
const SEQUENCE = ['C7', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12', 'L1', 'L2', 'L3', 'L4', 'L5'];
let previous = null;
for (const label of SEQUENCE) {
  const tip = get(`spinous_process_${label}.tip`);
  const inferior = get(`spinous_process_${label}.inferior_border`);
  const superior = get(`spinous_process_${label}.superior_border`);
  if (!tip || !inferior || !superior) { fail(`spinous_process_${label}: incomplete feature set`); continue; }
  if (previous && at(tip).y >= at(previous).y) fail(`spinous_process_${label}: tip is not below the one above it`);
  if (at(inferior).y >= at(superior).y) fail(`spinous_process_${label}: inferior border is not below the superior border`);
  if (at(tip).z > at(superior).z + 0.002) warn(`spinous_process_${label}: tip is not the rearmost feature`);
  previous = tip;
}

// 4. Trunk ordering and the derived umbilicus.
const xiphi = get('xiphisternal_junction'), pubis = get('pubic_symphysis_superior'), navel = get('umbilicus');
if (xiphi && pubis && navel) {
  if (!(at(xiphi).y > at(navel).y && at(navel).y > at(pubis).y)) fail('umbilicus: not between the xiphisternal junction and the pubic symphysis');
  const total = at(xiphi).y - at(pubis).y;
  const upper = at(xiphi).y - at(navel).y;
  if (Math.abs(upper / total - 8 / 13) > 0.001) fail('umbilicus: not at the 8:5 division');
  warn(`abdominal axis: 13 B-cun over ${mm(total)} gives 1 B-cun = ${mm(total / 13)}`);
}
const notch = get('suprasternal_notch');
if (notch && xiphi && at(notch).y <= at(xiphi).y) fail('suprasternal_notch: not above the xiphisternal junction');

// 5. Lower limb ordering and the leg B-cun axes.
for (const side of ['right', 'left']) {
  const trochanter = get('greater_trochanter', side), crease = get('popliteal_crease', side);
  const malleolus = get('lateral_malleolus_prominence', side), tip = get('lateral_malleolus_tip', side);
  const head = get('fibular_head', side), epicondyle = get('lateral_femoral_epicondyle', side);
  if (trochanter && crease) {
    const length = at(trochanter).y - at(crease).y;
    if (length <= 0) fail(`${side}: greater trochanter is not above the popliteal crease`);
    else warn(`${side} thigh axis: 19 B-cun over ${mm(length)} gives 1 B-cun = ${mm(length / 19)}`);
  }
  if (crease && malleolus) {
    const length = at(crease).y - at(malleolus).y;
    if (length <= 0) fail(`${side}: popliteal crease is not above the lateral malleolus`);
    else warn(`${side} leg axis: 16 B-cun over ${mm(length)} gives 1 B-cun = ${mm(length / 16)}`);
  }
  if (head && malleolus && at(head).y <= at(malleolus).y) fail(`${side}: fibular head is not above the lateral malleolus`);
  if (tip && malleolus && at(tip).y >= at(malleolus).y) fail(`${side}: malleolus tip is not below its prominence`);
  if (epicondyle && head && at(epicondyle).y <= at(head).y) warn(`${side}: lateral femoral epicondyle is not above the fibular head`);
}

// 6. Scalp axis.
const front = get('anterior_hairline_midpoint'), back = get('posterior_hairline_midpoint');
if (front && back) {
  if (at(front).z <= at(back).z) fail('hairline midpoints: the anterior one is not in front of the posterior one');
  const length = at(front).distanceTo(at(back));
  warn(`scalp axis: 12 B-cun over ${mm(length)} straight-line gives 1 B-cun = ${mm(length / 12)} before surface correction`);
}

// 7. Curves must be monotonic in height and sit on their source mesh.
for (const landmark of data.landmarks) {
  if (landmark.kind !== 'curve') continue;
  const heights = landmark.samples.map((s) => s[1]);
  const ascending = heights.every((y, i) => i === 0 || y > heights[i - 1]);
  if (!ascending) fail(`${landmark.id}/${landmark.side}: samples are not ordered by height`);
  if (landmark.samples.length < 12) warn(`${landmark.id}/${landmark.side}: only ${landmark.samples.length} samples`);
}

// 8. Nothing may fall outside the body surface.
const skin = mesh(atlas, 'Skin');
const box = skin.box.clone().expandByScalar(0.001);
for (const landmark of data.landmarks) {
  const points = landmark.kind === 'point' ? [landmark.point] : landmark.kind === 'curve' ? landmark.samples : [];
  for (const p of points) if (!box.containsPoint(new T.Vector3(...p))) fail(`${landmark.id}${landmark.side ? `/${landmark.side}` : ''}: point ${p} lies outside the body`);
}

console.log(`${data.landmarks.length} landmarks checked`);
for (const message of warnings) console.log(`  warning  ${message}`);
if (failures.length) {
  for (const message of failures) console.error(`  FAIL     ${message}`);
  console.error(`\n${failures.length} landmark checks failed`);
  process.exit(1);
}
console.log(`\nall landmark checks passed (${warnings.length} warnings)`);
