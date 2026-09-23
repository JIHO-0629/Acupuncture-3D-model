// Recompute the model-mm limit of each straight-needle profile in data/needling-direct.json.
//
// The cun range stays as written in the source (KCMRIC). The millimetres are this model's own proportional
// unit at the point, never a patient depth or a safety threshold. The first export took the unit from
// raycast_all.mjs, which chose a WHO segment by height alone: hand points were converted with the forearm
// B-cun, face and neck points with the sternal 9 B-cun, and every back point with an anterior-trunk segment.
// Here the unit follows the skin region under the point (data/skin-regions.json), split front/back on the
// trunk, and is measured on this body:
//
//   head, face,  forehead 3 B-cun (glabella - anterior hairline). The scalp B-cun that places the head points
//   neck, hand   (30.4 mm) is an arc along the curved scalp; as a straight depth it would put 0.2-0.3 cun through
//                the skull. WHO gives the hand no B-cun, and the finger unit (F-cun) is approximated by this
//                measure as scripts/meridians/st.mjs does
//   chest        suprasternal notch - xiphisternal junction = 9 B-cun
//   abdomen      xiphisternal junction - umbilicus = 8 B-cun above it, umbilicus - pubic symphysis = 5 below
//   back         medial ends of the two scapular spines = 6 B-cun (WHO: medial borders of the scapulae)
//   upper arm    anterior axillary fold - cubital crease = 9 B-cun (data/li-landmarks.json scale)
//   forearm      cubital crease - wrist crease = 12 B-cun (same source)
//   thigh, knee  greater trochanter - popliteal crease = 19 B-cun
//   leg          popliteal crease - lateral malleolus prominence = 16 B-cun
//   foot         medial malleolus prominence - sole = 3 B-cun
//
// usage: node scripts/needling/export_direct_profiles.mjs [--check]
import fs from 'node:fs';
import path from 'node:path';
import * as T from 'three';
import { allPoints } from './points_all.mjs';
import { loadAtlas, threeMesh, mesh } from '../atlas-geometry.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const check = process.argv.includes('--check');
const profilesPath = path.join(root, 'data/needling-direct.json');
const profiles = read('data/needling-direct.json');
const landmarks = read('data/landmarks.json').landmarks;
const lm = (id, side = 'right') => new T.Vector3(...(landmarks.find((l) => l.id === id && (l.side === side || l.side === null)).point));
const head = read('data/head-cun.json'), limb = read('data/li-landmarks.json').scale;
const regions = read('data/skin-regions.json');
const regionOfTriangle = Buffer.from(regions.regionOfTriangle, 'base64');

const UNITS = {
  face: { mm: head.forehead.cunMm, basis: '미간~전발제 3 B-cun (머리·얼굴·목·손, F-cun 근사)' },
  chest: { mm: lm('suprasternal_notch').distanceTo(lm('xiphisternal_junction')) * 1000 / 9, basis: '흉골상절흔~흉골체검상연결 9 B-cun' },
  upperAbdomen: { mm: lm('xiphisternal_junction').distanceTo(lm('umbilicus')) * 1000 / 8, basis: '흉골체검상연결~배꼽 8 B-cun' },
  lowerAbdomen: { mm: lm('umbilicus').distanceTo(lm('pubic_symphysis_superior')) * 1000 / 5, basis: '배꼽~치골결합 위모서리 5 B-cun' },
  back: { mm: lm('scapular_spine_medial_end', 'right').distanceTo(lm('scapular_spine_medial_end', 'left')) * 1000 / 6, basis: '양 견갑골 안쪽모서리 사이 6 B-cun' },
  arm: { mm: limb.armCunMm, basis: '앞겨드랑주름~팔오금주름 9 B-cun' },
  forearm: { mm: limb.forearmCunMm, basis: '팔오금주름~손목주름 12 B-cun' },
  thigh: { mm: lm('greater_trochanter').distanceTo(lm('popliteal_crease')) * 1000 / 19, basis: '넙다리뼈 큰돌기~오금주름 19 B-cun' },
  leg: { mm: lm('popliteal_crease').distanceTo(lm('lateral_malleolus_prominence')) * 1000 / 16, basis: '오금주름~가쪽복사융기 16 B-cun' },
  foot: { mm: lm('medial_malleolus_prominence').y * 1000 / 3, basis: '안쪽복사융기~발바닥 3 B-cun' },
};
UNITS.hand = { ...UNITS.face };

const umbilicusY = lm('umbilicus').y;
/** Region label + the point's position -> unit key. The trunk labels cover front and back alike. */
function unitFor(label, p) {
  const region = label.replace(/-[RL]$/, '');
  if (region === 'head' || region === 'face' || region === 'neck') return 'face';
  if (region === 'hand') return 'hand';
  if (region === 'forearm') return 'forearm';
  if (region === 'upper-arm') return 'arm';
  if (region === 'thigh' || region === 'knee') return 'thigh';
  if (region === 'leg') return 'leg';
  if (region === 'foot') return 'foot';
  if (region === 'shoulder') return p.z < -0.04 ? 'back' : 'arm';
  const posterior = p.z < -0.03, anterior = p.z > 0.02;
  if (region === 'thorax') return posterior ? 'back' : 'chest';
  if (region === 'lumbar') return posterior ? 'back' : p.y > umbilicusY ? 'upperAbdomen' : 'lowerAbdomen';
  if (region === 'pelvis') return posterior ? 'back' : anterior ? 'lowerAbdomen' : 'thigh';
  throw new Error(`no cun unit for region ${label}`);
}

// Skin projection exactly as app/scene.tsx does it, keeping the triangle so its region can be read.
const atlas = loadAtlas();
const skin = mesh(atlas, 'Skin'), skinObject = threeMesh(skin);
const others = atlas.parts.filter((p) => p.system === 'integumentary' && p !== skin).map((p) => threeMesh(p));
const raycaster = new T.Raycaster();
const HEAD_CENTRE = new T.Vector3(0, 1.59, 0);
const outwardOf = (def, seed) => def.outward ? new T.Vector3(...def.outward).normalize()
  : def.projection === 'anterior' ? new T.Vector3(0, 0, 1) : def.projection === 'posterior' ? new T.Vector3(0, 0, -1)
    : def.projection === 'dorsal-foot' ? new T.Vector3(0, 1, 0) : def.projection === 'lateral' ? new T.Vector3(-1, 0, 0)
      : seed.clone().sub(HEAD_CENTRE).normalize();
function skinRegion(def) {
  const seed = new T.Vector3(...def.seed), out = outwardOf(def, seed);
  // Direct seeds are already on the skin: read the triangle just behind them along the needle.
  const origin = def.projection === 'direct' ? seed.clone().addScaledVector(out, 0.01) : seed.clone().addScaledVector(out, 0.24);
  raycaster.set(origin, out.clone().negate()); raycaster.far = Infinity;
  let best, bestDistance = Infinity;
  for (const hit of raycaster.intersectObject(skinObject, false)) {
    const d = hit.point.distanceTo(seed);
    if (d < bestDistance) { best = hit; bestDistance = d; }
  }
  // Scalp and lips are covered by other surface meshes; their points still sit on the Skin's own regions.
  if (!best) for (const o of others) for (const hit of raycaster.intersectObject(o, false)) { const d = hit.point.distanceTo(seed); if (d < bestDistance) { best = { point: hit.point }; bestDistance = d; } }
  if (!best?.faceIndex && best?.faceIndex !== 0) return { label: seed.y > 1.6 ? 'head' : 'face', point: best?.point ?? seed };
  return { label: regions.regions[regionOfTriangle[best.faceIndex]].label, point: best.point };
}

const definitions = new Map(allPoints().map((p) => [p.code, p]));
const changes = [];
for (const [code, profile] of Object.entries(profiles)) {
  const def = definitions.get(code);
  if (!def) throw new Error(`no point definition for ${code}`);
  const { label, point } = skinRegion(def);
  const key = unitFor(label, point), unit = UNITS[key];
  const modelMaxMm = +(profile.maxCun * unit.mm).toFixed(1);
  changes.push({ code, from: profile.modelMaxMm, to: modelMaxMm, key, label });
  profile.modelMaxMm = modelMaxMm;
  profile.mmPerCun = +unit.mm.toFixed(1);
  profile.cunBasis = unit.basis;
}
console.log('units (mm per cun):', Object.entries(UNITS).map(([k, u]) => `${k} ${u.mm.toFixed(1)}`).join(', '));
const moved = changes.filter((c) => Math.abs(c.to - c.from) >= 0.5);
console.log(`${changes.length} profiles; ${moved.length} limits changed by 0.5 mm or more`);
for (const c of moved) console.log(`  ${c.code.padEnd(5)} ${String(c.from).padStart(5)} -> ${String(c.to).padStart(5)} mm  (${c.label} -> ${c.key})`);
if (!check) fs.writeFileSync(profilesPath, JSON.stringify(profiles));
