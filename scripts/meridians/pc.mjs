/** PC1–PC9 (수궐음심포경). node scripts/meridians/pc.mjs → data/meridians/PC.json
 *
 * Checked against: raw sheet (KCMRIC text) → WHO 2008 → photo archive images/PC/PC01–09.
 * PC8/PC9 are WHO 2008 contested points. Raw (KCMRIC) = WHO standard wording is used:
 *  - PC8 between the 2nd and 3rd metacarpals (photo notes the Korea/Japan 3rd–4th alternative; kept as a note only)
 *  - PC9 centre of the tip of the middle finger (alternative: radial nail-root corner; note only)
 */
import {
  atlas, mesh, extremeCluster, centroid, slab, v, mid, perp, most, centreOf, atHeight, radialFrom,
  LATERAL, MEDIAL, ANTERIOR, UP, DOWN, upperLimb, meridianWriter, toSkin,
} from '../acupoint-kit.mjs';

const W = meridianWriter('PC');
const L = upperLimb();
const log = {};
const armMedial = perp(MEDIAL, L.armAxis), armLateral = perp(LATERAL, L.armAxis);
const forearmAnterior = perp(ANTERIOR, L.forearmAxis);

// ---------------------------------------------------------------- PC1: 4th intercostal space, 5 B-cun lateral to the anterior median line
{
  const clavicle = mesh(atlas, 'Right clavicle');
  const chestCun = Math.abs((extremeCluster(clavicle, MEDIAL, 0.01).x + extremeCluster(clavicle, LATERAL, 0.01).x) / 2) / 4;
  const x = -5 * chestCun;
  // 4th ICS at that line: lower surface of the 4th rib and upper surface of the 5th rib, sampled on their anterior faces.
  const band = (name) => slab(mesh(atlas, name), 0, x, 0.004, (p) => p.z > 0.02);
  const rib4 = band('Right fourth rib'), rib5 = band('Right fifth rib');
  const ics4Y = (most(rib4, DOWN).y + most(rib5, UP).y) / 2;
  const deep = v(x, ics4Y, most([...rib4, ...rib5], ANTERIOR).z);
  W.put('PC1', deep, v(0, 0, 1), ['thorax'], '4th intercostal space · 5 B-cun lateral to anterior median line (clavicle-midpoint = 4 B-cun)');
  log.pc1 = { chestCunMm: +(chestCun * 1000).toFixed(1), x: +x.toFixed(4), ics4Y: +ics4Y.toFixed(4) };
}

// ---------------------------------------------------------------- PC2: anterior arm, between long and short heads of biceps, 2 B-cun below the fold
{
  const y = L.foldY - 2 * L.armCun;
  const longHead = slab(mesh(atlas, 'Long head of right biceps brachii'), 1, y, 0.004);
  const shortHead = slab(mesh(atlas, 'Short head of right biceps brachii'), 1, y, 0.004);
  const groove = mid(most(longHead, armMedial), most(shortHead, armLateral)).setY(y);
  W.put('PC2', groove, radialFrom(groove, L.elbowCentre, L.humeralHead), ['upper-arm-R'], 'between long and short heads of biceps brachii · 2 B-cun below anterior axillary fold');
}

// ---------------------------------------------------------------- PC3: cubital crease, depression medial to biceps tendon
{
  const biceps = ['Long head of right biceps brachii', 'Short head of right biceps brachii'].map((n) => mesh(atlas, n));
  const tendon = most(biceps.flatMap((part) => slab(part, 1, L.creaseY, 0.006)), armMedial);
  const deep = tendon.addScaledVector(armMedial, 0.003).setY(L.creaseY);
  // 2026-09-23: the forearm-anterior projection landed on skin angled over the biceps, and the needle crossed both
  // heads (13-27 mm). Here the needle goes straight back beside the tendon: brachialis, with the brachial artery
  // just lateral to the path.
  W.putDirect('PC3', toSkin(deep, ANTERIOR, ['upper-arm-R', 'forearm-R']).point, ANTERIOR, 'upper-arm-R', 'cubital crease · depression medial to biceps brachii tendon');
}

// ---------------------------------------------------------------- PC4–PC7: between palmaris longus and flexor carpi radialis tendons
const palmaris = mesh(atlas, 'Right palmaris longus'), fcr = mesh(atlas, 'Right flexor carpi radialis');
for (const [code, cun] of [['PC4', 5], ['PC5', 3], ['PC6', 2], ['PC7', 0]]) {
  const y = L.wristY + cun * L.forearmCun;
  const deep = mid(centreOf(atHeight(palmaris, y)), centreOf(atHeight(fcr, y)));
  const rule = cun ? `between palmaris longus and flexor carpi radialis tendons · ${cun} B-cun proximal to palmar wrist crease` : 'midpoint of palmar wrist crease · between palmaris longus and flexor carpi radialis tendons';
  W.put(code, deep, forearmAnterior, cun ? ['forearm-R'] : ['forearm-R', 'hand-R'], rule);
}

// ---------------------------------------------------------------- PC8: palm, between 2nd and 3rd metacarpals, proximal to the MCP joints
/** Palm normal = perpendicular to both the metacarpal axis and the 2nd→5th metacarpal transverse line,
 *  signed toward the thenar/hypothenar muscles (the first run's centroid difference tilted it radially ~5 mm). */
const palmarNormal = (axis) => {
  const mc2c = centroid(mesh(atlas, 'Right second metacarpal bone')), mc5c = centroid(mesh(atlas, 'Right fifth metacarpal bone'));
  const transverse = perp(mc5c.clone().sub(mc2c), axis);
  const normal = new (axis.constructor)().crossVectors(axis, transverse).normalize();
  const eminences = mid(centroid(mesh(atlas, 'Right opponens pollicis')), centroid(mesh(atlas, 'Opponens digiti minimi of right hand')));
  return normal.dot(eminences.sub(mid(mc2c, mc5c))) < 0 ? normal.negate() : normal;
};
const metacarpalFrame = (name) => {
  const part = mesh(atlas, name);
  const head = extremeCluster(part, DOWN, 0.03), base = extremeCluster(part, UP, 0.03);
  return { part, head, base, axis: base.clone().sub(head).normalize() };
};
{
  const mc2 = metacarpalFrame('Right second metacarpal bone'), mc3 = metacarpalFrame('Right third metacarpal bone');
  const axis = mid(mc2.axis, mc3.axis).normalize();
  const palmar = palmarNormal(axis);
  // Small proximal correction requested after local visual review.
  const deep = mid(mc2.head, mc3.head).addScaledVector(axis, 0.015);
  W.put('PC8', deep, palmar, ['hand-R'], 'palm · between 2nd and 3rd metacarpals · proximal to MCP joints (WHO/KCMRIC; 3rd–4th alternative noted)');
  log.pc8 = { palmar: palmar.toArray().map((n) => +n.toFixed(3)) };
}

// ---------------------------------------------------------------- PC9: centre of the tip of the middle finger
{
  const dp = mesh(atlas, 'Distal phalanx of right middle finger');
  const tip = extremeCluster(dp, v(0, -1, 0.7), 0.03), base = extremeCluster(dp, v(0, 1, -0.7), 0.03);
  const axis = tip.clone().sub(base).normalize();
  const mc3 = metacarpalFrame('Right third metacarpal bone');
  const palmar = palmarNormal(mc3.axis);
  W.put('PC9', tip, axis.clone().multiplyScalar(0.9).addScaledVector(palmar, 0.35).normalize(), ['hand-R'], 'centre of middle-finger tip with slight palmar bias (WHO standard; radial nail-root corner alternative noted)');
}

const english = { PC1: 'Tianchi', PC2: 'Tianquan', PC3: 'Quze', PC4: 'Ximen', PC5: 'Jianshi', PC6: 'Neiguan', PC7: 'Daling', PC8: 'Laogong', PC9: 'Zhongchong' };
const overrides = Object.fromEntries(Object.entries(english).map(([code, name]) => [code, { english: name }]));
overrides.PC8.location = '손바닥, 둘째와 셋째 손허리뼈의 사이, 손허리손가락관절의 몸쪽 오목한 곳. (대안: 셋째와 넷째 손허리뼈 사이 — 참고만)';
overrides.PC9.location = '가운데손가락 끝의 중심. (대안: 가운데손톱 노쪽 뿌리각 — 참고만)';
W.write({
  label: '심포경', name: '수궐음심포경', english: 'PERICARDIUM MERIDIAN',
  primarySource: 'https://m.kmcric.com/knowledge/acupoint/PC', secondarySource: 'https://iris.who.int/handle/10665/353407',
  scale: { armCunMm: +(L.armCun * 1000).toFixed(1), forearmCunMm: +(L.forearmCun * 1000).toFixed(1), creaseY: +L.creaseY.toFixed(4), wristY: +L.wristY.toFixed(4) },
}, overrides);
console.log(JSON.stringify(log));
