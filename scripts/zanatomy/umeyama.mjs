// 닮음변환 추정 (Umeyama 1991) + 3x3 SVD (Jacobi)
const centre = (pts) => pts.reduce((s, p) => s.add(p), pts[0].clone().set(0, 0, 0)).multiplyScalar(1 / pts.length);
export function umeyama(src, dst, T) {
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
export function svd3(A) {
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


// 아핀 최소제곱 (3x4): dst ≈ A·src + b. 긴 뼈의 길이·굵기 비율 차이를 흡수한다.
export function affineFit(src, dst, T) {
  const XtX = Array.from({ length: 4 }, () => [0, 0, 0, 0]), XtY = Array.from({ length: 4 }, () => [0, 0, 0]);
  for (let k = 0; k < src.length; k++) {
    const x = [src[k].x, src[k].y, src[k].z, 1], y = [dst[k].x, dst[k].y, dst[k].z];
    for (let i = 0; i < 4; i++) { for (let j = 0; j < 4; j++) XtX[i][j] += x[i] * x[j]; for (let j = 0; j < 3; j++) XtY[i][j] += x[i] * y[j]; }
  }
  const inv = new T.Matrix4().set(...XtX.flat()).invert().elements; // column-major
  const at = (r, c) => inv[c * 4 + r];
  const W = [0, 1, 2, 3].map((i) => [0, 1, 2].map((j) => [0, 1, 2, 3].reduce((s, k) => s + at(i, k) * XtY[k][j], 0)));
  return new T.Matrix4().set(W[0][0], W[1][0], W[2][0], W[3][0], W[0][1], W[1][1], W[2][1], W[3][1], W[0][2], W[1][2], W[2][2], W[3][2], 0, 0, 0, 1);
}
