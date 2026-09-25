/**
 * Build the non-clinical Needle's-eye dataset.
 *
 * Every structure is measured again from the same reviewed ray the viewer draws
 * (data/needling-paths.json direction, or the viewer's own rule when a row has none):
 * - cross: the ray intersects the mesh; depthMm/endMm are the entry and exit;
 * - near: the mesh approaches the ray; depthMm is the depth of the closest approach;
 * - concept: literature or anatomy names the structure but the atlas has no mesh for it.
 * `track` is the cross-section seen at each millimetre of depth, so the plot follows the
 * needle tip instead of one fixed nearest point. Bearings use the operator's view (from the
 * needle handle towards the tip) and label each screen axis with its anatomical direction.
 * The source reports hold model-ray intersections and closest approaches, not
 * patient-specific safety distances.
 */
import fs from 'node:fs';
import { atlas, projectToSkin, rayLayers, V } from './path-geometry.mjs';
import { baseName, koreanOf } from './anatomy-ko.mjs';
import { allPoints } from './points_all.mjs';
import { REFS, FAMILY_REFS } from './needle-eye-refs.mjs';
import { EXCLUDE_POINTS, EXTRA_POINTS, OVERRIDES } from './needle-eye-overrides.mjs';

const REPO = new URL('../../', import.meta.url);
const read = (path) => JSON.parse(fs.readFileSync(new URL(path, REPO), 'utf8'));
const paths = read('data/needling-paths.json');
const direct = read('data/needling-direct.json');
const definitions = new Map(allPoints().map((point) => [point.code, point]));

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) { row.push(field); field = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [rawHeaders, ...body] = rows;
  const headers = rawHeaders.map((header) => header.replace(/^﻿/, ''));
  return body.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
}

const auditRows = parseCsv(fs.readFileSync(new URL('reports/needling-path-review-2026-09-24.csv', REPO), 'utf8'));
const auditByPoint = new Map(auditRows.map((row) => [row['혈'], row]));

const PLEURA = /pleura|lung|흉막|허파/i;
// Word boundaries keep "genitofemoral nerve" and "medial circumflex femoral vein" out.
const MAJOR_VESSEL = /(aorta|vena cava|carotid|jugular|vertebral artery|subclavian (artery|vein)|brachiocephalic|axillary (artery|vein)|\bbrachial artery|\bfemoral (artery|vein)|external iliac|popliteal (artery|vein)|anterior tibial artery|posterior tibial (artery|vein)|\bradial artery|\bulnar artery|dorsalis pedis|동맥·정맥|신경혈관다발|목동맥|목정맥|척추동맥|빗장밑|팔머리|겨드랑동맥|겨드랑정맥|위팔동맥|넙다리동맥|넙다리정맥|바깥엉덩|오금동맥|오금정맥|앞정강동맥|뒤정강동맥|뒤정강정맥|배대동맥|대정맥)/i;
const MAJOR_NERVE = /(brachial plexus|sciatic nerve|\btibial nerve|common fibular nerve|deep fibular nerve|superficial fibular nerve|\bfemoral nerve|obturator nerve|\bmedian nerve|\bulnar nerve|\bradial nerve|accessory nerve|pudendal nerve|spinal cord|spinal dura|medulla|cauda equina|팔신경얼기|궁둥신경|정강신경|종아리신경|넙다리신경|폐쇄신경|정중신경|자신경|노신경|더부신경|음부신경|척수|숨뇌|연수|말총)/i;
// Kidney, orbit/eyeball and facial nerve were added to the hazard categories on 2026-09-25 (Jiho).
const CRITICAL_ORGAN = /(heart|trachea|kidney|eyeball|orbit|facial nerve|심장|기관|콩팥|안구|안와|얼굴신경)/i;
// Branches and small tributaries that share a major structure's name. Smaller named nerves
// (posterior interosseous, suprascapular, sacral) enter only through needle-eye-overrides.mjs.
const MINOR = /(circumflex|genitofemoral|deep brachial|cutaneous|muscular branch|digital|palmar branch|dorsal branch|communicating|sural)/i;
const textOf = (hazard) => `${hazard.ko ?? ''} ${hazard.en ?? ''}`;
const isMajor = (hazard) => {
  const text = textOf(hazard);
  return PLEURA.test(text) || MAJOR_VESSEL.test(text) || MAJOR_NERVE.test(text) || CRITICAL_ORGAN.test(text);
};
const isMinorBranch = (hazard) => MINOR.test(hazard.en ?? '') && hazard.source !== 'override';
const qualifies = (hazard) => isMajor(hazard) && !isMinorBranch(hazard);

const KO_EXTRA = {
  'brachiocephalic artery': '팔머리동맥', 'posterior interosseous nerve of forearm': '뒤뼈사이신경',
  'superficial branch of radial nerve': '노신경 얕은가지', 'suprascapular artery': '어깨위동맥',
  'deep femoral vein': '깊은넙다리정맥',
};
const koOf = (en) => koreanOf(en) ?? KO_EXTRA[baseName(en)] ?? null;
const isLeft = (name) => /(^Left |\bleft )/i.test(name);
const partsByBase = (en) => atlas.parts.filter((part) => !isLeft(part.name) && baseName(part.name) === baseName(en));
const partsByRegex = (source) => { const re = new RegExp(source, 'i'); return atlas.parts.filter((part) => !isLeft(part.name) && re.test(part.name)); };

// --- geometry: the same surface and trajectory as app/scene.tsx
function pointGeometry(code, row) {
  const definition = definitions.get(code);
  if (!definition) return null;
  const outward = definition.outward ? V(...definition.outward).normalize()
    : definition.projection === 'anterior' ? V(0, 0, 1)
      : definition.projection === 'posterior' ? V(0, 0, -1) : V(-1, 0, 0);
  // The viewer projects the current seed itself (object.surface / object.normal); 'direct'
  // points sit on an assumed surface and use the outward vector as their normal.
  const hit = definition.projection === 'direct'
    ? { point: V(...definition.seed), faceNormal: outward.clone() }
    : projectToSkin(V(...definition.seed), outward);
  const direction = row.direction ? V(...row.direction).normalize() : hit.faceNormal.clone().negate();
  const surface = hit.point.clone();
  return { origin: surface.clone().addScaledVector(direction, .00015), direction, midline: Math.abs(surface.x) < .008 };
}

// --- operator's view: screen up is the cranial (or anterior) axis, screen right = forward × up
const AXES = (midline) => [
  { vector: V(-1, 0, 0), plus: midline ? '환자 오른쪽' : '가쪽', minus: midline ? '환자 왼쪽' : '안쪽' },
  { vector: V(0, 1, 0), plus: '머리쪽', minus: '발쪽' },
  { vector: V(0, 0, 1), plus: '앞', minus: '뒤' },
];
function anatomicalLabel(vector, midline) {
  const parts = AXES(midline).map((axis) => { const d = vector.dot(axis.vector); return { d: Math.abs(d), word: d > 0 ? axis.plus : axis.minus }; })
    .sort((a, b) => b.d - a.d);
  return parts[1].d >= .45 ? `${parts[0].word}·${parts[1].word}` : parts[0].word;
}
function frameOf(direction, midline) {
  const project = (axis) => axis.clone().addScaledVector(direction, -axis.dot(direction));
  const cranial = project(V(0, 1, 0));
  const up = (cranial.length() >= .5 ? cranial : project(V(0, 0, 1))).normalize();
  const right = direction.clone().cross(up).normalize();
  return {
    up, right,
    labels: {
      up: anatomicalLabel(up, midline), down: anatomicalLabel(up.clone().negate(), midline),
      right: anatomicalLabel(right, midline), left: anatomicalLabel(right.clone().negate(), midline),
      view: '시술자 시점 — 침 손잡이에서 침끝 방향으로 본 단면',
    },
  };
}

// --- measurement of one structure along the ray
const SLAB_MM = 2, TRACK_RADIUS_MM = 35;
function measure(parts, geometry, frame, layers, trackMaxMm) {
  const ids = new Set(parts.map((part) => part.id));
  const intervals = layers.filter((layer) => ids.has(layer.id)).map((layer) => [layer.a, layer.b ?? layer.a]);
  const { origin, direction } = geometry;
  const buckets = new Map();
  let best = { distance: Infinity };
  const v = V(), offset = V();
  for (const part of parts) {
    const a = part.positions;
    for (let i = 0; i < a.length; i += 3) {
      v.set(a[i], a[i + 1], a[i + 2]).sub(origin);
      const t = v.dot(direction) * 1000;
      offset.copy(v).addScaledVector(direction, -v.dot(direction));
      const r = offset.length() * 1000;
      const clampedT = Math.max(0, Math.min(150, t));
      const distance = Math.hypot(r, t - clampedT);
      if (distance < best.distance) best = { distance, at: clampedT, x: offset.dot(frame.right) * 1000, y: offset.dot(frame.up) * 1000 };
      if (t < -SLAB_MM || t > trackMaxMm + SLAB_MM || r > TRACK_RADIUS_MM) continue;
      const key = Math.round(t);
      const slot = buckets.get(key);
      if (!slot || r < slot.r) buckets.set(key, { r, x: offset.dot(frame.right) * 1000, y: offset.dot(frame.up) * 1000 });
    }
  }
  const round = (n) => Math.round(n * 10) / 10;
  const track = [];
  for (let s = 0; s <= trackMaxMm; s++) {
    if (intervals.some(([a, b]) => s >= a - .5 && s <= b + .5)) { track.push([s, 0, 0]); continue; }
    let pick = null;
    for (let k = s - SLAB_MM; k <= s + SLAB_MM; k++) { const slot = buckets.get(k); if (slot && (!pick || slot.r < pick.r)) pick = slot; }
    if (pick) track.push([s, round(pick.x), round(pick.y)]);
  }
  return {
    intervals,
    closest: { distanceMm: round(best.distance), atMm: round(best.at), xMm: round(best.x), yMm: round(best.y) },
    track,
  };
}

function kindOf(hazard) {
  if (hazard.kind) return hazard.kind;
  const text = textOf(hazard);
  if (PLEURA.test(text) || /liver|heart|kidney|eyeball|orbit|간·심장|콩팥|안구|안와/i.test(text)) return 'boundary';
  const artery = /artery|동맥/i.test(text), vein = /vein|정맥/i.test(text), nerve = MAJOR_NERVE.test(text) || /nerve|plexus|신경/i.test(text);
  if (/bundle|sheath|다발|목동맥집/i.test(text) || [artery, vein, nerve].filter(Boolean).length > 1) return 'bundle';
  if (vein) return 'vein';
  if (artery) return 'artery';
  if (nerve) return 'nerve';
  return 'boundary';
}

function sourceLabel(hazard) {
  if (hazard.source === 'literature') return '문헌값';
  if (hazard.source === 'concept') return '해부 개념';
  return '참조 모델';
}

function refsFor(hazard, extra = []) {
  const text = textOf(hazard);
  const ids = new Set([...(hazard.refs ?? []), ...extra]);
  for (const [re, list] of FAMILY_REFS) if (re.test(text)) list.forEach((id) => ids.add(id));
  for (const id of ids) if (!REFS[id]) throw new Error(`unknown reference ${id}`);
  return [...ids];
}

function auditHazards(code) {
  const field = auditByPoint.get(code)?.['5 mm 이내 근접인데 표시 안 되는 위험구조'] ?? '';
  return field.split(';').map((entry) => entry.trim()).filter(Boolean).map((entry) => {
    const match = entry.match(/^(.*?)\s+([0-9.]+)mm옆@([0-9.]+)$/);
    if (!match) return null;
    const en = match[1].trim();
    return { ko: koOf(en) ?? en, en, source: 'model-audit', relation: 'near' };
  }).filter(Boolean).filter(isMajor).filter((hazard) => !PLEURA.test(textOf(hazard)));
}

const points = {};
const excluded = {};
const changes = [];
const usedRefs = new Set();
// Points without a reviewed path use the viewer's default rule: the skin normal at the
// projected seed, the documented depth from needling-direct.json and the first bone on the ray.
const extraRows = Object.entries(EXTRA_POINTS).filter(([code]) => !paths[code])
  .map(([code, spec]) => [code, { region: spec.region, modelMaxMm: direct[code]?.modelMaxMm ?? null, hazards: [], viewerDefault: true }]);
for (const [code, row] of [...Object.entries(paths), ...extraRows]) {
  if (code.startsWith('_') || row.blocked) continue;
  const override = OVERRIDES[code] ?? EXTRA_POINTS[code] ?? {};
  const raw = [
    ...(row.hazards ?? []).map((hazard) => ({ ...hazard, origin: 'spec' })),
    ...auditHazards(code).map((hazard) => ({ ...hazard, origin: 'audit' })),
  ];
  const candidates = raw.filter(qualifies);
  if (!candidates.length && !override.add) continue;
  if (EXCLUDE_POINTS[code]) { excluded[code] = EXCLUDE_POINTS[code]; EXCLUDE_POINTS[code].refs.forEach((id) => usedRefs.add(id)); continue; }

  const geometry = pointGeometry(code, row);
  const frame = frameOf(geometry.direction, geometry.midline);
  const reach = row.modelMaxMm ?? null;
  const trackMaxMm = Math.min(120, Math.max(30, (reach ?? 0) + 15));
  const layers = rayLayers(geometry.origin, geometry.direction, 150);
  const boneMm = row.bone?.mm ?? (row.viewerDefault ? layers.find((layer) => layer.system === 'skeletal')?.a ?? null : null);
  const log = [];
  const branches = raw.filter((hazard) => isMajor(hazard) && isMinorBranch(hazard));
  if (branches.length) log.push({ action: 'remove', structures: [...new Set(branches.map((h) => h.ko))], why: '주요 구조와 이름만 겹치는 가지·작은 혈관이다(휘돌이·음부넙다리·깊은위팔 등). 이름 규칙에 단어 경계를 두어 제외했다.', refs: [] });

  // Removals first, so an override can replace a structure with a better one.
  let list = candidates;
  if (override.remove) {
    const removed = list.filter((hazard) => override.remove.test(textOf(hazard)));
    if (removed.length) log.push({ action: 'remove', structures: [...new Set(removed.map((h) => h.ko))], why: override.why, refs: override.refs ?? [] });
    list = list.filter((hazard) => !override.remove.test(textOf(hazard)));
  }
  for (const near of override.add?.near ?? []) {
    list.push({ ko: near.ko, en: near.en, match: near.match, relation: 'near', source: 'override', origin: 'override', refs: near.refs, note: near.note });
    log.push({ action: 'add', structures: [near.ko], why: override.why ?? null, refs: near.refs });
  }
  for (const concept of override.add?.concept ?? []) {
    list.push({ ...concept, relation: 'concept', source: 'concept', origin: 'override' });
    log.push({ action: 'add', structures: [concept.ko], why: concept.note, refs: concept.refs });
  }
  // One entry per structure (English base name, then the Korean label); corrections win over
  // the reviewed spec, and the spec wins over the 09-24 audit list.
  const rank = { override: 0, spec: 1, audit: 2 };
  const same = (a, b) => (a.en && b.en && baseName(a.en) === baseName(b.en)) || a.ko === b.ko;
  list = [...list].sort((a, b) => rank[a.origin] - rank[b.origin])
    .filter((hazard, index, all) => all.findIndex((item) => same(item, hazard)) === index);

  const structures = [];
  for (const hazard of list) {
    // Concept hazards named by the reviewer are measured too when the atlas has their mesh
    // (e.g. Right kidney); they become model structures only if the mesh reaches the ray.
    const parts = hazard.match ? partsByRegex(hazard.match) : partsByBase(hazard.en ?? '');
    // replaceNotes: the reviewed spec note describes a mesh that has since been corrected.
    const note = [override.replaceNotes ? null : hazard.note, ...(override.notes ?? []).filter(([re]) => re.test(textOf(hazard))).map(([, text]) => text)].filter(Boolean).join(' ') || null;
    const refs = refsFor(hazard, (override.notes ?? []).some(([re]) => re.test(textOf(hazard))) ? override.refs ?? [] : []);
    refs.forEach((id) => usedRefs.add(id));
    const item = {
      id: `${code}-${structures.length}`,
      label: hazard.ko,
      english: hazard.en ?? null,
      kind: kindOf(hazard),
      relation: 'concept',
      depthMm: null,
      endMm: null,
      literatureReferenceMm: hazard.source === 'literature' ? hazard.mm ?? null : hazard.literatureMm ?? null,
      depthSource: sourceLabel(hazard),
      emph: Boolean(hazard.emph),
      note,
      basis: hazard.basis ?? null,
      bearing: null,
      track: null,
      beyondReach: false,
      beyondBone: false,
      refs,
    };
    // Literature hazards keep their reference depth but are also placed when the atlas has the mesh.
    if (parts.length) {
      const measured = measure(parts, geometry, frame, layers, trackMaxMm);
      const crossing = measured.intervals[0];
      // Audit hazards were listed as "within 5 mm" on the pre-review ray; keep only those that still are.
      if ((hazard.relation === 'concept' || hazard.source === 'literature') && !crossing && measured.closest.distanceMm > 10) { structures.push(item); continue; }
      // New points list a structure only when the mesh actually comes within 10 mm of the ray.
      if (row.viewerDefault && !crossing && measured.closest.distanceMm > 10) {
        log.push({ action: 'drop-far', structures: [hazard.ko], why: `기본 경로에서 ${measured.closest.distanceMm} mm 떨어져 있어 표시하지 않음`, refs: [] });
        continue;
      }
      if (hazard.origin === 'audit' && !crossing && measured.closest.distanceMm > 5) {
        log.push({ action: 'drop-stale', structures: [hazard.ko], why: `09-24 감사 경로 기준 5 mm 이내였으나 검수된 현재 경로에서는 ${measured.closest.distanceMm} mm`, refs: [] });
        continue;
      }
      if (hazard.relation === 'cross' && !crossing)
        log.push({ action: 'recheck', structures: [hazard.ko], why: `검수 경로 파일에는 교차로 기록됐으나 현재 ray는 교차하지 않음 (최근접 ${measured.closest.distanceMm} mm @ ${measured.closest.atMm} mm)`, refs: [] });
      item.relation = crossing ? 'cross' : 'near';
      item.depthMm = crossing ? crossing[0] : measured.closest.atMm;
      item.endMm = crossing ? crossing[1] : null;
      item.depthSource = '참조 모델';
      item.bearing = crossing ? { status: 'axis-crossing', xMm: 0, yMm: 0, distanceMm: 0 }
        : { status: 'model-nearest', xMm: measured.closest.xMm, yMm: measured.closest.yMm, distanceMm: measured.closest.distanceMm };
      item.track = measured.track;
      item.beyondReach = reach != null && item.depthMm > reach;
      item.beyondBone = boneMm != null && item.depthMm > boneMm;
    }
    structures.push(item);
  }
  if (!structures.length) {
    if (!log.some((entry) => entry.action === 'remove')) continue;
    excluded[code] = { why: "모든 구조가 관련성 검수에서 제외되어 Needle's Eye 대상에서 빠졌다.", changes: log, refs: [...new Set(log.flatMap((entry) => entry.refs))] };
    for (const entry of log) entry.refs.forEach((id) => usedRefs.add(id));
    changes.push([code, log]);
    continue;
  }
  for (const entry of log) entry.refs.forEach((id) => usedRefs.add(id));
  if (row.viewerDefault) (override.refs ?? []).forEach((id) => usedRefs.add(id));
  if (log.length) changes.push([code, log]);
  points[code] = {
    region: row.region,
    pathSource: row.viewerDefault ? 'viewer-default' : 'reviewed',
    ...(row.viewerDefault ? { rationale: { why: override.why ?? null, refs: override.refs ?? [] } } : {}),
    modelMaxMm: reach,
    boneMm,
    orientation: frame.labels,
    structures,
    changes: log,
  };
}

const output = {
  _about: 'Needle\'s-eye screening dataset. Distances and bearings are atlas-relative teaching data, not patient-specific safety margins.',
  _policy: {
    inclusion: 'pleura/lung, major vessels, major nerves, spinal cord/medulla, heart/trachea, kidney, orbit/eyeball, facial nerve',
    view: 'operator view from the needle handle toward the tip; axis labels are computed from the anatomical direction of each screen axis',
    rings: 'relative proximity zones; never labelled as millimetres',
    cross: 'center overlap only when the reviewed ray intersects the mesh; beyond the model depth limit it is shown as an extension crossing',
    track: '[depthMm, xMm, yMm] — in-plane offset of the structure in the cross-section at that depth (±2 mm slab, within 35 mm)',
    unknown: 'concept structures without a model mesh remain in the list and are not assigned an invented position',
  },
  _references: Object.fromEntries([...usedRefs].sort().map((id) => [id, { short: REFS[id].short, citation: REFS[id].citation, url: REFS[id].url, claim: REFS[id].claim }])),
  _excluded: excluded,
  points,
};

// Track samples are written one depth per line so the file stays reviewable in a diff.
const text = JSON.stringify(output, null, 1)
  .replace(/\[\s+(-?[\d.]+),\s+(-?[\d.]+),\s+(-?[\d.]+)\s+\]/g, '[$1,$2,$3]')
  .replace(/"track": \[\s+((?:\[[^\]]*\],?\s*)+)\]/g, (_, body) => `"track": [${body.trim().replace(/\],\s+\[/g, '],[')}]`);
fs.writeFileSync(new URL('data/needle-eye.json', REPO), `${text}\n`);
const structureCount = Object.values(points).reduce((sum, point) => sum + point.structures.length, 0);
console.log(`needle-eye points ${Object.keys(points).length}; structures ${structureCount}; excluded ${Object.keys(excluded).join(',') || '-'}; references ${usedRefs.size}`);
for (const [code, log] of changes) for (const entry of log) console.log(`${code} ${entry.action}: ${entry.structures.join(', ')}${entry.why ? ` — ${entry.why}` : ''}`);
