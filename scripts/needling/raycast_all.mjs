// 361 표준경혈 전체 raycast. 모델 거리는 시각화 값이고 안전 판정은 내지 않는다.
// usage: node raycast_all.mjs [--limit N]
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { allPoints } from './points_all.mjs';

const REPO = 'C:/Users/jiho3/Documents/Codex/2026-09-09/we-are-building-an-acupuncture-anatomy/human-atlas';
const T = await import(pathToFileURL(`${REPO}/node_modules/three/build/three.module.js`).href);
const { loadAtlas, threeMesh, mesh } = await import(pathToFileURL(`${REPO}/scripts/atlas-geometry.mjs`).href);
const RAYCAST_VERSION = 'raycast_all v1.0 (2026-09-23)';
const MAX_MM = 150;
const LIMIT = +(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? 0);

const atlas = loadAtlas();
const ZA = `${REPO}/public/models/zanatomy/`;
if (fs.existsSync(ZA + 'zanatomy.json')) {
  const zm = JSON.parse(fs.readFileSync(ZA + 'zanatomy.json', 'utf8'));
  const bufs = zm.chunks.map((c) => { const f = fs.readFileSync(ZA + c.url.split('/').pop()); return f.buffer.slice(f.byteOffset, f.byteOffset + f.byteLength); });
  for (const p of zm.parts) atlas.parts.push({ ...p, zanatomy: true,
    positions: new Float32Array(bufs[p.chunk], p.positions, p.vertexCount * 3),
    normals: new Int16Array(bufs[p.chunk], p.normals, p.vertexCount * 3),
    indices: new Uint32Array(bufs[p.chunk], p.indices, p.indexCount),
    box: new T.Box3(new T.Vector3().fromArray(p.bounds[0]), new T.Vector3().fromArray(p.bounds[1])) });
}
const v = (a) => new T.Vector3(...a);
const landmarks = JSON.parse(fs.readFileSync(`${REPO}/data/landmarks.json`, 'utf8')).landmarks;
const lm = (id) => v(landmarks.find((l) => l.id === id && l.side !== 'left').point);

// --- 체표 투영 (뷰어 scene.tsx projectToSkin과 같은 규칙)
const skins = atlas.parts.filter((p) => p.system === 'integumentary').map((p) => threeMesh(p));
const raycaster = new T.Raycaster();
const HEAD_CENTRE = new T.Vector3(0, 1.59, 0);
const projectionDirection = (seed, mode) => mode === 'anterior' ? v([0, 0, 1]) : mode === 'posterior' ? v([0, 0, -1])
  : mode === 'dorsal-foot' ? v([0, 1, 0]) : mode === 'lateral' ? v([-1, 0, 0]) : seed.clone().sub(HEAD_CENTRE).normalize();
function projectToSkin(seedArr, mode, outward) {
  const seed = v(seedArr);
  const dir = outward ? v(outward).normalize() : projectionDirection(seed, mode);
  if (mode === 'direct') return { point: seed, normal: dir, seedToSkinMm: 0 };
  raycaster.set(seed.clone().addScaledVector(dir, 0.24), dir.clone().negate());
  let best, bestD = Infinity;
  for (const obj of skins) for (const hit of raycaster.intersectObject(obj, false)) {
    const d = hit.point.distanceTo(seed);
    if (d < bestD) { best = hit; bestD = d; }
  }
  if (!best) return { point: seed, normal: dir, seedToSkinMm: 0, missed: true };
  const normal = best.face.normal.clone().normalize();
  if (normal.dot(dir) < 0) normal.negate();
  return { point: best.point.clone(), normal, seedToSkinMm: bestD * 1000 };
}

// --- 촌 → mm 변환 (후보 3종, 어느 것도 기본값으로 확정하지 않음)
const skinPart = mesh(atlas, 'Skin');
const GLOBAL_CUN = (skinPart.bounds[1][1] - skinPart.bounds[0][1]) * 1000 / 75;
const centroid = (p) => { const c = new T.Vector3(); for (let i = 0; i < p.vertexCount; i++) c.add(new T.Vector3(p.positions[i * 3], p.positions[i * 3 + 1], p.positions[i * 3 + 2])); return c.multiplyScalar(1 / p.vertexCount); };
const phalanx = mesh(atlas, 'Middle phalanx of right middle finger');
const fingerAxis = centroid(mesh(atlas, 'Distal phalanx of right middle finger')).sub(centroid(mesh(atlas, 'Proximal phalanx of right middle finger'))).normalize();
let flo = Infinity, fhi = -Infinity;
for (let i = 0; i < phalanx.vertexCount; i++) { const d = new T.Vector3(phalanx.positions[i * 3], phalanx.positions[i * 3 + 1], phalanx.positions[i * 3 + 2]).dot(fingerAxis); flo = Math.min(flo, d); fhi = Math.max(fhi, d); }
const F_CUN = (fhi - flo) * 1000;
// WHO 비례구간: 혈 위치(y)와 부위로 가장 가까운 구간을 고른다
const SEGMENTS = [
  { name: 'head 전후 발제 12 B-cun', mm: lm('anterior_hairline_midpoint').distanceTo(lm('posterior_hairline_midpoint')) * 1000 / 12, test: (p) => p.y > 1.54 },
  { name: 'suprasternal notch ↔ xiphisternal 9 B-cun', mm: lm('suprasternal_notch').distanceTo(lm('xiphisternal_junction')) * 1000 / 9, test: (p) => p.y > 1.24 },
  { name: 'xiphisternal ↔ umbilicus 8 B-cun', mm: lm('xiphisternal_junction').distanceTo(lm('umbilicus')) * 1000 / 8, test: (p) => p.y > 1.09 },
  { name: 'umbilicus ↔ pubic symphysis 5 B-cun', mm: lm('umbilicus').distanceTo(lm('pubic_symphysis_superior')) * 1000 / 5, test: (p) => p.y > 0.9 },
  { name: 'greater trochanter ↔ popliteal crease 19 B-cun', mm: lm('greater_trochanter').distanceTo(lm('popliteal_crease')) * 1000 / 19, test: (p) => p.y > 0.44 },
  { name: 'popliteal crease ↔ lateral malleolus 16 B-cun', mm: lm('popliteal_crease').distanceTo(lm('lateral_malleolus_prominence')) * 1000 / 16, test: (p) => p.y > 0.06 },
  { name: 'medial malleolus ↔ sole 3 B-cun', mm: lm('medial_malleolus_prominence').y * 1000 / 3, test: () => true },
];
const UPPER = [
  { name: 'anterior axillary fold ↔ cubital crease 9 B-cun', mm: null },
];
const localCun = (p, code) => {
  if (/^(LU|LI|HT|SI|PC|TE)\d/.test(code) && Math.abs(p.x) > 0.14) {
    // 팔: 아래팔 12 B-cun (주름 ↔ 손목) 을 쓴다
    const cubital = lm('medial_humeral_epicondyle'), wrist = lm('radial_styloid');
    return { name: 'cubital crease ↔ wrist crease 12 B-cun', mm: cubital.distanceTo(wrist) * 1000 / 12 };
  }
  return SEGMENTS.find((s) => s.test(p)) ?? SEGMENTS[SEGMENTS.length - 1];
};

// --- raycast
const probe = new T.Raycaster();
const PROBES = [v([0.577, 0.577, 0.577]), v([-0.707, 0.1, 0.7]), v([0.1, -0.99, 0.1])].map((d) => d.normalize());
const insideByVote = (obj, origin) => PROBES.filter((d) => { probe.set(origin, d); return probe.intersectObject(obj, false).length % 2 === 1; }).length >= 2;
function traverse(origin, dir) {
  const ray = new T.Ray(origin, dir), layers = [], range = MAX_MM / 1000;
  for (const part of atlas.parts) {
    if (part.system === 'integumentary') continue;
    const box = part.box.clone().expandByScalar(0.001);
    if (!box.containsPoint(origin) && !ray.intersectsBox(box)) continue;
    if (!box.containsPoint(origin)) { const h = ray.intersectBox(box, new T.Vector3()); if (!h || h.distanceTo(origin) > range) continue; }
    raycaster.set(origin, dir); raycaster.far = range;
    const obj = part.__obj ??= threeMesh(part);
    const hits = raycaster.intersectObject(obj, false).map((h) => h.distance).sort((a, b) => a - b)
      .filter((d, i, a) => i === 0 || d - a[i - 1] > 1e-5);
    raycaster.far = Infinity;
    if (!hits.length) continue;
    const seq = hits.length % 2 === 1 && insideByVote(obj, origin) ? [0, ...hits] : hits;
    for (let i = 0; i + 1 < seq.length; i += 2) layers.push({ part, entry: seq[i] * 1000, exit: seq[i + 1] * 1000 });
    if (seq.length % 2) layers.push({ part, entry: seq[seq.length - 1] * 1000, exit: null });
  }
  return layers.sort((a, b) => a.entry - b.entry);
}

const HAZARD_RE = /nervous|arterial|respiratory/;
const SUSPECT = new Set(['FJ2091', 'FJ2195', 'FJ2093', 'FJ2197', 'FJ2318', 'FJ2346']);
const label = (part) => SUSPECT.has(part.id) ? `${part.name} [이름 의심: 위치 불일치]` : part.name;
function nearestApproach(origin, dir, lengthMm) {
  const L = Math.max(lengthMm, 1) / 1000, a = origin, b = origin.clone().addScaledVector(dir, L);
  const seg = new T.Line3(a, b), reach = new T.Box3().setFromPoints([a, b]).expandByScalar(0.03);
  const tmp = new T.Vector3(), closest = new T.Vector3(), best = {};
  for (const part of atlas.parts) {
    if (!HAZARD_RE.test(part.system) || !part.box.intersectsBox(reach)) continue;
    const kind = part.system === 'respiratory' ? (/pleura/i.test(part.name) ? 'pleura' : 'lung') : part.system;
    const stride = part.vertexCount > 4000 ? 3 : 1;
    for (let i = 0; i < part.vertexCount; i += stride) {
      tmp.set(part.positions[i * 3], part.positions[i * 3 + 1], part.positions[i * 3 + 2]);
      if (!reach.containsPoint(tmp)) continue;
      const d = seg.closestPointToPoint(tmp, true, closest).distanceTo(tmp);
      if (!best[kind] || d < best[kind].d) best[kind] = { d, name: label(part), part, atMm: closest.distanceTo(a) * 1000 };
    }
  }
  return best;
}

const AZIMUTH = { superior: v([0, 1, 0]), inferior: v([0, -1, 0]), anterior: v([0, 0, 1]), posterior: v([0, 0, -1]),
  lateral: v([-1, 0, 0]), medial: v([1, 0, 0]) };
const sheet = JSON.parse(fs.readFileSync('sheet_data.json', 'utf8'));
const points = allPoints();
const byCode = new Map(points.map((p) => [p.code, p]));
const r3 = (x) => x.toArray().map((n) => +n.toFixed(4)).join(', ');
const rows = [], summary = [];
const codes = [...new Set(sheet.tech.map((t) => t.point_code))].filter((c) => byCode.has(c));
const started = Date.now();
let done = 0;
for (const code of (LIMIT ? codes.slice(0, LIMIT) : codes)) {
  const def = byCode.get(code);
  const { point, normal, seedToSkinMm, missed } = projectToSkin(def.seed, def.projection, def.outward);
  const cun = localCun(point, code);
  const convs = [
    { method: 'local_Bcun', mmPerCun: cun.mm, basis: cun.name },
    { method: 'model_Bcun_global', mmPerCun: GLOBAL_CUN, basis: '신장/75 (Lin 2013)' },
    { method: 'F_cun_middle', mmPerCun: F_CUN, basis: '중지 중절골 길이' },
  ];
  for (const t of sheet.tech.filter((x) => x.point_code === code)) {
    const variants = [];
    if (t.direction_class === 'perpendicular' && !t.direction_target && !t.direction_axis) variants.push({ label: 'normal', dir: normal.clone().negate() });
    else {
      const angle = t.angle_from_surface_normal_deg === '' ? (t.render_default_angle_deg || 45) : t.angle_from_surface_normal_deg;
      const axes = t.direction_axis ? t.direction_axis.split('+').filter((a) => AZIMUTH[a]) : [];
      const list = axes.length ? axes : ['superior', 'inferior', 'anterior', 'posterior'];
      for (const az of list) {
        const tangent = AZIMUTH[az].clone().addScaledVector(normal, -AZIMUTH[az].dot(normal));
        if (tangent.lengthSq() < 1e-8) continue;
        tangent.normalize();
        const rad = T.MathUtils.degToRad(angle);
        variants.push({ label: `${az}@${angle}°${axes.length ? '' : ' (원문 방위 없음 — 변형)'}`,
          dir: normal.clone().negate().multiplyScalar(Math.cos(rad)).addScaledVector(tangent, Math.sin(rad)).normalize() });
      }
      if (!variants.length) variants.push({ label: 'normal (접선 없음)', dir: normal.clone().negate() });
    }
    const est = convs.map((c) => ({ ...c, min: +(t.depth_cun_min * c.mmPerCun).toFixed(1), max: +(t.depth_cun_max * c.mmPerCun).toFixed(1) }));
    const Lmax = Math.max(...est.map((e) => e.max), 0);
    for (const vr of variants) {
      const origin = point.clone().addScaledVector(vr.dir, 0.00015);
      const layers = traverse(origin, vr.dir);
      const approach = nearestApproach(origin, vr.dir, Lmax);
      const base = {
        model_id: 'BodyParts3D atlas + Z-Anatomy supplement', model_version: 'repo 2d4aa8e', mesh_version: 'atlas.json / zanatomy-nerves-1',
        model_pose_id: 'anatomical standing (BodyParts3D default)', point_code: code, technique_id: t.technique_id,
        point_coordinate_version: `${def.projection} 투영${missed ? ' (피부 투영 실패 — seed 사용)' : ''}`,
        ray_origin_xyz: r3(point), ray_direction_xyz: r3(vr.dir), raycast_version: `${RAYCAST_VERSION}; variant ${vr.label}`,
        conversion_method: est.map((e) => e.method).join(' | '), conversion_version: 'v0.2',
        depth_mm_estimated_min: est.map((e) => e.min).join(' | '), depth_mm_estimated_max: est.map((e) => e.max).join(' | '),
      };
      layers.forEach((L, i) => rows.push({ ...base, layer_order: i + 1, structure_id: L.part.id, structure_name: label(L.part), structure_type: L.part.system,
        entry_mm: +L.entry.toFixed(1), exit_mm: L.exit === null ? '' : +L.exit.toFixed(1), mesh_available: L.part.zanatomy ? 'Y (Z-Anatomy)' : 'Y',
        notes: [L.exit === null ? `${MAX_MM} mm 안에서 exit 없음` : '', L.part.zanatomy ? `Z-Anatomy CC BY-SA 4.0; ${L.part.uncertainty ?? ''}` : ''].filter(Boolean).join(' / ') }));
      for (const [kind, val] of Object.entries(approach)) rows.push({ ...base, layer_order: 'nearest', structure_id: val.part.id, structure_name: val.name, structure_type: val.part.system,
        entry_mm: +val.atMm.toFixed(1), exit_mm: '', mesh_available: val.part.zanatomy ? 'Y (Z-Anatomy)' : 'Y',
        notes: `최근접 접근 ${(val.d * 1000).toFixed(1)} mm (침 경로 0–${Lmax} mm 안, 관통 아님). entry_mm = 가장 가까운 지점의 침 깊이` });
      summary.push({ code, technique: t.technique_id, variant: vr.label, cun: `${t.depth_cun_min}–${t.depth_cun_max}`, Lmax, seedToSkinMm: +seedToSkinMm.toFixed(1),
        first: layers[0] ? `${layers[0].part.name} @${layers[0].entry.toFixed(1)}` : '',
        nerve: approach.nervous && `${approach.nervous.name} ${(approach.nervous.d * 1000).toFixed(1)}mm`,
        artery: approach.arterial && `${approach.arterial.name} ${(approach.arterial.d * 1000).toFixed(1)}mm`,
        pleura: approach.pleura && `${(approach.pleura.d * 1000).toFixed(1)}mm`, lung: approach.lung && `${(approach.lung.d * 1000).toFixed(1)}mm` });
    }
  }
  done++;
  if (done % 10 === 0) console.log(`${done}/${LIMIT || codes.length} ${code} | ${((Date.now() - started) / 1000).toFixed(0)}s | rows ${rows.length}`);
}
fs.writeFileSync('model_paths_all.json', JSON.stringify({ rows, summary }, null, 1));
console.log(`완료: 혈 ${done}, 행 ${rows.length}, ${((Date.now() - started) / 1000 / 60).toFixed(1)}분`);
