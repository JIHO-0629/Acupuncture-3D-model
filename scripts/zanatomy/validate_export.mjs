// 내보낸 zanatomy.json(아틀라스 좌표)의 신경·흉막이 아틀라스 뼈와 맞는지 확인
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const REPO = 'C:/Users/jiho3/Documents/Codex/2026-09-09/we-are-building-an-acupuncture-anatomy/human-atlas';
const T = await import(pathToFileURL(`${REPO}/node_modules/three/build/three.module.js`).href);
const { loadAtlas, mesh, threeMesh } = await import(pathToFileURL(`${REPO}/scripts/atlas-geometry.mjs`).href);
const { Grid } = await import('./grid.mjs');
const atlas = loadAtlas();
const dir = `${REPO}/public/models/zanatomy/`;
const zm = JSON.parse(fs.readFileSync(dir + 'zanatomy.json', 'utf8'));
const bufs = zm.chunks.map((c) => { const f = fs.readFileSync(dir + c.url.split('/').pop()); return f.buffer.slice(f.byteOffset, f.byteOffset + f.byteLength); });
const zpts = (name) => { const p = zm.parts.find((x) => x.name === name), a = new Float32Array(bufs[p.chunk], p.positions, p.vertexCount * 3), o = []; for (let i = 0; i < p.vertexCount; i++) o.push(new T.Vector3(a[i * 3], a[i * 3 + 1], a[i * 3 + 2])); return o; };
const apts = (name) => { const part = mesh(atlas, name), o = []; for (let i = 0; i < part.vertexCount; i++) o.push(new T.Vector3(part.positions[i * 3], part.positions[i * 3 + 1], part.positions[i * 3 + 2])); return o; };
const rc = new T.Raycaster(), dirs = [new T.Vector3(0.577, 0.577, 0.577), new T.Vector3(-0.707, 0.1, 0.7).normalize(), new T.Vector3(0.1, -0.99, 0.1).normalize()];
const inside = (obj, p) => dirs.filter((d) => { rc.set(p, d); return rc.intersectObject(obj, false).length % 2 === 1; }).length >= 2;
const lms = JSON.parse(fs.readFileSync(`${REPO}/data/landmarks.json`, 'utf8')).landmarks;
const lm = (id) => new T.Vector3(...lms.find((l) => l.id === id && l.side !== 'left').point);

const rows = [];
for (const [nerve, bones] of [
  ['Right Sciatic nerve', ['Right femur', 'Right hip bone']], ['Right Common fibular nerve', ['Right fibula', 'Right femur', 'Right tibia']],
  ['Right Superficial fibular nerve', ['Right fibula', 'Right tibia']], ['Right Deep fibular nerve', ['Right fibula', 'Right tibia']],
  ['Right Tibial nerve', ['Right tibia', 'Right fibula', 'Right femur']], ['Right Femoral nerve', ['Right femur', 'Right hip bone']],
]) {
  const P = zpts(nerve), objs = bones.map((b) => threeMesh(mesh(atlas, b)));
  const step = Math.max(1, Math.floor(P.length / 500));
  let n = 0, inB = 0;
  for (let i = 0; i < P.length; i += step) { n++; if (objs.some((o) => inside(o, P[i]))) inB++; }
  rows.push({ nerve, samples: n, inBonePct: +(inB / n * 100).toFixed(1) });
}
console.table(rows);
const cf = new Grid(zpts('Right Common fibular nerve'), 0.01);
console.log('common fibular nerve ↔ fibular_head landmark:', (cf.nearest(lm('fibular_head')).dist * 1000).toFixed(1), 'mm');
const sc = new Grid(zpts('Right Sciatic nerve'), 0.01);
const qf = apts('Right quadratus femoris'), qfD = qf.map((p) => sc.nearest(p).dist).sort((a, b) => a - b);
console.log('sciatic ↔ quadratus femoris nearest:', (qfD[0] * 1000).toFixed(1), 'mm');
// 흉막: 늑골 안쪽에 있어야 함
const pleura = zpts('Pleura'), ribs = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth'].flatMap((o) => [`Right ${o} rib`, `Left ${o} rib`]);
const ribObjs = ribs.map((r) => threeMesh(mesh(atlas, r))), ribGrid = new Grid(ribs.flatMap(apts), 0.01);
let inRib = 0; const dist = [];
for (let i = 0; i < pleura.length; i += 40) { if (ribObjs.some((o) => inside(o, pleura[i]))) inRib++; dist.push(ribGrid.nearest(pleura[i]).dist); }
dist.sort((a, b) => a - b);
console.log(`pleura: inside rib bone ${(inRib / dist.length * 100).toFixed(1)}%, distance to nearest rib median ${(dist[dist.length >> 1] * 1000).toFixed(1)} mm`);
