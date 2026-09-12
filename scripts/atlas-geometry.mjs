/** Shared geometry access for the offline landmark and acupoint pipeline.
 *
 * Everything here reads the packed atlas the browser already downloads, so a
 * landmark can never depend on geometry the viewer does not ship.
 */
import fs from 'node:fs';
import * as T from 'three';

const dir = new URL('../public/models/', import.meta.url);

export function loadAtlas() {
  const manifest = JSON.parse(fs.readFileSync(new URL('atlas.json', dir), 'utf8'));
  const buffers = manifest.chunks.map((chunk) => {
    const file = fs.readFileSync(new URL(chunk.url.split('/').pop(), dir));
    return file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
  });
  const byName = new Map();
  const parts = manifest.parts.map((part, index) => {
    const buffer = buffers[part.chunk];
    const record = {
      ...part,
      index,
      positions: new Float32Array(buffer, part.positions, part.vertexCount * 3),
      // Source normals are outward facing; trust them instead of guessing an outward
      // direction from winding order or from distance to the body axis.
      normals: new Int16Array(buffer, part.normals, part.vertexCount * 3),
      indices: new Uint32Array(buffer, part.indices, part.indexCount),
      box: new T.Box3(new T.Vector3().fromArray(part.bounds[0]), new T.Vector3().fromArray(part.bounds[1])),
    };
    byName.set(part.name.toLowerCase(), record);
    return record;
  });
  return { manifest, parts, byName };
}

/** Named lookup that fails loudly: a missing mesh must never silently become a guess. */
export function mesh(atlas, name) {
  const found = atlas.byName.get(name.toLowerCase());
  if (!found) throw new Error(`atlas has no mesh named "${name}"`);
  return found;
}

export function has(atlas, name) {
  return atlas.byName.has(name.toLowerCase());
}

const vector = (positions, i) => new T.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);

/** Vertex furthest along `direction`. The workhorse behind every bony prominence. */
export function extreme(part, direction, filter) {
  const axis = new T.Vector3().copy(direction).normalize();
  let best = -Infinity, found = null;
  for (let i = 0; i < part.vertexCount; i++) {
    const point = vector(part.positions, i);
    if (filter && !filter(point)) continue;
    const score = point.dot(axis);
    if (score > best) { best = score; found = point; }
  }
  if (!found) throw new Error(`${part.name}: no vertex satisfied the filter`);
  return found;
}

/** Vertices inside a slab perpendicular to `axis`, used for cross-sections. */
export function slab(part, axis, centre, halfThickness, filter) {
  const points = [];
  for (let i = 0; i < part.vertexCount; i++) {
    const point = vector(part.positions, i);
    if (Math.abs(point.getComponent(axis) - centre) > halfThickness) continue;
    if (filter && !filter(point)) continue;
    points.push(point);
  }
  return points;
}

/** Furthest point along `direction` within a cross-section, widening until the slab is populated. */
export function extremeInSection(part, axis, centre, direction, options = {}) {
  const unit = new T.Vector3().copy(direction).normalize();
  const { halfThickness = 0.003, maxHalfThickness = 0.02, filter } = options;
  for (let half = halfThickness; half <= maxHalfThickness; half *= 1.6) {
    const points = slab(part, axis, centre, half, filter);
    if (!points.length) continue;
    let best = -Infinity, found = null;
    for (const point of points) {
      const score = point.dot(unit);
      if (score > best) { best = score; found = point; }
    }
    return { point: found, halfThickness: half, sampled: points.length };
  }
  return null;
}

export function centroid(part, filter) {
  const sum = new T.Vector3();
  let count = 0;
  for (let i = 0; i < part.vertexCount; i++) {
    const point = vector(part.positions, i);
    if (filter && !filter(point)) continue;
    sum.add(point); count++;
  }
  if (!count) throw new Error(`${part.name}: no vertex satisfied the filter`);
  return sum.multiplyScalar(1 / count);
}

/** Vertices furthest along `direction`, averaged and then snapped back to a real vertex.
 *
 * Averaging alone makes a tip robust against one stray vertex but lifts the result off a
 * curved surface, so the mean is only used to choose which actual vertex to return. That
 * keeps every bony landmark provably on its own bone. */
export function extremeCluster(part, direction, fraction = 0.02, filter) {
  const axis = new T.Vector3().copy(direction).normalize();
  const scored = [];
  for (let i = 0; i < part.vertexCount; i++) {
    const point = vector(part.positions, i);
    if (filter && !filter(point)) continue;
    scored.push([point.dot(axis), point]);
  }
  if (!scored.length) throw new Error(`${part.name}: no vertex satisfied the filter`);
  scored.sort((a, b) => b[0] - a[0]);
  const take = Math.max(1, Math.round(scored.length * fraction));
  const mean = new T.Vector3();
  for (let i = 0; i < take; i++) mean.add(scored[i][1]);
  mean.multiplyScalar(1 / take);
  let best = Infinity, found = scored[0][1];
  for (let i = 0; i < take; i++) {
    const distance = scored[i][1].distanceToSquared(mean);
    if (distance < best) { best = distance; found = scored[i][1]; }
  }
  return found.clone();
}

export function threeMesh(part) {
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.BufferAttribute(part.positions, 3));
  geometry.setIndex(new T.BufferAttribute(part.indices, 1));
  geometry.computeBoundingSphere();
  const object = new T.Mesh(geometry, new T.MeshBasicMaterial({ side: T.DoubleSide }));
  object.matrixAutoUpdate = false;
  object.updateMatrixWorld(true);
  return object;
}

/** Box prefilter that treats an interior origin as distance zero.
 *  Ray.intersectBox returns the exit point when the origin is inside, which silently
 *  drops every structure large enough to enclose the ray's start. */
export function boxWithinRange(box, ray, range, padding = 0) {
  const padded = box.clone().expandByScalar(padding);
  if (padded.containsPoint(ray.origin)) return true;
  const hit = ray.intersectBox(padded, new T.Vector3());
  return !!hit && hit.distanceTo(ray.origin) <= range;
}

export const SIDES = ['right', 'left'];
/** The viewer's right side is -x. Sided landmarks are derived per side, never mirrored. */
export const sideSign = (side) => (side === 'right' ? -1 : 1);
export const sidedName = (side, name) => `${side === 'right' ? 'Right' : 'Left'} ${name}`;
