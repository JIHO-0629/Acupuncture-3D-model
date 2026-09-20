/** Is a point outside this body's surface?
 *
 * Three earlier answers to that question were wrong, and the reason matters. The
 * BodyParts3D skin is not a clean closed surface: 57% of its triangles have more skin
 * beyond them along their own normal, so it carries inner sheets and folds. Anything
 * built on its normals (nearest triangle and its facing) or on its watertightness (ray
 * parity) reports the brain, the stomach and the humerus as outside the body.
 *
 * What survives that mesh is visibility. A point outside the body can see out: some
 * direction leaves it and meets no surface at all. A point under the skin cannot, in
 * any direction, because whatever sheet it crosses first still stops the ray. Counting
 * the directions that escape needs no normals and no closed surface.
 *
 * Measured over the atlas, that separates cleanly. Deep structures - stomach, humerus,
 * scapula, a temporal gyrus, masseter, lower lobe of lung - escape in 0.005 to 0.038 of
 * directions, never more than 0.04. Structures that really do break the surface reach
 * 0.33 (platysma), 0.38 (sternum, iliotibial tract) and 0.46 (xiphoid). A tenth of the
 * directions is comfortably between the two.
 *
 * The whole body surface counts as cover, not the Skin mesh alone: the scalp is covered
 * by the hair mesh, and the lips by their own.
 */
import * as T from 'three';

const SLAB = 0.05;
/** The atlas body axis through the trunk. */
export const AXIS = new T.Vector3(0, 0, 0.02);
export const OUTSIDE = 0.1;

/** 24 roughly even directions on the sphere, from a Fibonacci spiral. */
export const DIRECTIONS = Array.from({ length: 24 }, (_, i) => {
  const polar = Math.acos(1 - 2 * (i + 0.5) / 24);
  const azimuth = Math.PI * (1 + Math.sqrt(5)) * i;
  return new T.Vector3(Math.sin(polar) * Math.cos(azimuth), Math.cos(polar), Math.sin(polar) * Math.sin(azimuth));
});

export function buildSurface(atlas) {
  const parts = atlas.parts.filter((p) => p.system === 'integumentary');
  const slabs = new Map();
  for (const part of parts) {
    for (let t = 0; t < part.indexCount; t += 3) {
      const corners = [0, 1, 2].map((k) => {
        const i = part.indices[t + k];
        return [part.positions[i * 3], part.positions[i * 3 + 1], part.positions[i * 3 + 2]];
      });
      const lowest = Math.floor(Math.min(...corners.map((c) => c[1])) / SLAB);
      const highest = Math.floor(Math.max(...corners.map((c) => c[1])) / SLAB);
      // A triangle spanning a slab boundary belongs to every slab it touches.
      for (let s = lowest; s <= highest; s++) {
        let list = slabs.get(s);
        if (!list) slabs.set(s, (list = []));
        for (const corner of corners) list.push(...corner);
      }
    }
  }
  const meshes = new Map();
  for (const [slab, values] of slabs) {
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.BufferAttribute(new Float32Array(values), 3));
    geometry.computeBoundingSphere();
    const mesh = new T.Mesh(geometry, new T.MeshBasicMaterial({ side: T.DoubleSide }));
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrixWorld(true);
    meshes.set(slab, mesh);
  }
  const raycaster = new T.Raycaster();
  const REACH = 0.45;
  const blocked = (origin, direction) => {
    raycaster.set(origin, direction);
    raycaster.far = REACH;
    // Only the slabs the ray actually passes through. A horizontal ray stays in one of
    // them; searching the whole body's height instead made this eighteen times the work.
    const end = origin.y + direction.y * REACH;
    for (let s = Math.floor(Math.min(origin.y, end) / SLAB); s <= Math.floor(Math.max(origin.y, end) / SLAB); s++) {
      const mesh = meshes.get(s);
      if (!mesh) continue;
      if (raycaster.intersectObject(mesh, false).length) return true;
    }
    return false;
  };
  const step = new T.Vector3();
  const away = new T.Vector3();
  return {
    parts,
    blocked,
    /** One ray in front of the 24, so the visibility test only runs where it can matter.
     *  A point under the skin is blocked heading away from the body axis; a point that
     *  is not blocked there is worth the full test. Cheap, and wrong only where the axis
     *  is a poor sense of "out" - the sole of a foot, the inside of an orbit - which the
     *  full test then rejects anyway. */
    mayBeOutside(point) {
      away.set(point.x - AXIS.x, 0, point.z - AXIS.z);
      if (away.lengthSq() < 1e-8) return true;
      away.normalize();
      return !blocked(step.copy(point).addScaledVector(away, 0.0003), away);
    },
    /** Share of directions that leave the point without meeting any body surface. */
    escape(point) {
      let free = 0;
      for (const direction of DIRECTIONS) {
        step.copy(point).addScaledVector(direction, 0.0003);
        if (!blocked(step, direction)) free++;
      }
      return free / DIRECTIONS.length;
    },
    /** Distance back to the surface along `direction`, for a point that is outside it.
     *  One ray, where stepping back until the point stops seeing out would be hundreds. */
    reentry(point, direction, range = 0.05) {
      raycaster.set(step.copy(point).addScaledVector(direction, -0.0002), direction.clone().negate());
      raycaster.far = range;
      let best = Infinity;
      const end = step.y - direction.y * range;
      for (let s = Math.floor(Math.min(step.y, end) / SLAB); s <= Math.floor(Math.max(step.y, end) / SLAB); s++) {
        const mesh = meshes.get(s);
        if (!mesh) continue;
        const hit = raycaster.intersectObject(mesh, false)[0];
        if (hit && hit.distance < best) best = hit.distance;
      }
      return best === Infinity ? null : best;
    },
    /** Mean of the escaping directions: the way out, taken from the body rather than
     *  from a normal this mesh cannot supply. Null when the point is enclosed. */
    outward(point) {
      const mean = new T.Vector3();
      let free = 0;
      for (const direction of DIRECTIONS) {
        step.copy(point).addScaledVector(direction, 0.0003);
        if (blocked(step, direction)) continue;
        mean.add(direction);
        free++;
      }
      if (!free || mean.lengthSq() < 1e-12) return null;
      return { direction: mean.normalize(), escape: free / DIRECTIONS.length };
    },
  };
}

/** Cheap gate in front of the visibility test.
 *
 * Firing 24 rays from all 1.5 million atlas vertices is hours of work, and all but a
 * handful are nowhere near the surface. A point with no surface vertex within `near` is
 * either deep inside the body or grossly outside it, and a gross outlier is caught by
 * the second test: nothing may sit further from the body axis than the surface does at
 * that height. Everything else goes to the rays.
 */
export function buildGate(atlas, near = 0.012) {
  const CELL = near, BAND = 0.02;
  const grid = new Map();
  const widest = new Map();
  const key = (x, y, z) => Math.floor(x / CELL) + ':' + Math.floor(y / CELL) + ':' + Math.floor(z / CELL);
  for (const part of atlas.parts) {
    if (part.system !== 'integumentary') continue;
    for (let i = 0; i < part.vertexCount; i++) {
      const x = part.positions[i * 3], y = part.positions[i * 3 + 1], z = part.positions[i * 3 + 2];
      const cell = key(x, y, z);
      let list = grid.get(cell);
      if (!list) grid.set(cell, (list = []));
      list.push(x, y, z);
      const band = Math.floor(y / BAND);
      const radius = Math.hypot(x - AXIS.x, z - AXIS.z);
      if (radius > (widest.get(band) ?? 0)) widest.set(band, radius);
    }
  }
  const limit = near * near;
  return (point) => {
    const cx = Math.floor(point.x / CELL), cy = Math.floor(point.y / CELL), cz = Math.floor(point.z / CELL);
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) {
      const list = grid.get((cx + i) + ':' + (cy + j) + ':' + (cz + k));
      if (!list) continue;
      for (let v = 0; v < list.length; v += 3) {
        const dx = list[v] - point.x, dy = list[v + 1] - point.y, dz = list[v + 2] - point.z;
        if (dx * dx + dy * dy + dz * dz <= limit) return true;
      }
    }
    const band = widest.get(Math.floor(point.y / BAND));
    return band !== undefined && Math.hypot(point.x - AXIS.x, point.z - AXIS.z) > band;
  };
}
