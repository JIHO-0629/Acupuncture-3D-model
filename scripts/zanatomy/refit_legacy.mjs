// BodyParts3D 3.0에서 복원한 65개 메시(BP3_*)를 4.0 골격에 맞춰 부위별로 정합한다.
// 3.0 뼈 OBJ ↔ 아틀라스(4.0) 뼈 메시로 닮음변환을 구하고, 같은 부위의 3.0 근육·폐에 적용한다.
// --dry 면 잔차만 보고하고 파일은 쓰지 않는다.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const REPO = 'C:/Users/jiho3/Documents/Codex/2026-09-09/we-are-building-an-acupuncture-anatomy/human-atlas';
const ZIP = 'C:/Users/jiho3/Documents/Codex/outputs/bp3d30/BodyParts3D_3.0_obj_99.zip';
const PARTS_LIST = 'C:/Users/jiho3/AppData/Local/Temp/claude/parts_list_e.txt';
const DRY = process.argv.includes('--dry');
const T = await import(pathToFileURL(`${REPO}/node_modules/three/build/three.module.js`).href);
const { loadAtlas, mesh, has } = await import(pathToFileURL(`${REPO}/scripts/atlas-geometry.mjs`).href);
const { umeyama } = await import(pathToFileURL('C:/Users/jiho3/Documents/Codex/outputs/zanatomy/umeyama.mjs').href);
const { Grid } = await import(pathToFileURL('C:/Users/jiho3/Documents/Codex/outputs/zanatomy/grid.mjs').href);
const atlas = loadAtlas();

const nameToId = new Map(fs.readFileSync(PARTS_LIST, 'utf8').split(/\r?\n/).slice(1)
  .map((l) => l.split('\t')).filter((c) => c.length === 2).map(([id, en]) => [en.trim().toLowerCase(), id]));

// add-bp3-structures.mjs와 같은 좌표 변환 (mm/Z-up → m/Y-up)
const readObj = (text) => {
  const out = [];
  for (const line of text.split('\n')) if (line.startsWith('v ')) {
    const [x, y, z] = line.split(/\s+/).slice(1, 4).map(Number);
    out.push(new T.Vector3(x * 0.001, z * 0.001 + 0.0781112, -y * 0.001 - 0.1));
  }
  return out;
};
const objCache = new Map();
const bone30 = (atlasName) => {
  const id = nameToId.get(atlasName.toLowerCase());
  if (!id) return null;
  if (!objCache.has(id)) {
    try {
      const text = execFileSync('unzip', ['-p', ZIP, `*${id}.obj`], { encoding: 'utf8', maxBuffer: 1 << 28 });
      objCache.set(id, readObj(text));
    } catch { objCache.set(id, null); }
  }
  return objCache.get(id);
};
const atlasPts = (name, step = 3) => {
  const p = mesh(atlas, name), o = [];
  for (let i = 0; i < p.vertexCount; i += step) o.push(new T.Vector3(p.positions[i * 3], p.positions[i * 3 + 1], p.positions[i * 3 + 2]));
  return o;
};

const ordinal = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'];
const REGIONS = {
  skull: ['Mandible', 'Right zygomatic bone', 'Left zygomatic bone', 'Frontal bone', 'Right parietal bone', 'Left parietal bone', 'Occipital bone', 'Right maxilla', 'Left maxilla', 'Right temporal bone', 'Left temporal bone'],
  thorax: [...ordinal.slice(0, 10).flatMap((o) => [`Right ${o} rib`, `Left ${o} rib`]), 'Manubrium', 'Body of sternum',
    ...['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'].map((o) => `${o} thoracic vertebra`)],
  abdomen: ['Right hip bone', 'Left hip bone', 'Sacrum', ...['First', 'Second', 'Third', 'Fourth', 'Fifth'].map((o) => `${o} lumbar vertebra`),
    'Right eleventh rib', 'Left eleventh rib', 'Right twelfth rib', 'Left twelfth rib', 'Right seventh rib', 'Left seventh rib'],
};
const regionOf = (name) => {
  const n = name.toLowerCase();
  if (/rectus abdominis|latissimus dorsi/.test(n)) return /latissimus/.test(n) ? 'thorax' : 'abdomen';
  if (/lobe of (right |left )?lung/.test(n)) return 'thorax';
  return 'skull';
};

const fits = {};
for (const [region, bones] of Object.entries(REGIONS)) {
  const src = [], dstCloud = [];
  for (const b of bones) {
    if (!has(atlas, b)) continue;
    const pts = bone30(b);
    if (!pts) continue;
    const step = Math.max(1, Math.floor(pts.length / 1200));
    for (let i = 0; i < pts.length; i += step) src.push(pts[i]);
    dstCloud.push(...atlasPts(b, 2));
  }
  if (!src.length) { console.log(region, '3.0 뼈를 찾지 못함'); continue; }
  const grid = new Grid(dstCloud, 0.01);
  let M = new T.Matrix4();
  for (let it = 0; it < 20; it++) {
    const s = [], d = [];
    for (const p of src) { const n = grid.nearest(p.clone().applyMatrix4(M), 8); if (n.point && n.dist < 0.03) { s.push(p); d.push(n.point); } }
    M = umeyama(s, d, T);
  }
  const before = src.map((p) => grid.nearest(p, 8).dist).sort((a, b) => a - b);
  const after = src.map((p) => grid.nearest(p.clone().applyMatrix4(M), 8).dist).sort((a, b) => a - b);
  fits[region] = M;
  console.log(`${region.padEnd(8)} 뼈 ${src.length}점 | 정합 전 중앙값 ${(before[before.length >> 1] * 1000).toFixed(1)} mm → 후 ${(after[after.length >> 1] * 1000).toFixed(1)} mm (p90 ${(after[Math.floor(after.length * 0.9)] * 1000).toFixed(1)})`);
}

// --- 적용: 청크 안 BP3_* 파트의 좌표를 직접 옮긴다
const manifestPath = `${REPO}/public/models/atlas.json`;
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const legacy = manifest.parts.filter((p) => p.id.startsWith('BP3_'));
const byChunk = new Map();
for (const p of legacy) (byChunk.get(p.chunk) ?? byChunk.set(p.chunk, []).get(p.chunk)).push(p);
console.log(`\n대상 ${legacy.length}개, 청크 ${[...byChunk.keys()].join(',')}`);
if (DRY) process.exit(0);
for (const [ci, parts] of byChunk) {
  const file = `${REPO}/public/models/${manifest.chunks[ci].url.split('/').pop()}`;
  const buf = fs.readFileSync(file);
  for (const part of parts) {
    const M = fits[regionOf(part.name)];
    if (!M) continue;
    const pos = new Float32Array(buf.buffer, buf.byteOffset + part.positions, part.vertexCount * 3);
    const low = [Infinity, Infinity, Infinity], high = [-Infinity, -Infinity, -Infinity];
    const q = new T.Vector3();
    for (let i = 0; i < part.vertexCount; i++) {
      q.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]).applyMatrix4(M);
      pos[i * 3] = q.x; pos[i * 3 + 1] = q.y; pos[i * 3 + 2] = q.z;
      for (const a of [0, 1, 2]) { const val = q.getComponent(a); if (val < low[a]) low[a] = val; if (val > high[a]) high[a] = val; }
    }
    part.bounds = [low, high];
  }
  fs.writeFileSync(file, buf);
}
manifest.supplements = [...(manifest.supplements ?? []), { source: 'BodyParts3D 3.0 refit', date: '2026-09-23', regions: Object.keys(fits), reason: '3.0 복원 메시가 4.0 골격과 어긋나 부위별 닮음변환으로 재정합' }];
fs.writeFileSync(manifestPath, JSON.stringify(manifest));
console.log('적용 완료');
