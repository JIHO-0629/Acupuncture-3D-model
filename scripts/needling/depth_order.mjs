import { pathToFileURL } from 'node:url';
const REPO = 'C:/Users/jiho3/Documents/Codex/2026-09-09/we-are-building-an-acupuncture-anatomy/human-atlas';
const T = await import(pathToFileURL(`${REPO}/node_modules/three/build/three.module.js`).href);
const { loadAtlas, threeMesh } = await import(pathToFileURL(`${REPO}/scripts/atlas-geometry.mjs`).href);
const atlas = loadAtlas();
const rc = new T.Raycaster();
// 피부 바깥에서 몸 중심으로 쏴서 만나는 순서 (피부 제외)
const probe = (label, from, to) => {
  const o = new T.Vector3(...from), d = new T.Vector3(...to).sub(o).normalize(), hits = [];
  for (const p of atlas.parts) {
    if (p.system === 'integumentary') continue;
    const box = new T.Box3(new T.Vector3().fromArray(p.bounds[0]), new T.Vector3().fromArray(p.bounds[1])).expandByScalar(0.002);
    const r = new T.Ray(o, d);
    if (!box.containsPoint(o) && !r.intersectsBox(box)) continue;
    rc.set(o, d); rc.far = 0.4;
    const h = rc.intersectObject(p.__o ??= threeMesh(p), false)[0];
    if (h) hits.push({ mm: +(h.distance * 1000).toFixed(1), name: p.name, system: p.system });
  }
  hits.sort((a, b) => a.mm - b.mm);
  console.log(`\n== ${label}`);
  for (const h of hits.slice(0, 7)) console.log(`   ${String(h.mm).padStart(6)} mm  ${h.system.padEnd(10)} ${h.name}`);
};
probe('흉골 정중앙 (CV17 높이) 앞→뒤', [0, 1.30, 0.30], [0, 1.30, -0.10]);
probe('오른쪽 대흉근 부위 앞→뒤', [-0.07, 1.33, 0.30], [-0.07, 1.33, -0.10]);
probe('앞목 (CV22 위) 앞→뒤', [0, 1.45, 0.30], [0, 1.45, -0.05]);
probe('배꼽 위 복직근 앞→뒤', [-0.03, 1.15, 0.30], [-0.03, 1.15, -0.05]);
