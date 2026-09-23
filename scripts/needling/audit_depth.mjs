// Depth audit of every straight-needle profile on the current atlas, along the viewer's own ray.
//
// For each point in data/needling-direct.json: project as app/scene.tsx does (skin hit and its face normal,
// or the seed itself for 'direct' points), walk the needle to the documented model limit, and record every
// structure it enters with entry and exit depth. The report lists, per point, what lies within the documented
// range, the first structure beyond it, and flags for review:
//
//   empty       nothing but skin/fat inside the documented range
//   bone        a bone is entered inside the range (the needle would stop there)
//   hazard      an artery, vein, nerve, pleura/lung or viscus is entered inside the range
//
// Flags are prompts for review, not verdicts; no depth here is a clinical safety value.
// usage: node scripts/needling/audit_depth.mjs [out-basename]
import fs from 'node:fs';
import path from 'node:path';
import * as T from 'three';
import { allPoints } from './points_all.mjs';
import { loadAtlas, threeMesh } from '../atlas-geometry.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const base = process.argv[2] ?? `reports/needling-depth-audit-${new Date().toISOString().slice(0, 10)}`;
const profiles = JSON.parse(fs.readFileSync(path.join(root, 'data/needling-direct.json'), 'utf8'));
const atlas = loadAtlas();
const zd = path.join(root, 'public/models/zanatomy'), z = JSON.parse(fs.readFileSync(path.join(zd, 'zanatomy.json'), 'utf8'));
const buffers = z.chunks.map((c) => { const b = fs.readFileSync(path.join(zd, path.basename(c.url))); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); });
for (const p of z.parts) atlas.parts.push({ ...p, positions: new Float32Array(buffers[p.chunk], p.positions, p.vertexCount * 3),
  indices: new Uint32Array(buffers[p.chunk], p.indices, p.indexCount), box: new T.Box3(new T.Vector3(...p.bounds[0]), new T.Vector3(...p.bounds[1])) });
const skins = atlas.parts.filter((p) => p.system === 'integumentary').map((p) => threeMesh(p));
const raycaster = new T.Raycaster();
const HEAD = new T.Vector3(0, 1.59, 0);
const outwardOf = (def, seed) => def.outward ? new T.Vector3(...def.outward).normalize()
  : def.projection === 'anterior' ? new T.Vector3(0, 0, 1) : def.projection === 'posterior' ? new T.Vector3(0, 0, -1)
    : def.projection === 'dorsal-foot' ? new T.Vector3(0, 1, 0) : def.projection === 'lateral' ? new T.Vector3(-1, 0, 0)
      : seed.clone().sub(HEAD).normalize();
function project(def) {
  const seed = new T.Vector3(...def.seed), out = outwardOf(def, seed);
  if (def.projection === 'direct') return { point: seed, normal: out };
  raycaster.set(seed.clone().addScaledVector(out, 0.24), out.clone().negate()); raycaster.far = Infinity;
  let best, bd = Infinity;
  for (const m of skins) for (const h of raycaster.intersectObject(m, false)) { const d = h.point.distanceTo(seed); if (d < bd) { best = h; bd = d; } }
  if (!best) return { point: seed, normal: out, missed: true };
  const n = best.face.normal.clone().normalize(); if (n.dot(out) < 0) n.negate();
  return { point: best.point.clone(), normal: n };
}
const votes = [[0.577, 0.577, 0.577], [-0.707, 0.1, 0.7], [0.1, -0.99, 0.1]].map((d) => new T.Vector3(...d).normalize());
const cache = new Map();
const objectOf = (p) => { let o = cache.get(p); if (!o) { o = threeMesh(p); cache.set(p, o); } return o; };
function layers(origin, dir, maxMm) {
  const ray = new T.Ray(origin, dir), out = [];
  for (const part of atlas.parts) {
    // Same exclusions as the viewer: skin, and the hidden native ear (app/ear-anatomy.ts).
    if (part.system === 'integumentary' || part.id === 'FJ2811') continue;
    const box = part.box.clone().expandByScalar(0.001), inBox = box.containsPoint(origin);
    if (!inBox) { const h = ray.intersectBox(box, new T.Vector3()); if (!h || h.distanceTo(origin) > maxMm / 1000) continue; }
    raycaster.set(origin, dir); raycaster.far = maxMm / 1000;
    const o = objectOf(part);
    const hits = raycaster.intersectObject(o, false).map((h) => h.distance).sort((a, b) => a - b).filter((d, i, a) => i === 0 || d - a[i - 1] > 1e-5);
    raycaster.far = Infinity;
    if (!hits.length) continue;
    const inside = inBox && hits.length % 2 === 1 && votes.filter((d) => { raycaster.set(origin, d); return raycaster.intersectObject(o, false).length % 2 === 1; }).length >= 2;
    const seq = inside ? [0, ...hits] : hits;
    for (let i = 0; i < seq.length; i += 2) out.push({ name: part.name, system: part.system, a: +(seq[i] * 1000).toFixed(1), b: seq[i + 1] === undefined ? null : +(seq[i + 1] * 1000).toFixed(1) });
  }
  return out.sort((x, y) => x.a - y.a);
}
const HAZARD = /arterial|venous|nervous|respiratory|digestive|urinary|cardiac/;
const definitions = new Map(allPoints().map((p) => [p.code, p]));
const rows = [];
for (const [code, profile] of Object.entries(profiles)) {
  const def = definitions.get(code), { point, normal, missed } = project(def), dir = normal.clone().negate();
  const max = profile.modelMaxMm, all = layers(point.clone().addScaledVector(dir, 0.00015), dir, Math.max(max * 1.6, max + 15));
  const within = all.filter((l) => l.a <= max), beyond = all.filter((l) => l.a > max);
  const flags = [];
  if (missed) flags.push('skin-miss');
  if (!within.length) flags.push('empty');
  if (within.some((l) => l.system === 'skeletal')) flags.push('bone');
  if (within.some((l) => HAZARD.test(l.system))) flags.push('hazard');
  rows.push({ code, cun: `${profile.minCun}–${profile.maxCun}`, mmPerCun: profile.mmPerCun, max, projection: def.projection, flags,
    within: within.map((l) => ({ ...l, name: l.name })), next: beyond[0] ?? null });
}
const fmt = (l) => `${l.name.replace(/^Right /, '').replace(/ of right /, ' ')} ${l.a}${l.b === null ? '+' : `–${l.b}`}`;
const count = (f) => rows.filter((r) => r.flags.includes(f)).length;
const md = [
  `# 자침 깊이 감사 (${new Date().toISOString().slice(0, 10)})`, '',
  '- 대상: `data/needling-direct.json`의 직자 기법 전부. 경로는 뷰어(`app/scene.tsx`)와 같은 피부 투영과 면 법선(또는 direct 시드의 지정 방향)으로 계산했습니다.',
  '- 깊이 상한 = 문헌 촌 상한 × 혈 부위의 모델 비례 단위(`mmPerCun`, `scripts/needling/export_direct_profiles.mjs`). 임상 안전심도가 아닙니다.',
  '- 표시: empty = 상한 안에 피부·지방 외 구조 없음, bone = 상한 안에서 뼈에 닿음, hazard = 상한 안에서 혈관·신경·흉막·장기를 지남. 검토 신호이며 판정이 아닙니다.', '',
  `집계: ${rows.length}혈 · empty ${count('empty')} · bone ${count('bone')} · hazard ${count('hazard')} · 피부 투영 실패 ${count('skin-miss')}`, '',
  '| 혈 | 촌 | mm/촌 | 상한 mm | 표시 | 상한 안 구조 (진입–이탈 mm) | 상한 다음 첫 구조 |', '|---|---|---:|---:|---|---|---|',
  ...rows.map((r) => `| ${r.code} | ${r.cun} | ${r.mmPerCun} | ${r.max} | ${r.flags.join(', ') || '—'} | ${r.within.map(fmt).join('; ') || '—'} | ${r.next ? fmt(r.next) : '—'} |`),
].join('\n');
fs.writeFileSync(path.join(root, `${base}.md`), md + '\n');
fs.writeFileSync(path.join(root, `${base}.json`), JSON.stringify(rows));
console.log(`${rows.length} points · empty ${count('empty')} · bone ${count('bone')} · hazard ${count('hazard')} · skin-miss ${count('skin-miss')} → ${base}.md`);
