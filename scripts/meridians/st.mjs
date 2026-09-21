/** ST1–ST45 (족양명위경). node scripts/meridians/st.mjs → data/meridians/ST.json
 *
 * Checked against: KCMRIC (m.kmcric.com/knowledge/acupoint/ST) → WHO 2008 (TARA curated WHO text,
 * pp. 46–68) → photo archive images/ST/ST01–45.
 *
 * Reviewer decisions (2026-09-15):
 *  - ST6 협거: intersection of the mandibular-angle bisector and the earlobe horizontal (photo red point)
 *  - ST43 함곡: depression immediately proximal to the 2nd MTP joint (photo yellow point)
 * Photo notes applied: ST1 just above the palpable infraorbital-margin notch; ST2 at the foramen, not high;
 * ST4 close to the mouth angle; ST7 more anterior (directly below GB3); the 4촌 chest line and 2촌 abdominal
 * line follow the skin arc because the trunk widens; ST19 lies just below the costal arch.
 * Sheet error: ST30 raw text "앞정준선에서 가쪽으로 5촌" contradicts KCMRIC, WHO and its own next line. 2촌 is
 * used for the coordinate; the raw text is kept verbatim in rawLocation.
 */
import fs from 'node:fs';
import * as T from 'three';
import { atlas, mesh, centroid, v, mid, most, landmark, meridianWriter, UP, LATERAL, ANTERIOR } from '../acupoint-kit.mjs';
import { threeMesh } from '../atlas-geometry.mjs';

const W = meridianWriter('ST');
const log = {};
const r4 = (p) => p.toArray().map((n) => +n.toFixed(4));
const pts = (part, filter = () => true) => {
  const out = [];
  for (let i = 0; i < part.vertexCount; i++) {
    const p = v(part.positions[i * 3], part.positions[i * 3 + 1], part.positions[i * 3 + 2]);
    if (filter(p)) out.push(p);
  }
  return out;
};
const lowest = (a) => { if (!a.length) throw new Error('empty'); return a.reduce((b, p) => (p.y < b.y ? p : b)).clone(); };
const highest = (a) => { if (!a.length) throw new Error('empty'); return a.reduce((b, p) => (p.y > b.y ? p : b)).clone(); };
const exists = (name) => { try { mesh(atlas, name); return true; } catch { return false; } };

const headCun = JSON.parse(fs.readFileSync(new URL('../../data/head-cun.json', import.meta.url), 'utf8'));
const SCALP_CUN = headCun.scalp.cunMm / 1000;
/** Finger cun (F-cun) for the face and toes: the forehead B-cun is the nearest measured proxy. */
const F_CUN = headCun.forehead.cunMm / 1000;

// ---------------------------------------------------------------- skin normal sections (arc-length walks)
const skin = threeMesh(mesh(atlas, 'Skin'));
skin.updateMatrixWorld(true);
const raycaster = new T.Raycaster();
const SECTIONS = 1440, FOLD = 0.01;
function section(axis, value, centre, radius = 0.4) {
  const origin = centre.clone();
  origin[axis] = value;
  const [u, w] = axis === 'x' ? ['z', 'y'] : axis === 'y' ? ['x', 'z'] : ['x', 'y'];
  const curve = [];
  for (let i = 0; i < SECTIONS; i++) {
    const angle = (i / SECTIONS) * Math.PI * 2, direction = new T.Vector3();
    direction[u] = Math.cos(angle);
    direction[w] = Math.sin(angle);
    raycaster.set(origin.clone().addScaledVector(direction, radius), direction.clone().negate());
    const hit = raycaster.intersectObject(skin, false)[0];
    if (hit && Math.abs(hit.point[axis] - value) < 0.004) curve.push(hit.point.clone());
  }
  if (curve.length < SECTIONS * 0.3) throw new Error(`section ${axis}=${value} too sparse (${curve.length})`);
  return curve;
}
const nearestIndex = (curve, target) => curve.reduce((b, p, i) => (p.distanceTo(target) < curve[b].distanceTo(target) ? i : b), 0);
const stepToward = (curve, index, axis, sign) =>
  Math.sign(curve[(index + 1) % curve.length][axis] - curve[(index - 1 + curve.length) % curve.length][axis]) === sign ? 1 : -1;
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
  throw new Error(`advance ran out of curve before ${(distance * 1000).toFixed(1)} mm`);
}
function arcTo(curve, start, step, predicate) {
  let travelled = 0, i = start;
  for (let guard = 0; guard < curve.length; guard++) {
    if (predicate(curve[i])) return travelled;
    const next = (i + step + curve.length) % curve.length, leg = curve[i].distanceTo(curve[next]);
    if (leg < FOLD) travelled += leg;
    i = next;
  }
  throw new Error('arcTo never met its predicate');
}
/** Trunk transverse section at height y; returns the anterior midline index and the step toward the right side. */
function trunkRing(y) {
  const ring = section('y', y, v(0, y, -0.02));
  // Start on the midline itself: taking the most anterior point within ±12 mm let the start drift sideways and
  // shifted the 2 B-cun abdominal line by up to 15 mm between neighbouring points (first run: ST25 vs ST26).
  const front = ring.filter((p) => p.z > 0).reduce((b, p) => (Math.abs(p.x) < Math.abs(b.x) ? p : b));
  const index = nearestIndex(ring, front);
  return { ring, index, toRight: stepToward(ring, index, 'x', -1) };
}
/** Outward normal of a transverse section point, taken in the horizontal plane. */
const ringNormal = (p, y) => v(p.x, 0, p.z + 0.02).normalize();

// ---------------------------------------------------------------- face: ST1–ST7
const face = ['face'];
const pupil = landmark('pupil_center');
const maxilla = mesh(atlas, 'Right maxilla'), zygomatic = mesh(atlas, 'Right zygomatic bone');
{
  const onPupilLine = (p) => Math.abs(p.x - pupil.x) < 0.004;
  const margin = highest([...pts(maxilla, (p) => onPupilLine(p) && p.z > pupil.z - 0.005 && p.y < pupil.y), ...pts(zygomatic, (p) => onPupilLine(p) && p.z > pupil.z - 0.005 && p.y < pupil.y)]);
  W.put('ST1', v(pupil.x, margin.y + 0.0025, margin.z + 0.002), v(-0.12, 0.1, 1).normalize(), face,
    'pupil vertical line · between eyeball and infraorbital margin, just above the palpable margin notch (photo)');

  // The foramen is a dip in the anterior maxillary profile 6–12 mm below the margin. A wider window reaches the
  // canine fossa just above the ala and puts ST2 almost level with ST3 (first run: 3 mm apart).
  const column = pts(maxilla, onPupilLine);
  let foramen = null;
  for (let y = margin.y - 0.012; y <= margin.y - 0.006; y += 0.001) {
    const band = column.filter((p) => Math.abs(p.y - y) < 0.0012);
    if (!band.length) continue;
    const front = band.reduce((b, p) => (p.z > b.z ? p : b));
    if (!foramen || front.z < foramen.z) foramen = front;
  }
  if (!foramen) foramen = v(pupil.x, margin.y - 0.009, margin.z);
  W.put('ST2', v(pupil.x, foramen.y+0.004, foramen.z), v(-0.15, 0, 1).normalize(), face,
    'pupil vertical line · infraorbital foramen = dip in the anterior maxillary profile below the margin (photo: not high)');

  // Inferior border of the ala: lowest skin vertex of the alar base lateral to the septum.
  const lipTop = mesh(atlas, 'Lip').box.max.y;
  const alar = pts(mesh(atlas, 'Skin'), (p) => p.x < -0.010 && p.x > -0.020 && p.y > lipTop + 0.004 && p.y < 1.575 && p.z > 0.085);
  const alaY = lowest(alar).y;
  const frontAtAla = column.filter((p) => Math.abs(p.y - alaY) < 0.003);
  const alaZ = frontAtAla.length ? Math.max(...frontAtAla.map((p) => p.z)) : foramen.z;
  W.put('ST3', v(pupil.x, alaY, alaZ), v(-0.15, 0, 1).normalize(), face,
    'pupil vertical line · level of the inferior border of the ala of the nose');
  log.face = { margin: r4(margin), foramen: r4(foramen), alaY: +alaY.toFixed(4), lipTop: +lipTop.toFixed(4) };
}
{
  const angle = most(pts(mesh(atlas, 'Lip'), (p) => p.x < 0), LATERAL);
  // Along the cheek: lateral and slightly back, following the lip curvature.
  const tangent = v(-0.9, 0, -0.44).normalize();
  W.put('ST4', angle.clone().addScaledVector(tangent, 0.4 * F_CUN).add(v(0, 0, -0.004)), v(-0.45, 0, 0.9).normalize(), face,
    `0.4 F-cun (${(0.4 * F_CUN * 1000).toFixed(1)} mm) lateral to the angle of the mouth, on the nasolabial sulcus line (photo: close to the angle)`);
}
const mandible = pts(mesh(atlas, 'Mandible'), (p) => p.x < -0.02);
const massSuperficial = pts(mesh(atlas, 'Superficial part of right masseter'));
{
  const minY = Math.min(...massSuperficial.map((p) => p.y));
  const corner = most(massSuperficial.filter((p) => p.y < minY + 0.01), ANTERIOR);
  const border = lowest(mandible.filter((p) => p.x < corner.x + 0.004 && Math.abs(p.z - corner.z - 0.004) < 0.004));
  W.put('ST5', v(corner.x, border.y + 0.004, corner.z + 0.004), v(-0.85, -0.25, 0.45).normalize(), ['face', 'neck'],
    'anterior to the angle of the mandible · depression anterior to the masseter attachment on the lower border · facial artery');
  log.st5 = { masseterCorner: r4(corner), mandibleBorder: r4(border) };
}
{
  // Reviewer decision: 턱뼈각 이등분선 ∩ 귓불 수평선. The auricle is a presentation mesh (app/ear-anatomy.ts);
  // its lobule inferior tip sits at y 1.5666 with the current AURICLE_OFFSET.
  const EARLOBE_Y = 1.5666;
  const gonion = most(mandible, v(0, -1, -1).normalize());
  const condyle = landmark('mandibular_condyle');
  const bodyPoint = lowest(mandible.filter((p) => p.z > gonion.z + 0.03));
  // Bisect the angle as seen from the side (sagittal plane), as the photo draws it; the medial slope of the
  // mandibular body otherwise tilts the bisector toward the mouth.
  const sagittal = (d) => v(0, d.y, d.z).normalize();
  const ramus = sagittal(condyle.clone().sub(gonion)), body = sagittal(bodyPoint.clone().sub(gonion));
  const bisector = ramus.clone().add(body).normalize();
  const hit = gonion.clone().addScaledVector(bisector, (EARLOBE_Y - gonion.y) / bisector.y);
  const over = massSuperficial.filter((p) => Math.abs(p.y - hit.y) < 0.004 && Math.abs(p.z - hit.z) < 0.004);
  const deep = v(over.length ? Math.min(...over.map((p) => p.x)) : hit.x - 0.012, hit.y, hit.z);
  W.put('ST6', deep, v(-1, 0, 0.2).normalize(), face,
    'mandibular-angle bisector ∩ earlobe horizontal (reviewer decision: photo red point) · over the masseter');
  log.st6 = { gonion: r4(gonion), bisector: r4(bisector), hit: r4(hit), onMasseter: over.length > 0 };
}
{
  // WHO note: directly below GB3 (above the midpoint of the zygomatic arch). Keep that z unless the coronoid
  // process fills the gap under the arch; then walk back toward the mandibular notch to the first real depression.
  const arch = [...pts(zygomatic), ...pts(mesh(atlas, 'Right temporal bone'))].filter((p) => p.x < -0.05);
  const archMid = landmark('zygomatic_arch_midpoint');
  let chosen = null;
  for (let z = archMid.z; z > archMid.z - 0.02; z -= 0.002) {
    const archBottom = lowest(arch.filter((p) => Math.abs(p.z - z) < 0.002)).y;
    const top = mandible.filter((p) => Math.abs(p.z - z) < 0.0015);
    const mandTop = top.length ? highest(top).y : archBottom - 0.02;
    if (archBottom - mandTop >= 0.006) { chosen = { z, y: (archBottom + mandTop) / 2, archBottom, mandTop }; break; }
  }
  if (!chosen) throw new Error('ST7: no depression found below the zygomatic arch');
  W.put('ST7', v(archMid.x + 0.004, chosen.y, chosen.z), v(-1, 0, 0), ['face', 'head'],
    'depression between the inferior border of the zygomatic arch and the mandibular notch · directly below GB3 (photo: anterior)');
  log.st7 = { z: +chosen.z.toFixed(4), archBottom: +chosen.archBottom.toFixed(4), mandibleTop: +chosen.mandTop.toFixed(4) };
}

// ---------------------------------------------------------------- head: ST8
{
  const hair = pts(mesh(atlas, 'Hair of head'), (p) => p.z > 0);
  const columns = [];
  for (let x = 0; x >= -0.085; x -= 0.0025) {
    const c = hair.filter((p) => Math.abs(p.x - x) < 0.00125);
    if (c.length) columns.push(lowest(c));
  }
  // Corner of the forehead: last frontal-hairline column before the line drops into the temporal hairline.
  let corner = null;
  for (let i = 0; i < columns.length - 1; i++) if (columns[i].y - columns[i + 1].y > 0.01) { corner = columns[i]; break; }
  if (!corner) throw new Error('ST8: forehead hairline corner not found');
  const sagittal = section('x', corner.x, v(0, 1.6, -0.012));
  const index = nearestIndex(sagittal, corner);
  const point = advance(sagittal, index, stepToward(sagittal, index, 'y', 1), 0.5 * SCALP_CUN);
  W.put('ST8', point.clone().sub(point.clone().sub(v(0, 1.59, 0)).normalize().multiplyScalar(0.006)), point.clone().sub(v(0, 1.59, 0)).normalize(), ['head', 'face'],
    `corner of the forehead hairline (Hair of head) · 0.5 B-cun above on the scalp arc (${(0.5 * SCALP_CUN * 1000).toFixed(1)} mm) · defines 4.5 B-cun from the midline`);
  const ring = section('y', corner.y, v(0, corner.y, -0.012));
  const front = ring.filter((p) => Math.abs(p.x) < 0.012 && p.z > 0).reduce((b, p) => (p.z > b.z ? p : b));
  const i2 = nearestIndex(ring, front);
  log.st8 = { corner: r4(corner), anteriorTransverseCunMm: +(arcTo(ring, i2, stepToward(ring, i2, 'x', -1), (p) => p.x <= corner.x) / 4.5 * 1000).toFixed(2) };
}

// ---------------------------------------------------------------- neck: ST9–ST12
const scm = pts(mesh(atlas, 'Right sternocleidomastoid'), (p) => p.x < 0);
const neck = ['neck'];
{
  const thyroidTop = highest(pts(mesh(atlas, 'Thyroid cartilage')));
  // Reviewer (2026-09-21): level with C4. On this model the thyroid top sits at the C3/C4 disc, 10 mm higher than the
  // C4 body, so the vertebral level wins and the thyroid top is kept only in the log.
  const c4 = mesh(atlas, 'Fourth cervical vertebra'), y9 = (c4.box.min.y + c4.box.max.y) / 2;
  const border9 = most(scm.filter((p) => Math.abs(p.y - y9) < 0.003), ANTERIOR);
  // Skin just under the jaw is labelled 'face'; neck-only let the ray exit through the back of the neck (101 mm).
  W.put('ST9', v(border9.x + 0.003, y9, border9.z + 0.003), v(-0.5, 0, 0.87).normalize(), ['neck', 'face'],
    'level of the C4 vertebral body (superior thyroid border region) · anterior to sternocleidomastoid · common carotid pulse');
  const cricoid = mesh(atlas, 'Cricoid cartilage'), cricoidY = (cricoid.box.min.y + cricoid.box.max.y) / 2;
  const border10 = most(scm.filter((p) => Math.abs(p.y - cricoidY) < 0.003), ANTERIOR);
  W.put('ST10', v(border10.x + 0.002, cricoidY, border10.z + 0.003), v(-0.4, 0, 0.92).normalize(), neck,
    'level of the cricoid cartilage · just anterior to the border of sternocleidomastoid');
  log.neck = { thyroidTopY: +thyroidTop.y.toFixed(4), c4CentreY: +y9.toFixed(4), scmBorder9: r4(border9), cricoidY: +cricoidY.toFixed(4), scmBorder10: r4(border10) };
}
const clavicle = mesh(atlas, 'Right clavicle');
const clavicleMedial = most(pts(clavicle), v(1, 0, 0)), clavicleLateral = most(pts(clavicle), LATERAL);
{
  // Lesser supraclavicular fossa: the widest x-gap between the sternal and clavicular heads just above the clavicle.
  // Cut just below the top of the medial clavicle: 18 mm higher the sparse sternal head showed an internal gap and
  // the point landed in the middle of that head (reviewer, 2026-09-21).
  const y = highest(pts(clavicle, (p) => p.x > -0.035 && p.x < -0.01)).y - 0.003;
  const xs = [...scm.filter((p) => Math.abs(p.y - y) < 0.0025 && p.z > 0).map((p) => p.x)].sort((a, b) => b - a);
  let gap = { width: 0, sternalEdge: clavicleMedial.x - 0.01 };
  for (let i = 1; i < xs.length; i++) if (xs[i - 1] - xs[i] > gap.width) gap = { width: xs[i - 1] - xs[i], sternalEdge: xs[i - 1] };
  // Reviewer: hug the lateral border of the sternal head, and sit close to the top of the clavicle.
  const x11 = gap.sternalEdge - 0.002;
  const top = highest(pts(clavicle, (p) => Math.abs(p.x - x11) < 0.004));
  // skin-regions labels the skin over the medial clavicle 'shoulder', so it is allowed here.
  W.put('ST11', v(x11, top.y + 0.004, top.z + 0.004), v(0, 0.45, 0.9).normalize(), ['neck', 'thorax', 'shoulder'],
    'lesser supraclavicular fossa · just above the sternal end of the clavicle · immediately lateral to the sternal head of sternocleidomastoid');
  log.st11 = { cutY: +y.toFixed(4), sternalHeadLateralX: +gap.sternalEdge.toFixed(4), headGapWidthMm: +(gap.width * 1000).toFixed(1) };
}

// ---------------------------------------------------------------- transverse trunk scale (skin arc)
// WHO: mammillary line = 4 B-cun. Nipples are not meshed, so the clavicle midpoint marks the 4 B-cun line at
// clavicle level (same anchor as LU1/LU2); the arc length from the midline to it on the skin is 4 B-cun.
const clavicleMidX = (clavicleMedial.x + clavicleLateral.x) / 2;
const clavicleLevel = centroid(clavicle, (p) => Math.abs(p.x - clavicleMidX) < 0.006).y;
const TRUNK_CUN = (() => {
  const { ring, index, toRight } = trunkRing(clavicleLevel);
  return arcTo(ring, index, toRight, (p) => p.x <= clavicleMidX) / 4;
})();
/** Skin point `cun` B-cun lateral to the anterior midline at height y, measured along the skin. */
const lateralOnSkin = (y, cun) => {
  const { ring, index, toRight } = trunkRing(y);
  return advance(ring, index, toRight, cun * TRUNK_CUN);
};
log.trunk = { cunMm: +(TRUNK_CUN * 1000).toFixed(2), clavicleLevel: +clavicleLevel.toFixed(4), clavicleMidX: +clavicleMidX.toFixed(4) };


// ---------------------------------------------------------------- chest: ST13–ST18 on the 4 B-cun skin line
const ribParts = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'].map((n) =>
  [`Right ${n} rib`, `Right ${n} costal cartilage`].filter(exists).map((name) => mesh(atlas, name)));
const ribBand = (k, x) => {
  const column = ribParts[k - 1].flatMap((part) => pts(part, (p) => Math.abs(p.x - x) < 0.004 && p.z > 0.02));
  if (column.length) return { low: lowest(column).y, high: highest(column).y };
  // Rib 1 ends medial to the 4 B-cun line: take its most lateral anterior part.
  const fallback = ribParts[k - 1].flatMap((part) => pts(part, (p) => p.z > 0.02 && p.x > x && p.x < x + 0.025));
  if (!fallback.length) throw new Error(`rib ${k} not found near x=${x.toFixed(3)}`);
  return { low: lowest(fallback).y, high: highest(fallback).y };
};
/** Intercostal space k at the 4 B-cun skin line: iterate because the line's x depends on height. */
const intercostal = (k) => {
  let y = (ribBand(k, clavicleMidX).low + ribBand(k + 1, clavicleMidX).high) / 2;
  for (let pass = 0; pass < 2; pass++) {
    const x = lateralOnSkin(y, 4).x;
    y = (ribBand(k, x).low + ribBand(k + 1, x).high) / 2;
  }
  return y;
};
const chest = ['thorax', 'shoulder'];
const putOnTrunkLine = (code, y, cun, regions, rule) => {
  const surface = lateralOnSkin(y, cun);
  const normal = ringNormal(surface, y);
  W.put(code, surface.clone().addScaledVector(normal, -0.01), normal, regions, rule);
};
{
  // Nipple, drawn as a skin presentation (data/nipple.json → app/nipple-presentation.ts); BodyParts3D has none.
  // Reviewer (2026-09-21, second pass): the first placement on the 4 B-cun line sat far too medial. Male NAC
  // anthropometry puts the internipple distance at 60 ± 4 % of the thoracic width, independent of height and BMI
  // (PMC12399017), and the nipple on the most projecting point of the pectoral contour; the 4 B-cun line here gave 50 %.
  // Height is the 4th intercostal space just above the 5th rib (the reviewer's rule), taken at the nipple's x.
  let nippleY = ribBand(5, clavicleMidX).high + 0.004;
  for (let pass = 0; pass < 2; pass++) nippleY = ribBand(5, lateralOnSkin(nippleY, 4).x).high + 0.004;
  const lineY = nippleY;
  const skinVerts = pts(mesh(atlas, 'Skin'));
  const torsoHalfWidth = (y) => {
    // Walk outward over the front of the chest until the gap to the hanging arm (the back skin bridges the gap).
    const xs = [...new Set(skinVerts.filter((p) => Math.abs(p.y - y) < 0.004 && p.x < -0.05 && p.z > 0).map((p) => p.x))].sort((a, b) => b - a);
    let edge = xs[0];
    for (const x of xs) { if (edge - x > 0.02) break; edge = x; }
    return -edge;
  };
  const thoracicWidth = 2 * torsoHalfWidth(nippleY), nippleX = -0.3 * thoracicWidth;
  // Height: the reviewer's rule, just above the 5th rib (4th intercostal space), measured at the nipple's own x because the
  // rib climbs laterally. This lands 17.6 cm from the sternal notch, within 1 SD of the anthropometric 19.3 ± 1.7 cm.
  nippleY = ribBand(5, nippleX).high + 0.004;
  raycaster.set(v(nippleX, nippleY, 0.3), v(0, 0, -1));
  const nippleHit = raycaster.intersectObject(skin, false)[0];
  const nipple = nippleHit.point.clone();
  const nippleNormal = nippleHit.face.normal.clone().normalize().add(ringNormal(nipple, nippleY)).normalize();
  fs.writeFileSync(new URL('../../data/nipple.json', import.meta.url), JSON.stringify({
    generatedBy: 'scripts/meridians/st.mjs',
    rule: 'internipple distance = 60 % of the thoracic width at the 4th intercostal level (male NAC anthropometry); height just above the 5th rib (4th intercostal space) at that x; right side, the viewer mirrors x for the left',
    thoracicWidthMm: +(thoracicWidth * 1000).toFixed(1), internippleMm: +(-2 * nippleX * 1000).toFixed(1),
    centre: r4(nipple), normal: r4(nippleNormal),
  }, null, 1) + '\n');
  // ST12 and ST13 stay on the vertical 4 B-cun line at nipple height (the reviewer found ST12 too lateral, so they do
  // not follow the anatomical nipple outward); the arc drifts laterally above the clavicle, so the x is fixed here.
  const lineX = lateralOnSkin(lineY, 4).x;
  const top12 = highest(pts(clavicle, (p) => Math.abs(p.x - lineX) < 0.004));
  W.put('ST12', v(lineX, top12.y + 0.007, top12.z - 0.004), v(0, 0.65, 0.76).normalize(), ['neck', 'shoulder', 'thorax'],
    'greater supraclavicular fossa · on the vertical nipple line (4 B-cun) · depression above the clavicle');
  const clavicleLow = lowest(pts(clavicle, (p) => Math.abs(p.x - lineX) < 0.004)).y;
  // Reviewer: immediately below the clavicle, on the same line as ST12.
  W.put('ST13', v(lineX, clavicleLow - 0.003, 0.03), ANTERIOR, chest, 'immediately inferior to the clavicle · on the vertical nipple line with ST12 (4 B-cun)');
  const ics = {};
  for (const [code, k, extra] of [['ST14', 1, ''], ['ST15', 2, ' · below the 2nd rib at the sternal angle'], ['ST16', 3, ''], ['ST17', 4, ' · centre of the nipple in males (WHO)'], ['ST18', 5, ' · nipple line in males']]) {
    ics[code] = intercostal(k);
    putOnTrunkLine(code, ics[code], 4, chest, `${['1st', '2nd', '3rd', '4th', '5th'][k - 1]} intercostal space · 4 B-cun lateral (skin arc)${extra}`);
  }
  // ST17 is the centre of the nipple, so it follows the rendered nipple (lower part of the 4th intercostal space).
  log.chest = { clavicleLowY: +clavicleLow.toFixed(4), ics: Object.fromEntries(Object.entries(ics).map(([k, y]) => [k, +y.toFixed(4)])) };
}

// ---------------------------------------------------------------- abdomen: ST19–ST30 on the 2 B-cun skin line
const xiphisternal = landmark('xiphisternal_junction', null), umbilicus = landmark('umbilicus', null), pubis = landmark('pubic_symphysis_superior', null);
const upperCun = (xiphisternal.y - umbilicus.y) / 8, lowerCun = (umbilicus.y - pubis.y) / 5;
const abdomen = ['thorax', 'lumbar', 'pelvis'];
{
  const cartilage = ['Right sixth costal cartilage', 'Right seventh costal cartilage'].filter(exists).map((n) => mesh(atlas, n));
  let y19 = umbilicus.y + 6 * upperCun;
  const column = lateralOnSkin(y19, 2);
  const arch = cartilage.flatMap((part) => pts(part, (p) => Math.abs(p.x - column.x) < 0.004 && p.z > 0.03));
  const archLow = arch.length ? lowest(arch).y : null;
  // Photo: if the costal arch covers the nominal point, take the point just below the arch.
  const covered = archLow !== null && archLow < y19 - 0.002;
  if (covered) y19 = archLow - 0.004;
  putOnTrunkLine('ST19', y19, 2, abdomen, `6 B-cun above the umbilicus · 2 B-cun lateral (skin arc)${covered ? ' · moved just below the costal arch' : ' · just below the costal arch'}`);
  log.st19 = { nominalY: +(umbilicus.y + 6 * upperCun).toFixed(4), archLowY: archLow && +archLow.toFixed(4), covered };
}
for (const [code, cun] of [['ST20', 5], ['ST21', 4], ['ST22', 3], ['ST23', 2], ['ST24', 1]]) {
  putOnTrunkLine(code, umbilicus.y + cun * upperCun, 2, abdomen, `${cun} B-cun above the centre of the umbilicus · 2 B-cun lateral (skin arc)`);
}
putOnTrunkLine('ST25', umbilicus.y, 2, abdomen, '2 B-cun lateral to the centre of the umbilicus (skin arc)');
for (const [code, cun] of [['ST26', 1], ['ST27', 2], ['ST28', 3], ['ST29', 4]]) {
  putOnTrunkLine(code, umbilicus.y - cun * lowerCun, 2, abdomen, `${cun} B-cun below the centre of the umbilicus · 2 B-cun lateral (skin arc)`);
}
{
  // Reviewer (2026-09-21): re-seat ST30 now that the inguinal ligament is modelled. At the pubic-symphysis level the
  // 2 B-cun column passed 10 mm below the ligament; the point goes on the skin over the ligament at that column,
  // which is where the inguinal groove lies (about 0.3 B-cun above the symphysis level on this body).
  const column30 = lateralOnSkin(pubis.y, 2);
  const band30 = pts(mesh(atlas, 'Right inguinal ligament'), (p) => Math.abs(p.x - column30.x) < 0.004);
  const lig30 = band30.reduce((s, p) => s.add(p), v(0, 0, 0)).multiplyScalar(1 / band30.length);
  putOnTrunkLine('ST30', lig30.y, 2, ['pelvis', 'thigh-R'], 'inguinal groove over the inguinal ligament · 2 B-cun lateral (skin arc) · pubic-symphysis level region (sheet "5촌" is an error)');
  const artery = most(pts(mesh(atlas, 'Right femoral artery'), (p) => Math.abs(p.y - pubis.y) < 0.006), ANTERIOR);
  log.st30 = { femoralArtery: r4(artery), pointX: +W.get('ST30').x.toFixed(4) };
}
log.abdomen = { upperCunMm: +(upperCun * 1000).toFixed(1), lowerCunMm: +(lowerCun * 1000).toFixed(1) };

// ---------------------------------------------------------------- thigh: ST31–ST34
const asis = landmark('asis'), patellaBase = landmark('patella_base');
const patella = mesh(atlas, 'Right patella');
const patellaLateralBase = most(pts(patella, (p) => p.y > patella.box.max.y - 0.01), LATERAL);
const thighCun = (pubis.y - patellaBase.y) / 18; // WHO: pubic symphysis superior border → patella base = 18 B-cun
const onAsisPatellaLine = (y) => asis.clone().lerp(patellaLateralBase, (asis.y - y) / (asis.y - patellaLateralBase.y));
const thighOut = v(-0.35, 0, 0.94).normalize();
{
  const hip = mesh(atlas, 'Right hip bone');
  const medialX = Math.min(...pts(hip, (p) => p.y < 0.93).map((p) => Math.abs(p.x)));
  const symphysisBottom = lowest(pts(hip, (p) => Math.abs(p.x) < medialX + 0.004 && p.z > -0.01 && p.y < 0.93));
  const line = onAsisPatellaLine(symphysisBottom.y);
  const rectus = pts(mesh(atlas, 'Right rectus femoris'), (p) => Math.abs(p.y - symphysisBottom.y) < 0.005);
  const deep = v(line.x, symphysisBottom.y, rectus.length ? Math.max(...rectus.map((p) => p.z)) : line.z - 0.015);
  W.put('ST31', deep, ANTERIOR, ['thigh-R', 'pelvis'],
    'depression among rectus femoris (proximal), sartorius and tensor fasciae latae · ASIS–lateral patella base line at the level of the inferior border of the pubic symphysis');
  const sartorius = pts(mesh(atlas, 'Right sartorius'), (p) => Math.abs(p.y - symphysisBottom.y) < 0.005);
  const tfl = pts(mesh(atlas, 'Right tensor fasciae latae'), (p) => Math.abs(p.y - symphysisBottom.y) < 0.005);
  log.st31 = { symphysisBottomY: +symphysisBottom.y.toFixed(4), lineX: +line.x.toFixed(4), sartoriusLateralX: +Math.min(...sartorius.map((p) => p.x)).toFixed(4), tflMedialX: +Math.max(...tfl.map((p) => p.x)).toFixed(4) };
}
{
  const y32 = patellaBase.y + 6 * thighCun, line32 = onAsisPatellaLine(y32);
  W.put('ST32', v(line32.x, y32, line32.z), thighOut, ['thigh-R'], 'ASIS–lateral patella base line · 6 B-cun above the base of the patella');
  const rectus = pts(mesh(atlas, 'Right rectus femoris')), vastus = pts(mesh(atlas, 'Right vastus lateralis'));
  const y33 = patellaBase.y + 3 * thighCun;
  const rf33 = most(rectus.filter((p) => Math.abs(p.y - y33) < 0.004), LATERAL);
  W.put('ST33', v(rf33.x - 0.002, y33, rf33.z), thighOut, ['thigh-R', 'knee-R'], 'lateral to the rectus femoris tendon · 3 B-cun above the base of the patella');
  const y34 = patellaBase.y + 2 * thighCun;
  const rf34 = most(rectus.filter((p) => Math.abs(p.y - y34) < 0.004), LATERAL);
  const vl34 = most(vastus.filter((p) => Math.abs(p.y - y34) < 0.004), v(0.5, 0, 1).normalize());
  W.put('ST34', v((rf34.x + vl34.x) / 2, y34, Math.max(rf34.z, vl34.z)), thighOut, ['thigh-R', 'knee-R'],
    'between vastus lateralis and the lateral border of the rectus femoris tendon · 2 B-cun above the base of the patella');
  const midpoint = onAsisPatellaLine(y32).lerp(patellaLateralBase, 0.5);
  log.thigh = { thighCunMm: +(thighCun * 1000).toFixed(1), st33VsWhoMidpointXmm: +((rf33.x - 0.002 - midpoint.x) * 1000).toFixed(1) };
}

// ---------------------------------------------------------------- knee and leg: ST35–ST41
const tibia = mesh(atlas, 'Right tibia');
const patellaApex = landmark('patella_apex'); // registered surface landmark
const kneeLine = landmark('knee_joint_line');
const st35Deep = v(patellaApex.x - 0.013, (patellaApex.y + kneeLine.y) / 2, patellaApex.z);
W.put('ST35', st35Deep, v(-0.35, 0, 0.94).normalize(), ['knee-R', 'leg-R', 'thigh-R'],
  'depression lateral to the patellar ligament · below the lateral patella, at the joint space');
const medialMalleolus = landmark('medial_malleolus_prominence'); // registered surface landmark
const lateralMalleolus = landmark('lateral_malleolus_prominence');
const ankleY = (medialMalleolus.y + lateralMalleolus.y) / 2;
const ehl = most(pts(mesh(atlas, 'Right extensor hallucis longus'), (p) => Math.abs(p.y - ankleY) < 0.003), v(0, 1, 1).normalize());
const edl = most(pts(mesh(atlas, 'Right extensor digitorum longus'), (p) => Math.abs(p.y - ankleY) < 0.003), v(1, 0, 0));
const st41Deep = v((ehl.x + edl.x) / 2, ankleY, Math.max(ehl.z, edl.z));
W.put('ST41', st41Deep, v(0, 0.35, 0.94).normalize(), ['leg-R', 'foot-R'],
  'centre of the front of the ankle · between extensor hallucis longus and extensor digitorum longus tendons · level of the malleoli midpoint');
const legOut = v(-0.25, 0, 0.97).normalize();
// The ST35–ST41 chord runs over the anterior tibial crest; WHO/KCMRIC place ST36–ST39 on tibialis anterior, one
// fingerbreadth lateral to the crest. Bone and muscle extremes jump between the crest and the medial tibial surface
// from one height to the next (earlier runs: 17–20 mm sideways jumps), so the offset is walked on the skin instead:
// at each height, cut the leg skin, take the shin's most anterior point, and walk laterally along the skin.
const legRing = (y) => {
  const c = centroid(tibia, (p) => Math.abs(p.y - y) < 0.006);
  const centre = v(c.x, y, c.z);
  // 9 cm rays stay inside the right leg; longer ones reach the left leg first.
  const ring = section('y', y, centre, 0.09);
  const front = ring.reduce((b, p) => (p.z > b.z ? p : b));
  const index = nearestIndex(ring, front);
  return { ring, index, centre, toLateral: stepToward(ring, index, 'x', -1) };
};
const lateralOnShin = (y, fingerCun) => {
  const r = legRing(y);
  const surface = advance(r.ring, r.index, r.toLateral, fingerCun * F_CUN);
  const normal = v(surface.x - r.centre.x, 0, surface.z - r.centre.z).normalize();
  return { surface, normal, crest: r.ring[r.index] };
};
const shin = {};
for (const [code, cun] of [['ST36', 3], ['ST37', 6], ['ST38', 8], ['ST39', 9]]) {
  const y = st35Deep.y + (st41Deep.y - st35Deep.y) * (cun / 16);
  const { surface, normal, crest } = lateralOnShin(y, 1);
  shin[code] = { crestX: +crest.x.toFixed(4) };
  W.put(code, surface.clone().addScaledVector(normal, -0.006), normal, ['leg-R', 'knee-R'],
    `ST35–ST41 line (16 B-cun) · ${cun} B-cun below ST35 · on tibialis anterior, 1 F-cun lateral to the shin crest (skin arc)`);
}
{
  // WHO note: ST40 is one fingerbreadth lateral to ST38, on the lateral border of tibialis anterior.
  const y38 = st35Deep.y + (st41Deep.y - st35Deep.y) * 0.5;
  const { surface, normal } = lateralOnShin(y38, 2);
  W.put('ST40', surface.clone().addScaledVector(normal, -0.006), normal, ['leg-R'],
    'lateral border of tibialis anterior · 8 B-cun above the lateral malleolus prominence · one fingerbreadth lateral to ST38 (skin arc)');
  const slabTA = pts(mesh(atlas, 'Right tibialis anterior'), (p) => Math.abs(p.y - y38) < 0.004);
  const borderTA = most(slabTA, v(-1, 0, 0.5).normalize());
  log.leg = { ankleY: +ankleY.toFixed(4), shin, st40LateralToSt38Mm: +(W.get('ST38').distanceTo(W.get('ST40')) * 1000).toFixed(1), taAnterolateralBorder: r4(borderTA) };
}

// ---------------------------------------------------------------- foot: ST42–ST45
const foot = ['foot-R'];
{
  const mt2 = mesh(atlas, 'Right second metatarsal bone'), cuneiform = mesh(atlas, 'Right intermediate cuneiform bone');
  // Reviewer (2026-09-21, comment entered one row up on ST41): the point read as the 1st metatarsal base. The two
  // highest vertices sat on the medial edge of the joint, level in x with the 1st metatarsal base; centre it on the
  // 2nd metatarsal base instead, at the top of the joint line.
  const baseVerts = pts(mt2, (p) => p.z < mt2.box.min.z + 0.008), frontVerts = pts(cuneiform, (p) => p.z > cuneiform.box.max.z - 0.006);
  const x42 = baseVerts.reduce((s, p) => s + p.x, 0) / baseVerts.length;
  const near = (list) => list.filter((p) => Math.abs(p.x - x42) < 0.004);
  const mt2Base = most(near(baseVerts), UP), cuneiformFront = most(near(frontVerts).length ? near(frontVerts) : frontVerts, UP);
  const deep = v(x42, Math.max(mt2Base.y, cuneiformFront.y), (mt2Base.z + cuneiformFront.z) / 2);
  W.put('ST42', deep, v(0, 0.9, 0.43).normalize(), foot, 'joint of the 2nd metatarsal base and the intermediate cuneiform (centred on the 2nd metatarsal base) · dorsalis pedis artery');
  const artery = pts(mesh(atlas, 'Right dorsalis pedis artery')).reduce((b, p) => (p.distanceTo(deep) < b.distanceTo(deep) ? p : b));
  log.st42 = { arteryDistanceMm: +(artery.distanceTo(deep) * 1000).toFixed(1) };

  // Reviewer decision: yellow point, immediately proximal to the 2nd MTP joint.
  const mt3 = mesh(atlas, 'Right third metatarsal bone');
  const z43 = mt2.box.max.z - 0.020;
  const mt2Side = most(pts(mt2, (p) => Math.abs(p.z - z43) < 0.003), LATERAL);
  const mt3Side = most(pts(mt3, (p) => Math.abs(p.z - z43) < 0.003), v(1, 0, 0));
  W.put('ST43', v((mt2Side.x + mt3Side.x) / 2, Math.max(mt2Side.y, mt3Side.y), z43), v(0, 1, 0.1).normalize(), foot,
    'between the 2nd and 3rd metatarsals · depression immediately proximal to the 2nd MTP joint (reviewer decision: photo yellow point)');

  const pp2 = mesh(atlas, 'Proximal phalanx of right second toe'), pp3 = mesh(atlas, 'Proximal phalanx of right third toe');
  const z44 = Math.max(pp2.box.min.z, pp3.box.min.z) + 0.004;
  const toe2 = most(pts(pp2, (p) => Math.abs(p.z - z44) < 0.003), LATERAL);
  const toe3 = most(pts(pp3, (p) => Math.abs(p.z - z44) < 0.003), v(1, 0, 0));
  W.put('ST44', v((toe2.x + toe3.x) / 2, Math.max(toe2.y, toe3.y), z44), v(0, 0.95, 0.3).normalize(), foot,
    'between the 2nd and 3rd toes · proximal to the web margin, at the red-white flesh border');

  const distal = mesh(atlas, 'Distal phalanx of right second toe'), middle = mesh(atlas, 'Middle phalanx of right second toe');
  const neighbour = exists('Distal phalanx of right third toe') ? mesh(atlas, 'Distal phalanx of right third toe') : mesh(atlas, 'Proximal phalanx of right third toe');
  const longitudinal = centroid(distal).sub(centroid(middle)).normalize();
  const lateral = centroid(neighbour).sub(centroid(distal)).normalize();
  const dorsal = longitudinal.clone().cross(lateral).normalize();
  if (dorsal.y < 0) dorsal.negate();
  const size = distal.box.getSize(new T.Vector3());
  const corner = centroid(distal)
    .addScaledVector(longitudinal, -size.z * 0.15)
    .addScaledVector(lateral, (size.x / 2) * 0.35)
    .addScaledVector(dorsal, distal.box.max.y - centroid(distal).y);
  // 0.1 F-cun proximal-lateral to the nail-root corner (toenails are not modelled).
  const nailPoint = corner.addScaledVector(longitudinal, -0.1 * F_CUN * 0.7).addScaledVector(lateral, 0.1 * F_CUN * 0.35);
  W.put('ST45', nailPoint, lateral.clone().multiplyScalar(0.6).add(dorsal.clone().multiplyScalar(0.8)).normalize(), foot,
    '2nd toe · 0.1 F-cun proximal-lateral to the lateral corner of the toenail root (nail footprint estimated from the distal phalanx)');
}

const english = ['Chengqi', 'Sibai', 'Juliao', 'Dicang', 'Daying', 'Jiache', 'Xiaguan', 'Touwei', 'Renying', 'Shuitu', 'Qishe', 'Quepen', 'Qihu', 'Kufang', 'Wuyi', 'Yingchuang', 'Ruzhong', 'Rugen', 'Burong', 'Chengman', 'Liangmen', 'Guanmen', 'Taiyi', 'Huaroumen', 'Tianshu', 'Wailing', 'Daju', 'Shuidao', 'Guilai', 'Qichong', 'Biguan', 'Futu', 'Yinshi', 'Liangqiu', 'Dubi', 'Zusanli', 'Shangjuxu', 'Tiaokou', 'Xiajuxu', 'Fenglong', 'Jiexi', 'Chongyang', 'Xiangu', 'Neiting', 'Lidui'];
const overrides = Object.fromEntries(english.map((name, i) => [`ST${i + 1}`, { english: name }]));
overrides.ST30.location = '샅부위, 두덩결합 위모서리와 같은 높이, 앞정중선에서 가쪽으로 2촌, 넙다리동맥이 뛰는 곳 (시트 원문의 "5촌"은 KCMRIC·WHO와 불일치하여 2촌 적용)';
overrides.ST6.location = '턱뼈각 이등분선과 귓불 수평선이 만나는 점 (검수자 결정: 사진 빨간 점), 턱뼈각에서 위앞쪽 약 1촌';
W.write({
  label: '위경', name: '족양명위경', english: 'STOMACH MERIDIAN',
  primarySource: 'https://m.kmcric.com/knowledge/acupoint/ST', secondarySource: 'https://iris.who.int/handle/10665/353407',
  scale: { trunkCunMm: +(TRUNK_CUN * 1000).toFixed(1), upperAbdomenCunMm: +(upperCun * 1000).toFixed(1), lowerAbdomenCunMm: +(lowerCun * 1000).toFixed(1), thighCunMm: +(thighCun * 1000).toFixed(1), scalpCunMm: headCun.scalp.cunMm, fCunMm: headCun.forehead.cunMm },
}, overrides);
console.log(JSON.stringify(log, null, 1));
