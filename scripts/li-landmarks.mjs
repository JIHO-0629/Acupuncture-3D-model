/** LI1–LI20 surface anchors derived from bundled BodyParts3D vertices.
 *
 * Primary source: KCMRIC (m.kmcric.com/knowledge/acupoint/LI). Secondary: WHO 2008.
 * Every point is built from bone/muscle vertices of the RIGHT side, then snapped onto
 * the shipped Skin mesh. The viewer mirrors x for the left side.
 *
 *   node scripts/li-landmarks.mjs          → writes data/li-landmarks.json
 */
import fs from 'node:fs';
import * as T from 'three';
import { loadAtlas, mesh, has, extreme, extremeCluster, centroid, slab, threeMesh } from './atlas-geometry.mjs';

const atlas = loadAtlas();
const v = (x, y, z) => new T.Vector3(x, y, z);
const round = (p) => p.toArray().map((n) => +n.toFixed(5));
const mid = (a, b) => a.clone().add(b).multiplyScalar(0.5);
const LATERAL = v(-1, 0, 0), ANTERIOR = v(0, 0, 1), UP = v(0, 1, 0);
const perp = (dir, axis) => dir.clone().addScaledVector(axis, -dir.dot(axis)).normalize();

const skinPart = mesh(atlas, 'Skin');
const skin = threeMesh(skinPart);
const raycaster = new T.Raycaster();
/** Snap a deep anatomical point onto the skin along `outward`; nearest hit to the source wins. */
function toSkin(point, outward) {
  const out = outward.clone().normalize();
  raycaster.set(point.clone().addScaledVector(out, 0.12), out.clone().negate());
  raycaster.far = 0.24;
  // Prefer skin on the outward side of the anchor: in thin regions (hand) the opposite-side
  // skin can be nearer and would flip a radial point to the ulnar surface.
  const hits = raycaster.intersectObject(skin, false);
  const outwardSide = hits.filter((hit) => { const d = hit.point.clone().sub(point).dot(out); return d >= 0 && d < 0.05; });
  let best = null;
  for (const hit of outwardSide.length ? outwardSide : hits) {
    if (!best || hit.point.distanceTo(point) < best.point.distanceTo(point)) best = hit;
  }
  if (!best) throw new Error(`no skin hit near ${round(point)}`);
  const normal = best.face.normal.clone();
  if (normal.dot(out) < 0) normal.negate();
  return { point: best.point.clone(), normal, depthMm: +(best.point.distanceTo(point) * 1000).toFixed(1) };
}
/** Vertices of `part` within `half` metres of height `y`. */
const atHeight = (part, y, half = 0.004, filter) => {
  for (let h = half; h < 0.03; h *= 1.5) {
    const points = slab(part, 1, y, h, filter);
    if (points.length) return points;
  }
  throw new Error(`${part.name}: nothing near y=${y}`);
};
const most = (points, dir) => points.reduce((best, p) => (p.dot(dir) > best.dot(dir) ? p : best));
const closestOnSegment = (p, a, b) => {
  const ab = b.clone().sub(a), t = T.MathUtils.clamp(p.clone().sub(a).dot(ab) / ab.lengthSq(), 0, 1);
  return a.clone().addScaledVector(ab, t);
};
/** Outward direction perpendicular to a limb axis, passing through `p`. */
const radialFrom = (p, a, b) => perp(p.clone().sub(closestOnSegment(p, a, b)), b.clone().sub(a).normalize());

// ---------------------------------------------------------------- bony landmarks
const humerus = mesh(atlas, 'Right humerus'), radius = mesh(atlas, 'Right radius'), ulna = mesh(atlas, 'Right ulna');
const scapula = mesh(atlas, 'Right scapula'), clavicle = mesh(atlas, 'Right clavicle');
const mc2 = mesh(atlas, 'Right second metacarpal bone'), mc3 = mesh(atlas, 'Right third metacarpal bone');
const pp2 = mesh(atlas, 'Proximal phalanx of right index finger'), dp2 = mesh(atlas, 'Distal phalanx of right index finger');

const lateralEpicondyle = extremeCluster(humerus, LATERAL, 0.01, (p) => p.y < humerus.box.min.y + 0.05);
const medialEpicondyle = extremeCluster(humerus, v(1, 0, 0), 0.01, (p) => p.y < humerus.box.min.y + 0.05);
const elbowCentre = mid(lateralEpicondyle, medialEpicondyle);
const radialStyloid = extremeCluster(radius, v(0, -1, 0), 0.01);
const ulnarHead = extremeCluster(ulna, v(0, -1, 0), 0.01);
const wristCentre = mid(radialStyloid, ulnarHead);
const humeralHead = centroid(humerus, (p) => p.y > humerus.box.max.y - 0.03);
const forearmAxis = elbowCentre.clone().sub(wristCentre).normalize();

// Cubital crease is taken at the epicondylar level; dorsal wrist crease at the radial styloid.
let creaseY = lateralEpicondyle.y;
// Upper-arm B-cun: anterior axillary fold → cubital crease = 9 B-cun (WHO 2008 table).
const pecParts = ['Sternocostal part of right pectoralis major', 'Abdominal part of right pectoralis major', 'Clavicular part of right pectoralis major'].filter((n) => has(atlas, n)).map((n) => mesh(atlas, n));
let foldY = Infinity;
for (const part of pecParts) for (let i = 0; i < part.vertexCount; i++) {
  // Only fibres already lateral of the chest wall form the fold; medial fibres reach lower on the thorax.
  if (part.positions[i * 3] < -0.15) foldY = Math.min(foldY, part.positions[i * 3 + 1]);
}
const armCun = (foldY - creaseY) / 9;
// Reviewer check (2026-09-15): the lateral end of the cubital crease lies ~1 B-cun proximal to the
// lateral epicondyle on this atlas; the epicondyle itself anchors LI12, not LI11.
creaseY = lateralEpicondyle.y + armCun;
const forearmCun = (creaseY - radialStyloid.y) / 12;

// ---------------------------------------------------------------- hand frame
const mc2Head = extremeCluster(mc2, v(0, -1, 0), 0.03), mc2Base = extremeCluster(mc2, UP, 0.03);
const handAxis = mc2Base.clone().sub(mc2Head).normalize(); // distal → proximal
const handRadial = perp(centroid(mc2).sub(centroid(mc3)), handAxis);
let handDorsal = new T.Vector3().crossVectors(handAxis, handRadial).normalize();
if (handDorsal.z > 0) handDorsal.negate(); // supinated atlas hand: dorsum faces posterior
const mc2Mid = mid(mc2Head, mc2Base);

const points = {};
const rules = {};
function put(code, deep, outward, rule) {
  const snapped = toSkin(deep, outward);
  points[code] = { seed: round(snapped.point), outward: round(outward.clone().normalize()), depthMm: snapped.depthMm };
  rules[code] = rule;
}

// LI1 — radial nail-root corner of the index finger, 0.1 F-cun proximal-lateral.
{
  const tip = extremeCluster(dp2, v(0, -1, 0.7), 0.03), base = extremeCluster(dp2, v(0, 1, -0.7), 0.03);
  const axis = base.clone().sub(tip).normalize();
  const radial = perp(LATERAL, axis), dorsal = perp(v(0, -0.2, -1), axis);
  const length = tip.distanceTo(base);
  // Nail root ≈ proximal third of the distal phalanx; 0.1 F-cun ≈ 2 mm.
  const deep = base.clone().lerp(tip, 0.28).addScaledVector(axis, 0.002);
  put('LI1', deep, radial.clone().multiplyScalar(0.8).add(dorsal.clone().multiplyScalar(0.6)),
    `distal phalanx radial-dorsal corner at nail root (28% of ${(length * 1000).toFixed(0)} mm from base) + 0.1 F-cun proximal`);
}
// LI2 — distal to the radial side of MCP2, red-white flesh border (pure radial side).
{
  const base = extremeCluster(pp2, v(0, 1, -0.5), 0.03), tip = extremeCluster(pp2, v(0, -1, 0.5), 0.03);
  const axis = base.clone().sub(tip).normalize();
  put('LI2', base.clone().lerp(tip, 0.18), perp(handRadial, axis), 'proximal phalanx base (18% distal) · radial side = red-white border');
}
// LI3 — dorsum, proximal to the radial side of MCP2.
// LI3 — radial border (red-white junction) proximal to MCP2, not the dorsal skin.
put('LI3', mc2Head.clone().lerp(mc2Base, 0.18), handRadial.clone().add(handDorsal.clone().multiplyScalar(-0.1)), '2nd metacarpal head → 18% proximal · radial border');
// LI4 — radial to the midpoint of the 2nd metacarpal. Reviewer check (2026-09-15): on the radial
// border of the bone toward the palmar side, not on the dorsal skin of the web.
// Start from the bone's radial surface: a ray from the shaft centre can snap to ulnar-side skin.
{
  // A stronger palmar tilt enters the thenar mass (skin 45 mm away); -0.1 keeps the radial border.
  const outward = handRadial.clone().add(handDorsal.clone().multiplyScalar(-0.1)).normalize();
  const radialSurface = most(slab(mc2, 1, mc2Mid.y, 0.004), outward).addScaledVector(outward, 0.003);
  put('LI4', radialSurface, outward, 'midpoint of 2nd metacarpal · radial border (palmar-leaning)');
}
// LI5 — anatomical snuffbox: distal to radial styloid, radial end of dorsal wrist crease.
{
  // Snuffbox = between EPL (ulnar/dorsal wall) and EPB (radial wall), just distal to the styloid.
  const y = radialStyloid.y - 0.006;
  const tendonCentre = (name) => centroid(mesh(atlas, name), (p) => Math.abs(p.y - y) < 0.004);
  const snuff = mid(tendonCentre('Right extensor pollicis longus'), tendonCentre('Right extensor pollicis brevis'));
  const dorsal = perp(v(0, 0, -1), forearmAxis), radial = perp(LATERAL, forearmAxis);
  put('LI5', snuff, radial.clone().add(dorsal.clone().multiplyScalar(0.8)), 'midpoint(EPL, EPB tendons) 6 mm distal to radial styloid · snuffbox');
}
// LI11 — midpoint of LU5 (radial border of biceps tendon at crease) and lateral epicondyle.
{
  const biceps = ['Long head of right biceps brachii', 'Short head of right biceps brachii'].map((n) => mesh(atlas, n));
  const tendon = biceps.flatMap((part) => slab(part, 1, creaseY, 0.012));
  if (!tendon.length) throw new Error('biceps tendon not found at crease level');
  const lu5 = most(tendon, LATERAL);
  lu5.y = creaseY;
  const lateralAtCrease = most(atHeight(humerus, creaseY, 0.003), LATERAL);
  const deep = mid(lu5, lateralAtCrease);
  put('LI11', deep, radialFrom(deep, wristCentre, elbowCentre).add(v(-0.2, 0, 0)), 'midpoint(LU5 = lateral biceps tendon at crease, lateral epicondyle)');
  rules.LU5 = round(lu5);
}
// LI6–LI10 — on the LI5–LI11 skin line, wrist crease → cubital crease = 12 B-cun.
{
  const a = v(...points.LI5.seed), b = v(...points.LI11.seed);
  for (const [n, cun] of [[6, 3], [7, 5], [8, 8], [9, 9], [10, 10]]) {
    const t = cun / 12, deep = a.clone().lerp(b, t);
    const outward = v(...points.LI5.outward).lerp(v(...points.LI11.outward), t).normalize();
    put(`LI${n}`, deep, perp(outward, forearmAxis), `LI5→LI11 line ${cun}/12 B-cun`);
  }
}
// LI12 — superior to lateral epicondyle, anterior to lateral supraepicondylar ridge (~1 B-cun above LI11).
{
  // Anchored on the lateral epicondyle: KCMRIC "곡지 위로 1촌" along the supraepicondylar ridge.
  const y = creaseY + armCun;
  const ridge = most(atHeight(humerus, y, 0.003), LATERAL);
  const deep = ridge.clone().add(v(0, 0, 0.003));
  put('LI12', deep, perp(v(-1, 0, -0.1), forearmAxis), `lateral epicondyle → supraepicondylar ridge, LI11 + 1 B-cun, 3 mm anterior`);
}
// LI15 — depression between anterior end of lateral acromion border and greater tubercle.
// Restrict to the acromion (lateral + highest scapula); a looser box catches the coracoid.
// Anterior end of the LATERAL acromion border (not the medial/anterior acromion tip).
const acromionAnterolateral = extremeCluster(scapula, ANTERIOR, 0.02, (p) => p.x < -0.16 && p.y > scapula.box.max.y - 0.025);
const greaterTubercle = extremeCluster(humerus, v(-1, 0.3, 0.3), 0.01, (p) => p.y > humerus.box.max.y - 0.04);
{
  // Anterior depression just below the acromion, above the humeral head (arm-abducted 견우 hollow).
  // Reviewer photo (2026-09-15): the ANTERIOR hollow under the acromion front (견료 is the posterior one).
  const tubercleFront = extremeCluster(humerus, v(-0.5, 0.3, 1), 0.01, (p) => p.y > humerus.box.max.y - 0.04);
  const deep = mid(acromionAnterolateral, tubercleFront).add(v(0, 0.003, 0));
  put('LI15', deep, v(-0.6, 0.25, 0.8), 'anterior hollow: anterior end of lateral acromion border ↔ front of greater tubercle');
}
// LI13 / LI14 — upper arm, on LI11–LI15 line; 9 B-cun axillary fold → crease.
{
  const a = v(...points.LI11.seed), b = v(...points.LI15.seed);
  const onLineAt = (y) => a.clone().lerp(b, (y - a.y) / (b.y - a.y));
  const armAxisTop = humeralHead;
  const y13 = creaseY + 3 * armCun;
  put('LI13', onLineAt(y13), radialFrom(onLineAt(y13), elbowCentre, armAxisTop), 'LI11→LI15 line at crease + 3 B-cun');
  // Deltoid insertion (lowest fibres of the clavicular/acromial parts), just anterior to its border.
  // Reviewer photo (2026-09-15): the V apex where the deltoid converges onto its tendon, not the
  // biceps in front of it. Apex = mean of the lowest acromial and clavicular fibres.
  const apex = mid(...['Clavicular part of right deltoid', 'Acromial part of right deltoid']
    .map((n) => extremeCluster(mesh(atlas, n), v(0, -1, 0), 0.02)));
  const deep = apex.clone().add(v(0, 0.002, 0));
  put('LI14', deep, radialFrom(deep, elbowCentre, armAxisTop), `deltoid V apex (insertion) · crease+${((deep.y - creaseY) / armCun).toFixed(1)} B-cun`);
}
// LI16 — depression between acromial end of clavicle and spine of scapula.
{
  const clavEnd = extremeCluster(clavicle, LATERAL, 0.01);
  // Keep at the acromial end itself: the V between clavicle end and spine sits beside the acromion.
  const x = clavEnd.x + 0.004;
  const clavBack = most(slab(clavicle, 0, x, 0.004), v(0, 0.3, -1));
  const spine = most(slab(scapula, 0, x, 0.004, (p) => p.z < clavBack.z - 0.004 && p.y > clavBack.y - 0.03), v(0, 1, 0.3));
  put('LI16', mid(clavBack, spine), v(0, 1, -0.15), 'midpoint(posterior acromial end of clavicle, superior spine of scapula)');
}
// LI17 / LI18 — neck, relative to SCM borders.
{
  const scm = mesh(atlas, 'Right sternocleidomastoid');
  const neckCentre = (y) => v(0, y, -0.005);
  const cricoidY = centroid(mesh(atlas, 'Cricoid cartilage')).y;
  const at17 = atHeight(scm, cricoidY, 0.003, (p) => p.x < -0.01);
  const posterior = most(at17, v(-0.4, 0, -1));
  const deep17 = posterior.clone().add(v(-0.002, 0, -0.005));
  put('LI17', deep17, perp(deep17.clone().sub(neckCentre(cricoidY)), UP), 'cricoid level · just posterior to SCM posterior border');
  const thyroidTop = mesh(atlas, 'Thyroid cartilage').box.max.y;
  const at18 = atHeight(scm, thyroidTop, 0.003, (p) => p.x < -0.01);
  const deep18 = mid(most(at18, v(-0.2, 0, 1)), most(at18, v(-0.4, 0, -1)));
  put('LI18', deep18, perp(deep18.clone().sub(neckCentre(thyroidTop)), UP), 'superior thyroid cartilage level · midway between SCM borders');
  rules.levels = { cricoidY: +cricoidY.toFixed(4), thyroidTop: +thyroidTop.toFixed(4) };
}
// LI19 / LI20 — face.
{
  const alar = mesh(atlas, 'Right major alar cartilage'), lip = mesh(atlas, 'Lip');
  const alarLateral = extremeCluster(alar, LATERAL, 0.02);
  const subnasale = alar.box.min.y, vermilion = lip.box.max.y;
  const philtrumMid = (subnasale + vermilion) / 2;
  // LI19: level of the philtrum midpoint, directly inferior to the lateral nostril margin.
  const nostrilX = most(slab(alar, 1, alar.box.min.y + 0.002, 0.002), LATERAL).x;
  // Seed just under the upper-lip surface so the ray does not slide medially off the nose tip.
  put('LI19', v(nostrilX, philtrumMid, lip.box.max.z - 0.004), v(-0.1, 0, 1), 'level of philtrum midpoint · below lateral nostril margin');
  // LI20: nasolabial sulcus at the level of the midpoint of the lateral alar border.
  const alaMidY = (alar.box.min.y + alarLateral.y) / 2 + 0.002;
  put('LI20', v(alarLateral.x - 0.006, alaMidY, alarLateral.z), v(-0.45, 0, 1), 'nasolabial sulcus at midpoint of lateral alar border');
  rules.face = { subnasale: +subnasale.toFixed(4), vermilion: +vermilion.toFixed(4), philtrumMid: +philtrumMid.toFixed(4), alarLateral: round(alarLateral), nostrilX: +nostrilX.toFixed(4) };
}

const ordered = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`LI${i + 1}`, { ...points[`LI${i + 1}`], rule: rules[`LI${i + 1}`] }]));
const output = {
  generatedBy: 'scripts/li-landmarks.mjs',
  side: 'right (viewer mirrors x for left)',
  primarySource: 'https://m.kmcric.com/knowledge/acupoint/LI',
  secondarySource: 'https://iris.who.int/handle/10665/353407',
  scale: { creaseY: +creaseY.toFixed(4), axillaryFoldY: +foldY.toFixed(4), armCunMm: +(armCun * 1000).toFixed(1), forearmCunMm: +(forearmCun * 1000).toFixed(1) },
  reference: { lateralEpicondyle: round(lateralEpicondyle), radialStyloid: round(radialStyloid), acromionAnterolateral: round(acromionAnterolateral), greaterTubercle: round(greaterTubercle), LU5: rules.LU5, ...rules.levels, face: rules.face },
  points: ordered,
};
if (!process.argv.includes('--dry')) fs.writeFileSync(new URL('../data/li-landmarks.json', import.meta.url), JSON.stringify(output, null, 1) + '\n');
console.log(JSON.stringify(output.scale), JSON.stringify(output.reference));
for (const [code, p] of Object.entries(ordered)) console.log(code.padEnd(5), p.seed.join(', ').padEnd(30), 'depth', String(p.depthMm).padStart(5), 'mm ·', p.rule);
