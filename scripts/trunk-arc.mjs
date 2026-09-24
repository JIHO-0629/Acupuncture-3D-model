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

const ribParts = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'].map((n) =>
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
