/** HT1–HT9 (수소음심경). node scripts/meridians/ht.mjs → data/meridians/HT.json
 *
 * Checked against: raw sheet (KCMRIC text) → WHO 2008 → photo archive images/HT/HT01–09.
 * Raw, WHO and photos agree for all nine points.
 */
import {
  atlas, mesh, extremeCluster, centroid, slab, v, mid, perp, most, centreOf, atHeight, radialFrom,
  LATERAL, MEDIAL, ANTERIOR, UP, DOWN, upperLimb, meridianWriter,
} from '../acupoint-kit.mjs';

const W = meridianWriter('HT');
const L = upperLimb();
const log = {};
const armMedial = perp(MEDIAL, L.armAxis);
const forearmLateral = perp(LATERAL, L.forearmAxis), forearmMedial = perp(MEDIAL, L.forearmAxis), forearmAnterior = perp(ANTERIOR, L.forearmAxis);
const anteromedial = forearmAnterior.clone().addScaledVector(forearmMedial, 0.35).normalize();

// ---------------------------------------------------------------- HT1: centre of the axilla, over the axillary artery pulse
{
  const artery = mesh(atlas, 'Right axillary artery');
  // Lowest (most distal) third of the axillary artery lies under the axillary vault in the neutral pose.
  const vault = centroid(artery, (p) => p.y < artery.box.min.y + 0.025);
  const teresMajor = mesh(atlas, 'Right teres major');
  const posteriorFold = extremeCluster(teresMajor, LATERAL, 0.015, (p) => p.y < teresMajor.box.min.y + 0.04);
  // BodyParts3D leaves the axillary vault open, so preserve the hollow itself instead of snapping to its anterior rim.
  const centre = v(vault.x - 0.022, L.foldY, vault.z * 0.65 + posteriorFold.z * 0.35);
  W.putDirect('HT1', centre, v(0, -1, 0), 'upper-arm-R', 'centre of axillary hollow · midway between anterior and posterior folds · over axillary artery pulse');
  log.ht1 = { vault: vault.toArray().map((n) => +n.toFixed(4)), posteriorFold: posteriorFold.toArray().map((n) => +n.toFixed(4)) };
}

// ---------------------------------------------------------------- HT2: medial arm, just medial to biceps medial border, 3 B-cun above crease
const biceps = ['Long head of right biceps brachii', 'Short head of right biceps brachii'].map((n) => mesh(atlas, n));
{
  const y = L.creaseY + 3 * L.armCun;
  const shortHead = centreOf(atHeight(mesh(atlas, 'Short head of right biceps brachii'), y));
  const brachialis = centreOf(atHeight(mesh(atlas, 'Right brachialis'), y));
  const deep = mid(shortHead, brachialis).addScaledVector(armMedial, 0.002).setY(y);
  // The medial arm faces the chest wall: its skin is partly labelled thorax. toSkin takes the nearest outward-side hit,
  // which is the arm skin (~1 cm) before the chest wall (~3 cm).
  W.put('HT2', deep, radialFrom(deep, L.elbowCentre, L.humeralHead), ['upper-arm-R', 'thorax'], 'junction of short head of biceps brachii and brachialis · 3 B-cun above cubital crease');
}

// ---------------------------------------------------------------- HT3: anteromedial elbow, just anterior to medial epicondyle, level of cubital crease
{
  const anterior = perp(ANTERIOR, L.forearmAxis);
  const deep = v(L.medialEpicondyle.x, L.creaseY, L.medialEpicondyle.z).addScaledVector(anterior, 0.006);
  W.put('HT3', deep, anterior.clone().addScaledVector(perp(MEDIAL, L.forearmAxis), 0.6).normalize(), ['upper-arm-R', 'forearm-R'], 'level of cubital crease · just anterior to medial epicondyle of humerus');
}

// ---------------------------------------------------------------- HT4–HT7: radial border of flexor carpi ulnaris tendon
const fcu = ['Humeral head of right flexor carpi ulnaris', 'Ulnar head of right flexor carpi ulnaris'].map((n) => mesh(atlas, n));
for (const [code, cun] of [['HT4', 1.5], ['HT5', 1], ['HT6', 0.5], ['HT7', 0]]) {
  const y = L.wristY + cun * L.forearmCun;
  const pts = fcu.flatMap((part) => slab(part, 1, y, 0.004));
  if (!pts.length) throw new Error(`FCU tendon not found at ${code}`);
  // The slab is ±4 mm thick: pin the chosen border vertex back to the exact B-cun level.
  const border = most(pts, forearmLateral).addScaledVector(forearmLateral, 0.002).setY(y);
  // Horizontal ray: 0.5 B-cun steps are ~11 mm and the tilted forearm axis otherwise shifts each landing by ±6 mm.
  const level = anteromedial.clone().setY(0).normalize();
  const rule = cun ? `radial border of flexor carpi ulnaris tendon · ${cun} B-cun proximal to palmar wrist crease` : 'palmar wrist crease · radial border of flexor carpi ulnaris tendon (proximal to pisiform)';
  W.put(code, border, level, cun ? ['forearm-R'] : ['forearm-R', 'hand-R'], rule);
}

// ---------------------------------------------------------------- HT8: palm, between 4th and 5th metacarpals, proximal to 5th MCP joint
/** Palm normal = perpendicular to both the metacarpal axis and the 2nd→5th metacarpal transverse line,
 *  signed toward the thenar/hypothenar muscles (no radial tilt, unlike a raw centroid difference). */
const palmarNormal = (axis) => {
  const mc2 = centroid(mesh(atlas, 'Right second metacarpal bone')), mc5 = centroid(mesh(atlas, 'Right fifth metacarpal bone'));
  const transverse = perp(mc5.clone().sub(mc2), axis);
  const normal = new (axis.constructor)().crossVectors(axis, transverse).normalize();
  const eminences = mid(centroid(mesh(atlas, 'Right opponens pollicis')), centroid(mesh(atlas, 'Opponens digiti minimi of right hand')));
  return normal.dot(eminences.sub(mid(mc2, mc5))) < 0 ? normal.negate() : normal;
};
const metacarpalFrame = (name) => {
  const part = mesh(atlas, name);
  const head = extremeCluster(part, DOWN, 0.03), base = extremeCluster(part, UP, 0.03);
  return { part, head, base, axis: base.clone().sub(head).normalize() };
};
{
  const mc4 = metacarpalFrame('Right fourth metacarpal bone'), mc5 = metacarpalFrame('Right fifth metacarpal bone');
  const axis = mid(mc4.axis, mc5.axis).normalize();
  const palmar = palmarNormal(axis);
  const deep = mid(mc4.head, mc5.head).addScaledVector(axis, 0.015);
  W.put('HT8', deep, palmar, ['hand-R'], 'palm · between 4th and 5th metacarpals · proximal to 5th MCP joint');
  log.ht8 = { palmar: palmar.toArray().map((n) => +n.toFixed(3)) };
}

// ---------------------------------------------------------------- HT9: little finger, radial nail-root corner + 0.1 F-cun
{
  const dp = mesh(atlas, 'Distal phalanx of right little finger');
  const tip = extremeCluster(dp, v(0, -1, 0.7), 0.03), base = extremeCluster(dp, v(0, 1, -0.7), 0.03);
  const axis = base.clone().sub(tip).normalize();
  const radial = perp(centroid(mesh(atlas, 'Distal phalanx of right ring finger')).sub(centroid(dp)), axis);
  // Nail side = opposite the palm normal of the metacarpals (first run used a muscle-centroid difference and pointed palmar).
  const mc5 = metacarpalFrame('Right fifth metacarpal bone');
  let dorsal = perp(palmarNormal(mc5.axis).negate(), axis);
  dorsal = perp(dorsal, radial);
  const deep = base.clone().lerp(tip, 0.28).addScaledVector(axis, 0.002);
  W.put('HT9', deep, radial.clone().multiplyScalar(0.8).add(dorsal.clone().multiplyScalar(0.6)), ['hand-R'], 'little finger distal phalanx · radial nail-root corner + 0.1 F-cun proximal-radial');
  log.ht9 = { radial: radial.toArray().map((n) => +n.toFixed(3)), dorsal: dorsal.toArray().map((n) => +n.toFixed(3)) };
}

const english = { HT1: 'Jiquan', HT2: 'Qingling', HT3: 'Shaohai', HT4: 'Lingdao', HT5: 'Tongli', HT6: 'Yinxi', HT7: 'Shenmen', HT8: 'Shaofu', HT9: 'Shaochong' };
W.write({
  label: '심경', name: '수소음심경', english: 'HEART MERIDIAN',
  primarySource: 'https://m.kmcric.com/knowledge/acupoint/HT', secondarySource: 'https://iris.who.int/handle/10665/353407',
  scale: { armCunMm: +(L.armCun * 1000).toFixed(1), forearmCunMm: +(L.forearmCun * 1000).toFixed(1), creaseY: +L.creaseY.toFixed(4), wristY: +L.wristY.toFixed(4) },
}, Object.fromEntries(Object.entries(english).map(([code, name]) => [code, { english: name }])));
console.log(JSON.stringify(log));
