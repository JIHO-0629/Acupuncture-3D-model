/** Shared plumbing for scripts that reshape packed atlas meshes in place.
 *
 * scripts/fit-lungs-to-chest-wall.mjs grew the pattern: find how far each vertex has
 * to move, spread that into a smooth skirt over the surface so nothing creases,
 * rebuild the normals from the moved faces and rewrite the touched chunks. The trunk
 * fits need the same steps, so they live here once.
 */
import fs from 'node:fs';
import zlib from 'node:zlib';
import * as T from 'three';

export const modelDir = new URL('../public/models/', import.meta.url);
export const manifestPath = new URL('atlas.json', modelDir);

export function neighbourLists(part) {
  const neighbours = Array.from({ length: part.vertexCount }, () => new Set());
  for (let t = 0; t < part.indexCount; t += 3) {
    const a = part.indices[t], b = part.indices[t + 1], c = part.indices[t + 2];
    neighbours[a].add(b); neighbours[a].add(c);
    neighbours[b].add(a); neighbours[b].add(c);
    neighbours[c].add(a); neighbours[c].add(b);
  }
  return neighbours;
}

/** Grow a per-vertex displacement into its neighbours. Vertices with a requirement keep
 *  it exactly; the rest take a decaying share of their neighbours' mean. Works on each
 *  component of a vector field independently, so a signed displacement stays signed. */
export function skirt(part, required, fixed, passes, decay = 0.85) {
  const neighbours = neighbourLists(part), size = required.length / part.vertexCount;
  let field = Float64Array.from(required);
  for (let pass = 0; pass < passes; pass++) {
    const next = new Float64Array(field.length);
    for (let i = 0; i < part.vertexCount; i++) {
      if (fixed[i]) { for (let k = 0; k < size; k++) next[i * size + k] = required[i * size + k]; continue; }
      let n = 0;
      for (const j of neighbours[i]) { for (let k = 0; k < size; k++) next[i * size + k] += field[j * size + k]; n++; }
      for (let k = 0; k < size; k++) next[i * size + k] = n ? (next[i * size + k] / n) * decay : 0;
    }
    field = next;
  }
  return field;
}

/** Rebuild normals from the faces after a move, keeping the source mesh's outward sense. */
export function rebuildNormals(part) {
  const rebuilt = new Float64Array(part.vertexCount * 3);
  const a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3();
  const ab = new T.Vector3(), ac = new T.Vector3(), face = new T.Vector3();
  const at = (i, v) => v.set(part.positions[i * 3], part.positions[i * 3 + 1], part.positions[i * 3 + 2]);
  for (let t = 0; t < part.indexCount; t += 3) {
    const i0 = part.indices[t], i1 = part.indices[t + 1], i2 = part.indices[t + 2];
    at(i0, a); at(i1, b); at(i2, c);
    face.crossVectors(ab.subVectors(b, a), ac.subVectors(c, a));
    for (const i of [i0, i1, i2]) { rebuilt[i * 3] += face.x; rebuilt[i * 3 + 1] += face.y; rebuilt[i * 3 + 2] += face.z; }
  }
  let agree = 0;
  for (let i = 0; i < part.vertexCount; i += 17) {
    const dot = rebuilt[i * 3] * part.normals[i * 3] + rebuilt[i * 3 + 1] * part.normals[i * 3 + 1] + rebuilt[i * 3 + 2] * part.normals[i * 3 + 2];
    agree += dot > 0 ? 1 : -1;
  }
  const sign = agree >= 0 ? 1 : -1;
  for (let i = 0; i < part.vertexCount; i++) {
    const length = Math.hypot(rebuilt[i * 3], rebuilt[i * 3 + 1], rebuilt[i * 3 + 2]) || 1;
    for (let k = 0; k < 3; k++) {
      const value = Math.round((rebuilt[i * 3 + k] / length) * sign * 32767);
      part.normals[i * 3 + k] = Math.max(-32767, Math.min(32767, value));
    }
  }
}

/** Collects edited parts and writes their chunks, gzip payloads and bounds back. */
export function chunkWriter(manifest) {
  const touched = new Map();
  return {
    mark(part) {
      rebuildNormals(part);
      const low = [Infinity, Infinity, Infinity], high = [-Infinity, -Infinity, -Infinity];
      for (let i = 0; i < part.positions.length; i++) {
        const axis = i % 3, value = part.positions[i];
        if (value < low[axis]) low[axis] = value;
        if (value > high[axis]) high[axis] = value;
      }
      manifest.parts[part.index].bounds = [low, high];
      part.box = new T.Box3(new T.Vector3(...low), new T.Vector3(...high));
      touched.set(part.chunk, part.positions.buffer);
    },
    get count() { return touched.size; },
    write() {
      for (const [index, buffer] of touched) {
        const chunk = manifest.chunks[index], data = Buffer.from(buffer);
        fs.writeFileSync(new URL(chunk.url.split('/').pop(), modelDir), data);
        if (chunk.gzip) {
          const packed = zlib.gzipSync(data, { level: 9 });
          fs.writeFileSync(new URL(chunk.gzip.split('/').pop(), modelDir), packed);
          chunk.gzipBytes = packed.length;
        }
      }
      fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    },
  };
}

/** A regular (x, y) grid of per-cell values built from scattered samples, with holes
 *  filled from neighbours and an optional box blur. Used for the depth maps of the fits. */
export function grid({ x0, x1, y0, y1, step }) {
  const nx = Math.round((x1 - x0) / step) + 1, ny = Math.round((y1 - y0) / step) + 1;
  const value = new Float64Array(nx * ny).fill(NaN);
  const cell = (x, y) => {
    const i = Math.round((x - x0) / step), j = Math.round((y - y0) / step);
    return i < 0 || j < 0 || i >= nx || j >= ny ? -1 : j * nx + i;
  };
  return {
    nx, ny, value,
    x: (i) => x0 + i * step, y: (j) => y0 + j * step,
    put(x, y, v, keep = Math.max) { const c = cell(x, y); if (c < 0) return; value[c] = Number.isNaN(value[c]) ? v : keep(value[c], v); },
    at(x, y) { const c = cell(x, y); return c < 0 ? NaN : value[c]; },
    /** Bilinear read; NaN where any corner is empty. */
    sample(x, y) {
      const fx = (x - x0) / step, fy = (y - y0) / step, i = Math.floor(fx), j = Math.floor(fy);
      if (i < 0 || j < 0 || i + 1 >= nx || j + 1 >= ny) return this.at(x, y);
      const tx = fx - i, ty = fy - j, v = (a, b) => value[(j + b) * nx + (i + a)];
      const c = [v(0, 0), v(1, 0), v(0, 1), v(1, 1)];
      if (c.some(Number.isNaN)) return this.at(x, y);
      return (c[0] * (1 - tx) + c[1] * tx) * (1 - ty) + (c[2] * (1 - tx) + c[3] * tx) * ty;
    },
    blur(radius, passes = 1) {
      for (let p = 0; p < passes; p++) {
        const next = new Float64Array(value.length).fill(NaN);
        for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
          if (Number.isNaN(value[j * nx + i])) continue;
          let sum = 0, n = 0;
          for (let b = -radius; b <= radius; b++) for (let a = -radius; a <= radius; a++) {
            const ii = i + a, jj = j + b;
            if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue;
            const v = value[jj * nx + ii];
            if (!Number.isNaN(v)) { sum += v; n++; }
          }
          next[j * nx + i] = sum / n;
        }
        value.set(next);
      }
      return this;
    },
  };
}
