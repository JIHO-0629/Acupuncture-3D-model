/** LU1–LU11 (수태음폐경). node scripts/meridians/lu.mjs → data/meridians/LU.json
 *
 * Checked against: raw sheet (KCMRIC text) → WHO 2008 → photo archive images/LU/LU01–11.
 * LU1/LU2 raw memos ("실제로는 둘째/첫째 갈비사이공간") conflict with WHO and are NOT used for coordinates.
 */
import {
  atlas, mesh, extremeCluster, centroid, slab, v, mid, perp, most, centreOf, atHeight, radialFrom,
  LATERAL, MEDIAL, ANTERIOR, UP, DOWN, upperLimb, meridianWriter, toSkin,
} from '../acupoint-kit.mjs';

const W = meridianWriter('LU');
const L = upperLimb();
const log = {};

// ---------------------------------------------------------------- chest: LU1, LU2
// Transverse chest B-cun: midclavicular (mammillary) line = 4 B-cun from the anterior median line.
// Nipples are not meshed, so the clavicle midpoint stands in for the mammillary line (derived landmark).
const clavicle = mesh(atlas, 'Right clavicle'), scapula = mesh(atlas, 'Right scapula');
const clavMedial = extremeCluster(clavicle, MEDIAL, 0.01), clavLateral = extremeCluster(clavicle, LATERAL, 0.01);
const chestCun = Math.abs((clavMedial.x + clavLateral.x) / 2) / 4;
const sixCunX = -6 * chestCun;
const coracoid = extremeCluster(scapula, ANTERIOR, 0.005, (p) => p.y > 1.37);
const chestRegions = ['thorax', 'shoulder'];
// Pure anterior ray: the chest skin is ~3–5 cm in front of the coracoid, and any tilt would shift the level/6 B-cun line.
const chestOut = v(0, 0, 1);
// LU2: depression of the infraclavicular fossa, medial to the coracoid process, 6 B-cun lateral to the midline.
const clavicleAtSixCun = slab(clavicle, 0, sixCunX, 0.008);
const clavicleUnderside = most(clavicleAtSixCun, DOWN);
// Reviewer photo: the first pass sat too low in the fossa. Keep the point immediately below the clavicle.
const lu2 = v(sixCunX, clavicleUnderside.y - 0.004, coracoid.z);
W.put('LU2', lu2, chestOut, chestRegions, 'infraclavicular fossa immediately inferior to clavicle · medial to coracoid · 6 B-cun lateral');
// LU1: level of the 1st intercostal space (between 1st and 2nd costal cartilages at the sternal border), 6 B-cun lateral.
const cc1Low = extremeCluster(mesh(atlas, 'Right first costal cartilage'), DOWN, 0.02);
const cc2Top = extremeCluster(mesh(atlas, 'Right second costal cartilage'), UP, 0.02);
const ics1Y = (cc1Low.y + cc2Top.y) / 2;
W.put('LU1', v(sixCunX, ics1Y, coracoid.z), chestOut, chestRegions, 'level of 1st intercostal space · 6 B-cun lateral · lateral to infraclavicular fossa');
log.chest = { chestCunMm: +(chestCun * 1000).toFixed(1), sixCunX: +sixCunX.toFixed(4), coracoid: coracoid.toArray().map((n) => +n.toFixed(4)), ics1Y: +ics1Y.toFixed(4), lu2MinusOneCunY: +(coracoid.y - chestCun).toFixed(4) };

// ---------------------------------------------------------------- upper arm: LU3, LU4
const biceps = ['Long head of right biceps brachii', 'Short head of right biceps brachii'].map((n) => mesh(atlas, n));
const armLateral = perp(LATERAL, L.armAxis);
for (const [code, cun] of [['LU3', 3], ['LU4', 4]]) {
  const y = L.foldY - cun * L.armCun;
  const border = most(biceps.flatMap((part) => slab(part, 1, y, 0.004)), armLateral);
  // Slab vertices span ±4 mm: pin the border back to the exact B-cun level.
  const deep = border.addScaledVector(armLateral, 0.003).setY(y);
  W.put(code, deep, radialFrom(deep, L.elbowCentre, L.humeralHead), ['upper-arm-R'], `just lateral to lateral border of biceps brachii · ${cun} B-cun below anterior axillary fold`);
}

// ---------------------------------------------------------------- elbow: LU5
const forearmLateral = perp(LATERAL, L.forearmAxis), forearmAnterior = perp(ANTERIOR, L.forearmAxis);
{
  const tendon = most(biceps.flatMap((part) => slab(part, 1, L.creaseY, 0.006)), armLateral);
  const deep = tendon.addScaledVector(armLateral, 0.004).setY(L.creaseY + 0.003);
  // 2026-09-23: the projected skin faced the biceps and the needle went through its long head. Kept as the same
  // anterolateral direction, but applied directly at the skin beside the tendon: cephalic vein, then brachialis.
  const out = forearmAnterior.clone().addScaledVector(forearmLateral, 0.35).normalize();
  W.putDirect('LU5', toSkin(deep, out, ['upper-arm-R', 'forearm-R']).point, out, 'upper-arm-R', 'immediately superior to cubital crease · depression lateral to biceps brachii tendon');
}

// ---------------------------------------------------------------- wrist and forearm: LU9, LU8, LU7, LU6
const apl = mesh(atlas, 'Right abductor pollicis longus'), epb = mesh(atlas, 'Right extensor pollicis brevis');
const radialArtery = mesh(atlas, 'Right radial artery'), radius = mesh(atlas, 'Right radius');
const anterolateral = forearmAnterior.clone().addScaledVector(forearmLateral, 0.35);
const wristRegions = ['forearm-R', 'hand-R'];
{
  // LU9: palmar wrist crease, between radial styloid and scaphoid, in the depression ulnar to the APL tendon (over the radial artery).
  // A lateral ray tilt carried the first attempt radial to the APL tendon; the artery centre with an anterior ray keeps it ulnar.
  const y = L.wristY;
  const aplCentre = centreOf(atHeight(apl, y)), arteryCentre = centreOf(atHeight(radialArtery, y));
  const deep = arteryCentre.x > aplCentre.x ? arteryCentre : aplCentre.clone().addScaledVector(perp(MEDIAL, L.forearmAxis), 0.005);
  W.put('LU9', deep, forearmAnterior, wristRegions, 'palmar wrist crease · ulnar to abductor pollicis longus tendon (radial artery)');
  log.lu9 = { apl: aplCentre.toArray().map((n) => +n.toFixed(4)), artery: arteryCentre.toArray().map((n) => +n.toFixed(4)) };
}
{
  // LU8: 1 B-cun above palmar wrist crease, between the radial styloid process and the radial artery.
  const y = L.wristY + L.forearmCun;
  const styloidRidge = most(atHeight(radius, y), anterolateral);
  const deep = mid(styloidRidge, centreOf(atHeight(radialArtery, y)));
  W.put('LU8', deep, forearmAnterior.clone().addScaledVector(forearmLateral, 0.15), ['forearm-R'], '1 B-cun above palmar wrist crease · between radial styloid ridge and radial artery');
}
{
  // LU7: radial aspect of forearm, between APL and EPB tendons, 1.5 B-cun above palmar wrist crease.
  const y = L.wristY + 1.5 * L.forearmCun;
  const deep = mid(centreOf(atHeight(apl, y)), centreOf(atHeight(epb, y)));
  W.put('LU7', deep, forearmLateral, ['forearm-R'], 'radial aspect · between abductor pollicis longus and extensor pollicis brevis tendons · 1.5 B-cun above wrist crease');
}
{
  // LU6: on the LU5–LU9 line, 7 B-cun above the palmar wrist crease (12 B-cun forearm).
  const t = 7 / 12;
  const deep = W.get('LU9').lerp(W.get('LU5'), t);
  const outward = W.getOutward('LU9').lerp(W.getOutward('LU5'), t).normalize();
  W.put('LU6', deep, perp(outward, L.forearmAxis), ['forearm-R'], 'LU9→LU5 line · 7 B-cun above palmar wrist crease');
}

// ---------------------------------------------------------------- hand: LU10, LU11
{
  // LU10: palm, radial to the midpoint of the 1st metacarpal, at the red-white flesh border.
  const mc1 = mesh(atlas, 'Right first metacarpal bone');
  const head = extremeCluster(mc1, v(-0.4, -1, 0.2), 0.03), base = extremeCluster(mc1, v(0.4, 1, -0.2), 0.03);
  const axis = base.clone().sub(head).normalize();
  const border = perp(LATERAL, axis).add(perp(ANTERIOR, axis).multiplyScalar(0.35)).normalize();
  const midpoint = mid(head, base);
  // Project from the shaft midpoint itself; choosing the most radial slab vertex made the midpoint read too distal.
  W.put('LU10', midpoint, border, ['hand-R'], 'radial to exact midpoint of 1st metacarpal · red-white flesh border (palmar-radial)');
}
{
  // LU11: thumb distal phalanx, 0.1 F-cun proximal-lateral to the radial corner of the thumbnail.
  const dp = mesh(atlas, 'Distal phalanx of right thumb');
  const tip = extremeCluster(dp, v(-0.3, -1, 0.3), 0.03), base = extremeCluster(dp, v(0.3, 1, -0.3), 0.03);
  const axis = base.clone().sub(tip).normalize();
  const dpCentre = centroid(dp);
  const radial = perp(dpCentre.clone().sub(centroid(mesh(atlas, 'Proximal phalanx of right index finger'))), axis);
  // Nail side = dorsum of the thumb ray: away from the thenar muscles lying on the palmar face of the 1st metacarpal.
  // (DP centre − opponens centre was mostly along the axis and flipped the sign to palmar on the first run.)
  let dorsal = perp(centroid(mesh(atlas, 'Right first metacarpal bone')).sub(centroid(mesh(atlas, 'Right opponens pollicis'))), axis);
  dorsal = perp(dorsal, radial);
  const deep = base.clone().lerp(tip, 0.28).addScaledVector(axis, 0.002);
  W.put('LU11', deep, radial.clone().multiplyScalar(0.8).add(dorsal.clone().multiplyScalar(0.6)), ['hand-R'], 'thumb distal phalanx · radial nail-root corner + 0.1 F-cun proximal-lateral');
  log.thumb = { radial: radial.toArray().map((n) => +n.toFixed(3)), dorsal: dorsal.toArray().map((n) => +n.toFixed(3)) };
}

const english = { LU1: 'Zhongfu', LU2: 'Yunmen', LU3: 'Tianfu', LU4: 'Xiabai', LU5: 'Chize', LU6: 'Kongzui', LU7: 'Lieque', LU8: 'Jingqu', LU9: 'Taiyuan', LU10: 'Yuji', LU11: 'Shaoshang' };
const overrides = Object.fromEntries(Object.entries(english).map(([code, name]) => [code, { english: name }]));
overrides.LU1.location = '앞가슴부위, 첫째 갈비사이공간과 같은 높이, 빗장아래오목의 가쪽, 앞정중선에서 가쪽으로 6촌. (WHO 기준 · 원본 부가메모 미사용)';
overrides.LU2.location = '앞가슴부위, 빗장아래오목의 오목한 곳, 어깨뼈부리돌기 안쪽, 앞정중선에서 가쪽으로 6촌. (WHO 기준 · 원본 부가메모 미사용)';
W.write({
  label: '폐경', name: '수태음폐경', english: 'LUNG MERIDIAN',
  primarySource: 'https://m.kmcric.com/knowledge/acupoint/LU', secondarySource: 'https://iris.who.int/handle/10665/353407',
  scale: { chestCunMm: log.chest.chestCunMm, armCunMm: +(L.armCun * 1000).toFixed(1), forearmCunMm: +(L.forearmCun * 1000).toFixed(1), foldY: +L.foldY.toFixed(4), creaseY: +L.creaseY.toFixed(4), wristY: +L.wristY.toFixed(4) },
}, overrides);
console.log(JSON.stringify(log));
