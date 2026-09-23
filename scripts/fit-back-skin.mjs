/** Bring the skin of the upper back closer to the muscles under it.
 *
 * Over the scapulae the BodyParts3D skin stands 25-55 mm off the first muscle, while
 * the same body carries 3-20 mm over the chest and abdomen and 15-25 mm over the
 * lumbar back. The excess is local: skin-to-pleura at BL13, BL11 and SI14 measures
 * 66-70 mm on this model against 52 mm reported to the first hazardous tissue at SI14
 * (Chou 2015), and the 0.3-0.5 cun that sources give for the back-shu and scapular
 * points never leaves the fat, so trapezius, infraspinatus and the rhomboids never
 * appear on those paths.
 *
 * For each skin vertex on the back of the thorax (y 1.20-1.46, behind the frontal
 * plane of the axis, within the scapular width) the fat is measured along the ray
 * toward the trunk axis and capped at 16 mm, the thin end of this body's own lumbar
 * value (its chest and abdomen carry 3-20 mm). Thinner fat is left alone, so the
 * surface keeps the muscle relief instead of becoming a shrink-wrap. The inward move
 * is grown into a smooth skirt at the edge of the region and normals are rebuilt.
 * Structures that the new surface uncovers are left for scripts/tuck-under-skin.mjs.
 * Applied on 2026-09-23 (with an earlier 10 mm + 25 % rule for two passes, then this
 * cap): skin to pleura at SI14 went 70 -> 62 mm, BL15 60 -> 48 mm; infraspinatus at
 * SI11 from 41 to 29 mm under the skin. Re-running converges.
 *
 * Usage: node scripts/fit-back-skin.mjs [--check]; then node scripts/tuck-under-skin.mjs
 */
import fs from 'node:fs';
import * as T from 'three';
import { loadAtlas, threeMesh } from './atlas-geometry.mjs';
import { chunkWriter, manifestPath, skirt } from './mesh-edit.mjs';

const CAP = 0.016, MAX_MOVE = 0.03, Y0 = 1.2, Y1 = 1.46, HALF_WIDTH = 0.16, AXIS_Z = 0.0;
const check = process.argv.includes('--check');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const atlas = loadAtlas();
const writer = chunkWriter(manifest);
const skin = atlas.parts.find((p) => p.name === 'Skin');
const solid = atlas.parts.filter((p) => ['muscular', 'skeletal', 'connective'].includes(p.system)
  && p.box.max.y > Y0 - 0.05 && p.box.min.y < Y1 + 0.05 && p.box.min.z < 0);
const objects = solid.map((p) => ({ p, o: threeMesh(p) }));
const skinObject = threeMesh(skin);
const raycaster = new T.Raycaster();
const required = new Float64Array(skin.vertexCount * 3), fixed = new Uint8Array(skin.vertexCount);
const point = new T.Vector3(), inward = new T.Vector3();
let count = 0, worst = 0;
const histogram = [];
for (let v = 0; v < skin.vertexCount; v++) {
  point.set(skin.positions[v * 3], skin.positions[v * 3 + 1], skin.positions[v * 3 + 2]);
  if (point.y < Y0 || point.y > Y1 || point.z > AXIS_Z - 0.03 || Math.abs(point.x) > HALF_WIDTH) continue;
  inward.set(-point.x, 0, AXIS_Z - point.z).normalize();
  // Only the outermost sheet: the BodyParts3D skin carries inner folds. A ray aimed exactly
  // at a vertex may miss its own triangles, so only a hit clearly in front of it disqualifies.
  raycaster.set(point.clone().addScaledVector(inward, -0.1), inward); raycaster.far = 0.1 - 0.0015;
  if (raycaster.intersectObject(skinObject, false).length) continue;
  raycaster.set(point, inward); raycaster.far = 0.09;
  let first = Infinity;
  for (const { p, o } of objects) {
    if (!p.box.clone().expandByScalar(0.09).containsPoint(point)) continue;
    const hit = raycaster.intersectObject(o, false)[0];
    if (hit && hit.distance < first) first = hit.distance;
  }
  if (!Number.isFinite(first) || first <= CAP) continue;
  // Rays that slip into the axillary gap report 60+ mm; no single step moves more than 30 mm.
  const move = Math.min(MAX_MOVE, first - CAP);
  for (let k = 0; k < 3; k++) required[v * 3 + k] = inward.getComponent(k) * move;
  fixed[v] = 1; count++; worst = Math.max(worst, move);
  histogram.push(first);
}
histogram.sort((a, b) => a - b);
const q = (f) => (histogram[Math.floor(f * (histogram.length - 1))] * 1000).toFixed(1);
console.log(`back skin: ${count} vertices with more than ${CAP * 1000} mm of fat (median ${q(0.5)}, 90th ${q(0.9)}, max ${q(1)} mm); largest inward move ${(worst * 1000).toFixed(1)} mm`);
if (check) { console.log('(check only, nothing written)'); process.exit(0); }
const field = skirt(skin, required, fixed, 12, 0.85);
for (let i = 0; i < field.length; i++) skin.positions[i] += field[i];
writer.mark(skin);
writer.write();
console.log(`rewrote ${writer.count} chunk`);
