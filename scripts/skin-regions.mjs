/** Label every skin triangle with the body region it covers.
 *
 * PROJECT_TO_SKIN has to be able to say "the chest wall" rather than "whatever
 * surface this ray reaches first". With the arms resting against the trunk, an
 * unconstrained lateral ray toward the mid-axillary line lands on the upper arm,
 * which is how GB21 and GB22 ended up on the deltoid and the biceps.
 *
 * A triangle is labelled by the first skeletal structure its inward normal meets,
 * so the label follows the surface's own topology instead of raw proximity. Skin
 * with no bone beneath it inside the search range falls back to the nearest bone.
 *
 * Usage: node scripts/skin-regions.mjs
 * Output: data/skin-regions.json
 */
import fs from 'node:fs';
import * as T from 'three';
import { loadAtlas, mesh, threeMesh, boxWithinRange } from './atlas-geometry.mjs';

const REGION_RULES = [
  [/gingiva|tooth|maxilla|mandible|vomer|palatine bone|nasal bone|zygomatic bone|alar cartilage|ethmoid/i, 'face', 'head'],
  [/frontal bone|parietal bone|temporal bone|occipital bone|sphenoid bone/i, 'head', 'head'],
  [/atlas|axis|cervical vertebra|hyoid|thyroid cartilage|cricoid cartilage|arytenoid cartilage|corniculate cartilage|cuneiform cartilage/i, 'neck', 'trunk'],
  [/thoracic vertebra|rib$|costal cartilage|sternum|manubrium|xiphoid/i, 'thorax', 'trunk'],
  [/lumbar vertebra/i, 'lumbar', 'trunk'],
  [/^intervertebral disk$/i, 'lumbar', 'trunk'],
  [/sacrum|hip bone/i, 'pelvis', 'trunk'],
  [/clavicle|scapula|subscapularis|levator scapulae/i, 'shoulder', 'trunk'],
  [/humerus/i, 'upper-arm', 'upper-limb'],
  [/radius|ulna/i, 'forearm', 'upper-limb'],
  [/scaphoid|lunate|triquetral|pisiform|trapezium|trapezoid|capitate|hamate|metacarpal|phalanx of (right|left) (thumb|index|middle|ring|little)( finger)?$/i, 'hand', 'upper-limb'],
  [/iliotibial tract|femur/i, 'thigh', 'lower-limb'],
  [/patella/i, 'knee', 'lower-limb'],
  [/tibia|fibula|tibialis|fibularis/i, 'leg', 'lower-limb'],
  [/talus|calcaneus|navicular bone|cuboid bone|cuneiform bone|sesamoid bone|metatarsal|toe$/i, 'foot', 'lower-limb'],
];

const classify = (name) => {
  for (const [pattern, region, group] of REGION_RULES) if (pattern.test(name)) return { region, group };
  return null;
};

const atlas = loadAtlas();
const anchors = [];
for (const part of atlas.parts) {
  if (part.system !== 'skeletal') continue;
  const label = classify(part.name);
  if (!label) continue;
  const side = /^right /i.test(part.name) || / of right /i.test(part.name) ? 'right'
    : /^left /i.test(part.name) || / of left /i.test(part.name) ? 'left' : null;
  anchors.push({ part, ...label, side, object: threeMesh(part) });
}
const unmatched = atlas.parts.filter((p) => p.system === 'skeletal' && !classify(p.name));
if (unmatched.length) console.error(`unclassified skeletal meshes: ${[...new Set(unmatched.map((p) => p.name))].join(', ')}`);

// Downsampled bone cloud for the fallback, bucketed into a uniform grid.
const CELL = 0.02;
const grid = new Map();
const key = (x, y, z) => `${Math.floor(x / CELL)},${Math.floor(y / CELL)},${Math.floor(z / CELL)}`;
anchors.forEach((anchor, anchorIndex) => {
  for (let i = 0; i < anchor.part.vertexCount; i += 4) {
    const x = anchor.part.positions[i * 3], y = anchor.part.positions[i * 3 + 1], z = anchor.part.positions[i * 3 + 2];
    const cell = key(x, y, z);
    let list = grid.get(cell);
    if (!list) grid.set(cell, (list = []));
    list.push([x, y, z, anchorIndex]);
  }
});
/** Nearest sampled bone vertex. Returns the anchor and the point, because the direction
 *  from bone to skin is also what tells us which way is out. */
const nearestBone = (point) => {
  const cx = Math.floor(point.x / CELL), cy = Math.floor(point.y / CELL), cz = Math.floor(point.z / CELL);
  let best = Infinity, found = -1, at = null, hitRing = -1;
  for (let ring = 1; ring <= 14; ring++) {
    for (let dx = -ring; dx <= ring; dx++) for (let dy = -ring; dy <= ring; dy++) for (let dz = -ring; dz <= ring; dz++) {
      if (hitRing >= 0 && Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz)) < ring) continue;
      const list = grid.get(`${cx + dx},${cy + dy},${cz + dz}`);
      if (!list) continue;
      for (const [x, y, z, anchorIndex] of list) {
        const distance = (x - point.x) ** 2 + (y - point.y) ** 2 + (z - point.z) ** 2;
        if (distance < best) { best = distance; found = anchorIndex; at = [x, y, z]; }
      }
    }
    // One extra ring past the first hit, so a diagonal neighbour cannot beat the winner.
    if (found >= 0) { if (hitRing >= 0) break; hitRing = ring; }
  }
  return { anchor: found, at };
};

const skin = mesh(atlas, 'Skin');
const triangles = skin.indexCount / 3;
const regionIds = [], aspectIds = [], sourceIds = [];
const regions = [], regionIndex = new Map();
const REGION_ID = (region, group, side) => {
  const label = side ? `${region}-${side === 'right' ? 'R' : 'L'}` : region;
  if (!regionIndex.has(label)) { regionIndex.set(label, regions.length); regions.push({ label, region, group, side }); }
  return regionIndex.get(label);
};
const ASPECTS = ['anterior', 'posterior', 'lateral-R', 'lateral-L', 'superior', 'inferior'];

const raycaster = new T.Raycaster();
const RANGE = 0.26;
const a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3();
const centre = new T.Vector3(), normal = new T.Vector3(), edge1 = new T.Vector3(), edge2 = new T.Vector3(), outward = new T.Vector3();
let byRay = 0, byNearest = 0;

for (let t = 0; t < triangles; t++) {
  const i0 = skin.indices[t * 3], i1 = skin.indices[t * 3 + 1], i2 = skin.indices[t * 3 + 2];
  a.fromArray(skin.positions, i0 * 3); b.fromArray(skin.positions, i1 * 3); c.fromArray(skin.positions, i2 * 3);
  centre.copy(a).add(b).add(c).multiplyScalar(1 / 3);
  edge1.subVectors(b, a); edge2.subVectors(c, a);
  normal.crossVectors(edge1, edge2);
  if (normal.lengthSq() < 1e-16) normal.set(0, 0, 1);
  normal.normalize();

  // The Skin mesh's stored normals are not consistently oriented (roughly half face
  // inward), and the viewer hides that by rendering double sided. Bone is always deep to
  // skin, so the direction from the nearest bone to this triangle is a sound "outward".
  const near = nearestBone(centre);
  outward.set(centre.x, 0, centre.z);
  if (near.at) outward.set(centre.x - near.at[0], centre.y - near.at[1], centre.z - near.at[2]);
  if (outward.lengthSq() < 1e-12) outward.set(centre.x, 0, centre.z);
  if (outward.lengthSq() < 1e-12) outward.set(0, 1, 0);
  outward.normalize();
  if (normal.dot(outward) < 0) normal.negate();

  const absolute = [Math.abs(normal.z), Math.abs(normal.x), Math.abs(normal.y)];
  const dominant = absolute.indexOf(Math.max(...absolute));
  aspectIds.push(dominant === 0 ? (normal.z >= 0 ? 0 : 1) : dominant === 1 ? (normal.x < 0 ? 2 : 3) : (normal.y >= 0 ? 4 : 5));

  let chosen = -1, nearest = Infinity;
  // Try the oriented face normal first, then aim straight at the nearest bone for skin
  // whose local normal grazes past every structure beneath it.
  for (const direction of [normal.clone().negate(), outward.clone().negate()]) {
    const origin = centre.clone().addScaledVector(direction, 0.0005);
    const ray = new T.Ray(origin, direction);
    raycaster.set(origin, direction);
    raycaster.far = RANGE;
    for (let index = 0; index < anchors.length; index++) {
      if (!boxWithinRange(anchors[index].part.box, ray, RANGE, 0.001)) continue;
      const hit = raycaster.intersectObject(anchors[index].object, false)[0];
      if (hit && hit.distance < nearest) { nearest = hit.distance; chosen = index; }
    }
    if (chosen >= 0) break;
  }
  if (chosen >= 0) byRay++;
  else { chosen = near.anchor; byNearest++; }
  if (chosen < 0) throw new Error('no skeletal anchor found for a skin triangle');
  const anchor = anchors[chosen];
  // Head and trunk stay unsided: a rib is a chest wall landmark, not a right-chest one.
  const sided = anchor.group === 'upper-limb' || anchor.group === 'lower-limb';
  const side = !sided ? null : anchor.side ?? (centre.x < 0 ? 'right' : 'left');
  regionIds.push(REGION_ID(anchor.region, anchor.group, side));
  sourceIds.push(nearest < Infinity ? 1 : 0);
}

const counts = new Map();
for (const id of regionIds) counts.set(id, (counts.get(id) ?? 0) + 1);
// Record the height band of the bones behind each region, so a validator can check the
// labelling against the anchors that produced it instead of a hand-picked bone.
const boneSpan = {};
for (const anchor of anchors) {
  const existing = boneSpan[anchor.region] ?? [Infinity, -Infinity];
  boneSpan[anchor.region] = [Math.min(existing[0], anchor.part.box.min.y), Math.max(existing[1], anchor.part.box.max.y)];
}
const output = {
  source: 'atlas.json Skin mesh',
  triangles,
  regions,
  boneSpan,
  aspects: ASPECTS,
  method: 'first skeletal structure met by the inward face normal, else nearest skeletal vertex',
  resolvedByRay: byRay,
  resolvedByProximity: byNearest,
  regionOfTriangle: Buffer.from(Uint8Array.from(regionIds)).toString('base64'),
  aspectOfTriangle: Buffer.from(Uint8Array.from(aspectIds)).toString('base64'),
  rayResolved: Buffer.from(Uint8Array.from(sourceIds)).toString('base64'),
};
fs.mkdirSync(new URL('../data/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('../data/skin-regions.json', import.meta.url), JSON.stringify(output));
console.log(`${triangles} skin triangles: ${byRay} by inward ray, ${byNearest} by proximity`);
console.log([...counts.entries()].sort((x, y) => y[1] - x[1]).map(([id, n]) => `${regions[id].label}=${n}`).join('  '));
