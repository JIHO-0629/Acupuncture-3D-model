/** TE1–TE23 (수소양삼초경). node scripts/meridians/te.mjs → data/meridians/TE.json
 *
 * Checked against: KCMRIC (m.kmcric.com/knowledge/acupoint/TE) → WHO 2008 (TARA curated WHO text) → photo archive
 * images/TE/TE01–23.
 *
 * Reviewer decisions (2026-09-15):
 *  - TE22 화료: photo height, at the crus-of-helix root of the auricle, anterior to the auricular root. The sheet memo
 *    "귀 위끝선과 살쩍머리카락 뒷경계선의 교점" is GB7's definition and is not used.
 *  - Source conflicts follow KCMRIC: TE5–TE9 use the dorsal line TE4 → olecranon = 12 B-cun (KCMRIC TE8/TE9 methods);
 *    TE7 is on the ulnar side of TE6 only; TE16 is level with the angle of the mandible.
 * Photo notes: the TE13 atlas figure mislabels 천료 as TE16 (it is TE15); TE16's photo marks only SI17 and the mastoid.
 */
import fs from 'node:fs';
import { CatmullRomCurve3 } from 'three';
import { atlas, mesh, centroid, v, mid, most, perp, landmark, upperLimb, atHeight, toSkin, meridianWriter, LATERAL, MEDIAL, ANTERIOR, POSTERIOR } from '../acupoint-kit.mjs';
import { pts, lowest } from '../trunk-arc.mjs';

const W = meridianWriter('TE');
const L = upperLimb();
const log = {};
const r4 = (p) => p.toArray().map((n) => +n.toFixed(4));
const mm = (n) => +(n * 1000).toFixed(1);
const seedOf = (id, code) => {
  const row = JSON.parse(fs.readFileSync(new URL(`../../data/meridians/${id}.json`, import.meta.url), 'utf8')).points.find((p) => p.code === code);
  if (!row) throw new Error(`${id} point missing: ${code}`);
  return v(...row.seed);
};
const headCun = JSON.parse(fs.readFileSync(new URL('../../data/head-cun.json', import.meta.url), 'utf8'));
const F_CUN = headCun.forehead.cunMm / 1000;
const place = (code, p, out, regions, rule) => W.put(code, p.clone().addScaledVector(out, -0.004), out, regions, rule);

// Auricle presentation landmarks (app/ear-anatomy.ts, right side, with the current AURICLE_OFFSET).
const EAR = {
  apex: v(-0.0737, 1.6226, -0.0298),
  crusOfHelixRoot: v(-0.0724, 1.6045, -0.0075),
  supratragicNotch: v(-0.0696, 1.6033, -0.0083),
  lobuleInferiorTip: v(-0.0656, 1.5666, -0.0082),
};

// ---------------------------------------------------------------- hand: TE1–TE4
const dorsal = v(0, 0, -1);
const ringDistal = mesh(atlas, 'Distal phalanx of right ring finger'), ringProximal = mesh(atlas, 'Proximal phalanx of right ring finger');
const littleProximal = mesh(atlas, 'Proximal phalanx of right little finger');
const ulnar = perp(centroid(mesh(atlas, 'Distal phalanx of right little finger')).sub(centroid(ringDistal)), v(0, 1, 0));
{
  const axis = centroid(ringDistal).sub(centroid(ringProximal)).normalize();
  const nail = most(pts(ringDistal), ulnar.clone().addScaledVector(dorsal, 0.5).normalize()).addScaledVector(axis, -0.0018);
  place('TE1', nail, ulnar.clone().multiplyScalar(0.8).addScaledVector(dorsal, 0.6).normalize(), ['hand-R'],
    'ring finger · ulnar nail-root corner · 0.1 F-cun proximal');

  const yWeb = Math.min(ringProximal.box.max.y, littleProximal.box.max.y) - 0.004;
  const a = most(atHeight(ringProximal, yWeb), ulnar), b = most(atHeight(littleProximal, yWeb), ulnar.clone().negate());
  place('TE2', v((a.x + b.x) / 2, yWeb, Math.min(a.z, b.z)), dorsal, ['hand-R'],
    'dorsum of the hand · proximal to the web margin between ring and little fingers · red-white flesh border');

  const mc4 = mesh(atlas, 'Right fourth metacarpal bone'), mc5 = mesh(atlas, 'Right fifth metacarpal bone');
  const y3 = lowest(pts(mc4)).y + 0.012;
  const c = most(atHeight(mc4, y3), ulnar), d = most(atHeight(mc5, y3), ulnar.clone().negate());
  place('TE3', v((c.x + d.x) / 2, y3, Math.min(c.z, d.z)), dorsal, ['hand-R'],
    'dorsum of the hand · between the 4th and 5th metacarpals · depression proximal to the 4th MCP joint');
}
const forearmDorsal = perp(POSTERIOR, L.forearmAxis);
const radialDir = perp(L.radialStyloid.clone().sub(L.ulnarHead), L.forearmAxis);
let te4Deep;
{
  // WHO note: TE4 is level with LI5 and SI5 (both at y 0.878 on this model).
  const y4 = seedOf('SI', 'SI5').y;
  te4Deep = mid(L.radialStyloid,L.ulnarHead).addScaledVector(L.forearmAxis,0.004).setY(y4);
  W.put('TE4', te4Deep, forearmDorsal, ['forearm-R', 'hand-R'], 'dorsal wrist crease · depression ulnar to the extensor digitorum tendon · level with LI5 and SI5');
}

// ---------------------------------------------------------------- forearm: TE5–TE9 on TE4 → olecranon = 12 B-cun (KCMRIC)
const olecranon = most(pts(L.ulna, (p) => p.y > L.ulna.box.max.y - 0.03), v(0, 0.4, -1).normalize());
const interosseous = (cun) => {
  const level = te4Deep.clone().lerp(olecranon, cun / 12);
  const radiusEdge = most(atHeight(L.radius, level.y), radialDir.clone().negate());
  const ulnaEdge = most(atHeight(L.ulna, level.y), radialDir);
  return { level, radiusEdge, ulnaEdge, centre: mid(radiusEdge, ulnaEdge).setY(level.y) };
};
for (const [code, cun, note] of [['TE5', 2, ' · PC6 counterpart'], ['TE6', 3, ' · level with TE7'], ['TE8', 4, ' · junction of the upper 2/3 and lower 1/3 of TE4–olecranon'], ['TE9', 7, ' · 5 B-cun distal to the olecranon prominence']]) {
  W.put(code, interosseous(cun).centre, forearmDorsal, ['forearm-R'],
    `posterior forearm · midpoint of the radius–ulna interosseous space · ${cun} B-cun proximal to the dorsal wrist crease on TE4–olecranon (12 B-cun)${note}`);
}
{
  const at3 = interosseous(3);
  W.put('TE7', at3.ulnaEdge.clone().addScaledVector(radialDir, 0.002).setY(at3.level.y), forearmDorsal, ['forearm-R'],
    'posterior forearm · just radial to the ulna · 3 B-cun proximal to the dorsal wrist crease · ulnar to TE6');
  log.forearm = { forearmCunMm: mm(te4Deep.distanceTo(olecranon) / 12), kitForearmCunMm: mm(L.forearmCun), olecranon: r4(olecranon), te6te7Mm: mm(W.get('TE6').distanceTo(W.get('TE7'))) };
}

// ---------------------------------------------------------------- arm and shoulder: TE10–TE15
const armPosterior = perp(POSTERIOR, L.armAxis);
const scapula = mesh(atlas, 'Right scapula'), humerus = mesh(atlas, 'Right humerus');
const acromionLateral = landmark('acromion_lateral');
const acromialAngle = most(pts(scapula, (p) => p.y > acromionLateral.y - 0.025 && p.x < acromionLateral.x + 0.03), v(-0.6, 0.2, -0.8).normalize());
const toAngle = acromialAngle.clone().sub(olecranon).normalize();
W.put('TE10', olecranon.clone().addScaledVector(L.armAxis, L.armCun), armPosterior, ['upper-arm-R', 'forearm-R'],
  'posterior elbow · depression 1 B-cun proximal to the olecranon prominence (olecranon fossa)');
for (const [code, cun] of [['TE11', 2], ['TE12', 5]]) {
  W.put(code, olecranon.clone().addScaledVector(toAngle, cun * L.armCun), armPosterior, ['upper-arm-R'],
    `posterior arm · olecranon–acromial angle line · ${cun} B-cun proximal to the olecranon prominence`);
}
const postArm = v(-0.55, 0, -0.84).normalize();
W.put('TE13', acromialAngle.clone().addScaledVector(toAngle, -3 * L.armCun).add(v(0.007,0,-0.003)), postArm, ['upper-arm-R', 'shoulder'],
  'posterior arm · medial junction of spinal deltoid and triceps · 3 B-cun inferior to the acromial angle');
{
  const tubercle = most(pts(humerus, (p) => p.y > humerus.box.max.y - 0.04), v(-1, 0, -0.2).normalize());
  W.put('TE14', mid(acromialAngle, tubercle).add(v(0.008, -0.006, -0.004)), v(-0.45, 0, -0.89).normalize(), ['shoulder', 'upper-arm-R'],
    'shoulder girdle · depression between the acromial angle and the greater tubercle (posterior to LI15)');
  log.shoulder = { acromialAngle: r4(acromialAngle), tubercle: r4(tubercle), olecranonToAngleCun: +(olecranon.distanceTo(acromialAngle) / L.armCun).toFixed(2) };
}
{
  // KCMRIC 부위 is the definition: superior to the superior angle of the scapula. The 취혈 shortcut (midway between
  // GB21 and SI13) lands 28 mm lateral to the angle on this model (first run), so it is logged, not used.
  const superiorAngle = most(pts(scapula), v(0.6, 1, 0).normalize());
  const out = v(0, 0.35, -0.94).normalize();
  W.put('TE15', superiorAngle.clone().add(v(0, 0.01, -0.004)), out, ['shoulder', 'neck', 'thorax'],
    'scapular region · depression superior to the superior angle of the scapula (KCMRIC 부위)');
  const halfway = mid(v(-0.125, 1.402, -0.005), seedOf('SI', 'SI13'));
  log.te15 = { superiorAngle: r4(superiorAngle), gb21Si13MidpointX: +halfway.x.toFixed(4), pointX: +W.get('TE15').x.toFixed(4) };
}

// ---------------------------------------------------------------- neck and head: TE16–TE23
const mandible = pts(mesh(atlas, 'Mandible'), (p) => p.x < -0.02);
{
  const gonion = most(mandible, v(0, -1, -1).normalize());
  const scmBack = most(atHeight(mesh(atlas, 'Right sternocleidomastoid'), gonion.y), v(-0.3, 0, -1).normalize());
  W.put('TE16', scmBack.clone().add(v(0, 0, -0.006)).setY(gonion.y), v(-0.6, 0, -0.8).normalize(), ['neck', 'face'],
    'anterior neck · level of the angle of the mandible · depression posterior to sternocleidomastoid');
  log.te16 = { gonionY: +gonion.y.toFixed(4), si17Y: +seedOf('SI', 'SI17').y.toFixed(4) };
}
{
  const tip = landmark('mastoid_process_tip');
  const y17 = tip.y + 0.004;
  const temporal = mesh(atlas, 'Right temporal bone');
  // Posterior half only: without the z limit the articular tubercle in front of the meatus won (first run: TE17 in
  // front of the ear lobe). The external acoustic meatus sits at z -0.020.
  const mastoidFront = most(pts(temporal, (p) => Math.abs(p.y - y17) < 0.004 && p.x < -0.035 && p.z < -0.022), ANTERIOR);
  const ramusBack = most(mandible.filter((p) => Math.abs(p.y - y17) < 0.004), POSTERIOR);
  const deep = v((mastoidFront.x + ramusBack.x) / 2, y17, (mastoidFront.z + ramusBack.z) / 2);
  W.put('TE17', deep, v(-1, 0, 0), ['face', 'neck', 'head'],
    'posterior to the ear lobe · depression anterior to the inferior end of the mastoid process (between mastoid and mandibular ramus)');
  log.te17 = { mastoidFront: r4(mastoidFront), ramusBack: r4(ramusBack), behindLobuleMm: mm(EAR.lobuleInferiorTip.z - W.get('TE17').z) };
}
W.put('TE20', v(-0.06, EAR.apex.y + 0.003, EAR.apex.z), v(-1, 0.15, 0).normalize(), ['head', 'face'],
  'just superior to the auricular apex (where the folded apex touches the head)');
{
  // TE18/TE19: arc-length thirds of the postauricular curve from TE20 down to TE17. KCMRIC puts TE18 at the centre of
  // the mastoid process, so the curve passes through the mastoid centre instead of a fixed bulge (first run: a 22 mm
  // bulge kept TE18 on the auricular root, 15 mm in front of the mastoid).
  const top = W.get('TE20'), bottom = W.get('TE17');
  const temporal = mesh(atlas, 'Right temporal bone'), tip = landmark('mastoid_process_tip');
  const mastoidCentre = centroid(temporal, (p) => p.x < -0.04 && p.z < -0.03 && p.y < tip.y + 0.025 && p.y > tip.y - 0.004);
  const waypoint = v(-0.064,EAR.crusOfHelixRoot.y,EAR.crusOfHelixRoot.z);
  const curve = new CatmullRomCurve3([top, waypoint, bottom], false, 'centripetal');
  const samples = [];
  for (const p of curve.getPoints(80)) {
    samples.push({ deep: v(-0.05, p.y, p.z), surface: toSkin(v(-0.05, p.y, p.z), LATERAL, ['head', 'face', 'neck']).point });
  }
  const lengths = [0];
  for (let i = 1; i < samples.length; i++) lengths.push(lengths[i - 1] + samples[i].surface.distanceTo(samples[i - 1].surface));
  const total = lengths.at(-1);
  const at = (fraction) => samples[Math.max(0, lengths.findIndex((l) => l >= total * fraction))].deep;
  W.put('TE19', at(1 / 3), LATERAL, ['head', 'face'], 'TE17–TE20 curve · junction of the upper 1/3 and lower 2/3');
  W.put('TE18', at(2 / 3), LATERAL, ['head', 'face', 'neck'], 'centre of the mastoid process · TE17–TE20 curve · junction of the upper 2/3 and lower 1/3');
  log.te18te19 = { curveMm: mm(total), mastoidCentre: r4(mastoidCentre), te18ToMastoidSkinMm: mm(W.get('TE18').distanceTo(waypoint)) };
}
{
  const si19 = seedOf('SI', 'SI19');
  W.put('TE21', v(-0.064, EAR.supratragicNotch.y, si19.z), LATERAL, ['face', 'head'],
    'depression between the supratragic notch and the condylar process of the mandible · directly superior to SI19');
  W.put('TE22', v(-0.064, EAR.crusOfHelixRoot.y, EAR.crusOfHelixRoot.z + 0.01), v(-1, 0, 0.15).normalize(), ['head', 'face'],
    'posterior to the temple hairline · anterior to the auricular root at the height of the crus of helix root (reviewer decision: photo) · posterior to the superficial temporal artery');
  log.te21te22Mm = mm(W.get('TE21').distanceTo(W.get('TE22')));
}
{
  const canthus = landmark('lateral_canthus');
  const frontal = mesh(atlas, 'Frontal bone');
  const rim = pts(frontal, (p) => p.x < canthus.x - 0.004 && p.x > canthus.x - 0.016 && p.y > canthus.y + 0.004 && p.y < canthus.y + 0.03 && p.z > canthus.z - 0.004);
  const margin = lowest(rim);
  W.put('TE23', margin.clone().add(v(0, 0.004, 0.002)), v(-0.45, 0.15, 0.88).normalize(), ['face', 'head'],
    'depression at the lateral end of the eyebrow (lateral supraorbital margin) · superior to GB1');
  log.te23 = { margin: r4(margin), aboveCanthusMm: mm(W.get('TE23').y - canthus.y) };
}

const english = ['Guanchong', 'Yemen', 'Zhongzhu', 'Yangchi', 'Waiguan', 'Zhigou', 'Huizong', 'Sanyangluo', 'Sidu', 'Tianjing', 'Qinglengyuan', 'Xiaoluo', 'Naohui', 'Jianliao', 'Tianliao', 'Tianyou', 'Yifeng', 'Chimai', 'Luxi', 'Jiaosun', 'Ermen', 'Erheliao', 'Sizhukong'];
const overrides = Object.fromEntries(english.map((name, i) => [`TE${i + 1}`, { english: name }]));
overrides.TE7.location = '아래팔 뒤쪽면, 자뼈의 바로 노쪽, 손등쪽 손목주름에서 몸쪽으로 3촌, 지구(TE6)의 자쪽 (KCMRIC)';
overrides.TE16.location = '목 앞부위, 턱뼈각과 같은 높이, 목빗근의 뒤쪽 오목한 곳 (KCMRIC)';
overrides.TE22.location = '머리, 살쩍머리카락 경계선의 뒤쪽, 귓바퀴뿌리의 앞쪽, 이륜각 기시부 높이 (검수자 결정: 사진 기준), 얕은관자동맥의 뒤쪽';
W.write({
  label: '삼초경', name: '수소양삼초경', english: 'TRIPLE ENERGIZER MERIDIAN',
  primarySource: 'https://m.kmcric.com/knowledge/acupoint/TE', secondarySource: 'https://iris.who.int/handle/10665/353407',
  scale: { dorsalForearmCunMm: mm(te4Deep.distanceTo(olecranon) / 12), armCunMm: mm(L.armCun), fCunMm: headCun.forehead.cunMm },
}, overrides);
console.log(JSON.stringify(log, null, 1));
