// 뼈 분절별 정합: Z-Anatomy 골격 → human-atlas(BodyParts3D) 골격
// 분절마다 닮음변환을 ICP로 맞추고, 신경·흉막 정점은 가까운 분절 변환들의 가중 평균으로 옮긴다.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { loadFbx } from './inspect_fbx.mjs';

const REPO = 'C:/Users/jiho3/Documents/Codex/2026-09-09/we-are-building-an-acupuncture-anatomy/human-atlas';
const { loadAtlas, mesh } = await import(pathToFileURL(`${REPO}/scripts/atlas-geometry.mjs`).href);
export const atlas = loadAtlas();
const skel = await loadFbx('SkeletalSystem100.fbx');
const { T } = skel;
const global = new T.Matrix4().fromArray(JSON.parse(fs.readFileSync('registration.json', 'utf8')).matrix);

const ordinal = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth', 'Eleventh', 'Twelfth'];
const side = (s, z, a) => [[`${z}${s === 'right' ? 'r' : 'l'}`, `${s === 'right' ? 'Right' : 'Left'} ${a}`]];
const SEGMENTS = {
  thorax: [
    ...ordinal.slice(0, 10).flatMap((o) => [[`${o}_ribr`, `Right ${o.toLowerCase()} rib`], [`${o}_ribl`, `Left ${o.toLowerCase()} rib`]]),
    ['Vertebra_C7', 'Seventh cervical vertebra'],
    ...ordinal.slice(0, 10).map((o, i) => [`Vertebra_T${i + 1}`, `${o} thoracic vertebra`]),
  ],
  cervical: [['Vertebra_C1', 'Atlas'], ['Vertebra_C2', 'Axis'],
    ...['Third', 'Fourth', 'Fifth', 'Sixth'].map((o, i) => [`Vertebra_C${i + 3}`, `${o} cervical vertebra`]),
    ['Vertebra_C7', 'Seventh cervical vertebra']],
  lumbar: [...['First', 'Second', 'Third', 'Fourth', 'Fifth'].map((o, i) => [`Vertebra_L${i + 1}`, `${o} lumbar vertebra`]),
    ['Sacrum', 'Sacrum'],
    ...['Eleventh', 'Twelfth'].flatMap((o) => [[`${o}_ribr`, `Right ${o.toLowerCase()} rib`], [`${o}_ribl`, `Left ${o.toLowerCase()} rib`]])],
  pelvis_r: [...side('right', 'Hip_bone', 'hip bone'), ['Sacrum', 'Sacrum']],
  pelvis_l: [...side('left', 'Hip_bone', 'hip bone'), ['Sacrum', 'Sacrum']],
  thigh_r: side('right', 'Femur', 'femur'), thigh_l: side('left', 'Femur', 'femur'),
  leg_r: [...side('right', 'Tibia', 'tibia'), ...side('right', 'Fibula', 'fibula'), ...side('right', 'Patella', 'patella')],
  leg_l: [...side('left', 'Tibia', 'tibia'), ...side('left', 'Fibula', 'fibula'), ...side('left', 'Patella', 'patella')],
};

const zPts = (m, n) => { const p = m.geometry.attributes.position, s = Math.max(1, Math.floor(p.count / n)), o = []; for (let i = 0; i < p.count; i += s) o.push(new T.Vector3().fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld)); return o; };
const aPts = (part, n) => { const s = Math.max(1, Math.floor(part.vertexCount / n)), o = []; for (let i = 0; i < part.vertexCount; i += s) o.push(new T.Vector3(part.positions[i * 3], part.positions[i * 3 + 1], part.positions[i * 3 + 2])); return o; };

// 균일 격자 최근접점
export class Grid {
  constructor(points, cell) { this.cell = cell; this.map = new Map(); this.points = points; points.forEach((p, i) => { const k = this.key(p); (this.map.get(k) ?? this.map.set(k, []).get(k)).push(i); }); }
  key(p) { return `${Math.floor(p.x / this.cell)},${Math.floor(p.y / this.cell)},${Math.floor(p.z / this.cell)}`; }
  nearest(p, maxRing = 6) {
    const cx = Math.floor(p.x / this.cell), cy = Math.floor(p.y / this.cell), cz = Math.floor(p.z / this.cell);
    let best = null, bd = Infinity;
    for (let r = 0; r <= maxRing; r++) {
      for (let x = cx - r; x <= cx + r; x++) for (let y = cy - r; y <= cy + r; y++) for (let z = cz - r; z <= cz + r; z++) {
        if (Math.max(Math.abs(x - cx), Math.abs(y - cy), Math.abs(z - cz)) !== r) continue;
        for (const i of this.map.get(`${x},${y},${z}`) ?? []) { const d = this.points[i].distanceToSquared(p); if (d < bd) { bd = d; best = this.points[i]; } }
      }
      if (best && Math.sqrt(bd) < r * this.cell) break;
    }
    return { point: best, dist: Math.sqrt(bd) };
  }
}

const { umeyama, affineFit } = await import('./umeyama.mjs');
export const segmentFits = {};
for (const [seg, pairs] of Object.entries(SEGMENTS)) {
  const src = [], dstCloud = [];
  for (const [z, a] of pairs) {
    const m = skel.meshes.find((x) => x.name === z);
    if (!m) { console.log('Z missing', z); continue; }
    src.push(...zPts(m, 1500)); dstCloud.push(...aPts(mesh(atlas, a), 3000));
  }
  const grid = new Grid(dstCloud, 0.01);
  let M = global.clone();
  for (let it = 0; it < 25; it++) {
    const s = [], d = [];
    for (const p of src) { const q = p.clone().applyMatrix4(M); const n = grid.nearest(q); if (n.point && n.dist < 0.03) { s.push(p); d.push(n.point); } }
    M = (seg.startsWith('thigh') || seg.startsWith('leg')) && it >= 10 ? affineFit(s, d, T) : umeyama(s, d, T);
  }
  const res = src.map((p) => grid.nearest(p.clone().applyMatrix4(M)).dist).sort((a, b) => a - b);
  const res0 = src.map((p) => grid.nearest(p.clone().applyMatrix4(global)).dist).sort((a, b) => a - b);
  segmentFits[seg] = { matrix: M.elements, zSource: src, scale: new T.Vector3().setFromMatrixScale(M).x,
    globalMedianMm: +(res0[res0.length >> 1] * 1000).toFixed(1), medianMm: +(res[res.length >> 1] * 1000).toFixed(1), p90Mm: +(res[Math.floor(res.length * 0.9)] * 1000).toFixed(1) };
  console.log(seg.padEnd(9), 'global median', segmentFits[seg].globalMedianMm, 'mm → segment median', segmentFits[seg].medianMm, 'p90', segmentFits[seg].p90Mm, 'scale', segmentFits[seg].scale.toFixed(5));
}
fs.writeFileSync('segment_registration.json', JSON.stringify(Object.fromEntries(Object.entries(segmentFits).map(([k, v]) => [k, { matrix: v.matrix, scale: v.scale, globalMedianMm: v.globalMedianMm, medianMm: v.medianMm, p90Mm: v.p90Mm }])), null, 1));
