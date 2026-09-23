/** Put quadratus lumborum back in front of the erector spinae.
 *
 * Quadratus lumborum came from BodyParts3D 3.0 (scripts/restore-bp3-trunk-wall.mjs);
 * the erector spinae are 4.0. Its top meets the twelfth rib, but lower down the 3.0
 * muscle sits 5-20 mm too far back: at L2-L4 its posterior surface lies behind the
 * front of iliocostalis and longissimus and behind the tips of the transverse
 * processes, so a lumbar back-shu needle (BL23, BL25, BL26, BL52) met quadratus
 * lumborum before - or instead of - the erector spinae. In the body the order is
 * thoracolumbar fascia, erector spinae, then quadratus lumborum anterior to it, with
 * psoas and the kidney further forward.
 *
 * On a grid of posterior rays the script measures, per column, how far the back of
 * quadratus lumborum has to come forward to clear the front of the erector spinae by
 * 2 mm, and how far it may come before its front meets psoas, the kidney or the colon
 * (again with 2 mm to spare). The smaller of the two, blurred over neighbouring
 * columns, moves every vertex of the column forward, so the muscle keeps its thickness.
 *
 * Usage: node scripts/fit-quadratus-lumborum.mjs [--check]
 */
import fs from 'node:fs';
import * as T from 'three';
import { loadAtlas, threeMesh } from './atlas-geometry.mjs';
import { chunkWriter, grid, manifestPath } from './mesh-edit.mjs';

const check = process.argv.includes('--check');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const atlas = loadAtlas();
const writer = chunkWriter(manifest);
const named = (name) => atlas.parts.find((p) => p.name === name);
const CLEARANCE = 0.002, STEP = 0.003;
const raycaster = new T.Raycaster();
const objects = new Map();
const object = (part) => { let o = objects.get(part); if (!o) { o = threeMesh(part); objects.set(part, o); } return o; };
const zs = (parts, x, y) => {
  raycaster.set(new T.Vector3(x, y, -0.4), new T.Vector3(0, 0, 1)); raycaster.far = 0.6;
  return parts.flatMap((p) => raycaster.intersectObject(object(p), false).map((h) => h.point.z)).sort((a, b) => a - b);
};

for (const side of ['Right', 'Left']) {
  const QL = named(`${side} quadratus lumborum`);
  const erector = [`${side} iliocostalis lumborum`, `${side} longissimus thoracis`, `${side} iliocostalis thoracis`].map(named).filter(Boolean);
  const deep = [`${side} psoas major`, `${side} kidney`, side === 'Right' ? 'Ascending colon' : 'Descending colon'].map(named).filter(Boolean);
  const shift = grid({ x0: QL.box.min.x - 0.01, x1: QL.box.max.x + 0.01, y0: QL.box.min.y - 0.01, y1: QL.box.max.y + 0.01, step: STEP });
  let columns = 0, capped = 0;
  for (let j = 0; j < shift.ny; j++) for (let i = 0; i < shift.nx; i++) {
    const x = shift.x(i), y = shift.y(j);
    const q = zs([QL], x, y);
    if (!q.length) continue;
    const e = zs(erector, x, y), d = zs(deep, x, y).filter((z) => z > q[0]);
    const need = e.length ? Math.max(0, e[e.length - 1] + CLEARANCE - q[0]) : 0;
    const room = d.length ? Math.max(0, d[0] - CLEARANCE - q[q.length - 1]) : Infinity;
    if (need > room) capped++;
    shift.put(x, y, Math.min(need, room));
    columns++;
  }
  // Edge vertices fall in cells no ray hit; carry the shift outward so the rim moves with the muscle.
  for (let pass = 0; pass < 4; pass++) {
    const next = Float64Array.from(shift.value);
    for (let j = 0; j < shift.ny; j++) for (let i = 0; i < shift.nx; i++) {
      if (!Number.isNaN(shift.value[j * shift.nx + i])) continue;
      let sum = 0, n = 0;
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ii = i + a, jj = j + b;
        if (ii < 0 || jj < 0 || ii >= shift.nx || jj >= shift.ny) continue;
        const value = shift.value[jj * shift.nx + ii];
        if (!Number.isNaN(value)) { sum += value; n++; }
      }
      if (n) next[j * shift.nx + i] = sum / n;
    }
    shift.value.set(next);
  }
  shift.blur(2, 2);
  let worst = 0;
  const move = new Float64Array(QL.vertexCount);
  for (let v = 0; v < QL.vertexCount; v++) {
    const value = shift.sample(QL.positions[v * 3], QL.positions[v * 3 + 1]);
    move[v] = Number.isNaN(value) ? 0 : value;
    worst = Math.max(worst, move[v]);
  }
  console.log(`${QL.name}: ${columns} columns, forward up to ${(worst * 1000).toFixed(1)} mm${capped ? `, ${capped} columns limited by the organs in front` : ''}`);
  if (check || worst < 1e-4) continue;
  for (let v = 0; v < QL.vertexCount; v++) QL.positions[v * 3 + 2] += move[v];
  writer.mark(QL);
}
if (check) console.log('\n(check only, nothing written)');
else if (writer.count) { writer.write(); console.log(`rewrote ${writer.count} chunks`); }
