// 정합된 하지 신경이 아틀라스 뼈·근육과 해부학적으로 맞는지 확인
// - 뼈 관통 비율 (신경 점이 뼈 메시 안에 들어간 비율)
// - 기대 이웃 구조까지 최근접 거리
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { loadFbx } from './inspect_fbx.mjs';

const REPO = 'C:/Users/jiho3/Documents/Codex/2026-09-09/we-are-building-an-acupuncture-anatomy/human-atlas';
const { loadAtlas, mesh, threeMesh } = await import(pathToFileURL(`${REPO}/scripts/atlas-geometry.mjs`).href);
const atlas = loadAtlas();
const nerv = await loadFbx('NervousSystem100.fbx');
const visc = await loadFbx('VisceralSystem100.fbx');
const { T } = nerv;
const reg = JSON.parse(fs.readFileSync('registration.json', 'utf8'));
const M = new T.Matrix4().fromArray(reg.matrix);
const lms = JSON.parse(fs.readFileSync(`${REPO}/data/landmarks.json`, 'utf8')).landmarks;
const lm = (id) => new T.Vector3(...lms.find((l) => l.id === id && l.side !== 'left').point);

const pts = (m, n = 600) => { const p = m.geometry.attributes.position, s = Math.max(1, Math.floor(p.count / n)), o = []; for (let i = 0; i < p.count; i += s) o.push(new T.Vector3().fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld).applyMatrix4(M)); return o; };
const apts = (part) => { const o = []; for (let i = 0; i < part.vertexCount; i++) o.push(new T.Vector3(part.positions[i * 3], part.positions[i * 3 + 1], part.positions[i * 3 + 2])); return o; };
const rc = new T.Raycaster(), dirs = [new T.Vector3(0.577, 0.577, 0.577), new T.Vector3(-0.707, 0.1, 0.7).normalize(), new T.Vector3(0.1, -0.99, 0.1).normalize()];
const inside = (obj, p) => dirs.filter((d) => { rc.set(p, d); return rc.intersectObject(obj, false).length % 2 === 1; }).length >= 2;
const nearest = (p, cloud) => Math.sqrt(cloud.reduce((b, a) => Math.min(b, a.distanceToSquared(p)), Infinity));

const CHECKS = [
  ['Sciatic_nerver', ['Right femur', 'Right hip bone'], ['Right quadratus femoris', 'Right gluteus maximus', 'Right piriformis']],
  ['Common_fibular_nerver', ['Right fibula', 'Right femur', 'Right tibia'], ['Right biceps femoris', 'Right fibularis longus']],
  ['Superficial_fibular_nerver', ['Right fibula', 'Right tibia'], ['Right fibularis longus', 'Right fibularis brevis', 'Right extensor digitorum longus']],
  ['Deep_fibular_nerver', ['Right fibula', 'Right tibia'], ['Right tibialis anterior', 'Right extensor digitorum longus', 'Interosseous membrane of right leg']],
  ['Tibial_nerver', ['Right tibia', 'Right fibula', 'Right femur'], ['Right soleus', 'Right tibialis posterior']],
];
const out = [];
for (const [zName, bones, neighbours] of CHECKS) {
  const m = nerv.meshes.find((x) => x.name === zName);
  const P = pts(m);
  let inBone = 0;
  const boneObjs = bones.map((b) => threeMesh(mesh(atlas, b)));
  for (const p of P) if (boneObjs.some((o) => inside(o, p))) inBone++;
  const nb = neighbours.map((n) => { let a; try { a = apts(mesh(atlas, n)); } catch { return `${n}: 없음`; }
    const ds = P.map((p) => nearest(p, a)).sort((x, y) => x - y); return `${n}: median ${(ds[ds.length >> 1] * 1000).toFixed(1)} mm`; });
  out.push({ nerve: zName, samples: P.length, inBonePct: +(inBone / P.length * 100).toFixed(1), neighbours: nb.join(' ; ') });
}
// 총비골신경 ↔ 비골두 랜드마크
const cf = pts(nerv.meshes.find((x) => x.name === 'Common_fibular_nerver'), 3000);
console.log('common fibular nerve → fibular_head landmark nearest:', (nearest(lm('fibular_head'), cf) * 1000).toFixed(1), 'mm');
// 흉막 ↔ 아틀라스 폐엽 (흉막은 폐 바깥을 감싸야 함)
const pleura = pts(visc.meshes.find((x) => x.name === 'Pleura'), 4000);
const lobes = ['Upper lobe of right lung', 'Middle lobe of lung', 'Lower lobe of right lung', 'Upper lobe of left lung', 'Lower lobe of left lung'].map((n) => threeMesh(mesh(atlas, n)));
const lungCloud = lobes.flatMap((o) => { const a = o.geometry.attributes.position, r = []; for (let i = 0; i < a.count; i += 3) r.push(new T.Vector3().fromBufferAttribute(a, i)); return r; });
const pd = pleura.map((p) => nearest(p, lungCloud)).sort((a, b) => a - b);
const pleuraInsideLung = pleura.filter((p) => lobes.some((o) => inside(o, p))).length;
console.log(`pleura → atlas lung surface: median ${(pd[pd.length >> 1] * 1000).toFixed(1)} mm, p90 ${(pd[Math.floor(pd.length * 0.9)] * 1000).toFixed(1)} mm, inside lung ${(pleuraInsideLung / pleura.length * 100).toFixed(1)}%`);
console.table(out);
