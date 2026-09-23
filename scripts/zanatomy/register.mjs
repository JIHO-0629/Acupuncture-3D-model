// Z-Anatomy(cm, Y-up) → human-atlas(BodyParts3D, m, Y-up) 정합
// 공통 장기·뇌신경의 표면점으로 닮음변환(균일 스케일 + 회전 + 이동)을 추정하고
// 대칭 최근접점 거리로 잔차를 보고한다.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { loadFbx } from './inspect_fbx.mjs';

const REPO = 'C:/Users/jiho3/Documents/Codex/2026-09-09/we-are-building-an-acupuncture-anatomy/human-atlas';
const { loadAtlas, mesh } = await import(pathToFileURL(`${REPO}/scripts/atlas-geometry.mjs`).href);
const atlas = loadAtlas();
const nerv = await loadFbx('NervousSystem100.fbx');
const visc = await loadFbx('VisceralSystem100.fbx');
const { T } = nerv;

const PAIRS = [
  ['visc', 'Kidneyr', 'Right kidney'], ['visc', 'Kidneyl', 'Left kidney'], ['visc', 'Pancreas', 'Pancreas'],
  ['visc', 'Stomach', 'Stomach'], ['visc', 'Gallbladder', 'Gallbladder'], ['visc', 'Trachea', 'Trachea'],
  ['visc', 'Oesophagus', 'Esophagus'], ['visc', 'Urinary_bladder', 'Urinary bladder'],
  ['nerv', 'Optic_nerve_(II)r', 'Right optic nerve'], ['nerv', 'Optic_nerve_(II)l', 'Left optic nerve'],
  ['nerv', 'Trochlear_nerve_(IV)r', 'Right trochlear nerve'], ['nerv', 'Trochlear_nerve_(IV)l', 'Left trochlear nerve'],
];

const worldPoints = (m, stride = 1) => {
  const p = m.geometry.attributes.position, out = [];
  for (let i = 0; i < p.count; i += stride) out.push(new T.Vector3().fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld));
  return out;
};
const atlasPoints = (part, stride = 1) => {
  const out = [];
  for (let i = 0; i < part.vertexCount; i += stride) out.push(new T.Vector3(part.positions[i * 3], part.positions[i * 3 + 1], part.positions[i * 3 + 2]));
  return out;
};
const centre = (pts) => pts.reduce((s, p) => s.add(p), new T.Vector3()).multiplyScalar(1 / pts.length);

// 1) 초기값: 짝별 중심점으로 Umeyama
function umeyama(src, dst) {
  const n = src.length, ms = centre(src.map((p) => p.clone())), md = centre(dst.map((p) => p.clone()));
  const S = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; let varS = 0;
  for (let k = 0; k < n; k++) {
    const a = src[k].clone().sub(ms), b = dst[k].clone().sub(md);
    varS += a.lengthSq();
    const av = a.toArray(), bv = b.toArray();
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) S[i][j] += bv[i] * av[j] / n;
  }
  varS /= n;
  // 3x3 SVD via Jacobi on S^T S
  const { U, D, V } = svd3(S);
  const det = new T.Matrix3().set(...U.flat()).determinant() * new T.Matrix3().set(...V.flat()).determinant();
  const Sd = [1, 1, det < 0 ? -1 : 1];
  const R = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) R[i][j] += U[i][k] * Sd[k] * V[j][k];
  const scale = (D[0] * Sd[0] + D[1] * Sd[1] + D[2] * Sd[2]) / varS;
  const Rm = new T.Matrix4().set(R[0][0], R[0][1], R[0][2], 0, R[1][0], R[1][1], R[1][2], 0, R[2][0], R[2][1], R[2][2], 0, 0, 0, 0, 1);
  const t = md.clone().sub(ms.clone().applyMatrix4(Rm).multiplyScalar(scale));
  return new T.Matrix4().makeTranslation(t.x, t.y, t.z).multiply(new T.Matrix4().makeScale(scale, scale, scale)).multiply(Rm);
}
function svd3(A) {
  // Jacobi eigen of A^T A → V, singular values; U = A V / s
  const ata = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) ata[i][j] += A[k][i] * A[k][j];
  let V = [[1, 0, 0], [0, 1, 0], [0, 0, 1]], M = ata.map((r) => r.slice());
  for (let sweep = 0; sweep < 50; sweep++) for (let p = 0; p < 2; p++) for (let q = p + 1; q < 3; q++) {
    if (Math.abs(M[p][q]) < 1e-15) continue;
    const th = 0.5 * Math.atan2(2 * M[p][q], M[q][q] - M[p][p]), c = Math.cos(th), s = Math.sin(th);
    for (let k = 0; k < 3; k++) { const mkp = M[k][p], mkq = M[k][q]; M[k][p] = c * mkp - s * mkq; M[k][q] = s * mkp + c * mkq; }
    for (let k = 0; k < 3; k++) { const mpk = M[p][k], mqk = M[q][k]; M[p][k] = c * mpk - s * mqk; M[q][k] = s * mpk + c * mqk; }
    for (let k = 0; k < 3; k++) { const vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq; }
  }
  const order = [0, 1, 2].sort((a, b) => M[b][b] - M[a][a]);
  V = V.map((r) => order.map((i) => r[i]));
  const D = order.map((i) => Math.sqrt(Math.max(M[i][i], 0)));
  const U = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) { let s = 0; for (let k = 0; k < 3; k++) s += A[i][k] * V[k][j]; U[i][j] = D[j] > 1e-12 ? s / D[j] : (i === j ? 1 : 0); }
  return { U, D, V };
}

const src = [], dst = [], pairData = [];
for (const [lib, zName, aName] of PAIRS) {
  const m = (lib === 'visc' ? visc : nerv).meshes.find((x) => x.name === zName);
  const part = mesh(atlas, aName);
  if (!m) { console.log('missing', zName); continue; }
  const zp = worldPoints(m, Math.max(1, Math.floor(m.geometry.attributes.position.count / 400)));
  const ap = atlasPoints(part, Math.max(1, Math.floor(part.vertexCount / 400)));
  src.push(centre(zp.map((p) => p.clone()))); dst.push(centre(ap.map((p) => p.clone())));
  pairData.push({ zName, aName, zp, ap });
}
let M = umeyama(src, dst);

// 2) 정밀화: 짝별 표면점 ICP (각 Z 점 → 같은 짝 아틀라스 최근접점)
for (let iter = 0; iter < 15; iter++) {
  const s2 = [], d2 = [];
  for (const { zp, ap } of pairData) for (const p of zp) {
    const q = p.clone().applyMatrix4(M);
    let best = null, bd = Infinity;
    for (const a of ap) { const d = a.distanceToSquared(q); if (d < bd) { bd = d; best = a; } }
    s2.push(p); d2.push(best);
  }
  M = umeyama(s2, d2);
}

const scale = new T.Vector3().setFromMatrixScale(M).x;
console.log('scale (Z-Anatomy unit → m):', scale.toFixed(6));
const report = [];
for (const { zName, aName, zp, ap } of pairData) {
  let sum = 0, max = 0;
  for (const p of zp) { const q = p.clone().applyMatrix4(M); let bd = Infinity; for (const a of ap) bd = Math.min(bd, a.distanceTo(q)); sum += bd; max = Math.max(max, bd); }
  report.push({ pair: `${zName} → ${aName}`, meanMm: +(sum / zp.length * 1000).toFixed(1), maxMm: +(max * 1000).toFixed(1) });
}
console.table(report);
fs.writeFileSync('registration.json', JSON.stringify({ matrix: M.elements, scale, pairs: report, method: 'Umeyama on centroids, then 15-iter per-pair ICP (similarity)', date: '2026-09-22' }, null, 1));
