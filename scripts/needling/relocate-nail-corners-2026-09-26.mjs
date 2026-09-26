/** Jing-well points onto one nail-root-corner rule (reviewer, 2026-09-26: LU11 and the other digit tips read twisted).
 *
 * Each generator placed its corner with its own frame, and several frames were wrong: LU11 took "radial" as
 * "away from the index finger", which on the rotated thumb points out of the nail, so the corner turned onto the
 * dorsum; HT9/ST45/GB44 sat on the middle of the nail, TE1/SI1 on the middle phalanx, BL67 near the tip.
 * One rule now, per digit, from bones only (BodyParts3D models no nails):
 *   axis    middle (or proximal) phalanx centre → distal phalanx centre
 *   dorsal  fingers 2–5: the hand's dorsal normal (metacarpal row, sign toward extensor digitorum) ⊥ axis
 *           thumb: extensor pollicis longus − flexor pollicis longus at the distal phalanx base ⊥ axis
 *           toes: +Y ⊥ axis (the foot is planted, as the nail presentation assumes)
 *   side    fingers/toes: toward or away from the neighbouring distal phalanx, ⊥ dorsal
 *           thumb: abductor pollicis brevis − adductor pollicis (radial = the abductor side), ⊥ dorsal
 *   level   TIP_SHARE of the bone's length back from the SKIN tip (nail + free edge + 0.1 F-cun proximal). This
 *           atlas's skin runs 8–12 mm past the finger bones, so a level taken from the bone read as the DIP crease.
 *   point   fingers: the skin sleeve's centre at that level; toes (one skin sleeve for the lesser toes): the bone's
 *           edge on the named side. Projected to skin along dorsal·cos(CORNER) + side·sin(CORNER), just off the
 *           nail's corner on the named side.
 * PC9 is the centre of the middle finger's tip: the mean of the skin within 3 mm of the skin tip, projected along
 * the axis. KI1 (sole) is not a digit point and is left alone. Edits data/meridians/*.json,
 * data/li-landmarks.json and the GB44 landmark in data/landmarks.json in place.
 *
 *   node scripts/needling/relocate-nail-corners-2026-09-26.mjs          apply, print before → after
 *   node scripts/needling/relocate-nail-corners-2026-09-26.mjs --dry    print only
 */
import fs from 'node:fs';
import { atlas, mesh, centroid, v, perp, toSkin, round } from '../acupoint-kit.mjs';

const TIP_SHARE = 0.88, CORNER = (55 * Math.PI) / 180, FINGER_EDGE = (70 * Math.PI) / 180;
const dry = process.argv.includes('--dry');
const REPO = new URL('../../', import.meta.url);
const verts = (name) => { const p = mesh(atlas, name).positions, out = []; for (let i = 0; i < p.length; i += 3) out.push(v(p[i], p[i + 1], p[i + 2])); return out; };
const nearMean = (name, to, k = 30) => verts(name).sort((a, b) => a.distanceTo(to) - b.distanceTo(to)).slice(0, k).reduce((s, q) => s.add(q), v(0, 0, 0)).multiplyScalar(1 / k);
const C = (name) => centroid(mesh(atlas, name));
const DP = (digit) => `Distal phalanx of right ${digit}`;
const SKIN = verts('Skin'), SKIN_INDEX = mesh(atlas, 'Skin').indices;
/** The skin loop around this digit where the plane ⊥ its axis at `t` cuts the skin: triangle edges crossing the
 * plane, chained through shared edges into loops. Only a loop that goes all the way round the axis counts (a
 * neighbouring finger's loop does not), and of those the widest, the outer skin surface. */
const section = (f, t, sleeve) => {
  const at = (q) => q.clone().sub(f.c).dot(f.axis) - t, point = new Map(), parent = new Map();
  const find = (k) => { while (parent.get(k) !== k) k = parent.get(k); return k; };
  for (let i = 0; i < SKIN_INDEX.length; i += 3) {
    const keys = [];
    for (const [x, y] of [[0, 1], [1, 2], [2, 0]]) {
      const ia = SKIN_INDEX[i + x], ib = SKIN_INDEX[i + y], dp = at(SKIN[ia]), dq = at(SKIN[ib]);
      if (dp * dq >= 0) continue;
      const key = ia < ib ? ia + ':' + ib : ib + ':' + ia;
      if (!point.has(key)) { const hit = SKIN[ia].clone().lerp(SKIN[ib], dp / (dp - dq)); if (hit.distanceTo(f.c) > 0.04) continue; point.set(key, hit); parent.set(key, key); }
      keys.push(key);
    }
    if (keys.length === 2) parent.set(find(keys[0]), find(keys[1]));
  }
  const loops = new Map();
  for (const key of point.keys()) { const root = find(key); if (!loops.has(root)) loops.set(root, []); loops.get(root).push(point.get(key)); }
  const u = f.dorsal, w = f.axis.clone().cross(f.dorsal);
  let best = [], bestRadius = 0;
  for (const loop of loops.values()) {
    const rel = loop.map((q) => q.clone().sub(f.c).addScaledVector(f.axis, -q.clone().sub(f.c).dot(f.axis)));
    const angles = rel.map((q) => Math.atan2(q.dot(w), q.dot(u))).sort((x, y) => x - y);
    const gap = Math.max(...angles.map((x, i) => (i ? x - angles[i - 1] : x + 2 * Math.PI - angles[angles.length - 1])));
    const radius = rel.reduce((sum, q) => sum + q.length(), 0) / rel.length;
    if (gap < Math.PI / 2 && radius < sleeve && radius > bestRadius) { best = loop; bestRadius = radius; }
  }
  return best;
};

// Hand dorsal normal: across the metacarpal row × along the middle ray, signed toward the extensor tendons.
const mc3 = C('Right third metacarpal bone');
let handDorsal = C('Right fifth metacarpal bone').sub(C('Right second metacarpal bone')).cross(C('Proximal phalanx of right middle finger').sub(mc3)).normalize();
if (handDorsal.dot(nearMean('Right extensor digitorum', mc3).sub(nearMean('Right flexor digitorum superficialis', mc3))) < 0) handDorsal.negate();

const PROX = { thumb: 'Proximal phalanx of right thumb', 'big toe': 'Proximal phalanx of right big toe' };
const frame = (digit) => {
  const c = C(DP(digit)), axis = c.clone().sub(C(PROX[digit] ?? `Middle phalanx of right ${digit}`)).normalize();
  const t = verts(DP(digit)).map((q) => q.clone().sub(c).dot(axis)), base = Math.min(...t), tip = Math.max(...t);
  let dorsal;
  if (digit === 'thumb') { const b = c.clone().addScaledVector(axis, base); dorsal = perp(nearMean('Right extensor pollicis longus', b).sub(nearMean('Right flexor pollicis longus', b)), axis); }
  else if (/toe/.test(digit)) dorsal = perp(v(0, 1, 0), axis);
  else dorsal = perp(handDorsal, axis);
  return { c, axis, base, tip, dorsal };
};
const sideOf = (f, spec) => {
  const toward = spec.digit === 'thumb'
    ? C('Right abductor pollicis brevis').sub(C('Transverse head of right adductor pollicis'))
    : C(DP(spec.ref)).sub(f.c).multiplyScalar(spec.toward ? 1 : -1);
  return perp(perp(toward, f.axis), f.dorsal);
};

const SPECS = [
  { code: 'LU11', file: 'LU', digit: 'thumb', side: 'radial', region: 'hand-R' },
  { code: 'LI1', file: 'LI', digit: 'index finger', ref: 'middle finger', toward: false, side: 'radial', region: 'hand-R' },
  { code: 'PC9', file: 'PC', digit: 'middle finger', ref: 'index finger', toward: true, tip: true, region: 'hand-R' },
  { code: 'TE1', file: 'TE', digit: 'ring finger', ref: 'little finger', toward: true, side: 'ulnar', region: 'hand-R' },
  { code: 'HT9', file: 'HT', digit: 'little finger', ref: 'ring finger', toward: true, side: 'radial', region: 'hand-R' },
  { code: 'SI1', file: 'SI', digit: 'little finger', ref: 'ring finger', toward: false, side: 'ulnar', region: 'hand-R' },
  { code: 'SP1', file: 'SP', digit: 'big toe', ref: 'second toe', toward: false, side: 'medial', region: 'foot-R' },
  { code: 'LR1', file: 'LR', digit: 'big toe', ref: 'second toe', toward: true, side: 'lateral', region: 'foot-R' },
  { code: 'ST45', file: 'ST', digit: 'second toe', ref: 'third toe', toward: true, side: 'lateral', region: 'foot-R' },
  { code: 'GB44', file: 'GB', digit: 'fourth toe', ref: 'little toe', toward: true, side: 'lateral', region: 'foot-R' },
  { code: 'BL67', file: 'BL', digit: 'little toe', ref: 'fourth toe', toward: false, side: 'lateral', region: 'foot-R' },
];

const read = (path) => JSON.parse(fs.readFileSync(new URL(path, REPO), 'utf8'));
const write = (path, data, indent) => {
  const url = new URL(path, REPO), old = fs.readFileSync(url, 'utf8'), eol = old.includes('\r\n') ? '\r\n' : '\n';
  fs.writeFileSync(url, JSON.stringify(data, null, indent).replace(/\n/g, eol) + (old.endsWith('\n') ? eol : ''));
};
const indentOf = (path) => (fs.readFileSync(new URL(path, REPO), 'utf8').match(/\n( +)"/)?.[1].length ?? 1);
const files = {};
const load = (path) => (files[path] ??= { data: read(path), indent: indentOf(path) });

for (const spec of SPECS) {
  const f = frame(spec.digit), side = sideOf(f, spec);
  const len = f.tip - f.base, toe = /toe/.test(spec.digit), sleeve = toe ? 0.007 : spec.digit === 'thumb' ? 0.014 : 0.01;
  const around = (q) => { const d = q.clone().sub(f.c), t = d.dot(f.axis); return { t, r: d.addScaledVector(f.axis, -t).length() }; };
  const skinTip = Math.max(...SKIN.map(around).filter(({ t, r }) => t > f.tip - 0.005 && r < sleeve).map(({ t }) => t));
  const rootT = Math.min(Math.max(skinTip - TIP_SHARE * len, f.base + 0.2 * len), f.base + 0.9 * len);
  const level = (q) => q.clone().addScaledVector(f.axis, rootT - q.clone().sub(f.c).dot(f.axis));
  const mean = (list) => level(list.reduce((s, q) => s.add(q), v(0, 0, 0)).multiplyScalar(1 / list.length));
  // Fingers: the skin's own cross-section at that level and its outermost point FINGER_EDGE from the dorsum toward
  // the named side, which is the skin edge just beside the nail corner whatever the bone's offset inside this skin.
  // Toes share one skin sleeve, so they start from the bone's edge and tilt toward the dorsum on a webbed edge.
  let angle, outward, hit, ring = [];
  if (spec.tip) {
    ring = SKIN.filter((q) => { const a = around(q); return a.t > skinTip - 0.003 && a.r < sleeve; });
    angle = 0; outward = f.axis.clone();
    hit = toSkin(ring.reduce((s, q) => s.add(q), v(0, 0, 0)).multiplyScalar(1 / ring.length).addScaledVector(outward, -0.004), outward, [spec.region]);
  } else if (!toe) {
    ring = section(f, rootT, sleeve);
    angle = FINGER_EDGE;
    outward = f.dorsal.clone().multiplyScalar(Math.cos(angle)).addScaledVector(side, Math.sin(angle)).normalize();
    const edgePoint = ring.reduce((best, q) => (q.dot(outward) > best.dot(outward) ? q : best));
    hit = toSkin(edgePoint.addScaledVector(outward, -0.003), outward, [spec.region]);
  } else {
    const slice = verts(DP(spec.digit)).filter((q) => Math.abs(q.clone().sub(f.c).dot(f.axis) - rootT) < 0.15 * len), centre = mean(slice);
    const deep = centre.addScaledVector(side, 0.8 * Math.max(...slice.map((q) => q.clone().sub(centre).dot(side))));
    for (angle = CORNER; ; angle -= (10 * Math.PI) / 180) {
      outward = f.dorsal.clone().multiplyScalar(Math.cos(angle)).addScaledVector(side, Math.sin(angle)).normalize();
      hit = toSkin(deep, outward, [spec.region]);
      if (hit.depthMm < 9 || angle < (20 * Math.PI) / 180) break;
    }
  }
  const deg = Math.round((angle * 180) / Math.PI);
  const rule = spec.tip ? 'centre of the middle-finger tip on the skin (the skin runs past the bone here; WHO standard, radial nail-root corner alternative noted)' : `${spec.digit} distal phalanx · ${spec.side} nail-root corner + 0.1 F-cun proximal (${TIP_SHARE} × bone length back from the skin tip, ${toe ? 'bone edge projected' : 'skin cross-section edge'} ${deg}° from the dorsum toward the ${spec.side} side)`;
  let row, before;
  if (spec.file === 'LI') { row = load('data/li-landmarks.json').data.points.LI1; }
  else if (spec.file === 'GB') { row = load('data/landmarks.json').data.landmarks.find((l) => l.id === 'toenail_root_corner_4_lateral' && l.side === 'right'); }
  else { row = load(`data/meridians/${spec.file}.json`).data.points.find((p) => p.code === spec.code); }
  before = row.seed ?? row.point;
  const moved = hit.point.distanceTo(v(...before)) * 1000;
  console.log(`${spec.code.padEnd(5)} ${deg}° level ${((rootT - f.base) / len).toFixed(2)} skinTip+${((skinTip - f.tip) * 1000).toFixed(1)}mm section ${ring.length} moved ${moved.toFixed(1).padStart(5)} mm · skin depth ${hit.depthMm} mm · ${before.join(',')} → ${round(hit.point).join(',')}`);
  if (spec.file === 'GB') { row.point = round(hit.point); row.derivation = `2026-09-26 unified jing-well rule: ${rule}`; continue; }
  row.seed = round(hit.point); row.outward = round(outward); row.depthMm = hit.depthMm; row.rule = rule;
  if ('region' in row) row.region = hit.region;
}
if (!dry) for (const [path, { data, indent }] of Object.entries(files)) write(path, data, indent);
console.log(dry ? '(dry run)' : 'written');
