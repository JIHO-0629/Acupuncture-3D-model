/** Derive the head's B-cun scales as geodesics on the skin, and place the head points on them.
 *
 * 골도분촌 is laid on the scalp like a tape, not taken as a straight line through the skull.
 * The earlier head seeds mixed two scales (GB13/GB14 on a 17.9 mm/촌 chord, GB15..GB18 at
 * roughly 35 mm/촌). This script replaces both with arc length measured on the skin.
 *
 * Method. Every distance is a normal section: cut the skin with a plane and read arc length
 * along the curve. Sagittal planes (x = const) carry longitudinal distances, coronal planes
 * (z = const) the 이개첨 verticals, transverse planes (y = const) lateral offsets.
 *
 * Scales. WHO proportional cun are local: each bone segment is its own scale, so a point is
 * measured on the segment that contains it.
 *   - 미간 ~ 전발제 = 3촌 (forehead): GB14
 *   - 전발제 ~ 후발제 = 12촌 (scalp): GB8, GB9, GB13, GB15..GB18
 *   - 유양돌기 ~ 유양돌기 = 9촌 (posterior transverse): GB19
 * The anterior hairline is read from the "Hair of head" mesh, which matches the rendered
 * forehead. The scalp scale is anchored on GV20 (reviewer, 2026-09-21): the point where the
 * plane of the two auricular long axes (lobule → apex, leaning back) crosses the midline, 5촌
 * behind the anterior hairline. The earlier rule (전발제→EOP = 11촌) made every point measured
 * from the front 1.5촌 short. Two independent checks agree with the new scale: the GV20–GV17 arc
 * gives 29.7 mm/촌 against 30.4, and 12촌 from the anterior hairline ends at y 1.536, the C2
 * level where the sheet puts the posterior hairline.
 *
 * Usage: node scripts/head-cun.mjs
 * Output: data/head-cun.json
 */
import fs from 'node:fs';
import * as T from 'three';
import { loadAtlas, mesh, threeMesh } from './atlas-geometry.mjs';

const atlas = loadAtlas();
const skin = threeMesh(mesh(atlas, 'Skin'));
skin.updateMatrixWorld(true);
const hair = mesh(atlas, 'Hair of head');
const frontal = mesh(atlas, 'Frontal bone');
const occipital = mesh(atlas, 'Occipital bone');
const landmarks = JSON.parse(fs.readFileSync(new URL('../data/landmarks.json', import.meta.url), 'utf8')).landmarks;
const raycaster = new T.Raycaster();
const round = (p) => [+p.x.toFixed(5), +p.y.toFixed(5), +p.z.toFixed(5)];
const mm = (n) => +(n * 1000).toFixed(1);
const vertex = (part, i) => new T.Vector3(part.positions[i * 3], part.positions[i * 3 + 1], part.positions[i * 3 + 2]);
const landmark = (id, side) => {
  const found = landmarks.find((l) => l.id === id && l.side === side);
  if (!found?.point) throw new Error(`landmark missing: ${id}/${side}`);
  return new T.Vector3().fromArray(found.point);
};

/** Vertex of `part` passing `filter` that maximises `score`. Throws instead of guessing. */
function best(part, filter, score) {
  let found = null, value = -Infinity;
  for (let i = 0; i < part.vertexCount; i++) {
    const p = vertex(part, i);
    if (!filter(p)) continue;
    const s = score(p);
    if (s > value) { value = s; found = p; }
  }
  if (!found) throw new Error(`${part.name}: no vertex matched`);
  return found;
}

const SECTIONS = 1440;
/**
 * Closed curve where the plane `axis = value` cuts the skin, ordered by angle about `centre`.
 * Each angle keeps only the outermost hit, so interior surfaces never enter the walk.
 * Arc length was checked against 180..1440 samples and ±5-sample median smoothing: it varies
 * by under 5%, so tessellation noise is not what sets the scale.
 */
function section(axis, value, centre = new T.Vector3(0, 1.6, -0.012)) {
  const origin = centre.clone();
  origin[axis] = value;
  const [u, w] = axis === 'x' ? ['z', 'y'] : axis === 'y' ? ['x', 'z'] : ['x', 'y'];
  const curve = [];
  for (let i = 0; i < SECTIONS; i++) {
    const angle = (i / SECTIONS) * Math.PI * 2;
    const direction = new T.Vector3();
    direction[u] = Math.cos(angle);
    direction[w] = Math.sin(angle);
    raycaster.set(origin.clone().addScaledVector(direction, 0.32), direction.clone().negate());
    const hit = raycaster.intersectObject(skin, false)[0];
    if (hit && Math.abs(hit.point[axis] - value) < 0.004) curve.push(hit.point.clone());
  }
  if (curve.length < SECTIONS * 0.5) throw new Error(`section ${axis}=${value} is too sparse (${curve.length})`);
  return curve;
}

const nearest = (curve, target) =>
  curve.reduce((b, p, i) => (p.distanceTo(target) < curve[b].distanceTo(target) ? i : b), 0);
/** Legs longer than 1 cm are folds where the section jumps; they are skipped, not counted. */
const FOLD = 0.01;

function advance(curve, start, step, distance) {
  let travelled = 0, i = start;
  for (let guard = 0; guard < curve.length; guard++) {
    const next = (i + step + curve.length) % curve.length, leg = curve[i].distanceTo(curve[next]);
    if (leg < FOLD) {
      if (travelled + leg >= distance) return curve[i].clone().lerp(curve[next], (distance - travelled) / leg);
      travelled += leg;
    }
    i = next;
  }
  throw new Error(`advance ran out of curve before ${mm(distance)} mm`);
}

function arc(curve, from, to, step) {
  let travelled = 0, i = nearest(curve, from);
  const end = nearest(curve, to);
  for (let guard = 0; guard < curve.length; guard++) {
    if (i === end) return travelled;
    const next = (i + step + curve.length) % curve.length, leg = curve[i].distanceTo(curve[next]);
    if (leg < FOLD) travelled += leg;
    i = next;
  }
  throw new Error('arc never reached its end point');
}

/** Step direction along `curve` at `index` that increases `axis` (sign +1) or decreases it (-1). */
const stepToward = (curve, index, axis, sign) => {
  const ahead = curve[(index + 1) % curve.length][axis], behind = curve[(index - 1 + curve.length) % curve.length][axis];
  return Math.sign(ahead - behind) === sign ? 1 : -1;
};

/** Point on a section at a given height, on the front (+z) or back (-z) of the head. */
const atHeight = (curve, y, front) =>
  curve.filter((p) => (front ? p.z > 0 : p.z < 0)).reduce((b, p) => (Math.abs(p.y - y) < Math.abs(b.y - y) ? p : b));

/** Same rule as projectToSkin in app/scene.tsx for projection 'head'. */
function projectHead(seed) {
  const outward = seed.clone().sub(new T.Vector3(0, 1.59, 0)).normalize();
  raycaster.set(seed.clone().addScaledVector(outward, 0.24), outward.clone().negate());
  let hit = null, distance = Infinity;
  for (const h of raycaster.intersectObject(skin, false)) {
    const d = h.point.distanceTo(seed);
    if (d < distance) { distance = d; hit = h; }
  }
  if (!hit) throw new Error('head projection missed the skin');
  return hit.point.clone();
}

// ---------------------------------------------------------------- scalp axis: 전발제~후발제 = 12촌
const midline = section('x', 0);
const hairMeshAnterior = best(hair, (p) => Math.abs(p.x) < 0.012 && p.z > 0, (p) => -p.y);
const hairMeshPosterior = best(hair, (p) => Math.abs(p.x) < 0.012 && p.z < 0, (p) => -p.y);
// Registered protuberance (reviewer-confirmed 2026-09-21): the lower edge of the occipital bulge, not its rearmost point.
const eop = landmark('external_occipital_protuberance', null);
const anteriorHairline = midline[nearest(midline, hairMeshAnterior)];
const eopSkin = atHeight(midline, eop.y, false);
const overVertex = stepToward(midline, nearest(midline, anteriorHairline), 'y', 1);
const toEop = arc(midline, anteriorHairline, eopSkin, overVertex);
// Scale (reviewer, 2026-09-21): GV20 is where the plane of the auricular long axes (lobule → apex, both leaning back)
// crosses the midline, and it is 5 B-cun behind the anterior hairline. The old rule (anterior hairline → EOP = 11 B-cun)
// put every point measured from the front 1.5 B-cun short. The GV18–GV20 arc to GV17 agrees with this scale within 2 %.
const AURICULAR_APEX_Z = -0.0298; // app/ear-anatomy.ts builds the apex here (see AURICLE_OFFSET)
const EAR_APEX = new T.Vector3(-0.0737, 1.6226, AURICULAR_APEX_Z), EAR_LOBULE = new T.Vector3(-0.0656, 1.5666, -0.0082);
const earPlaneNormal = new T.Vector3(1, 0, 0).cross(EAR_APEX.clone().sub(EAR_LOBULE).normalize()).normalize();
const earPlane = (p) => earPlaneNormal.dot(p.clone().sub(EAR_APEX));
const gv20 = midline.filter((p) => p.y > 1.66).reduce((b, p) => (Math.abs(earPlane(p)) < Math.abs(earPlane(b)) ? p : b));
const CUN = arc(midline, anteriorHairline, gv20, overVertex) / 5;
const posteriorHairline = advance(midline, nearest(midline, anteriorHairline), overVertex, 12 * CUN);
const gvMidline = Object.fromEntries([
  ['GV18', 8], ['GV19', 6.5], ['GV20', 5], ['GV21', 3.5], ['GV22', 2], ['GV23', 1], ['GV24', 0.5],
].map(([code, cun]) => [code, round(advance(midline, nearest(midline, anteriorHairline), overVertex, cun * CUN))]));

// ---------------------------------------------------------------- posterior transverse: 유양돌기간 = 9촌
const mastoidR = landmark('mastoid_process_tip', 'right'), mastoidL = landmark('mastoid_process_tip', 'left');
const mastoidHeight = (mastoidR.y + mastoidL.y) / 2;
const backRing = section('y', mastoidHeight, new T.Vector3(0, mastoidHeight, -0.03));
const skinOver = (bone) => backRing
  .filter((p) => p.z < 0 && Math.sign(p.x) === Math.sign(bone.x))
  .reduce((b, p) => (Math.abs(p.z - bone.z) < Math.abs(b.z - bone.z) ? p : b));
const backMid = backRing.filter((p) => p.z < 0).reduce((b, p) => (Math.abs(p.x) < Math.abs(b.x) ? p : b));
const iBackMid = nearest(backRing, backMid), towardRight = stepToward(backRing, iBackMid, 'x', -1);
const TRANSVERSE_CUN = (arc(backRing, backMid, skinOver(mastoidR), towardRight) + arc(backRing, backMid, skinOver(mastoidL), -towardRight)) / 9;

// ---------------------------------------------------------------- head points
const points = [];
const byCode = {};
const add = (code, korean, point, rule, sources) => {
  byCode[code] = point;
  points.push({ code, korean, point: round(point), rule, sources });
};

// 동공중선. GB14 uses the forehead scale (미간~전발제 = 3촌, eyebrow = supraorbital margin);
// GB15..GB18 use the scalp scale measured back from this column's hairline.
const pupil = landmark('pupil_center', 'right');
const browBone = best(frontal, (p) => Math.abs(p.x - pupil.x) < 0.006 && p.z > pupil.z + 0.008, (p) => -p.y);
let foreheadCun;
{
  const column = section('x', pupil.x);
  const brow = atHeight(column, browBone.y, true);
  const hairlineHere = column[nearest(column, best(hair, (p) => Math.abs(p.x - pupil.x) < 0.007 && p.z > 0, (p) => -p.y))];
  const iBrow = nearest(column, brow), up = stepToward(column, iBrow, 'y', 1);
  foreheadCun = arc(column, brow, hairlineHere, up) / 3;
  add('GB14', '양백', advance(column, iBrow, up, foreheadCun), '동공중선, 눈썹(눈확위모서리) 위 1촌 (미간~전발제 3촌 척도)', ['Skin', 'Frontal bone', 'Hair of head']);
  const iHair = nearest(column, hairlineHere);
  for (const [code, korean, cun] of [['GB15', '두임읍', 0.5], ['GB16', '목창', 1.5], ['GB17', '정영', 2.5], ['GB18', '승령', 4]]) {
    add(code, korean, advance(column, iHair, up, cun * CUN), `동공중선, 전발제 안쪽 ${cun}촌 (전후발제 12촌 척도)`, ['Skin', 'Hair of head']);
  }
}

// GB13 본신: column kept at the existing x -.052 until ST8 provides the anterior transverse scale.
{
  const GB13_COLUMN_X = -0.052;
  const column = section('x', GB13_COLUMN_X);
  const start = column[nearest(column, best(hair, (p) => Math.abs(p.x - GB13_COLUMN_X) < 0.007 && p.z > 0, (p) => -p.y))];
  const index = nearest(column, start);
  add('GB13', '본신', advance(column, index, stepToward(column, index, 'y', 1), 0.5 * CUN), '전발제 위 0.5촌 (전후발제 12촌 척도; 가쪽 3촌 열은 ST8 구현 전까지 x -.052 유지)', ['Skin', 'Hair of head']);
}

// GB8 / GB9: the temporal hairline is read from the hair mesh in each coronal column.
for (const [code, korean, z, cun, rule] of [
  ['GB8', '솔곡', AURICULAR_APEX_Z, 1.5, '이개첨 수직선, 측두 발제선 위 1.5촌 (전후발제 12촌 척도)'],
  ['GB9', '천충', AURICULAR_APEX_Z - 0.5 * CUN, 2, '이개첨 뒤 0.5촌 수직선, 발제선 위 2촌 (전후발제 12촌 척도)'],
]) {
  const column = section('z', z, new T.Vector3(0, 1.6, 0));
  const start = best(hair, (p) => p.x < -0.055 && p.y > 1.598 && Math.abs(p.z - z) < 0.006, (p) => -p.y);
  const index = nearest(column, start);
  add(code, korean, advance(column, index, stepToward(column, index, 'y', 1), cun * CUN), rule, ['Skin', 'Hair of head']);
}

// GB10 / GB11: arc-length thirds of the scalp curve from GB9 to GB12 (GB12 unchanged).
{
  const gb12 = projectHead(new T.Vector3(-0.067, 1.570, -0.065));
  const centre = new T.Vector3(-0.030, 1.596, -0.030);
  const u = byCode.GB9.clone().sub(centre), w = gb12.clone().sub(centre);
  const turn = new T.Quaternion().setFromUnitVectors(u.clone().normalize(), w.clone().normalize());
  const curve = [];
  for (let i = 0; i <= 200; i++) {
    const t = i / 200;
    const direction = u.clone().applyQuaternion(new T.Quaternion().identity().slerp(turn, t)).setLength(T.MathUtils.lerp(u.length(), w.length(), t));
    curve.push(projectHead(centre.clone().add(direction)));
  }
  const lengths = [0];
  for (let i = 1; i < curve.length; i++) lengths.push(lengths[i - 1] + curve[i].distanceTo(curve[i - 1]));
  const total = lengths[lengths.length - 1];
  const at = (fraction) => {
    const target = total * fraction, i = Math.max(1, lengths.findIndex((l) => l >= target));
    return curve[i - 1].clone().lerp(curve[i], (target - lengths[i - 1]) / (lengths[i] - lengths[i - 1] || 1));
  };
  add('GB10', '부백', at(1 / 3), `GB9–GB12 두피 곡선(${mm(total)} mm)의 위쪽 1/3`, ['Skin']);
  add('GB11', '두규음', at(2 / 3), `GB9–GB12 두피 곡선(${mm(total)} mm)의 위쪽 2/3`, ['Skin']);
}

// GB19 뇌공: level with the upper border of the EOP (GV17/BL9 level), 2.25 transverse 촌 lateral to the midline.
{
  const upper = eop.clone().add(new T.Vector3(0, 0.008, 0));
  const ring = section('y', upper.y, new T.Vector3(0, upper.y, -0.03));
  const back = ring.filter((p) => p.z < 0).reduce((b, p) => (Math.abs(p.x) < Math.abs(b.x) ? p : b));
  const index = nearest(ring, back);
  add('GB19', '뇌공', advance(ring, index, stepToward(ring, index, 'x', -1), 2.25 * TRANSVERSE_CUN), '외후두융기 위모서리 높이, 뒤정중선 가쪽 2.25촌 (유양돌기간 9촌 척도)', ['Skin', 'Occipital bone']);
}

// ---------------------------------------------------------------- output
const output = {
  source: 'atlas.json',
  generated: 'scripts/head-cun.mjs',
  note: 'head B-cun as arc length on the skin, one local scale per WHO segment',
  scalp: {
    rule: '전발제~후발제 = 12촌; 전발제는 Hair of head 메쉬, 백회(양 이개 장축 평면과 정중선의 교점)가 전발제 뒤 5촌',
    anteriorHairline: round(anteriorHairline), externalOccipitalProtuberance: round(eopSkin), posteriorHairline: round(posteriorHairline),
    anteriorHairlineToEopMm: mm(toEop), cunMm: +(CUN * 1000).toFixed(3),
    hairMeshPosteriorRejected: round(hairMeshPosterior),
    anchor: { rule: '백회 = 양 이개 장축(귓불→귀끝) 평면과 정중선의 교점 = 전발제 뒤 5촌', gv20: round(gv20), auricularApexZ: AURICULAR_APEX_Z, behindApexLineMm: mm(AURICULAR_APEX_Z - gv20.z) },
    gvMidline,
  },
  forehead: { rule: '미간~전발제 = 3촌 (동공중선)', cunMm: +(foreheadCun * 1000).toFixed(3) },
  posteriorTransverse: { rule: '유양돌기~유양돌기 = 9촌 (뒤통수 피부 호길이)', heightMm: mm(mastoidHeight), cunMm: +(TRANSVERSE_CUN * 1000).toFixed(3) },
  count: points.length,
  points,
};
fs.writeFileSync(new URL('../data/head-cun.json', import.meta.url), JSON.stringify(output, null, 1));
console.log(`scalp 1촌 ${output.scalp.cunMm} mm | forehead 1촌 ${output.forehead.cunMm} mm | posterior transverse 1촌 ${output.posteriorTransverse.cunMm} mm`);
console.log(`GV20 anchor: ${output.scalp.anchor.behindApexLineMm} mm behind the auricular-apex line (z ${mm(gv20.z)})`);
console.log(`posterior hairline y ${mm(posteriorHairline.y)} (hair mesh rejected at y ${mm(hairMeshPosterior.y)})`);
for (const p of points) console.log(`${p.code.padEnd(5)} ${p.korean.padEnd(4)} ${p.point.map((n) => (n * 1000).toFixed(1).padStart(7)).join('')}`);
