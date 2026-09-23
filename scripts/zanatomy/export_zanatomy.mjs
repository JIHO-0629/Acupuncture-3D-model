// Z-Anatomy 말초신경 + 흉막 → human-atlas 좌표계로 옮겨 별도 청크로 내보낸다.
// 출력은 public/models/zanatomy/ 한 폴더에만 쓴다 (CC BY-SA 4.0 범위를 이 폴더로 한정).
// atlas.json과 BodyParts3D 청크는 건드리지 않는다.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { loadFbx } from './inspect_fbx.mjs';

const REPO = 'C:/Users/jiho3/Documents/Codex/2026-09-09/we-are-building-an-acupuncture-anatomy/human-atlas';
const OUT = `${REPO}/public/models/zanatomy`;
const { MeshoptSimplifier } = await import(pathToFileURL(`${REPO}/node_modules/meshoptimizer/index.js`).href);
await MeshoptSimplifier.ready;
const nerv = await loadFbx('NervousSystem100.fbx');
const visc = await loadFbx('VisceralSystem100.fbx');
const skel = await loadFbx('SkeletalSystem100.fbx');
const { T } = nerv;
const { Grid } = await import('./grid.mjs');

// --- 분절 변환 (segment_register.mjs 결과) + 분절별 Z 뼈 점군
const segReg = JSON.parse(fs.readFileSync('segment_registration.json', 'utf8'));
const globalM = new T.Matrix4().fromArray(JSON.parse(fs.readFileSync('registration.json', 'utf8')).matrix);
const SEG_BONES = {
  thorax: [...['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'].flatMap((o) => [`${o}_ribr`, `${o}_ribl`]), 'Vertebra_C7', ...Array.from({ length: 10 }, (_, i) => `Vertebra_T${i + 1}`)],
  cervical: [...Array.from({ length: 5 }, (_, i) => `Vertebra_C${i + 3}`)],
  lumbar: [...Array.from({ length: 5 }, (_, i) => `Vertebra_L${i + 1}`), 'Sacrum', 'Eleventh_ribr', 'Eleventh_ribl', 'Twelfth_ribr', 'Twelfth_ribl'],
  pelvis_r: ['Hip_boner', 'Sacrum'], pelvis_l: ['Hip_bonel', 'Sacrum'],
  thigh_r: ['Femurr'], thigh_l: ['Femurl'],
  leg_r: ['Tibiar', 'Fibular', 'Patellar'], leg_l: ['Tibial', 'Fibulal', 'Patellal'],
};
const segs = Object.entries(SEG_BONES).map(([name, bones]) => {
  const pts = [];
  for (const b of bones) { const m = skel.meshes.find((x) => x.name === b); const p = m.geometry.attributes.position; for (let i = 0; i < p.count; i += 4) pts.push(new T.Vector3().fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld)); }
  return { name, M: new T.Matrix4().fromArray(segReg[name].matrix), grid: new Grid(pts, 2) };
});
const SIGMA = 2.0, FAR = 8.0; // Z 단위(cm)
function mapPoint(p) {
  const ds = segs.map((s) => s.grid.nearest(p, 8).dist);
  const dmin = Math.min(...ds);
  if (!(dmin < FAR)) return { q: p.clone().applyMatrix4(globalM), seg: 'global' };
  const w = ds.map((d) => Math.exp(-(d - dmin) / SIGMA));
  const sum = w.reduce((a, b) => a + b, 0), q = new T.Vector3();
  segs.forEach((s, i) => { if (w[i] / sum > 1e-3) q.addScaledVector(p.clone().applyMatrix4(s.M), w[i] / sum); });
  return { q, seg: segs[ds.indexOf(dmin)].name };
}

// --- 대상 메시
const NERVE_WORD = /(nerve|plexus|ganglion|branch|ramus|rami|root|trunk|cord|muscle|division)/i;
function cleanName(raw) {
  const m = raw.match(/^(.*[a-z)])([rl])$/);
  if (m && NERVE_WORD.test(m[1])) return `${m[2] === 'r' ? 'Right' : 'Left'} ${m[1].replace(/_/g, ' ').trim()}`.replace(/\s+/g, ' ');
  return raw.replace(/_/g, ' ');
}
const targets = [];
for (const m of nerv.meshes) {
  if (m.geometry.attributes.position.count <= 100) continue;          // 그룹용 빈 메시(36점) 제외
  const box = new T.Box3().setFromObject(m);
  if (box.min.y >= 150) continue;                                        // 머리 안쪽 구조 제외 (아틀라스에 이미 있음)
  targets.push({ m, system: 'nervous' });
}
targets.push({ m: visc.meshes.find((x) => x.name === 'Pleura'), system: 'respiratory' });
// 척추 자침에 필요한 관절 구조: 추간판과 척추 인대 (아틀라스에 없음)
const joints = await loadFbx('Joints100.fbx');
const JOINT_RE = /^(Intervertebral_disc|Ligamenta_flava|Interspinous_ligament|Anterior_longitudinal_ligament|Posterior_longitudinal_ligament|Nuchal_ligament|Costotransverse_ligament|Intertransverse_ligament|Iliolumbar_ligament|Supraspinous_ligament|(Anterior|Posterior|Interosseous)_sacro-?iliac_ligament|Sacrotuberous_ligament|Sacrospinous_ligament)/i;
for (const m of joints.meshes) if (JOINT_RE.test(m.name) && m.geometry.attributes.position.count > 200) targets.push({ m, system: 'connective' });

// --- 청크 기록 (add-bp3-structures.mjs와 같은 레이아웃)
fs.mkdirSync(OUT, { recursive: true });
const manifest = { version: 'zanatomy-nerves-1', license: 'CC BY-SA 4.0', source: 'Z-Anatomy (LluisV/Z-Anatomy, PC-Version) NervousSystem100.fbx, VisceralSystem100.fbx', parts: [], chunks: [], triangles: 0 };
let chunkIndex = 0, segments = [], bytes = 0;
const flush = () => { if (!bytes) return; const url = `/models/zanatomy/zanatomy-${chunkIndex}.bin`; fs.writeFileSync(`${OUT}/zanatomy-${chunkIndex}.bin`, Buffer.concat(segments)); manifest.chunks.push({ url, bytes }); chunkIndex++; segments = []; bytes = 0; };
const append = (a) => { const pad = (4 - bytes % 4) % 4; if (pad) { segments.push(Buffer.alloc(pad)); bytes += pad; } const off = bytes, b = Buffer.from(a.buffer, a.byteOffset, a.byteLength); segments.push(b); bytes += b.length; return off; };

let idx = 0, maxError = 0;
for (const { m, system } of targets) {
  const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry;
  // FBXLoader는 비인덱스 삼각형을 준다 → 정점 병합 후 인덱스 생성
  const pos = g.attributes.position, key = new Map(), verts = [], indices = new Uint32Array(pos.count);
  const segCount = {};
  for (let i = 0; i < pos.count; i++) {
    const k = `${pos.getX(i).toFixed(4)},${pos.getY(i).toFixed(4)},${pos.getZ(i).toFixed(4)}`;
    let vi = key.get(k);
    if (vi === undefined) {
      const p = new T.Vector3().fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
      const { q, seg } = mapPoint(p);
      segCount[seg] = (segCount[seg] ?? 0) + 1;
      vi = verts.length / 3; verts.push(q.x, q.y, q.z); key.set(k, vi);
    }
    indices[i] = vi;
  }
  const positions = new Float32Array(verts);
  const target = Math.max(96, Math.floor(indices.length * 0.22 / 3) * 3);
  const [simplified, error] = MeshoptSimplifier.simplify(indices, positions, 3, Math.min(indices.length, target), 0.002);
  maxError = Math.max(maxError, error);
  const [remap, count] = MeshoptSimplifier.compactMesh(simplified);
  const outPos = new Float32Array(count * 3);
  for (let old = 0; old < remap.length; old++) { const n = remap[old]; if (n !== 0xffffffff) outPos.set(positions.subarray(old * 3, old * 3 + 3), n * 3); }
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(outPos, 3)); geo.setIndex(new T.BufferAttribute(simplified, 1)); geo.computeVertexNormals();
  const nrm = geo.attributes.normal.array, normals = new Int16Array(nrm.length);
  for (let i = 0; i < nrm.length; i++) normals[i] = Math.round(nrm[i] * 32767);
  if (bytes > 4_000_000) flush();
  const low = [Infinity, Infinity, Infinity], high = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < outPos.length; i++) { const a = i % 3; low[a] = Math.min(low[a], outPos[i]); high[a] = Math.max(high[a], outPos[i]); }
  const segs2 = Object.entries(segCount).sort((a, b) => b[1] - a[1]).map(([s, c]) => `${s} ${(c / (verts.length / 3) * 100).toFixed(0)}%`).join(', ');
  manifest.parts.push({
    id: `ZA${String(++idx).padStart(4, '0')}`, name: cleanName(m.name), sourceName: m.name, system, chunk: chunkIndex,
    positions: append(outPos), normals: append(normals), indices: append(simplified), vertexCount: count, indexCount: simplified.length, bounds: [low, high],
    registration: segs2, uncertainty: segs2.startsWith('global') ? '분절 정합 밖 (전역 정합만) — 위치 오차 미검증' : '뼈 분절 정합 (뼈 표면 잔차 중앙값 2–4 mm, p90 4–10 mm)',
  });
  manifest.triangles += simplified.length / 3;
}
flush();
fs.writeFileSync(`${OUT}/zanatomy.json`, JSON.stringify(manifest));
console.log(JSON.stringify({ parts: manifest.parts.length, triangles: manifest.triangles, chunks: manifest.chunks.length, bytes: manifest.chunks.reduce((n, c) => n + c.bytes, 0), maxError }));
for (const p of manifest.parts.filter((p) => /sciatic|fibular|tibial nerve|femoral nerve|Pleura|intercostal|brachial|median nerve|ulnar nerve|radial nerve/i.test(p.name)).slice(0, 30)) console.log(p.id, p.name, '|', p.registration);
