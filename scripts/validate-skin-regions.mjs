/** Check that the skin region labels are usable for constrained projection.
 *
 * The motivating case is the lateral chest. With the arms down, a lateral ray toward the
 * mid-axillary line meets the upper arm before the chest wall, which is how GB21 and GB22
 * came to sit on the deltoid and the biceps. The labels are only worth having if a
 * projection restricted to the thorax reaches the chest wall instead.
 *
 * Usage: node scripts/validate-skin-regions.mjs
 */
import fs from 'node:fs';
import * as T from 'three';
import { loadAtlas, mesh } from './atlas-geometry.mjs';

const data = JSON.parse(fs.readFileSync(new URL('../data/skin-regions.json', import.meta.url), 'utf8'));
const atlas = loadAtlas();
const skin = mesh(atlas, 'Skin');
const failures = [], warnings = [];
const fail = (m) => failures.push(m);
const warn = (m) => warnings.push(m);
const mm = (n) => `${(n * 1000).toFixed(1)} mm`;

const regionOf = Buffer.from(data.regionOfTriangle, 'base64');
const aspectOf = Buffer.from(data.aspectOfTriangle, 'base64');
const triangles = skin.indexCount / 3;

if (regionOf.length !== triangles) fail(`region array covers ${regionOf.length} triangles but the skin mesh has ${triangles}`);
if (aspectOf.length !== triangles) fail(`aspect array covers ${aspectOf.length} triangles but the skin mesh has ${triangles}`);
for (let t = 0; t < Math.min(regionOf.length, triangles); t++) {
  if (regionOf[t] >= data.regions.length) { fail(`triangle ${t} has region id ${regionOf[t]} outside the legend`); break; }
  if (aspectOf[t] >= data.aspects.length) { fail(`triangle ${t} has aspect id ${aspectOf[t]} outside the legend`); break; }
}
if (data.resolvedByProximity / triangles > 0.05) {
  fail(`${((data.resolvedByProximity / triangles) * 100).toFixed(1)}% of triangles fell back to nearest-bone, over the 5% ceiling`);
}

const centre = (t) => {
  const out = new T.Vector3();
  for (let k = 0; k < 3; k++) {
    const i = skin.indices[t * 3 + k];
    out.x += skin.positions[i * 3]; out.y += skin.positions[i * 3 + 1]; out.z += skin.positions[i * 3 + 2];
  }
  return out.multiplyScalar(1 / 3);
};
const label = (t) => data.regions[regionOf[t]].label;
const centres = [];
for (let t = 0; t < triangles; t++) centres.push(centre(t));

// 1. Regions must occupy the height band their bones do.
const heights = new Map();
for (let t = 0; t < triangles; t++) {
  const key = data.regions[regionOf[t]].region;
  const list = heights.get(key) ?? [];
  list.push(centres[t].y);
  heights.set(key, list);
}
// Compared against the anchors the generator actually used, not a hand-picked bone.
// A handful of stray triangles is expected where regions meet, so the test is on the
// share that strays rather than on the single furthest one.
if (!data.boneSpan) fail('output carries no boneSpan record; regenerate with the current script');
const MARGIN = 0.09, TOLERATED = 0.02;
for (const [region, list] of heights) {
  const bones = data.boneSpan?.[region];
  if (!bones) { fail(`no bone span recorded for region ${region}`); continue; }
  const strays = list.filter((y) => y < bones[0] - MARGIN || y > bones[1] + MARGIN);
  const share = strays.length / list.length;
  if (share > TOLERATED) {
    const low = Math.min(...list), high = Math.max(...list);
    fail(`${region}: ${strays.length}/${list.length} triangles (${(share * 100).toFixed(1)}%) sit outside its anchors' ${mm(bones[0])}..${mm(bones[1])} band; skin spans ${mm(low)}..${mm(high)}`);
  } else if (strays.length) {
    warn(`${region}: ${strays.length}/${list.length} triangles (${(share * 100).toFixed(1)}%) outside the anchor band`);
  }
}
for (const region of Object.keys(data.boneSpan ?? {})) {
  if (!heights.has(region)) warn(`region ${region} has anchors but no skin triangle was labelled with it`);
}

// 2. The lateral chest test. At the height of the fourth intercostal space, a lateral ray
//    must meet arm skin first and chest skin behind it, and the two must carry different labels.
const rib4 = mesh(atlas, 'Right fourth rib'), rib5 = mesh(atlas, 'Right fifth rib');
const spaceY = (rib4.box.min.y + rib5.box.max.y) / 2;
const band = [];
for (let t = 0; t < triangles; t++) {
  const c = centres[t];
  if (c.x > 0 || Math.abs(c.y - spaceY) > 0.012) continue;
  band.push({ x: c.x, z: c.z, region: label(t) });
}
const chest = band.filter((entry) => entry.region.startsWith('thorax'));
const arm = band.filter((entry) => entry.region.startsWith('upper-arm') || entry.region.startsWith('shoulder'));
if (!band.length) fail('no skin triangles found at the height of the fourth intercostal space');
else if (!chest.length) fail('no thorax skin anywhere at the fourth intercostal space; the labelling is unusable there');
else {
  const lateral = (list) => Math.min(...list.map((e) => e.x));
  console.log(`fourth intercostal space: ${chest.length} thorax patches reaching x=${lateral(chest).toFixed(3)}, ${arm.length} arm patches reaching x=${arm.length ? lateral(arm).toFixed(3) : 'n/a'}`);
  // How much of the mid-axillary line is actually exposed decides whether GB22 and GB23
  // can be projected at all in this standing, arms-down pose.
  const axillary = chest.filter((entry) => Math.abs(entry.z) < 0.03);
  if (!axillary.length) {
    warn('no chest wall skin within 30 mm of the mid-axillary line at the fourth intercostal space: the arm occludes it completely in this pose, so a rule for GB22 or GB23 has to project onto the nearest exposed chest wall and record the offset');
  } else if (axillary.length < 5) {
    warn(`only ${axillary.length} chest wall patches near the mid-axillary line at the fourth intercostal space; the target is sparse`);
  }
  if (arm.length && lateral(arm) >= lateral(chest)) fail('arm skin does not reach further out than chest skin; the labels do not separate the two');
}

// 3. The shoulder above the acromion must not be labelled as arm, or GB21 lands on the deltoid again.
const scapula = mesh(atlas, 'Right scapula');
const acromionY = scapula.box.max.y;
const shoulderTop = [];
for (let t = 0; t < triangles; t++) {
  const c = centres[t];
  if (c.x > 0 || c.y < acromionY || c.y > acromionY + 0.04 || c.x < scapula.box.min.x - 0.02 || c.x > -0.03) continue;
  shoulderTop.push(label(t));
}
if (!shoulderTop.length) warn('no skin sampled above the acromion');
else {
  const arm = shoulderTop.filter((l) => l.startsWith('upper-arm')).length;
  if (arm / shoulderTop.length > 0.25) fail(`${arm}/${shoulderTop.length} skin patches above the acromion are labelled upper-arm`);
  else console.log(`shoulder top test: ${shoulderTop.length} patches above the acromion, ${arm} labelled upper-arm`);
}

const counts = new Map();
for (let t = 0; t < triangles; t++) counts.set(label(t), (counts.get(label(t)) ?? 0) + 1);
console.log(`${triangles} triangles across ${data.regions.length} regions; ${data.resolvedByRay} resolved by inward ray, ${data.resolvedByProximity} by proximity`);
for (const message of warnings) console.log(`  warning  ${message}`);
if (failures.length) {
  for (const message of failures) console.error(`  FAIL     ${message}`);
  console.error(`\n${failures.length} skin region checks failed`);
  process.exit(1);
}
console.log(`\nall skin region checks passed (${warnings.length} warnings)`);
