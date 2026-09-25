/**
 * Build the non-clinical Needle's-eye dataset.
 *
 * The source reports contain model-ray intersections and closest approaches, not
 * patient-specific safety distances. This file preserves that distinction:
 * - cross: the atlas ray intersects the structure;
 * - near: the atlas mesh approaches the ray;
 * - concept: literature/anatomy says the structure matters, but the atlas cannot
 *   supply a trustworthy bearing.
 */
import fs from 'node:fs';
import { Line3 } from 'three';
import { atlas, projectToSkin, V } from './path-geometry.mjs';
import { baseName, koreanOf } from './anatomy-ko.mjs';
import { allPoints } from './points_all.mjs';

const REPO = new URL('../../', import.meta.url);
const read = (path) => JSON.parse(fs.readFileSync(new URL(path, REPO), 'utf8'));
const paths = read('data/needling-paths.json');
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
  const headers = rawHeaders.map((header) => header.replace(/^\uFEFF/, ''));
  return body.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
}

const auditRows = parseCsv(fs.readFileSync(new URL('reports/needling-path-review-2026-09-24.csv', REPO), 'utf8'));
const auditByPoint = new Map(auditRows.map((row) => [row['혈'], row]));

const PLEURA = /pleura|lung|흉막|허파/i;
const MAJOR_VESSEL = /(aorta|vena cava|carotid|jugular|vertebral artery|subclavian|brachiocephalic|axillary (artery|vein)|brachial artery|femoral (artery|vein)|external iliac|popliteal (artery|vein)|anterior tibial artery|posterior tibial (artery|vein)|radial artery|ulnar artery|dorsalis pedis|동맥·정맥|신경혈관다발|목동맥|목정맥|척추동맥|빗장밑|팔머리정맥|겨드랑동맥|겨드랑정맥|위팔동맥|넙다리동맥|넙다리정맥|바깥엉덩|오금동맥|오금정맥|앞정강동맥|뒤정강동맥|뒤정강정맥|배대동맥|대정맥)/i;
const MAJOR_NERVE = /(brachial plexus|sciatic nerve|tibial nerve|common fibular nerve|deep fibular nerve|superficial fibular nerve|femoral nerve|obturator nerve|median nerve|ulnar nerve|radial nerve|accessory nerve|pudendal nerve|spinal cord|spinal dura|medulla|cauda equina|팔신경얼기|궁둥신경|정강신경|종아리신경|넙다리신경|폐쇄신경|정중신경|자신경|노신경|더부신경|음부신경|척수|숨뇌|연수|말총)/i;
const CRITICAL_ORGAN = /(heart|trachea|심장|기관)/i;
const qualifies = (hazard) => {
  const text = `${hazard.ko ?? ''} ${hazard.en ?? ''}`;
  return PLEURA.test(text) || MAJOR_VESSEL.test(text) || MAJOR_NERVE.test(text) || CRITICAL_ORGAN.test(text);
};

function auditHazards(code) {
  const field = auditByPoint.get(code)?.['5 mm 이내 근접인데 표시 안 되는 위험구조'] ?? '';
  return field.split(';').map((entry) => entry.trim()).filter(Boolean).map((entry) => {
    const match = entry.match(/^(.*?)\s+([0-9.]+)mm옆@([0-9.]+)$/);
    if (!match) return null;
    const en = match[1].trim();
    return {
      ko: koreanOf(en) ?? en,
      en,
      mm: Number(match[3]),
      auditedDistanceMm: Number(match[2]),
      source: 'model-audit',
      relation: 'near',
    };
  }).filter(Boolean).filter(qualifies).filter((hazard) => !PLEURA.test(`${hazard.ko} ${hazard.en}`));
}

const rightSidePart = (name) => atlas.parts.find((part) =>
  !/(^Left |\bleft )/i.test(part.name) && baseName(part.name) === baseName(name),
);

function closestApproach(part, origin, direction, maxMm) {
  const end = origin.clone().addScaledVector(direction, maxMm / 1000);
  const segment = new Line3(origin, end);
  const closest = V(), vertex = V();
  let best = Infinity, bestNeedle = V(), bestStructure = V();
  for (let i = 0; i < part.positions.length; i += 3) {
    vertex.set(part.positions[i], part.positions[i + 1], part.positions[i + 2]);
    segment.closestPointToPoint(vertex, true, closest);
    const distance = closest.distanceTo(vertex);
    if (distance < best) {
      best = distance;
      bestNeedle = closest.clone();
      bestStructure = vertex.clone();
    }
  }
  return { distanceMm: best * 1000, needle: bestNeedle, structure: bestStructure };
}

function orientation(direction) {
  const anatomical = [
    { label: '앞', vector: V(0, 0, 1) },
    { label: '머리쪽', vector: V(0, 1, 0) },
  ].map((candidate) => {
    const projected = candidate.vector.clone().addScaledVector(direction, -candidate.vector.dot(direction));
    return { ...candidate, projected, length: projected.length() };
  }).sort((a, b) => b.length - a.length)[0];
  const up = anatomical.projected.normalize();
  const right = direction.clone().cross(up).normalize();
  const lateral = V(-1, 0, 0);
  if (right.dot(lateral) < 0) right.negate();
  return { up, right, upLabel: anatomical.label, rightLabel: '가쪽' };
}

function pointGeometry(code, row) {
  const definition = definitions.get(code);
  if (!definition) return null;
  const outward = definition.outward ? V(...definition.outward).normalize()
    : definition.projection === 'anterior' ? V(0, 0, 1)
      : definition.projection === 'posterior' ? V(0, 0, -1) : V(-1, 0, 0);
  const hit = projectToSkin(V(...definition.seed), outward);
  const direction = row.direction ? V(...row.direction).normalize() : hit.faceNormal.clone().negate();
  const origin = V(...(row.surface ?? hit.point.toArray())).addScaledVector(direction, .00015);
  return { origin, direction, orientation: orientation(direction) };
}

function kindOf(hazard) {
  const text = `${hazard.ko ?? ''} ${hazard.en ?? ''}`;
  if (PLEURA.test(text)) return 'boundary';
  if (/vein|정맥/i.test(text)) return 'vein';
  if (/artery|동맥|혈관다발/i.test(text)) return 'artery';
  if (MAJOR_NERVE.test(text)) return 'nerve';
  return 'boundary';
}

function sourceLabel(hazard) {
  if (hazard.source === 'literature') return '문헌값';
  if (hazard.source === 'model' || hazard.source === 'model-audit') return '참조 모델';
  return '해부 개념';
}

const points = {};
const unresolved = [];
for (const [code, row] of Object.entries(paths)) {
  if (code.startsWith('_') || row.blocked) continue;
  const merged = [...(row.hazards ?? []), ...auditHazards(code)]
    .filter(qualifies)
    .filter((hazard, index, list) => list.findIndex((item) => item.ko === hazard.ko) === index);
  if (!merged.length) continue;
  const geometry = pointGeometry(code, row);
  const frame = geometry?.orientation;
  const structures = merged.map((hazard, index) => {
    const item = {
      id: `${code}-${index}`,
      label: hazard.ko,
      english: hazard.en,
      kind: kindOf(hazard),
      relation: hazard.relation,
      depthMm: hazard.source === 'literature' ? null : hazard.mm ?? null,
      literatureReferenceMm: hazard.source === 'literature' ? hazard.mm ?? null : null,
      depthSource: sourceLabel(hazard),
      emph: Boolean(hazard.emph),
      note: hazard.note ?? null,
      basis: hazard.basis ?? null,
      bearing: null,
    };
    if (hazard.relation === 'cross') {
      item.bearing = { status: 'axis-crossing', xMm: 0, yMm: 0, distanceMm: 0 };
      return item;
    }
    if (hazard.relation !== 'near' || !geometry || !frame) return item;
    const part = rightSidePart(hazard.en);
    if (!part) { unresolved.push(`${code}: ${hazard.en}`); return item; }
    const approach = closestApproach(part, geometry.origin, geometry.direction, Math.max(110, (hazard.mm ?? 0) + 30));
    const delta = approach.structure.clone().sub(approach.needle);
    item.bearing = {
      status: 'model-nearest',
      xMm: Number((delta.dot(frame.right) * 1000).toFixed(1)),
      yMm: Number((delta.dot(frame.up) * 1000).toFixed(1)),
      distanceMm: Number(approach.distanceMm.toFixed(1)),
    };
    return item;
  });
  points[code] = {
    region: row.region,
    modelMaxMm: row.modelMaxMm ?? null,
    orientation: frame ? { up: frame.upLabel, right: frame.rightLabel } : { up: '해부 기준', right: '가쪽' },
    structures,
  };
}

const output = {
  _about: 'Needle\'s-eye screening dataset. Distances and bearings are atlas-relative teaching data, not patient-specific safety margins.',
  _policy: {
    inclusion: 'pleura/lung, major vessels, major nerves, spinal cord/medulla, heart/trachea',
    rings: 'relative proximity zones; never labelled as millimetres',
    cross: 'center overlap is used only when the reviewed atlas ray intersects the structure',
    unknown: 'concept structures without a model bearing remain in the list and are not assigned an invented point position',
  },
  _references: {
    who: 'https://www.who.int/publications/i/item/978-92-4-001688-0',
    neckShoulderMri: 'https://pubmed.ncbi.nlm.nih.gov/26224017/',
    gb21Ultrasound: 'https://pubmed.ncbi.nlm.nih.gov/29936338/',
    bl40Mri: 'https://pubmed.ncbi.nlm.nih.gov/33032445/',
    st36Cadaver: 'https://pubmed.ncbi.nlm.nih.gov/16903599/',
    commonFibularCadaver: 'https://pubmed.ncbi.nlm.nih.gov/31918532/',
    radialNerveLi13: 'https://pubmed.ncbi.nlm.nih.gov/31312289/',
    poplitealAnatomy: 'https://www.ncbi.nlm.nih.gov/books/NBK532891/',
    lungPleuraAnatomy: 'https://www.ncbi.nlm.nih.gov/books/NBK470197/',
  },
  points,
};

fs.writeFileSync(new URL('data/needle-eye.json', REPO), `${JSON.stringify(output, null, 1)}\n`);
console.log(`needle-eye points ${Object.keys(points).length}; unresolved model bearings ${unresolved.length}`);
if (unresolved.length) console.log(unresolved.join('\n'));
