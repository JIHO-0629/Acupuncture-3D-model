/** Skin arc-length helpers for trunk points (KI, LR). Same method and scale as scripts/meridians/st.mjs:
 * distances are walked along transverse skin sections, and the clavicle midpoint marks the 4 B-cun
 * mammillary line at clavicle level (the anchor already used by LU1/LU2 and ST12–ST18).
 */
import * as T from 'three';
import { atlas, mesh, centroid, v, most, LATERAL } from './acupoint-kit.mjs';
import { threeMesh } from './atlas-geometry.mjs';

const skin = threeMesh(mesh(atlas, 'Skin'));
skin.updateMatrixWorld(true);
const raycaster = new T.Raycaster();
const SECTIONS = 1440, FOLD = 0.01;

export const pts = (part, filter = () => true) => {
  const out = [];
  for (let i = 0; i < part.vertexCount; i++) {
    const p = v(part.positions[i * 3], part.positions[i * 3 + 1], part.positions[i * 3 + 2]);
    if (filter(p)) out.push(p);
  }
  return out;
};
export const lowest = (a) => { if (!a.length) throw new Error('empty point set'); return a.reduce((b, p) => (p.y < b.y ? p : b)).clone(); };
export const highest = (a) => { if (!a.length) throw new Error('empty point set'); return a.reduce((b, p) => (p.y > b.y ? p : b)).clone(); };
export const exists = (name) => { try { mesh(atlas, name); return true; } catch { return false; } };

export function section(axis, value, centre, radius = 0.4) {
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
export const nearestIndex = (curve, target) => curve.reduce((b, p, i) => (p.distanceTo(target) < curve[b].distanceTo(target) ? i : b), 0);
export const stepToward = (curve, index, axis, sign) =>
  Math.sign(curve[(index + 1) % curve.length][axis] - curve[(index - 1 + curve.length) % curve.length][axis]) === sign ? 1 : -1;
export function advance(curve, start, step, distance) {
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
export function arcTo(curve, start, step, predicate) {
  let travelled = 0, i = start;
  for (let guard = 0; guard < curve.length; guard++) {
    if (predicate(curve[i])) return travelled;
    const next = (i + step + curve.length) % curve.length, leg = curve[i].distanceTo(curve[next]);
    if (leg < FOLD) travelled += leg;
    i = next;
  }
  throw new Error('arcTo never met its predicate');
}

/** Trunk transverse section at height y, starting on the anterior midline, stepping toward the right side. */
export function trunkRing(y) {
  const ring = section('y', y, v(0, y, -0.02));
  const front = ring.filter((p) => p.z > 0).reduce((b, p) => (Math.abs(p.x) < Math.abs(b.x) ? p : b));
  const index = nearestIndex(ring, front);
  return { ring, index, toRight: stepToward(ring, index, 'x', -1) };
}
export const ringNormal = (p) => v(p.x, 0, p.z + 0.02).normalize();

const clavicle = mesh(atlas, 'Right clavicle');
const clavicleMedial = most(pts(clavicle), v(1, 0, 0)), clavicleLateral = most(pts(clavicle), LATERAL);
export const clavicleMidX = (clavicleMedial.x + clavicleLateral.x) / 2;
export const clavicleLevel = centroid(clavicle, (p) => Math.abs(p.x - clavicleMidX) < 0.006).y;
export const TRUNK_CUN = (() => {
  const { ring, index, toRight } = trunkRing(clavicleLevel);
  return arcTo(ring, index, toRight, (p) => p.x <= clavicleMidX) / 4;
})();
/** Skin point `cun` B-cun lateral to the anterior midline at height y, measured along the skin. */
export const lateralOnSkin = (y, cun) => {
  const { ring, index, toRight } = trunkRing(y);
  return cun === 0 ? ring[index].clone() : advance(ring, index, toRight, cun * TRUNK_CUN);
};

const ribParts = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth'].map((n) =>
  [`Right ${n} rib`, `Right ${n} costal cartilage`].filter(exists).map((name) => mesh(atlas, name)));
const ribBand = (k, x) => {
  const column = ribParts[k - 1].flatMap((part) => pts(part, (p) => Math.abs(p.x - x) < 0.004 && p.z > 0.02));
  if (column.length) return { low: lowest(column).y, high: highest(column).y };
  // The 6 B-cun skin line can lie lateral to the bony rib on this reference
  // body.  In that case use the nearest available lateral rib column instead
  // of failing or silently falling back to a medial segment.
  const anterior = ribParts[k - 1].flatMap((part) => pts(part, (p) => p.z > -0.02));
  const nearestX = anterior.reduce((best, p) => Math.abs(p.x - x) < Math.abs(best - x) ? p.x : best, anterior[0]?.x ?? x);
  const fallback = anterior.filter((p) => Math.abs(p.x - nearestX) < 0.006);
  if (!fallback.length) throw new Error(`rib ${k} not found near x=${x.toFixed(3)}`);
  return { low: lowest(fallback).y, high: highest(fallback).y };
};
/** Height of intercostal space k on the `cun` B-cun skin line. The rib slope changes with x, so iterate. */
export const intercostalOnLine = (k, cun) => {
  let x = -cun * TRUNK_CUN;
  let y = (ribBand(k, x).low + ribBand(k + 1, x).high) / 2;
  for (let pass = 0; pass < 3; pass++) {
    x = lateralOnSkin(y, cun).x;
    y = (ribBand(k, x).low + ribBand(k + 1, x).high) / 2;
  }
  return y;
};
export const clavicleLowOnLine = (cun) => {
  const x = lateralOnSkin(clavicleLevel, cun).x;
  return lowest(pts(clavicle, (p) => Math.abs(p.x - x) < 0.004)).y;
};

// ---------------------------------------------------------------- mammillary (nipple) line and the chest B-cun
// Photo archive (ST12, ST14, ST16, LR14, GB24; reviewer, 2026-09-26): the 4 B-cun line leaves the clavicle where
// it bends and, because the chest widens, curves outward to pass through the nipple; below the nipple LR14 and
// GB24 sit straight down on it. On the chest, 4 B-cun is therefore the skin arc to this line at each height, and
// the 2, 5 and 6 B-cun lines scale with it; the abdomen keeps TRUNK_CUN.
// Where the nipple sits (reviewer on the model, 2026-09-26): at the lower lateral edge of the pectoral mound, where
// the front chest contour turns. A ratio taken from the photos (1.18 × the clavicle midpoint) put it about 15 mm too
// medial on this broad-chested body. At nipple height the contour runs within ~12° of the frontal plane out to
// x ≈ 107 mm and then steepens past 25°; that turn is the nipple's x.
export const PECTORAL_TURN_DEG = 25;
/** x where the front skin contour at height y first leans more than PECTORAL_TURN_DEG from the frontal plane. */
export const pectoralTurnX = (y) => {
  const { ring, index, toRight } = trunkRing(y), step = toRight * 3;
  let i = index, previous = ring[i];
  for (let guard = 0; guard < ring.length; guard++) {
    i = (i + step + ring.length) % ring.length;
    const next = ring[i], dx = next.x - previous.x, dz = next.z - previous.z;
    if (Math.hypot(dx, dz) < 1e-4) continue;
    if (next.x < -0.06 && Math.atan2(-dz, -dx) * 180 / Math.PI >= PECTORAL_TURN_DEG) return next.x;
    previous = next;
    if (next.x < -0.2) break;
  }
  throw new Error(`no pectoral turn found at y=${y.toFixed(4)}`);
};
const MAMMILLARY_TOP = { y: clavicleLevel, x: clavicleMidX };
/** Nipple height: just above the 5th rib (4th intercostal space) measured on the clavicle-midpoint line. Measured at
 *  the nipple's own x the rib has climbed and the nipple rose 16 mm above where the reviewer marked it. */
export const nippleY = ribBand(5, clavicleMidX).high + 0.004;
export const nippleX = pectoralTurnX(nippleY);
/** x of the mammillary line at height y: the clavicle midpoint at clavicle level, easing out to the nipple, straight below it. */
export const mammillaryX = (y) => {
  if (y >= MAMMILLARY_TOP.y) return MAMMILLARY_TOP.x;
  // Below the nipple the chest wall narrows toward the costal margin; held at the nipple's x, LR14 and GB24 read as
  // lateral (reviewer, 2026-09-26). From 30 mm below the nipple (under ST18) the line eases medially 1 mm per 8 mm.
  if (y <= nippleY) return nippleX + Math.max(0, nippleY - 0.03 - y) / 8;
  const t = (MAMMILLARY_TOP.y - y) / (MAMMILLARY_TOP.y - nippleY);
  return MAMMILLARY_TOP.x + (nippleX - MAMMILLARY_TOP.x) * Math.pow(t, 1.5);
};
/** Millimetres of skin per chest B-cun at height y: the arc from the midline to the mammillary line is 4 B-cun. */
export const chestCunAt = (y) => {
  const { ring, index, toRight } = trunkRing(y);
  return arcTo(ring, index, toRight, (p) => p.x <= mammillaryX(y)) / 4;
};
/** Skin point `cun` chest B-cun lateral to the anterior midline at height y. */
export const chestLateralOnSkin = (y, cun) => {
  const { ring, index, toRight } = trunkRing(y);
  return advance(ring, index, toRight, cun * chestCunAt(y));
};
/** Height of intercostal space k on the `cun` chest B-cun line. */
export const intercostalOnChestLine = (k, cun) => {
  let x = mammillaryX(nippleY) * cun / 4;
  let y = (ribBand(k, x).low + ribBand(k + 1, x).high) / 2;
  for (let pass = 0; pass < 3; pass++) {
    x = chestLateralOnSkin(y, cun).x;
    y = (ribBand(k, x).low + ribBand(k + 1, x).high) / 2;
  }
  return y;
};
/** The nipple itself: on the skin at (nippleX, nippleY). */
export const nippleSurface = () => chestLateralOnSkin(nippleY, 4);
