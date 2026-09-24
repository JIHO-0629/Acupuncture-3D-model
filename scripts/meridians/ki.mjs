/** KI1–KI27 (족소음신경). node scripts/meridians/ki.mjs → data/meridians/KI.json
 *
 * Checked against: KCMRIC (m.kmcric.com/knowledge/acupoint/KI) → WHO 2008 (TARA curated WHO text) → photo archive
 * images/KI/KI01–27.
 *
 * Reviewer decisions (2026-09-15):
 *  - Medial leg scale follows KCMRIC: medial malleolus prominence → 음릉천 SP9 = 13 B-cun. The WHO note's
 *    patella-apex 15 B-cun line (and the "15촌" label on the KI07–09 photos) is not used; on this model it would put
 *    KI9 12.8 mm lower and break its required level with LR5.
 *  - Source conflicts follow KCMRIC: KI5 uses KCMRIC's ankle scale (KI3 → ground = 3 B-cun); KI9 sits between soleus and
 *    the calcaneal tendon at 5 B-cun on the KI3–SP9 line; KI10 lies between the semitendinosus and semimembranosus
 *    tendons; KI16 is on the upper abdomen.
 * Photo notes: KI4 about 0.5 B-cun below KI3 (used as a check); 동의보감 alternatives on KI11/14/16/21 are not used.
 */
import fs from 'node:fs';
import * as T from 'three';
import { threeMesh } from '../atlas-geometry.mjs';
import { atlas, mesh, centroid, v, mid, most, landmark, atHeight, meridianWriter, MEDIAL, LATERAL, ANTERIOR, POSTERIOR, DOWN } from '../acupoint-kit.mjs';
import { pts, lowest, highest, section, nearestIndex, stepToward, advance, lateralOnSkin, ringNormal, intercostalOnLine, clavicleLowOnLine, TRUNK_CUN } from '../trunk-arc.mjs';

const W = meridianWriter('KI');
const log = {};
const r4 = (p) => p.toArray().map((n) => +n.toFixed(4));
const mm = (n) => +(n * 1000).toFixed(1);
const generated = (id) => JSON.parse(fs.readFileSync(new URL(`../../data/meridians/${id}.json`, import.meta.url), 'utf8'));
const seedOf = (id, code) => {
  const row = generated(id).points.find((p) => p.code === code);
  if (!row) throw new Error(`${id} point missing: ${code}`);
  return v(...row.seed);
};
const place = (code, p, out, regions, rule) => W.put(code, p.clone().addScaledVector(out, -0.004), out, regions, rule);

// ---------------------------------------------------------------- scales
const tibia = mesh(atlas, 'Right tibia');
const medialMalleolus = landmark('medial_malleolus_prominence'); // same anchor as SP5/SP6
const sp9 = seedOf('SP', 'SP9');
const LEG_CUN = (sp9.y - medialMalleolus.y) / 13;
const foot = ['foot-R'], ankle = ['foot-R', 'leg-R'], leg = ['leg-R'];
const skin = mesh(atlas, 'Skin');
const groundY = lowest(pts(skin, (p) => p.x < -0.04 && p.x > -0.16 && p.y < 0.03)).y;
const tendon = mesh(atlas, 'Right calcaneal tendon');
log.scale = { legCunMm: mm(LEG_CUN), medialMalleolus: r4(medialMalleolus), sp9Y: +sp9.y.toFixed(4), groundY: +groundY.toFixed(4), tendonTopY: +tendon.box.max.y.toFixed(4) };

// ---------------------------------------------------------------- foot: KI1, KI2
{
  const calcaneus = mesh(atlas, 'Right calcaneus');
  const heel = most(pts(calcaneus), v(0, -0.3, -1).normalize());
  const pp2 = mesh(atlas, 'Proximal phalanx of right second toe'), pp3 = mesh(atlas, 'Proximal phalanx of right third toe');
  const z = Math.max(pp2.box.min.z, pp3.box.min.z) + 0.004;
  const web = mid(most(pts(pp2, (p) => Math.abs(p.z - z) < 0.003), LATERAL), most(pts(pp3, (p) => Math.abs(p.z - z) < 0.003), MEDIAL));
  const deep = web.clone().lerp(heel, 1 / 3);
  W.put('KI1', v(deep.x, Math.max(deep.y, groundY + 0.008), deep.z), DOWN, foot,
    'sole · deepest depression with toes flexed · anterior 1/3 of the line from the 2nd–3rd toe web margin to the heel');
  log.ki1 = { web: r4(web), heel: r4(heel) };

  const tuberosity = most(pts(mesh(atlas, 'Navicular bone of right foot')), MEDIAL);
  W.put('KI2', tuberosity.clone().add(v(0, -0.01, 0)), v(0.9, -0.35, 0).normalize(), foot,
    'medial foot · inferior to the tuberosity of the navicular bone · red-white flesh border');
}

// ---------------------------------------------------------------- ankle: KI3–KI6
const posteromedial = v(0.75, 0, -0.65).normalize();
const ki3Deep = (() => {
  const front = most(atHeight(tendon, medialMalleolus.y), v(0.6, 0, 1).normalize());
  return mid(medialMalleolus, front);
})();
W.put('KI3', ki3Deep, posteromedial, ankle, 'posteromedial ankle · depression between the medial malleolus prominence and the calcaneal tendon');
// KCMRIC KI5: KI3 → ground = 3 B-cun. KI6 shares that local ankle scale.
const ANKLE_CUN = (ki3Deep.y - groundY) / 3;
{
  const y4 = ki3Deep.y - 0.5 * ANKLE_CUN;
  const front4 = most(atHeight(tendon, y4), ANTERIOR);
  const ki4Deep = v(front4.x, y4, front4.z + 0.006);
  W.put('KI4', ki4Deep, v(0.9, 0, -0.3).normalize(), ankle,
    'posteroinferior to the medial malleolus · superior to the calcaneus · anterior to the medial attachment of the calcaneal tendon (photo: ~0.5 B-cun below KI3)');
  const y5 = ki3Deep.y - ANKLE_CUN;
  W.put('KI5', v(ki4Deep.x, y5, ki4Deep.z + 0.010), v(1, -0.15, -0.1).normalize(), foot,
    'KCMRIC: KI3 → ground = 3 B-cun · 1 B-cun below KI3 · immediately anterior to KI4 and posterior talus region');
  W.put('KI6', v(medialMalleolus.x - 0.002, y5, medialMalleolus.z), v(1, -0.15, 0).normalize(), ankle,
    '1 B-cun below the medial malleolus prominence · depression directly inferior to the malleolus');
  const calcaneusTop = highest(pts(mesh(atlas, 'Right calcaneus'), (p) => Math.abs(p.z - ki4Deep.z) < 0.004 && Math.abs(p.x - ki4Deep.x) < 0.01));
  log.ankle = { ankleCunMm: mm(ANKLE_CUN), ki4Y: +y4.toFixed(4), calcaneusTopAtKi4: +calcaneusTop.y.toFixed(4) };
}

// ---------------------------------------------------------------- leg: KI7–KI9 (13 B-cun), knee: KI10
{
  const y7 = medialMalleolus.y + 2 * LEG_CUN;
  const front7 = most(atHeight(tendon, y7), v(0.5, 0, 1).normalize());
  W.put('KI7', v(front7.x + 0.003, y7, front7.z + 0.005), v(0.8, 0, -0.6).normalize(), leg,
    '2 B-cun above the medial malleolus prominence (13 B-cun medial leg) · anterior to the calcaneal tendon');
  // KCMRIC 취혈: KI8 is 0.5 B-cun anterior to KI7. Projecting from the tibial border landed on KI7 itself (first run:
  // 3.9 mm apart), so walk 0.5 B-cun forward from KI7 along the skin of this leg section.
  const c7 = centroid(tibia, (p) => Math.abs(p.y - y7) < 0.006);
  const ring7 = section('y', y7, v(c7.x, y7, c7.z - 0.02), 0.09);
  const i7 = nearestIndex(ring7, W.get('KI7'));
  const surface8 = advance(ring7, i7, stepToward(ring7, i7, 'z', 1), 0.5 * LEG_CUN);
  const normal8 = v(surface8.x - c7.x, 0, surface8.z - c7.z + 0.02).normalize();
  W.put('KI8', surface8.clone().addScaledVector(normal8, -0.006), normal8, leg,
    '2 B-cun above the medial malleolus prominence · depression posterior to the medial border of the tibia · 0.5 B-cun anterior to KI7 (KCMRIC)');
  const border8 = most(atHeight(tibia, y7), v(0.7, 0, -0.7).normalize());
  log.ki8 = { ki7ki8SeparationMm: mm(W.get('KI7').distanceTo(W.get('KI8'))), tibiaPosteromedialBorder: r4(border8) };

  const y9 = medialMalleolus.y + 5 * LEG_CUN;
  const soleus = most(atHeight(mesh(atlas, 'Right soleus'), y9), v(0.8, 0, 0.2).normalize());
  const tendonCovers = y9 < tendon.box.max.y - 0.004;
  const deep9 = tendonCovers ? mid(soleus, most(atHeight(tendon, y9), v(0.8, 0, -0.2).normalize())) : soleus.clone().add(v(0.002, 0, -0.01));
  deep9.y = y9;
  W.put('KI9', deep9, v(0.85, 0, -0.5).normalize(), leg,
    '5 B-cun above the medial malleolus prominence on the KI3–SP9 13 B-cun line · between soleus and the calcaneal tendon');
  const lineAt9 = ki3Deep.clone().lerp(sp9, 5 / 13);
  log.ki9 = { tendonCovers, offsetFromKi3Sp9LineMm: mm(Math.hypot(deep9.x - lineAt9.x, deep9.z - lineAt9.z)) };

  const crease = landmark('popliteal_crease');
  const st = most(atHeight(mesh(atlas, 'Right semitendinosus'), crease.y), POSTERIOR);
  const sm = most(atHeight(mesh(atlas, 'Right semimembranosus'), crease.y), POSTERIOR);
  // The tendon's posterior-most vertex put the needle straight into semitendinosus. Take its lateral border instead,
  // so the point sits beside the tendon (between it and semimembranosus), 7 mm lateral to LR8 on its medial side.
  const stLateral = most(atHeight(mesh(atlas, 'Right semitendinosus'), crease.y), LATERAL);
  W.put('KI10', v(stLateral.x - 0.002, crease.y, Math.min(stLateral.z, st.z + 0.004)), v(0.2, 0, -0.98).normalize(), ['knee-R', 'leg-R', 'thigh-R'],
    'posteromedial knee · popliteal crease · immediately lateral to the semitendinosus tendon');
  log.ki10 = { semitendinosus: r4(st), semimembranosus: r4(sm) };
}

// ---------------------------------------------------------------- abdomen: KI11–KI21 on the 0.5 B-cun skin line
const xiphisternal = landmark('xiphisternal_junction', null), umbilicus = landmark('umbilicus', null), pubis = landmark('pubic_symphysis_superior', null);
const upperCun = (xiphisternal.y - umbilicus.y) / 8, lowerCun = (umbilicus.y - pubis.y) / 5;
const putOnLine = (code, y, cun, regions, rule) => {
  const surface = lateralOnSkin(y, cun);
  const normal = ringNormal(surface);
  W.put(code, surface.clone().addScaledVector(normal, -0.01), normal, regions, rule);
};
const abdomen = ['thorax', 'lumbar', 'pelvis'];
for (const [code, cun] of [['KI11', 5], ['KI12', 4], ['KI13', 3], ['KI14', 2], ['KI15', 1]]) {
  putOnLine(code, umbilicus.y - cun * lowerCun, 0.5, abdomen, `${cun} B-cun below the centre of the umbilicus · 0.5 B-cun lateral (skin arc)`);
}
putOnLine('KI16', umbilicus.y, 0.5, abdomen, '0.5 B-cun lateral to the centre of the umbilicus (skin arc)');
for (const [code, cun] of [['KI17', 2], ['KI18', 3], ['KI19', 4], ['KI20', 5], ['KI21', 6]]) {
  putOnLine(code, umbilicus.y + cun * upperCun, 0.5, abdomen, `${cun} B-cun above the centre of the umbilicus · 0.5 B-cun lateral (skin arc)`);
}

// ---------------------------------------------------------------- chest: KI22–KI27 on the 2 B-cun skin line
const chest = ['thorax', 'shoulder'];
const ics = {};
// Reviewer (2026-09-21): from the front KI22 read as the 6th rib. Near the sternum the 6th costal cartilage climbs
// steeply, so the midpoint of the gap at the skin line put the needle into cartilage 12 mm deep. Slide the point up
// to the middle of the heights whose needle path clears the 5th and 6th ribs and cartilages.
const clearOfRibs = (() => {
  const bones = ['fifth', 'sixth'].flatMap((n) => [`Right ${n} rib`, `Right ${n} costal cartilage`]).filter((n) => { try { mesh(atlas, n); return true; } catch { return false; } }).map((n) => threeMesh(mesh(atlas, n)));
  const caster = new T.Raycaster();
  return (y) => { const surface = lateralOnSkin(y, 2), normal = ringNormal(surface); caster.set(surface, normal.clone().negate()); caster.far = 0.035; return caster.intersectObjects(bones, false).length === 0; };
})();
for (const [code, k] of [['KI22', 5], ['KI23', 4], ['KI24', 3], ['KI25', 2], ['KI26', 1]]) {
  ics[code] = intercostalOnLine(k, 2);
  if (code === 'KI22' && !clearOfRibs(ics[code])) {
    const clear = [];
    for (let dy = 0.001; dy <= 0.02; dy += 0.001) if (clearOfRibs(ics[code] + dy)) clear.push(dy); else if (clear.length) break;
    if (!clear.length) throw new Error('KI22: no clear 5th intercostal path above the measured gap');
    log.ki22 = { measuredY: +ics[code].toFixed(4), clearFromMm: mm(clear[0]), clearToMm: mm(clear.at(-1)) };
    ics[code] += (clear[0] + clear.at(-1)) / 2;
  }
  // Reviewer capture: these three paths still ran along a rib edge.  Move to
  // the visually confirmed centre of the adjacent intercostal gap.
  if (code === 'KI22' || code === 'KI24' || code === 'KI25') ics[code] += 0.006;
  putOnLine(code, ics[code], 2, chest, `${['1st', '2nd', '3rd', '4th', '5th'][k - 1]} intercostal space measured on the 2 B-cun line · 2 B-cun lateral (skin arc)`);
}
putOnLine('KI27', clavicleLowOnLine(2) - 0.001, 2, chest, 'just inferior to the clavicle · 2 B-cun lateral (skin arc)');
log.trunk = { trunkCunMm: mm(TRUNK_CUN), upperCunMm: mm(upperCun), lowerCunMm: mm(lowerCun), ics: Object.fromEntries(Object.entries(ics).map(([k, y]) => [k, +y.toFixed(4)])) };

const english = ['Yongquan', 'Rangu', 'Taixi', 'Dazhong', 'Shuiquan', 'Zhaohai', 'Fuliu', 'Jiaoxin', 'Zhubin', 'Yingu', 'Henggu', 'Dahe', 'Qixue', 'Siman', 'Zhongzhu', 'Huangshu', 'Shangqu', 'Shiguan', 'Yindu', 'Futonggu', 'Youmen', 'Bulang', 'Shenfeng', 'Lingxu', 'Shencang', 'Yuzhong', 'Shufu'];
const overrides = Object.fromEntries(english.map((name, i) => [`KI${i + 1}`, { english: name }]));
overrides.KI5.location = '발 안쪽면, 태계(KI3)에서 지면까지를 3촌으로 할 때 태계 아래 1촌, 발꿈치뼈융기 앞쪽 오목한 곳';
overrides.KI9.location = '종아리 뒤안쪽면, 가자미근과 발꿈치힘줄 사이, 태계(KI3)와 음릉천(SP9)을 잇는 13촌 선에서 태계 위 5촌';
overrides.KI10.location = '무릎 뒤안쪽면, 오금주름 위, 반힘줄근힘줄과 반막근힘줄 사이';
overrides.KI16.location = '윗배, 배꼽 중심에서 가쪽으로 0.5촌';
W.write({
  label: '신경', name: '족소음신경', english: 'KIDNEY MERIDIAN',
  primarySource: 'https://m.kmcric.com/knowledge/acupoint/KI', secondarySource: 'https://iris.who.int/handle/10665/353407',
  scale: { legCunMm: mm(LEG_CUN), ankleCunMm: mm(ANKLE_CUN), trunkCunMm: mm(TRUNK_CUN), upperAbdomenCunMm: mm(upperCun), lowerAbdomenCunMm: mm(lowerCun) },
}, overrides);
console.log(JSON.stringify(log, null, 1));
