// ④ 자침 벡터 생성 + ⑤ BodyParts3D raycast 프로토타입 (GB21 · GB30 · GB38)
// 모델 거리는 시각화 값이다. 안전 판정을 출력하지 않는다 (clearance·겹침 같은 사실만).
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const REPO = 'C:/Users/jiho3/Documents/Codex/2026-09-09/we-are-building-an-acupuncture-anatomy/human-atlas';
const T = await import(pathToFileURL(`${REPO}/node_modules/three/build/three.module.js`).href);
const { loadAtlas, threeMesh, mesh } = await import(pathToFileURL(`${REPO}/scripts/atlas-geometry.mjs`).href);

const RAYCAST_VERSION = 'raycast_prototype v0.1 (2026-09-22)';
const MAX_MM = 150;
const atlas = loadAtlas();
// Z-Anatomy 말초신경·흉막 (별도 폴더, CC BY-SA 4.0) — 있으면 raycast 대상에 합친다
const ZA_DIR = `${REPO}/public/models/zanatomy/`;
if (fs.existsSync(ZA_DIR + 'zanatomy.json')) {
  const zm = JSON.parse(fs.readFileSync(ZA_DIR + 'zanatomy.json', 'utf8'));
  const bufs = zm.chunks.map((c) => { const f = fs.readFileSync(ZA_DIR + c.url.split('/').pop()); return f.buffer.slice(f.byteOffset, f.byteOffset + f.byteLength); });
  for (const p of zm.parts) atlas.parts.push({ ...p, zanatomy: true, positions: new Float32Array(bufs[p.chunk], p.positions, p.vertexCount * 3), normals: new Int16Array(bufs[p.chunk], p.normals, p.vertexCount * 3), indices: new Uint32Array(bufs[p.chunk], p.indices, p.indexCount), box: new T.Box3(new T.Vector3().fromArray(p.bounds[0]), new T.Vector3().fromArray(p.bounds[1])) });
  console.log('Z-Anatomy parts added:', zm.parts.length);
}
const v = (a) => new T.Vector3(...a);
const landmarks = JSON.parse(fs.readFileSync(`${REPO}/data/landmarks.json`, 'utf8')).landmarks;
const lm = (id) => v(landmarks.find((l) => l.id === id && l.side !== 'left').point);

// --- 혈 위치: 뷰어 런타임 projectToSkin을 그대로 재현 (오른쪽; 왼쪽은 x 반전)
const legHeight = (cun) => lm('lateral_malleolus_prominence').y + (lm('popliteal_crease').y - lm('lateral_malleolus_prominence').y) * cun / 16;
const sampleCurveAtHeight = (id, h) => {
  const s = landmarks.find((l) => l.id === id && l.side === 'right').samples;
  for (let i = 1; i < s.length; i++) if (h <= s[i][1]) { const r = (h - s[i - 1][1]) / (s[i][1] - s[i - 1][1] || 1); return [s[i - 1][0] + (s[i][0] - s[i - 1][0]) * r, h, s[i - 1][2] + (s[i][2] - s[i - 1][2]) * r]; }
  throw new Error(id);
};
const POINTS = {
  // 뷰어 seed [-0.125, 1.402, -0.005] + lateral 투영은 팔 바깥 피부(seed에서 82 mm)에 닿는다.
  // 프로토타입은 WHO 정의(C7 극돌기 ↔ 견봉 외측단 중점)를 위에서 투영한다.
  GB21: { seed: lm('spinous_process_C7.tip').add(lm('acromion_lateral')).multiplyScalar(0.5).toArray(), projection: 'superior', source: 'WHO landmark midpoint (C7 tip ↔ acromion lateral) → superior projection' },
  GB30: { seed: [-0.135, 0.840, -0.085], projection: 'posterior' },
  GB38: { seed: sampleCurveAtHeight('fibula_anterior_border', legHeight(4)), projection: 'lateral' },
};
const OUTWARD = { lateral: v([-1, 0, 0]), posterior: v([0, 0, -1]), anterior: v([0, 0, 1]), superior: v([0, 1, 0]) };

const skins = atlas.parts.filter((p) => p.system === 'integumentary').map((p) => ({ part: p, obj: threeMesh(p) }));
const raycaster = new T.Raycaster();
function projectToSkin(seedArr, mode) {
  const seed = v(seedArr), outward = OUTWARD[mode].clone();
  raycaster.set(seed.clone().addScaledVector(outward, 0.24), outward.clone().negate());
  let best, bestD = Infinity;
  for (const { obj } of skins) for (const hit of raycaster.intersectObject(obj, false)) {
    const d = hit.point.distanceTo(seed);
    if (d < bestD) { best = hit; bestD = d; }
  }
  if (!best) throw new Error('skin projection missed');
  const normal = best.face.normal.clone().normalize();
  if (normal.dot(outward) < 0) normal.negate();
  return { point: best.point.clone(), normal, seedToSkinMm: bestD * 1000 };
}

// --- 촌 → mm 변환 프로파일 (후보 비교용; 어느 것도 기본값으로 확정하지 않음)
const skinPart = mesh(atlas, 'Skin');
const heightM = skinPart.bounds[1][1] - skinPart.bounds[0][1];
const centroid = (p) => { const c = new T.Vector3(); for (let i = 0; i < p.vertexCount; i++) c.add(new T.Vector3(p.positions[i * 3], p.positions[i * 3 + 1], p.positions[i * 3 + 2])); return c.multiplyScalar(1 / p.vertexCount); };
const middlePhalanx = mesh(atlas, 'Middle phalanx of right middle finger');
const fingerAxis = centroid(mesh(atlas, 'Distal phalanx of right middle finger')).sub(centroid(mesh(atlas, 'Proximal phalanx of right middle finger'))).normalize();
let lo = Infinity, hi = -Infinity;
for (let i = 0; i < middlePhalanx.vertexCount; i++) { const d = new T.Vector3(middlePhalanx.positions[i * 3], middlePhalanx.positions[i * 3 + 1], middlePhalanx.positions[i * 3 + 2]).dot(fingerAxis); lo = Math.min(lo, d); hi = Math.max(hi, d); }
const LOCAL = {
  GB21: { mm: lm('suprasternal_notch').distanceTo(lm('xiphisternal_junction')) * 1000 / 9, basis: 'suprasternal notch → xiphisternal junction = 9 B-cun (견부엔 WHO 세로 B-cun 구간이 없어 가장 가까운 체간 구간 사용)' },
  GB30: { mm: lm('greater_trochanter').distanceTo(lm('popliteal_crease')) * 1000 / 19, basis: 'greater trochanter → popliteal crease = 19 B-cun' },
  GB38: { mm: lm('popliteal_crease').distanceTo(lm('lateral_malleolus_prominence')) * 1000 / 16, basis: 'popliteal crease → lateral malleolus = 16 B-cun' },
};
const conversions = (code) => [
  { method: 'local_Bcun', version: 'v0.1', mmPerCun: LOCAL[code].mm, basis: LOCAL[code].basis },
  { method: 'model_Bcun_global', version: 'v0.1', mmPerCun: heightM * 1000 / 75, basis: `신장 ${Math.round(heightM * 1000)} mm / 75 (Lin 2013 리뷰의 B-cun 정의)` },
  { method: 'F_cun_middle', version: 'v0.1', mmPerCun: (hi - lo) * 1000, basis: '우측 중지 중절골 길이 (피부 주름 간격 대신 뼈 길이 근사)' },
];

// --- raycast: 한 방향으로 모든 비피부 구조의 entry/exit
const probe = new T.Raycaster();
const PROBES = [v([0.577, 0.577, 0.577]), v([-0.707, 0.1, 0.7]), v([0.1, -0.99, 0.1])].map((d) => d.normalize());
function insideByVote(obj, origin) {
  let votes = 0;
  for (const d of PROBES) { probe.set(origin, d); if (probe.intersectObject(obj, false).length % 2 === 1) votes++; }
  return votes >= 2;
}
function traverse(origin, dir) {
  const ray = new T.Ray(origin, dir), layers = [];
  const range = MAX_MM / 1000;
  for (const part of atlas.parts) {
    if (part.system === 'integumentary') continue;
    const box = part.box.clone().expandByScalar(0.001);
    if (!box.containsPoint(origin)) { const h = ray.intersectBox(box, new T.Vector3()); if (!h || h.distanceTo(origin) > range) continue; }
    raycaster.set(origin, dir); raycaster.far = range;
    const obj = part.__obj ??= threeMesh(part);
    const hits = raycaster.intersectObject(obj, false).map((h) => h.distance).sort((a, b) => a - b)
      .filter((d, i, a) => i === 0 || d - a[i - 1] > 1e-5);  // 삼각형 경계 중복 제거
    if (!hits.length) continue;
    // 짝수 = 밖에서 시작, 홀수 = 시작점이 메시 안 (첫 hit이 exit)
    const inside = hits.length % 2 === 1 && insideByVote(obj, origin);
    const seq = inside ? [0, ...hits] : hits;
    for (let i = 0; i + 1 < seq.length; i += 2)
      layers.push({ part, entry: seq[i] * 1000, exit: seq[i + 1] * 1000 });
    if (seq.length % 2) layers.push({ part, entry: seq[seq.length - 1] * 1000, exit: null });
  }
  raycaster.far = Infinity;
  return layers.sort((a, b) => a.entry - b.entry);
}

const HAZARD_RE = /nervous|arterial|respiratory/;
// 아틀라스 원본에서 이름과 위치가 맞지 않는 메시 (별도 감사 작업 대상)
const SUSPECT = new Set(['FJ2091', 'FJ2195', 'FJ2093', 'FJ2197', 'FJ2318', 'FJ2346']);
const label = (part) => SUSPECT.has(part.id) ? `${part.name} [이름 의심: 위치 불일치]` : part.name;
function nearestApproach(origin, dir, lengthMm) {
  const L = lengthMm / 1000, a = origin, b = origin.clone().addScaledVector(dir, L), seg = new T.Line3(a, b), tmp = new T.Vector3(), best = {};
  const reach = new T.Box3().setFromPoints([a, b]).expandByScalar(0.03);
  for (const part of atlas.parts) {
    if (!HAZARD_RE.test(part.system) || !part.box.intersectsBox(reach)) continue;
    const kind = part.system === 'respiratory' ? (/pleura/i.test(part.name) ? 'pleura' : 'lung') : part.system;
    for (let i = 0; i < part.vertexCount; i++) {
      const p = tmp.set(part.positions[i * 3], part.positions[i * 3 + 1], part.positions[i * 3 + 2]);
      if (!reach.containsPoint(p)) continue;
      const c = seg.closestPointToPoint(p, true, new T.Vector3()), d = c.distanceTo(p);
      if (!best[kind] || d < best[kind].d) best[kind] = { d, name: label(part), part, atMm: c.distanceTo(a) * 1000 };
    }
  }
  return best;
}
const sheet = JSON.parse(fs.readFileSync('sheet_data.json', 'utf8'));
const AZIMUTH = { superior: v([0, 1, 0]), inferior: v([0, -1, 0]), anterior: v([0, 0, 1]), posterior: v([0, 0, -1]) };
const rows = [], summary = [];
const r3 = (x) => x.toArray().map((n) => +n.toFixed(4)).join(', ');
for (const code of Object.keys(POINTS)) {
  const { point, normal, seedToSkinMm } = projectToSkin(POINTS[code].seed, POINTS[code].projection);
  const convs = conversions(code);
  for (const t of sheet.tech.filter((x) => x.point_code === code)) {
    // 방향 변형: 직자 = 법선 반대 1개. 사자는 원문에 방위가 없으면 렌더 기본각 45°로 4방위 모두 계산 (민감도 확인용)
    const variants = [];
    if (t.direction_class === 'perpendicular') variants.push({ label: 'normal', dir: normal.clone().negate(), angle: 0 });
    else {
      const angle = (t.angle_from_surface_normal_deg === '' ? t.render_default_angle_deg : t.angle_from_surface_normal_deg);
      const axes = t.direction_axis ? t.direction_axis.split('+') : Object.keys(AZIMUTH);
      for (const az of axes) {
        const tangent = AZIMUTH[az].clone().addScaledVector(normal, -AZIMUTH[az].dot(normal)).normalize();
        const a = T.MathUtils.degToRad(angle);
        variants.push({ label: `${az}@${angle}°${t.direction_axis ? '' : ' (원문 방위 없음 — 변형)'}`, dir: normal.clone().negate().multiplyScalar(Math.cos(a)).addScaledVector(tangent, Math.sin(a)).normalize(), angle });
      }
    }
    for (const vr of variants) {
      const origin = point.clone().addScaledVector(vr.dir, 0.00015);
      const layers = traverse(origin, vr.dir);
      const est = convs.map((c) => ({ ...c, min: +(t.depth_cun_min * c.mmPerCun).toFixed(1), max: +(t.depth_cun_max * c.mmPerCun).toFixed(1) }));
      layers.forEach((L, i) => rows.push({
        model_id: 'BodyParts3D atlas (human-atlas public/models/atlas.json)', model_version: 'repo HEAD f005e5e', mesh_version: atlas.manifest.version ?? 'atlas.json',
        model_pose_id: 'anatomical standing (BodyParts3D default)', point_code: code, technique_id: t.technique_id,
        point_coordinate_version: POINTS[code].source ?? `gb-points.ts seed → runtime projectToSkin(${POINTS[code].projection}) replica`,
        ray_origin_xyz: r3(point), ray_direction_xyz: r3(vr.dir), raycast_version: `${RAYCAST_VERSION}; variant ${vr.label}`,
        conversion_method: est.map((e) => e.method).join(' | '), conversion_version: 'v0.1',
        depth_mm_estimated_min: est.map((e) => e.min).join(' | '), depth_mm_estimated_max: est.map((e) => e.max).join(' | '),
        layer_order: i + 1, structure_id: L.part.id, structure_name: L.part.name, structure_type: L.part.system,
        entry_mm: +L.entry.toFixed(1), exit_mm: L.exit === null ? '' : +L.exit.toFixed(1), mesh_available: L.part.zanatomy ? 'Y (Z-Anatomy)' : 'Y',
        notes: [L.exit === null ? `${MAX_MM} mm 안에서 exit 없음` : '', L.part.zanatomy ? `Z-Anatomy CC BY-SA 4.0; ${L.part.uncertainty}` : ''].filter(Boolean).join(' / '),
      }));
      const Lmax = Math.max(...est.map((e) => e.max));
      const approach = nearestApproach(origin, vr.dir, Lmax);
      for (const [kind, v] of Object.entries(approach)) rows.push({
        model_id: v.part.zanatomy ? 'Z-Anatomy supplement (public/models/zanatomy, CC BY-SA 4.0)' : 'BodyParts3D atlas (human-atlas public/models/atlas.json)', model_version: 'repo HEAD f005e5e', mesh_version: v.part.zanatomy ? 'zanatomy-nerves-1' : 'atlas.json',
        model_pose_id: 'anatomical standing (BodyParts3D default)', point_code: code, technique_id: t.technique_id,
        point_coordinate_version: POINTS[code].source ?? `gb-points.ts seed → runtime projectToSkin(${POINTS[code].projection}) replica`,
        ray_origin_xyz: r3(point), ray_direction_xyz: r3(vr.dir), raycast_version: `${RAYCAST_VERSION}; variant ${vr.label}`,
        conversion_method: est.map((e) => e.method).join(' | '), conversion_version: 'v0.1',
        depth_mm_estimated_min: est.map((e) => e.min).join(' | '), depth_mm_estimated_max: est.map((e) => e.max).join(' | '),
        layer_order: 'nearest', structure_id: v.part.id, structure_name: v.name, structure_type: v.part.system,
        entry_mm: +v.atMm.toFixed(1), exit_mm: '', mesh_available: v.part.zanatomy ? 'Y (Z-Anatomy)' : 'Y',
        notes: `최근접 접근 ${(v.d * 1000).toFixed(1)} mm (침 경로 0–${Lmax} mm 안, 관통 아님). entry_mm = 가장 가까운 지점의 침 깊이${v.part.zanatomy ? '; ' + v.part.uncertainty : ''}`,
      });
      const firstOf = (re) => layers.find((L) => re.test(L.part.system));
      summary.push({ approach, Lmax, code, technique: t.technique_id, cls: t.direction_class, variant: vr.label, cun: `${t.depth_cun_min}–${t.depth_cun_max}寸`, est, seedToSkinMm: +seedToSkinMm.toFixed(1),
        layers: layers.filter((L) => L.entry <= 80).map((L) => `${L.entry.toFixed(1)}–${L.exit === null ? '…' : L.exit.toFixed(1)} ${L.part.name}`),
        firstBone: firstOf(/skeletal/), firstVessel: firstOf(/arterial|venous/), firstNerve: firstOf(/nervous/), firstLung: firstOf(/respiratory/) });
    }
  }
}
// 위험구조인데 아틀라스에 메시가 없는 것 (신경 메시는 머리에만 있음: y ≥ 1.54 m)
const MISSING = {
  GB21: [['pleura (cervical pleura / pleural cupula)', 'respiratory', '흉막 독립 메시 없음 — 폐엽 표면을 근사로 사용']],
  GB30: [['sciatic nerve', 'nervous', '아틀라스 신경 메시는 머리에만 있음']],
  GB38: [['superficial fibular nerve', 'nervous', '아틀라스 신경 메시는 머리에만 있음'], ['deep fibular nerve', 'nervous', '아틀라스 신경 메시는 머리에만 있음']],
};
const haveZA = atlas.parts.some((p) => p.zanatomy);
for (const [code, list] of Object.entries(MISSING)) for (const [name, type, note] of list.filter(() => !haveZA))
  rows.push({ model_id: 'BodyParts3D atlas (human-atlas public/models/atlas.json)', model_version: 'repo HEAD f005e5e', mesh_version: 'atlas.json', model_pose_id: 'anatomical standing (BodyParts3D default)', point_code: code, technique_id: '(all)', point_coordinate_version: '', ray_origin_xyz: '', ray_direction_xyz: '', raycast_version: RAYCAST_VERSION, conversion_method: '', conversion_version: '', depth_mm_estimated_min: '', depth_mm_estimated_max: '', layer_order: '', structure_id: '', structure_name: name, structure_type: type, entry_mm: '', exit_mm: '', mesh_available: 'N', notes: note });
fs.writeFileSync('model_paths.json', JSON.stringify({ rows, summary: summary.map((s) => ({ ...s, firstBone: s.firstBone && [s.firstBone.part.name, +s.firstBone.entry.toFixed(1)], firstVessel: s.firstVessel && [s.firstVessel.part.name, +s.firstVessel.entry.toFixed(1)], firstNerve: s.firstNerve && [s.firstNerve.part.name, +s.firstNerve.entry.toFixed(1)], firstLung: s.firstLung && [s.firstLung.part.name, +s.firstLung.entry.toFixed(1)] })) }, null, 1));
for (const s of summary) {
  console.log(`\n== ${s.technique} ${s.cls} ${s.variant} | KCMRIC ${s.cun} | seed→skin ${s.seedToSkinMm} mm`);
  console.log('   est mm:', s.est.map((e) => `${e.method} ${e.min}–${e.max} (1寸=${e.mmPerCun.toFixed(1)})`).join(' ; '));
  console.log('   first bone/vessel/nerve/lung:', [s.firstBone, s.firstVessel, s.firstNerve, s.firstLung].map((f) => f ? `${f.part.name}@${f.entry.toFixed(1)}` : '-').join(' | '));
  console.log(`   nearest approach within 0–${s.Lmax} mm:`, Object.entries(s.approach).map(([k, v]) => `${k}: ${v.name} ${(v.d * 1000).toFixed(1)} mm @${v.atMm.toFixed(1)}`).join(' | '));
  for (const l of s.layers.slice(0, 10)) console.log('   ', l);
}
console.log('\nrows', rows.length);
