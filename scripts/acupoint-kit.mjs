/** Shared kit for per-meridian acupoint rule scripts.
 *
 * Sources, in order: KCMRIC (raw sheet location text) → WHO 2008 → labelled photo archive.
 * Rules (from the project failure log):
 *  - every anterior/posterior/lateral decision uses a LOCAL anatomical frame, never a world-axis extreme
 *  - the REGION named by the source is kept: skin projection is restricted to skin-regions.json labels
 *  - B-cun are proportional spans between landmarks, never fixed millimetres
 *  - generated points are `implemented_unverified` until the reviewer checks them visually
 * Every point is built on the RIGHT side; the viewer mirrors x for the left.
 */
import fs from 'node:fs';
import * as T from 'three';
import { loadAtlas, mesh, has, extremeCluster, slab, centroid, threeMesh } from './atlas-geometry.mjs';

export { mesh, has, extremeCluster, slab, centroid };
export const atlas = loadAtlas();
export const v = (x, y, z) => new T.Vector3(x, y, z);
export const round = (p) => p.toArray().map((n) => +n.toFixed(5));
export const mid = (a, b) => a.clone().add(b).multiplyScalar(0.5);
export const perp = (dir, axis) => dir.clone().addScaledVector(axis, -dir.dot(axis)).normalize();
export const LATERAL = v(-1, 0, 0), MEDIAL = v(1, 0, 0), ANTERIOR = v(0, 0, 1), POSTERIOR = v(0, 0, -1), UP = v(0, 1, 0), DOWN = v(0, -1, 0);

export const most = (points, dir) => {
  if (!points.length) throw new Error('empty point set');
  return points.reduce((best, p) => (p.dot(dir) > best.dot(dir) ? p : best)).clone();
};
export const centreOf = (points) => {
  if (!points.length) throw new Error('empty point set');
  return points.reduce((sum, p) => sum.add(p), v(0, 0, 0)).multiplyScalar(1 / points.length);
};
/** Vertices of `part` within a horizontal slab at height y, widening until populated. */
export const atHeight = (part, y, half = 0.004, filter) => {
  for (let h = half; h < 0.03; h *= 1.5) {
    const points = slab(part, 1, y, h, filter);
    if (points.length) return points;
  }
  throw new Error(`${part.name}: nothing near y=${y.toFixed(4)}`);
};
export const closestOnSegment = (p, a, b) => {
  const ab = b.clone().sub(a), t = T.MathUtils.clamp(p.clone().sub(a).dot(ab) / ab.lengthSq(), 0, 1);
  return a.clone().addScaledVector(ab, t);
};
/** Outward direction perpendicular to a limb axis a→b, passing through p. */
export const radialFrom = (p, a, b) => perp(p.clone().sub(closestOnSegment(p, a, b)), b.clone().sub(a).normalize());

const landmarkFile = JSON.parse(fs.readFileSync(new URL('../data/landmarks.json', import.meta.url), 'utf8'));
export const landmark = (id, side = 'right') => {
  const found = landmarkFile.landmarks.find((item) => item.id === id && item.side === side);
  if (!found || !found.point) throw new Error(`landmark missing: ${id}/${side}`);
  return v(...found.point);
};

// ---------------------------------------------------------------- region-constrained skin projection
const skinRegions = JSON.parse(fs.readFileSync(new URL('../data/skin-regions.json', import.meta.url), 'utf8'));
const regionOfTriangle = Buffer.from(skinRegions.regionOfTriangle, 'base64');
const regionLabel = (face) => skinRegions.regions[regionOfTriangle[face]]?.label;
const skin = threeMesh(mesh(atlas, 'Skin'));
const raycaster = new T.Raycaster();

/** Snap a deep anatomical point onto skin along `outward`, only accepting triangles of `regions`.
 *  Prefers skin on the outward side (thin parts such as the hand otherwise flip sides). */
export function toSkin(point, outward, regions) {
  const out = outward.clone().normalize();
  raycaster.set(point.clone().addScaledVector(out, 0.12), out.clone().negate());
  raycaster.far = 0.24;
  const hits = raycaster.intersectObject(skin, false).filter((hit) => !regions || regions.includes(regionLabel(hit.faceIndex)));
  if (!hits.length) throw new Error(`no skin hit in [${regions}] near ${round(point)}`);
  const outwardSide = hits.filter((hit) => { const d = hit.point.clone().sub(point).dot(out); return d >= 0 && d < 0.05; });
  const pool = outwardSide.length ? outwardSide : hits;
  const best = pool.reduce((b, hit) => (hit.point.distanceTo(point) < b.point.distanceTo(point) ? hit : b));
  return { point: best.point.clone(), region: regionLabel(best.faceIndex), depthMm: +(best.point.distanceTo(point) * 1000).toFixed(1) };
}

/** Closest skin vertex of the allowed regions — for hollows (axilla) where no single ray reaches the surface. */
const skinPart = mesh(atlas, 'Skin');
export function nearestSkin(point, regions) {
  let best = null, bestDistance = Infinity;
  const index = skinPart.indices, positions = skinPart.positions;
  for (let face = 0; face < index.length / 3; face++) {
    if (regions && !regions.includes(regionLabel(face))) continue;
    for (let corner = 0; corner < 3; corner++) {
      const i = index[face * 3 + corner] * 3;
      const d = (positions[i] - point.x) ** 2 + (positions[i + 1] - point.y) ** 2 + (positions[i + 2] - point.z) ** 2;
      if (d < bestDistance) { bestDistance = d; best = { point: v(positions[i], positions[i + 1], positions[i + 2]), region: regionLabel(face) }; }
    }
  }
  if (!best) throw new Error(`no skin vertex in [${regions}]`);
  return { ...best, depthMm: +(Math.sqrt(bestDistance) * 1000).toFixed(1) };
}

// ---------------------------------------------------------------- right upper-limb frame and B-cun spans
export function upperLimb() {
  const humerus = mesh(atlas, 'Right humerus'), radius = mesh(atlas, 'Right radius'), ulna = mesh(atlas, 'Right ulna');
  const lateralEpicondyle = extremeCluster(humerus, LATERAL, 0.01, (p) => p.y < humerus.box.min.y + 0.05);
  const medialEpicondyle = extremeCluster(humerus, MEDIAL, 0.01, (p) => p.y < humerus.box.min.y + 0.05);
  const elbowCentre = mid(lateralEpicondyle, medialEpicondyle);
  const radialStyloid = extremeCluster(radius, DOWN, 0.01);
  const ulnarHead = extremeCluster(ulna, DOWN, 0.01);
  const wristCentre = mid(radialStyloid, ulnarHead);
  const humeralHead = centroid(humerus, (p) => p.y > humerus.box.max.y - 0.03);
  let foldY = Infinity;
  for (const name of ['Sternocostal part of right pectoralis major', 'Abdominal part of right pectoralis major', 'Clavicular part of right pectoralis major']) {
    const part = mesh(atlas, name);
    for (let i = 0; i < part.vertexCount; i++) if (part.positions[i * 3] < -0.15) foldY = Math.min(foldY, part.positions[i * 3 + 1]);
  }
  // Reviewer decision (LI11, 2026-09-15): cubital crease lies 1 B-cun proximal to the lateral epicondyle.
  const epicondyleCun = (foldY - lateralEpicondyle.y) / 9;
  const creaseY = lateralEpicondyle.y + epicondyleCun;
  const wristY = radialStyloid.y; // palmar/dorsal wrist crease at the radiocarpal level
  return {
    humerus, radius, ulna, lateralEpicondyle, medialEpicondyle, elbowCentre, radialStyloid, ulnarHead, wristCentre, humeralHead,
    foldY, creaseY, wristY,
    armCun: (foldY - creaseY) / 9, // WHO: anterior axillary fold → cubital crease = 9 B-cun
    forearmCun: (creaseY - wristY) / 12, // WHO: cubital crease → wrist crease = 12 B-cun
    armAxis: humeralHead.clone().sub(elbowCentre).normalize(),
    forearmAxis: elbowCentre.clone().sub(wristCentre).normalize(),
  };
}

// ---------------------------------------------------------------- output
const sourceDir = new URL('../data/meridians/source/', import.meta.url);
export const readSource = (id) => JSON.parse(fs.readFileSync(new URL(`${id}.json`, sourceDir), 'utf8'));

/** Collects points and writes data/meridians/<ID>.json with raw source text preserved beside each rule. */
export function meridianWriter(id) {
  const source = readSource(id);
  const points = new Map();
  return {
    source,
    put(code, deep, outward, regions, rule, extra = {}) {
      const row = source.points.find((item) => item.code === code);
      if (!row) throw new Error(`source row missing: ${code}`);
      const snapped = toSkin(deep, outward, regions);
      points.set(code, { seed: round(snapped.point), outward: round(outward.clone().normalize()), region: snapped.region, depthMm: snapped.depthMm, rule, ...extra });
      return snapped.point;
    },
    /** Nearest-skin variant; outward is the direction from the deep anchor to the chosen skin vertex. */
    putNearest(code, deep, regions, rule, extra = {}) {
      if (!source.points.some((item) => item.code === code)) throw new Error(`source row missing: ${code}`);
      const nearest = nearestSkin(deep, regions);
      const outward = nearest.point.clone().sub(deep).normalize();
      points.set(code, { seed: round(nearest.point), outward: round(outward), region: nearest.region, depthMm: nearest.depthMm, rule, ...extra });
      return nearest.point;
    },
    /** Keep an already verified atlas surface/mucosal point without re-projecting it to Skin. */
    putDirect(code, surface, outward, region, rule, extra = {}) {
      if (!source.points.some((item) => item.code === code)) throw new Error(`source row missing: ${code}`);
      points.set(code, { seed: round(surface), outward: round(outward.clone().normalize()), region, depthMm: 0, rule, projection: 'direct', ...extra });
      return surface.clone();
    },
    get: (code) => v(...points.get(code).seed),
    getOutward: (code) => v(...points.get(code).outward),
    write(meta, overrides = {}) {
      const rows = source.points.map((row) => {
        const anchor = points.get(row.code);
        if (!anchor) throw new Error(`rule missing: ${row.code}`);
        return {
          code: row.code, korean: row.korean, hanja: row.hanja, english: overrides[row.code]?.english ?? row.english ?? '',
          location: overrides[row.code]?.location ?? row.location,
          rawLocation: row.location, rawMethod: row.method ?? '', classification: row.classification ?? '',
          whoStatus: row.whoStatus ?? '', whoNote: row.whoNote ?? '', manualCheck: row.manualCheck ?? '',
          needlingStatus: row.needlingStatus ?? 'allowed_unverified',
          needlingRestriction: row.needlingRestriction ?? '',
          sourceValidation: row.sourceValidation ?? null,
          status: 'implemented_unverified', ...anchor,
        };
      });
      fs.writeFileSync(new URL(`../data/meridians/${id}.json`, import.meta.url), JSON.stringify({ id, ...meta, generatedBy: `scripts/meridians/${id.toLowerCase()}.mjs`, points: rows }, null, 1) + '\n');
      for (const row of rows) console.log(row.code.padEnd(5), row.seed.join(', ').padEnd(30), row.region.padEnd(12), `depth ${String(row.depthMm).padStart(5)} mm ·`, row.rule);
    },
  };
}
