/** Move four vessel meshes to their textbook relations so the Needle's-eye view measures them.
 *
 * 1. Posterior tibial vein: BodyParts3D places it 8-16 mm medial to the posterior tibial
 *    artery in the calf, so KI7/KI9 met it just under the skin. The veins are venae
 *    comitantes of the artery in the deep posterior compartment (StatPearls NBK546623,
 *    NBK538488). Each level of the vein is drawn in until it touches the artery.
 * 2. Popliteal vein: the atlas has it lateral to the artery and slightly deeper. In the
 *    fossa the order from superficial to deep is tibial nerve, popliteal vein, popliteal
 *    artery (StatPearls NBK532891), so the vein is moved behind the artery, clear of the
 *    tibial nerve, and tapered back to the source at both ends of the fossa.
 * 3. Popliteal/femoral vein junction: the top 12 mm of the popliteal vein lies inside the
 *    femoral vein, so a ray at LR9 met "two" veins. The femoral vein becomes the popliteal
 *    vein at the adductor hiatus (StatPearls NBK556046); the overlapping popliteal
 *    triangles are collapsed so only one vessel remains there.
 * 4. Common carotid artery and internal jugular vein: both stop low in the neck
 *    (y 1.451 / 1.460) while the internal carotid starts at y 1.513, leaving ST9/ST10 with
 *    no carotid sheath. The carotid bifurcation lies mostly at C3-C4, between the hyoid
 *    and the upper border of the thyroid cartilage (Manta 2024 doi:10.1007/s00276-024-03404-y;
 *    suprathyroid in 89%, Karangeli 2026 doi:10.1007/s00276-026-03915-w). The upper part
 *    of each mesh is stretched up the carotid sheath, following the vagus nerve that runs
 *    between them (StatPearls NBK519577), to the bifurcation (artery) and the same level
 *    lateral to it (vein). Vertex counts are unchanged, so validate-atlas.mjs still holds.
 *
 * Only vertex positions (and, for 3, collapsed triangle indices) change. Both sides. The
 * tibial nerve is a Z-Anatomy supplement mesh and is written back to that folder.
 * Usage: node scripts/fit-needle-eye-vessels.mjs [--check]
 */
import fs from 'node:fs';
import * as T from 'three';
import { atlas } from './needling/path-geometry.mjs';
import { chunkWriter, manifestPath, rebuildNormals } from './mesh-edit.mjs';

const check = process.argv.includes('--check');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const writer = chunkWriter(manifest);
// The Z-Anatomy supplement (CC BY-SA, public/models/zanatomy/) has its own manifest and no gzip copies.
const supplementDir = new URL('../public/models/zanatomy/', import.meta.url), supplementPath = new URL('zanatomy.json', supplementDir);
const supplementManifest = JSON.parse(fs.readFileSync(supplementPath, 'utf8'));
const supplement = (() => {
  const touched = new Map();
  return {
    mark(part) {
      const record = supplementManifest.parts.find((p) => p.id === part.id);
      const normals = new Int16Array(part.positions.buffer, record.normals, part.vertexCount * 3);
      rebuildNormals({ ...part, normals });
      const low = [Infinity, Infinity, Infinity], high = [-Infinity, -Infinity, -Infinity];
      for (let i = 0; i < part.positions.length; i++) { const k = i % 3; low[k] = Math.min(low[k], part.positions[i]); high[k] = Math.max(high[k], part.positions[i]); }
      record.bounds = [low, high];
      part.box = new T.Box3(new T.Vector3(...low), new T.Vector3(...high));
      touched.set(part.chunk, part.positions.buffer);
    },
    get count() { return touched.size; },
    write() {
      for (const [index, buffer] of touched) fs.writeFileSync(new URL(supplementManifest.chunks[index].url.split('/').pop(), supplementDir), Buffer.from(buffer));
      if (touched.size) fs.writeFileSync(supplementPath, JSON.stringify(supplementManifest));
    },
  };
})();
const named = (name) => { const part = atlas.parts.find((p) => p.name === name); if (!part) throw new Error(`no mesh ${name}`); return part; };
const mm = (v) => (v * 1000).toFixed(1);

/** Mean centre and mean radius of the vertices in a horizontal slab. */
function ring(part, y, half = 0.002, keep = () => true) {
  const a = part.positions; let n = 0, sx = 0, sz = 0; const pts = [];
  for (let i = 0; i < a.length; i += 3) {
    if (Math.abs(a[i + 1] - y) > half || !keep(a[i], a[i + 2])) continue;
    n++; sx += a[i]; sz += a[i + 2]; pts.push([a[i], a[i + 2]]);
  }
  if (n < 3) return null;
  const x = sx / n, z = sz / n;
  return { x, z, r: pts.reduce((s, [px, pz]) => s + Math.hypot(px - x, pz - z), 0) / n };
}
const yRange = (part) => [part.box.min.y, part.box.max.y];
/** Piecewise-linear lookup of a sampled [y, dx, dz] shift table. */
function shiftAt(table, y) {
  if (!table.length || y <= table[0][0]) return table[0] ? [table[0][1], table[0][2]] : [0, 0];
  for (let i = 1; i < table.length; i++) if (y <= table[i][0]) {
    const [y0, a0, b0] = table[i - 1], [y1, a1, b1] = table[i], t = (y - y0) / (y1 - y0 || 1);
    return [a0 + (a1 - a0) * t, b0 + (b1 - b0) * t];
  }
  const last = table[table.length - 1]; return [last[1], last[2]];
}
function smooth(table, width = 2) {
  return table.map(([y], i) => {
    let a = 0, b = 0, n = 0;
    for (let k = Math.max(0, i - width); k <= Math.min(table.length - 1, i + width); k++) { a += table[k][1]; b += table[k][2]; n++; }
    return [y, a / n, b / n];
  });
}
function applyShift(part, table) {
  const a = part.positions; let worst = 0;
  for (let i = 0; i < a.length; i += 3) {
    const [dx, dz] = shiftAt(table, a[i + 1]);
    a[i] += dx; a[i + 2] += dz; worst = Math.max(worst, Math.hypot(dx, dz));
  }
  return worst;
}
const ramp = (y, a, b) => Math.max(0, Math.min(1, (y - a) / (b - a)));
const report = [];

for (const side of ['Right', 'Left']) {
  const lateral = side === 'Right' ? -1 : 1;   // lateral x sign

  // --- 1. posterior tibial vein beside the artery
  {
    const vein = named(`${side} posterior tibial vein`), artery = named(`${side} posterior tibial artery`);
    const [y0] = yRange(vein), top = Math.min(yRange(vein)[1], yRange(artery)[1]);
    const table = [];
    for (let y = y0; y <= top; y += 0.002) {
      const v = ring(vein, y), a = ring(artery, y);
      if (!v || !a) continue;
      const dx = v.x - a.x, dz = v.z - a.z, dist = Math.hypot(dx, dz), touch = a.r + v.r + 0.0005;
      const weight = 1 - ramp(y, 0.30, 0.35);   // full below mid-calf, back to source near the tibioperoneal trunk
      const k = dist > touch ? (touch / dist - 1) * weight : 0;
      table.push([y, dx * k, dz * k]);
    }
    const shifts = smooth(table);
    const before = [0.28, 0.22, 0.16, 0.09].map((y) => { const v = ring(vein, y), a = ring(artery, y); return v && a ? mm(Math.hypot(v.x - a.x, v.z - a.z)) : '-'; });
    const worst = check ? Math.max(...shifts.map(([, a, b]) => Math.hypot(a, b))) : applyShift(vein, shifts);
    const after = check ? '(check)' : [0.28, 0.22, 0.16, 0.09].map((y) => { const v = ring(vein, y), a = ring(artery, y); return v && a ? mm(Math.hypot(v.x - a.x, v.z - a.z)) : '-'; }).join('/');
    if (!check) writer.mark(vein);
    report.push(`${side} posterior tibial vein: centre-to-artery at y .28/.22/.16/.09 ${before.join('/')} mm → ${after}; largest move ${mm(worst)} mm`);
  }

  // --- 2. popliteal fossa order: tibial nerve (superficial) → popliteal vein → popliteal artery
  // The artery stays; the vein is placed directly behind it, touching; the tibial nerve
  // (Z-Anatomy, registration p90 4-10 mm) is moved behind the vein where it would overlap.
  {
    const vein = named(`${side} popliteal vein`), artery = named(`${side} popliteal artery`);
    const nerve = named(`${side} Tibial nerve`);
    const veinTable = [], nerveTable = [];
    for (let y = 0.396; y <= 0.576; y += 0.002) {
      const v = ring(vein, y), a = ring(artery, y), n = ring(nerve, y, 0.003);
      const weight = ramp(y, 0.40, 0.425) * (1 - ramp(y, 0.53, 0.556));
      if (!v || !a) { veinTable.push([y, 0, 0]); nerveTable.push([y, 0, 0]); continue; }
      const touch = a.r + v.r + 0.0005, sideways = Math.sign(v.x - a.x) || lateral;
      // Behind the artery, with a small share of the vein's present side (posterolateral above,
      // posteromedial below in the textbook; the source keeps it lateral throughout).
      const vx = a.x + sideways * touch * 0.25, vz = a.z - touch * Math.sqrt(1 - 0.25 ** 2);
      veinTable.push([y, (vx - v.x) * weight, (vz - v.z) * weight]);
      if (!n) { nerveTable.push([y, 0, 0]); continue; }
      const clear = v.r + n.r + 0.0005, dx = n.x - vx, need = Math.sqrt(Math.max(0, clear ** 2 - dx ** 2));
      const nz = Math.min(n.z, vz - need);   // only ever move the nerve backwards (superficially)
      nerveTable.push([y, 0, (nz - n.z) * weight]);
    }
    const probe = (y) => { const v = ring(vein, y), a = ring(artery, y), n = ring(nerve, y, 0.003); return v && a && n ? `N${mm(n.z)}/V${mm(v.z)}/A${mm(a.z)}` : '-'; };
    const before = [0.48, 0.46].map(probe).join(' ');
    const vs = smooth(veinTable), ns = smooth(nerveTable);
    const worstVein = check ? Math.max(...vs.map(([, a, b]) => Math.hypot(a, b))) : applyShift(vein, vs);
    const worstNerve = check ? Math.max(...ns.map(([, a, b]) => Math.hypot(a, b))) : applyShift(nerve, ns);
    const after = check ? '(check)' : [0.48, 0.46].map(probe).join(' ');
    if (!check) { writer.mark(vein); supplement.mark(nerve); }
    report.push(`${side} popliteal fossa z (more negative = more superficial) at y .48/.46: ${before} → ${after}; vein moved ≤ ${mm(worstVein)} mm, tibial nerve moved back ≤ ${mm(worstNerve)} mm`);

    // --- 3. collapse the popliteal vein triangles that lie inside the femoral vein
    const femoral = named(`${side} femoral vein`), limit = femoral.box.min.y;
    const I = vein.indices, P = vein.positions; let collapsed = 0;
    for (let t = 0; t < I.length; t += 3) {
      const low = Math.min(P[I[t] * 3 + 1], P[I[t + 1] * 3 + 1], P[I[t + 2] * 3 + 1]);
      if (low > limit && I[t] !== I[t + 1]) { collapsed++; if (!check) { I[t + 1] = I[t]; I[t + 2] = I[t]; } }
    }
    if (!check) writer.mark(vein);
    report.push(`${side} popliteal vein: ${collapsed} triangles above the femoral vein's lower end (y ${mm(limit)}) ${check ? 'would be ' : ''}collapsed`);
  }

  // --- 4. carotid sheath up to the bifurcation
  // Artery medial, vein lateral, vagus behind between them (StatPearls NBK519577); the artery
  // passes posterolateral to the thyroid lamina. The Z-Anatomy vagus sits 15 mm behind the
  // source artery and its neck centre jumps with branches, so it only sets the back limit.
  {
    const vagus = named(`${side} Vagus nerve (X)`), cca = named(`${side} common carotid artery`), ijv = named(`${side} internal jugular vein`);
    const thyroid = named('Thyroid cartilage');
    const BIFURCATION = 1.505, VEIN_TOP = 1.515;   // C3/C4: hyoid 1.500-1.519, upper thyroid border 1.509
    const near = (x, z) => x * lateral > 0.008 && x * lateral < 0.045 && z > -0.015 && z < 0.03;
    const vagusAt = (y) => ring(vagus, y, 0.003, near);
    const laminaEdge = (y) => { let edge = 0; const a = thyroid.positions; for (let i = 0; i < a.length; i += 3) if (Math.abs(a[i + 1] - y) < 0.002 && a[i] * lateral > edge * lateral) edge = a[i]; return edge; };
    const smoothstep = (t) => t * t * (3 - 2 * t);
    const oldTopA = cca.box.max.y, oldTopV = ijv.box.max.y;
    const rA = ring(cca, oldTopA - 0.004).r, rV = ring(ijv, oldTopV - 0.004).r;
    const endA = (() => {
      const g = vagusAt(BIFURCATION);
      return { x: laminaEdge(BIFURCATION) + lateral * (rA + 0.0015), z: g.z + g.r + rA + 0.003 };
    })();
    const endV = { x: endA.x + lateral * (rA + rV + 0.0015), z: endA.z + 0.002 };
    const stretch = (vessel, newTop, end) => {
      const start = vessel.box.max.y - 0.02, oldTop = vessel.box.max.y;
      const from = ring(vessel, start, 0.0015), top = ring(vessel, oldTop - 0.003, 0.003);
      const centres = [];
      for (let y = start - 0.001; y <= oldTop + 0.001; y += 0.001) { const c = ring(vessel, y, 0.0015); if (c) centres.push([y, c]); }
      const centreAt = (y) => centres.reduce((best, item) => Math.abs(item[0] - y) < Math.abs(best[0] - y) ? item : best)[1];
      // Centre path: the source path up to its old top, then a smooth run to the new end.
      const path = (y) => {
        if (y <= oldTop) { const t = (y - start) / (oldTop - start); return { x: from.x + (top.x - from.x) * t, z: from.z + (top.z - from.z) * t }; }
        const t = smoothstep((y - oldTop) / (newTop - oldTop));
        return { x: top.x + (end.x - top.x) * t, z: top.z + (end.z - top.z) * t };
      };
      const P = vessel.positions, plan = [];
      for (let i = 0; i < P.length; i += 3) {
        const y = P[i + 1]; if (y <= start) continue;
        const c = centreAt(y), yNew = start + ((y - start) / (oldTop - start)) * (newTop - start), p = path(yNew);
        plan.push([i, p.x + (P[i] - c.x), yNew, p.z + (P[i + 2] - c.z)]);
      }
      if (!check) for (const [i, x, y, z] of plan) { P[i] = x; P[i + 1] = y; P[i + 2] = z; }
      return { moved: plan.length, oldTop };
    };
    const a = stretch(cca, BIFURCATION, endA), v = stretch(ijv, VEIN_TOP, endV);
    if (!check) { writer.mark(cca); writer.mark(ijv); }
    const g = vagusAt(BIFURCATION);
    report.push(`${side} common carotid artery: top ${mm(a.oldTop)} → ${mm(BIFURCATION)} (${a.moved} vertices), end centre x ${mm(endA.x)} z ${mm(endA.z)} (lamina edge x ${mm(laminaEdge(BIFURCATION))}, vagus x ${mm(g.x)} z ${mm(g.z)}); `
      + `internal jugular vein top ${mm(v.oldTop)} → ${mm(VEIN_TOP)} (${v.moved} vertices), end centre x ${mm(endV.x)} z ${mm(endV.z)}`);
  }
}

console.log(report.join('\n'));
if (!check) { writer.write(); supplement.write(); console.log(`wrote ${writer.count} atlas chunk(s), ${supplement.count} Z-Anatomy chunk(s)`); }
