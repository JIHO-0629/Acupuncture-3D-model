// 새로 넣은 척추 구조가 제자리인지: 추간판은 위·아래 척추뼈 사이, 인대·신경근은 척추 범위 안
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const REPO = 'C:/Users/jiho3/Documents/Codex/2026-09-09/we-are-building-an-acupuncture-anatomy/human-atlas';
const T = await import(pathToFileURL(`${REPO}/node_modules/three/build/three.module.js`).href);
const { loadAtlas, mesh, threeMesh } = await import(pathToFileURL(`${REPO}/scripts/atlas-geometry.mjs`).href);
const { Grid } = await import('./grid.mjs');
const atlas = loadAtlas(), dir = `${REPO}/public/models/zanatomy/`;
const zm = JSON.parse(fs.readFileSync(dir + 'zanatomy.json', 'utf8'));
const bufs = zm.chunks.map((c) => { const f = fs.readFileSync(dir + c.url.split('/').pop()); return f.buffer.slice(f.byteOffset, f.byteOffset + f.byteLength); });
const pts = (p) => { const a = new Float32Array(bufs[p.chunk], p.positions, p.vertexCount * 3), o = []; for (let i = 0; i < p.vertexCount; i += 4) o.push(new T.Vector3(a[i * 3], a[i * 3 + 1], a[i * 3 + 2])); return o; };
const byName = new Map(zm.parts.map((p) => [p.name, p]));
console.log('총', zm.parts.length, '개 |', ['Intervertebral disc', 'ligament', 'Ligamenta flava', 'root of spinal nerve', 'Spinal ganglion', 'Cauda equina', 'Intercostal nerves', 'Sympathetic trunk', 'Vagus nerve'].map((k) => `${k}: ${zm.parts.filter((p) => p.name.includes(k)).length}`).join(' | '));
// 추간판 ↔ 인접 척추뼈 거리
const VN = { C: 'cervical', T: 'thoracic', L: 'lumbar' };
const ORD = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth', 'Eleventh', 'Twelfth'];
const atlasName = (tag) => tag === 'S1' ? 'Sacrum' : `${ORD[+tag.slice(1) - 1]} ${VN[tag[0]]} vertebra`;
const rows = [];
for (const p of zm.parts.filter((x) => x.name.startsWith('Intervertebral disc'))) {
  const [a, b] = p.name.split(' ').pop().split('-');
  try {
    const cloud = new Grid([...pts(p)], 0.01);
    const d = [a, b].map((tag) => { const part = mesh(atlas, atlasName(tag)), out = []; for (let i = 0; i < part.vertexCount; i += 6) out.push(cloud.nearest(new T.Vector3(part.positions[i * 3], part.positions[i * 3 + 1], part.positions[i * 3 + 2])).dist); out.sort((x, y) => x - y); return +(out[0] * 1000).toFixed(1); });
    rows.push({ disc: p.name.split(' ').pop(), [`위뼈 최근접mm`]: d[0], [`아래뼈 최근접mm`]: d[1] });
  } catch { rows.push({ disc: p.name.split(' ').pop(), '위뼈 최근접mm': '—', '아래뼈 최근접mm': '—' }); }
}
console.table(rows.filter((_, i) => i % 3 === 0));
// 척추 인대·신경근이 뼈 안에 박혔는지
const bones = ['Seventh cervical vertebra', 'Sixth thoracic vertebra', 'Third lumbar vertebra', 'Sacrum'].map((n) => threeMesh(mesh(atlas, n)));
const rc = new T.Raycaster(), dirs = [new T.Vector3(0.577, 0.577, 0.577), new T.Vector3(-0.707, 0.1, 0.7).normalize(), new T.Vector3(0.1, -0.99, 0.1).normalize()];
const inBone = (q) => bones.some((o) => dirs.filter((d) => { rc.set(q, d); return rc.intersectObject(o, false).length % 2 === 1; }).length >= 2);
for (const n of ['Ligamenta flava', 'Anterior longitudinal ligament', 'Right Posterior root of spinal nerve', 'Cauda equina', 'Right Sympathetic trunk']) {
  const p = byName.get(n); if (!p) { console.log(n, '없음'); continue; }
  const s = pts(p).filter((_, i) => i % 5 === 0);
  console.log(`${n}: 표본 ${s.length}, 척추뼈 안 ${(s.filter(inBone).length / s.length * 100).toFixed(0)}%`);
}
