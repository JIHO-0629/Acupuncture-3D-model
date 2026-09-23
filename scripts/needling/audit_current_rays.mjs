// Read-only current-atlas ray audit. Mirrors app/scene.tsx's right-side skin
// projection, five shaft samples, interior-origin check, and first-hit scan.
import fs from 'node:fs';
import path from 'node:path';
import * as T from 'three';
import { allPoints } from './points_all.mjs';
import { loadAtlas, threeMesh } from '../atlas-geometry.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const inputPath = process.argv[2];
const outputPath = process.argv[3];
const limit = +(process.argv.find((arg) => arg.startsWith('--limit='))?.split('=')[1] ?? 0);
if (!inputPath || !outputPath) throw new Error('usage: audit_current_rays.mjs input.json output.json [--limit=N]');
const profiles = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const all = new Map(allPoints().map((point) => [point.code, point]));
const atlas = loadAtlas();
const supplementDir = path.join(root, 'public/models/zanatomy');
const supplement = JSON.parse(fs.readFileSync(path.join(supplementDir, 'zanatomy.json'), 'utf8'));
const supplementBuffers = supplement.chunks.map((chunk) => {
  const bytes = fs.readFileSync(path.join(supplementDir, path.basename(chunk.url)));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
});
for (const part of supplement.parts) {
  const buffer = supplementBuffers[part.chunk];
  atlas.parts.push({ ...part,
    positions: new Float32Array(buffer, part.positions, part.vertexCount * 3),
    normals: new Int16Array(buffer, part.normals, part.vertexCount * 3),
    indices: new Uint32Array(buffer, part.indices, part.indexCount),
    box: new T.Box3(new T.Vector3().fromArray(part.bounds[0]), new T.Vector3().fromArray(part.bounds[1])),
  });
}

const skins = atlas.parts.filter((part) => part.system === 'integumentary').map((part) => threeMesh(part));
const raycaster = new T.Raycaster();
const v = (array) => new T.Vector3(...array);
const headCentre = new T.Vector3(0, 1.59, 0);
function projectionDirection(seed, mode) {
  if (mode === 'anterior') return new T.Vector3(0, 0, 1);
  if (mode === 'posterior') return new T.Vector3(0, 0, -1);
  if (mode === 'dorsal-foot') return new T.Vector3(0, 1, 0);
  if (mode === 'lateral') return new T.Vector3(-1, 0, 0);
  return seed.clone().sub(headCentre).normalize();
}
function projectToSkin(def) {
  const seed = v(def.seed);
  const outward = def.outward ? v(def.outward).normalize() : projectionDirection(seed, def.projection);
  if (def.projection === 'direct') return { point: seed, normal: outward, missed: false };
  const origin = seed.clone().addScaledVector(outward, 0.24);
  raycaster.set(origin, outward.clone().negate());
  raycaster.far = Infinity;
  let best;
  let bestSeedDistance = Infinity;
  for (const mesh of skins) for (const hit of raycaster.intersectObject(mesh, false)) {
    const distance = hit.point.distanceTo(seed);
    if (distance < bestSeedDistance) { best = hit; bestSeedDistance = distance; }
  }
  if (!best) return { point: seed, normal: outward, missed: true };
  const normal = best.face.normal.clone().normalize();
  if (normal.dot(outward) < 0) normal.negate();
  return { point: best.point.clone(), normal, missed: false };
}

const insideDirections = [v([0.577, 0.577, 0.577]), v([-0.707, 0.1, 0.7]), v([0.1, -0.99, 0.1])].map((d) => d.normalize());
function insideNeedleMesh(mesh, origin) {
  let votes = 0;
  for (const direction of insideDirections) {
    raycaster.set(origin, direction);
    raycaster.far = Infinity;
    if (raycaster.intersectObject(mesh, false).length % 2 === 1) votes++;
  }
  return votes >= 2;
}
const meshCache = new Map();
const shaftRadius = 0.00065;
const hitPoint = new T.Vector3();
function hitsFor(surface, trajectory, depthMm) {
  const referenceAxis = Math.abs(trajectory.y) < 0.9 ? new T.Vector3(0, 1, 0) : new T.Vector3(1, 0, 0);
  const across = new T.Vector3().crossVectors(trajectory, referenceAxis).normalize();
  const around = new T.Vector3().crossVectors(trajectory, across).normalize();
  const origins = [
    surface.clone().addScaledVector(trajectory, 0.00015),
    surface.clone().addScaledVector(across, shaftRadius).addScaledVector(trajectory, 0.00015),
    surface.clone().addScaledVector(across, -shaftRadius).addScaledVector(trajectory, 0.00015),
    surface.clone().addScaledVector(around, shaftRadius).addScaledVector(trajectory, 0.00015),
    surface.clone().addScaledVector(around, -shaftRadius).addScaledVector(trajectory, 0.00015),
  ];
  const axisRay = new T.Ray(origins[0], trajectory);
  const scanDepth = depthMm / 1000;
  const hits = [];
  for (const [index, part] of atlas.parts.entries()) {
    if (part.system === 'integumentary') continue;
    const box = part.box.clone().expandByScalar(shaftRadius);
    if (!box.containsPoint(origins[0])) {
      const boxHit = axisRay.intersectBox(box, hitPoint);
      if (!boxHit || boxHit.distanceTo(origins[0]) > scanDepth + shaftRadius) continue;
    }
    let mesh = meshCache.get(index);
    if (!mesh) { mesh = threeMesh(part); meshCache.set(index, mesh); }
    let nearest = Infinity;
    for (const origin of origins) {
      raycaster.set(origin, trajectory);
      raycaster.far = scanDepth;
      const hit = raycaster.intersectObject(mesh, false)[0];
      if (hit && hit.distance < nearest) nearest = hit.distance;
    }
    raycaster.far = Infinity;
    if (part.box.containsPoint(origins[0]) && insideNeedleMesh(mesh, origins[0])) nearest = 0;
    if (nearest <= scanDepth) hits.push({ id: part.id, name: part.name, system: part.system,
      distanceMm: Math.round(nearest * 10000) / 10 });
  }
  return hits.sort((a, b) => a.distanceMm - b.distanceMm);
}

const output = {};
const started = Date.now();
for (const [index, profile] of (limit ? profiles.slice(0, limit) : profiles).entries()) {
  const def = all.get(profile.code);
  if (!def) throw new Error(`point definition missing: ${profile.code}`);
  const { point, normal, missed } = projectToSkin(def);
  const probeMm = profile.code.startsWith('GB') ? profile.probeMm
    : Math.max(profile.probeMm * 1.45, profile.probeMm + 5);
  const scanMm = Math.max(probeMm, profile.sourceMaxMm ?? 0);
  output[profile.code] = { missedSkin: missed, origin: point.toArray(), normal: normal.toArray(),
    hits: hitsFor(point, normal.clone().negate(), scanMm) };
  if ((index + 1) % 20 === 0) console.log(`${index + 1}/${limit || profiles.length} ${profile.code} ${(Date.now() - started) / 1000}s`);
}
fs.writeFileSync(outputPath, JSON.stringify(output));
console.log(`done ${Object.keys(output).length} points in ${((Date.now() - started) / 1000).toFixed(1)}s`);
