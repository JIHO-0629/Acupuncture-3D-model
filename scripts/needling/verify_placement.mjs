// 위치 검증 ①: 체표 밖으로 나온 구조, ② 뼈를 파고든 구조
// 체표 판정은 피부 정점의 법선 부호로 근사한다 (피부 메시 전체 raycast는 너무 느림).
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';

const REPO = 'C:/Users/jiho3/Documents/Codex/2026-09-09/we-are-building-an-acupuncture-anatomy/human-atlas';
const T = await import(pathToFileURL(`${REPO}/node_modules/three/build/three.module.js`).href);
const { loadAtlas, mesh, threeMesh } = await import(pathToFileURL(`${REPO}/scripts/atlas-geometry.mjs`).href);
const { Grid } = await import(pathToFileURL('C:/Users/jiho3/Documents/Codex/outputs/zanatomy/grid.mjs').href);
const atlas = loadAtlas();

const skin = mesh(atlas, 'Skin');
const skinPts = [], skinNrm = [];
for (let i = 0; i < skin.vertexCount; i++) {
  skinPts.push(new T.Vector3(skin.positions[i * 3], skin.positions[i * 3 + 1], skin.positions[i * 3 + 2]));
  skinNrm.push(new T.Vector3(skin.normals[i * 3], skin.normals[i * 3 + 1], skin.normals[i * 3 + 2]).normalize());
}
const grid = new Grid(skinPts, 0.02);
const index = new Map(skinPts.map((p, i) => [`${p.x},${p.y},${p.z}`, i]));
const outsideMm = (p) => {
  const n = grid.nearest(p, 10);
  if (!n.point) return null;
  const i = index.get(`${n.point.x},${n.point.y},${n.point.z}`);
  return p.clone().sub(n.point).dot(skinNrm[i]) * 1000;
};

const sample = (part, n = 60) => {
  const step = Math.max(1, Math.floor(part.vertexCount / n)), out = [];
  for (let i = 0; i < part.vertexCount; i += step) out.push(new T.Vector3(part.positions[i * 3], part.positions[i * 3 + 1], part.positions[i * 3 + 2]));
  return out;
};

// ① 체표 밖으로 나온 구조 (피부 자신과 손발톱·모발 표현은 제외)
const protruding = [];
for (const part of atlas.parts) {
  if (part.system === 'integumentary') continue;
  const pts = sample(part), d = pts.map(outsideMm).filter((x) => x !== null);
  if (!d.length) continue;
  const over = d.filter((x) => x > 2).length;
  if (over) protruding.push({ id: part.id, name: part.name, system: part.system, pct: +(over / d.length * 100).toFixed(0), maxMm: +Math.max(...d).toFixed(1) });
}
protruding.sort((a, b) => b.maxMm - a.maxMm);
console.log(`\n### 체표 밖으로 나온 구조: ${protruding.length}개`);
console.table(protruding.slice(0, 25));

// ② 뼈를 파고든 구조 — BodyParts3D 3.0에서 복원한 메시(BP3_*)만
const bones = atlas.parts.filter((p) => p.system === 'skeletal' && p.vertexCount > 200).map((p) => ({ p, o: threeMesh(p) }));
const rc = new T.Raycaster(), dirs = [new T.Vector3(0.577, 0.577, 0.577), new T.Vector3(-0.707, 0.1, 0.7).normalize(), new T.Vector3(0.1, -0.99, 0.1).normalize()];
const inBone = (q) => bones.some(({ p, o }) => q.x > p.bounds[0][0] && q.x < p.bounds[1][0] && q.y > p.bounds[0][1] && q.y < p.bounds[1][1] && q.z > p.bounds[0][2] && q.z < p.bounds[1][2]
  && dirs.filter((d) => { rc.set(q, d); return rc.intersectObject(o, false).length % 2 === 1; }).length >= 2);
const legacy = atlas.parts.filter((p) => p.id.startsWith('BP3_'));
const rows = [];
for (const part of legacy) {
  const pts = sample(part, 40), n = pts.filter(inBone).length;
  rows.push({ id: part.id, name: part.name, inBonePct: +(n / pts.length * 100).toFixed(0) });
}
rows.sort((a, b) => b.inBonePct - a.inBonePct);
console.log(`\n### BodyParts3D 3.0 복원 메시(${legacy.length}개) 뼈 관통 비율`);
console.table(rows.slice(0, 15));
fs.writeFileSync('placement_report.json', JSON.stringify({ protruding, legacy: rows }, null, 1));
