/** LR1–LR14 (족궐음간경). node scripts/meridians/lr.mjs → data/meridians/LR.json
 *
 * Checked against: KCMRIC (m.kmcric.com/knowledge/acupoint/LR) → WHO 2008 (TARA curated WHO text) → photo archive
 * images/LR/LR01–14.
 *
 * Reviewer decisions (2026-09-15):
 *  - LR5/LR6 use KCMRIC's medial leg scale: medial malleolus prominence → 음릉천 SP9 = 13 B-cun (not the WHO note's
 *    patella-apex 15 B-cun line). LR5 is level with KI9.
 *  - Source conflicts follow KCMRIC: LR8 lies medial to the semitendinosus and semimembranosus tendons. The sheet memo
 *    "반힘줄근과 반막근 사이" is not used; it is KI10's position.
 *  - LR14 follows the 6th intercostal space on the 4 B-cun line; the WHO note "2 B-cun lateral to ST19" is logged only.
 * Photo notes: LR12 photo shows the femoral vessels lateral to LR12 and ST30, matching the current ST30.
 */
import fs from 'node:fs';
import * as T from 'three';
import { atlas, mesh, centroid, v, mid, most, landmark, atHeight, meridianWriter, MEDIAL, LATERAL, ANTERIOR, POSTERIOR } from '../acupoint-kit.mjs';
import { pts, lateralOnSkin, ringNormal, intercostalOnLine, TRUNK_CUN } from '../trunk-arc.mjs';

const W = meridianWriter('LR');
const log = {};
const r4 = (p) => p.toArray().map((n) => +n.toFixed(4));
const mm = (n) => +(n * 1000).toFixed(1);
const generatedRow = (id, code) => {
  const row = JSON.parse(fs.readFileSync(new URL(`../../data/meridians/${id}.json`, import.meta.url), 'utf8')).points.find((p) => p.code === code);
  if (!row) throw new Error(`${id} point missing: ${code}`);
  return row;
};
const seedOf = (id, code) => v(...generatedRow(id, code).seed);
const headCun = JSON.parse(fs.readFileSync(new URL('../../data/head-cun.json', import.meta.url), 'utf8'));
const F_CUN = headCun.forehead.cunMm / 1000;
const foot = ['foot-R'];

// ---------------------------------------------------------------- toes and foot: LR1–LR4
{
  const distal = mesh(atlas, 'Distal phalanx of right big toe'), proximal = mesh(atlas, 'Proximal phalanx of right big toe');
  const longitudinal = centroid(distal).sub(centroid(proximal)).normalize();
  const lateral = centroid(mesh(atlas, 'Distal phalanx of right second toe')).sub(centroid(distal));
  lateral.addScaledVector(longitudinal, -lateral.dot(longitudinal)).normalize();
  const dorsal = longitudinal.clone().cross(lateral).normalize();
  if (dorsal.y < 0) dorsal.negate();
  const size = distal.box.getSize(new T.Vector3());
  const corner = centroid(distal)
    .addScaledVector(longitudinal, -size.z * 0.15)
    .addScaledVector(lateral, (size.x / 2) * 0.7)
    .addScaledVector(dorsal, distal.box.max.y - centroid(distal).y);
  const nailPoint = corner.addScaledVector(longitudinal, -0.1 * F_CUN * 0.7).addScaledVector(lateral, 0.1 * F_CUN * 0.7);
  W.put('LR1', nailPoint, lateral.clone().multiplyScalar(0.6).add(dorsal.clone().multiplyScalar(0.8)).normalize(), foot,
    'great toe · 0.1 F-cun proximal-lateral to the lateral corner of the toenail root (nail footprint estimated from the distal phalanx)');

  const pp1 = mesh(atlas, 'Proximal phalanx of right big toe'), pp2 = mesh(atlas, 'Proximal phalanx of right second toe');
  const z2 = Math.max(pp1.box.min.z, pp2.box.min.z) + 0.004;
  const big = most(pts(pp1, (p) => Math.abs(p.z - z2) < 0.003), LATERAL), second = most(pts(pp2, (p) => Math.abs(p.z - z2) < 0.003), MEDIAL);
  W.put('LR2', v((big.x + second.x) / 2, Math.max(big.y, second.y), z2), v(0, 0.95, 0.3).normalize(), foot,
    'dorsum of the foot · between the 1st and 2nd toes · proximal to the web margin at the red-white flesh border');

  const mt1 = mesh(atlas, 'Right first metatarsal bone'), mt2 = mesh(atlas, 'Right second metatarsal bone');
  const z3 = Math.max(mt1.box.min.z, mt2.box.min.z) + 0.024;
  const edge1 = most(pts(mt1, (p) => Math.abs(p.z - z3) < 0.003), LATERAL), edge2 = most(pts(mt2, (p) => Math.abs(p.z - z3) < 0.003), MEDIAL);
  const lr3 = v((edge1.x + edge2.x) / 2, Math.max(edge1.y, edge2.y), z3);
  W.put('LR3', lr3, v(0, 1, 0.1).normalize(), foot,
    'between the 1st and 2nd metatarsals · depression distal to the junction of their bases · dorsalis pedis pulse');
  const artery = pts(mesh(atlas, 'Right dorsalis pedis artery')).reduce((b, p) => (p.distanceTo(lr3) < b.distanceTo(lr3) ? p : b));
  log.lr3ArteryDistanceMm = mm(artery.distanceTo(lr3));

  const sp5 = seedOf('SP', 'SP5'), st41 = seedOf('ST', 'ST41');
  const halfway = mid(sp5, st41);
  const tendonMedial = most(atHeight(mesh(atlas, 'Right tibialis anterior'), halfway.y), MEDIAL);
  const out4 = v(0.45, 0.25, 0.86).normalize();
  const lr4 = v(Math.max(halfway.x, tendonMedial.x + 0.004), halfway.y, halfway.z).addScaledVector(out4, -0.008);
  W.put('LR4', lr4, out4, ['foot-R', 'leg-R'], 'anteromedial ankle · medial to the tibialis anterior tendon · anterior to the medial malleolus · midway between SP5 and ST41');
  log.lr4 = { halfwayX: +halfway.x.toFixed(4), tibialisAnteriorMedialX: +tendonMedial.x.toFixed(4) };
}

// ---------------------------------------------------------------- leg: LR5–LR7 (KCMRIC 13 B-cun)
const tibia = mesh(atlas, 'Right tibia');
const medialMalleolus = landmark('medial_malleolus_prominence');
const sp9Row = generatedRow('SP', 'SP9'), sp9 = v(...sp9Row.seed);
const LEG_CUN = (sp9.y - medialMalleolus.y) / 13;
// The tibial shaft mesh is coarse (2–3 vertices in a 4 mm slab; first run collapsed crest and border into one vertex
// at LR6), so read the anterior crest and the medial border from a ±20 mm band and aim from the shaft centre through
// their midpoint.
for (const [code, cun] of [['LR5', 5], ['LR6', 7]]) {
  const y = medialMalleolus.y + cun * LEG_CUN;
  const band = pts(tibia, (p) => Math.abs(p.y - y) < 0.02);
  const centre = centroid(tibia, (p) => Math.abs(p.y - y) < 0.02).setY(y);
  const crest = most(band, v(0.2, 0, 1).normalize()), border = most(band, v(0.7, 0, -0.7).normalize());
  const surfaceMid = mid(crest, border).setY(y);
  // The medial surface faces anteromedially. Deriving the normal from the shaft centre flipped it laterally at LR6
  // (second run), so both points use the direction measured cleanly at LR5.
  const normal = v(0.65, 0, 0.76).normalize();
  log[`${code}CentreDirection`] = r4(v(surfaceMid.x - centre.x, 0, surfaceMid.z - centre.z).normalize());
  W.put(code, surfaceMid, normal, ['leg-R'],
    `centre of the medial surface of the tibia · ${cun} B-cun above the medial malleolus prominence (KCMRIC 13 B-cun to SP9)`);
  log[code] = { crest: r4(crest), medialBorder: r4(border), normal: r4(normal) };
}
{
  const sp9Out = v(...sp9Row.outward);
  const deep = sp9.clone().addScaledVector(sp9Out, -0.012).add(v(0, 0, -0.25*LEG_CUN));
  W.put('LR7', deep, v(0.8, 0, -0.6).normalize(), ['leg-R', 'knee-R'], 'inferior to the medial condyle of the tibia · vertically below the posterior end of the condyle, posterior to SP9 (reviewer placement)');
}

// ---------------------------------------------------------------- knee and thigh: LR8–LR11
{
  const crease = landmark('popliteal_crease');
  const st = atHeight(mesh(atlas, 'Right semitendinosus'), crease.y), sm = atHeight(mesh(atlas, 'Right semimembranosus'), crease.y);
  const semitendinosusMedial = most(st, MEDIAL);
  W.put('LR8', semitendinosusMedial.clone().add(v(0.003, 0, 0.002)), v(1, 0, -0.2).normalize(), ['knee-R', 'thigh-R', 'leg-R'],
    'medial end of the popliteal crease · immediately medial to the semitendinosus tendon');
}
const pubis = landmark('pubic_symphysis_superior', null), patellaBase = landmark('patella_base');
const thighCun = (pubis.y - patellaBase.y) / 18;
{
  const y9 = patellaBase.y + 4 * thighCun;
  const sartorius = most(atHeight(mesh(atlas, 'Right sartorius'), y9), v(0.3, 0, -1).normalize());
  const gracilis = most(atHeight(mesh(atlas, 'Right gracilis'), y9), v(0.3, 0, 1).normalize());
  W.put('LR9', mid(sartorius, gracilis).setY(y9), v(1, 0, 0), ['thigh-R', 'knee-R'],
    'medial thigh · between gracilis and sartorius (posterior to sartorius) · 4 B-cun above the base of the patella');
  log.lr9 = { sartoriusPosterior: r4(sartorius), gracilisAnterior: r4(gracilis) };
}
{
  // ST30 now sits on the inguinal ligament, ~5 mm above the pubic-symphysis level it is defined at; LR10/LR11 keep that
  // level (their review found them correct), so they are measured from the symphysis rather than from the ST30 seed.
  const st30 = v(0, pubis.y, 0);
  const y10 = st30.y - 3 * thighCun, y11 = st30.y - 2 * thighCun;
  const artery10 = most(atHeight(mesh(atlas, 'Right femoral artery'), y10), ANTERIOR);
  // Pure anterior projection keeps the measured x: the tilted rays of the first run moved LR11 7 mm medial, inside
  // the femoral artery it should lie lateral to.
  W.put('LR10', artery10, ANTERIOR, ['thigh-R', 'pelvis'], '3 B-cun distal to ST30 · over the femoral artery pulse');
  const adductor = most(atHeight(mesh(atlas, 'Right adductor longus'), y11), v(-1, 0, 0.5).normalize());
  W.put('LR11', adductor.clone().add(v(-0.004, 0, 0.002)), ANTERIOR, ['thigh-R', 'pelvis'],
    '2 B-cun distal to ST30 · lateral to adductor longus');
  const artery11 = most(atHeight(mesh(atlas, 'Right femoral artery'), y11), ANTERIOR);
  log.groin = { thighCunMm: mm(thighCun), st30X: +st30.x.toFixed(4), lr10ArteryX: +artery10.x.toFixed(4), lr11AdductorX: +adductor.x.toFixed(4), arteryXAtLr11: +artery11.x.toFixed(4) };
}

// ---------------------------------------------------------------- trunk: LR12–LR14
const putOnLine = (code, y, cun, regions, rule) => {
  const surface = lateralOnSkin(y, cun);
  const normal = ringNormal(surface);
  W.put(code, surface.clone().addScaledVector(normal, -0.01), normal, regions, rule);
};
putOnLine('LR12', pubis.y, 2.5, ['pelvis', 'thigh-R'], 'groin · level of the superior border of the pubic symphysis · 2.5 B-cun lateral (skin arc)');
{
  const tip = landmark('rib_eleventh_free_end');
  W.put('LR13', tip.clone().add(v(0, -0.006, 0)), v(tip.x, 0, tip.z + 0.02).normalize(), ['lumbar', 'thorax', 'pelvis'],
    'lateral abdomen · inferior to the free extremity of the 11th rib');
}
{
  const y14 = intercostalOnLine(6, 4);
  putOnLine('LR14', y14, 4, ['thorax'], '6th intercostal space measured on the 4 B-cun line · 4 B-cun lateral (skin arc) · below the nipple');
  log.lr14 = { y: +y14.toFixed(4), st19Y: +seedOf('ST', 'ST19').y.toFixed(4), levelDifferenceFromSt19Mm: mm(y14 - seedOf('ST', 'ST19').y), st17X: +seedOf('ST', 'ST17').x.toFixed(4), lr14X: +W.get('LR14').x.toFixed(4) };
}

const english = ['Dadun', 'Xingjian', 'Taichong', 'Zhongfeng', 'Ligou', 'Zhongdu', 'Xiguan', 'Ququan', 'Yinbao', 'Zuwuli', 'Yinlian', 'Jimai', 'Zhangmen', 'Qimen'];
const overrides = Object.fromEntries(english.map((name, i) => [`LR${i + 1}`, { english: name }]));
overrides.LR5.location = '종아리 앞안쪽면, 정강뼈 안쪽면의 중앙, 안쪽복사 융기에서 음릉천까지 13촌으로 할 때 안쪽복사 융기 위 5촌, 축빈(KI9)과 같은 높이 (KCMRIC)';
overrides.LR6.location = '종아리 앞안쪽면, 정강뼈 안쪽면의 중앙, 안쪽복사 융기에서 음릉천까지 13촌으로 할 때 안쪽복사 융기 위 7촌 (KCMRIC)';
overrides.LR8.location = '무릎 안쪽면, 오금주름의 안쪽끝, 반힘줄근힘줄과 반막근힘줄의 안쪽 오목한 곳 (KCMRIC)';
W.write({
  label: '간경', name: '족궐음간경', english: 'LIVER MERIDIAN',
  primarySource: 'https://m.kmcric.com/knowledge/acupoint/LR', secondarySource: 'https://iris.who.int/handle/10665/353407',
  scale: { legCunMm: mm(LEG_CUN), thighCunMm: mm(thighCun), trunkCunMm: mm(TRUNK_CUN), fCunMm: headCun.forehead.cunMm },
}, overrides);
console.log(JSON.stringify(log, null, 1));
