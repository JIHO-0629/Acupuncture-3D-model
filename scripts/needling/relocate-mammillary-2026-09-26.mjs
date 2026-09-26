/** Chest points onto the curved mammillary line (reviewer, 2026-09-26; photo archive ST12/ST14/ST16/LR14/GB24).
 *
 * The 4 B-cun chest line used to be a straight vertical at the clavicle midpoint, which left ST17 about 15 mm
 * medial of the nipple, and the nipple itself sat about 5 mm too lateral. scripts/trunk-arc.mjs now defines the
 * mammillary line (clavicle midpoint → curving out → nipple at 1.18 × that x → straight down) and the chest B-cun
 * that makes it 4 B-cun at every height. This script moves only the points defined on that scale, keeping each
 * point's reviewed height and then re-centring it in its intercostal space the way the 2026-09-25 review did,
 * because the ribs climb as the line moves out. The meridian generators are not idempotent against the reviewed
 * JSON (see relocate-review-2026-09-25.mjs), so this edits data/meridians/*.json in place.
 *
 *   node scripts/needling/relocate-mammillary-2026-09-26.mjs          apply, print before → after
 *   node scripts/needling/relocate-mammillary-2026-09-26.mjs --gb     also print the GB24 seed for app/gb-points.ts
 */
import fs from 'node:fs';
import { V, projectToSkin, smoothSkinNormal, rayLayers, REPO } from './path-geometry.mjs';
import { chestLateralOnSkin, intercostalOnChestLine, ringNormal, nippleSurface, nippleX, nippleY, mammillaryX, clavicleMidX, trunkRing, pts, lowest } from '../trunk-arc.mjs';
import { atlas, mesh } from '../acupoint-kit.mjs';

const ORD = ['zero', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'];
const ribNumber = (name) => { const m = name.match(/(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth) (rib|costal cartilage)/i); return m ? ORD.indexOf(m[1].toLowerCase()) : null; };
/** Same test as relocate-review-2026-09-25.mjs: the offset (mm) that centres the viewer's needle ray in intercostal space N. */
function intercostalOffset(seed, outward, N) {
  const rows = [];
  for (let dy = -35; dy <= 35; dy++) {
    const hit = projectToSkin(V(seed[0], seed[1] + dy / 1000, seed[2]), outward), dir = smoothSkinNormal(hit.point, hit.face, 15, outward).negate();
    const layers = rayLayers(hit.point.clone().addScaledVector(dir, 0.00015), dir, 70), bone = layers.find((l) => l.system === 'skeletal'), pleura = layers.find((l) => /Pleura|lung/i.test(l.name));
    rows.push(bone && (!pleura || bone.a < pleura.a) ? ribNumber(bone.name) ?? -1 : 0);
  }
  const label = rows.map((v, i) => (v > 0 && (rows[i - 1] === v || rows[i + 1] === v) ? v : v > 0 ? -2 : v)), runs = [];
  for (let i = 0; i < label.length; i++) {
    if (label[i] > 0) continue; let j = i; while (j + 1 < label.length && label[j + 1] <= 0) j++;
    let below = i - 1; while (below >= 0 && label[below] <= 0) below--; let above = j + 1; while (above < label.length && label[above] <= 0) above++;
    const clear = []; for (let k = i; k <= j; k++) if (label[k] === 0) clear.push(k - 35);
    if (clear.length) runs.push({ lo: i - 35, hi: j - 35, below: below >= 0 ? label[below] : null, above: above < label.length ? label[above] : null, clear }); i = j;
  }
  const valid = runs.filter((r) => r.above === N && r.below === N + 1);
  if (!valid.length) throw new Error(`no intercostal space ${N} near ${seed}`);
  const run = valid.find((r) => r.lo <= 0 && r.hi >= 0) ?? valid.sort((x, y) => Math.min(Math.abs(x.lo), Math.abs(x.hi)) - Math.min(Math.abs(y.lo), Math.abs(y.hi)))[0];
  return run.clear[Math.floor(run.clear.length / 2)];
}
const round = (v) => +v.toFixed(5);
/** Lower edge of the clavicle over ST13's column (x of the ST13 seed, measured on the bone). */
/** Lower edge of the clavicle on the mammillary line's clavicular start (clavicle midpoint x), measured on the bone. */
const CLAVICLE_LOW = lowest(pts(mesh(atlas, 'Right clavicle'), (p) => Math.abs(p.x - clavicleMidX) < 0.004)).y;
/** Whether the viewer's needle ray from this placement meets a rib before the pleura. */
const onRib = ({ seed, normal }) => {
  const hit = projectToSkin(V(...seed.toArray()), normal), dir = smoothSkinNormal(hit.point, hit.face, 15, normal).negate();
  const layers = rayLayers(hit.point.clone().addScaledVector(dir, 0.00015), dir, 70), bone = layers.find((l) => l.system === 'skeletal'), pleura = layers.find((l) => /Pleura|lung/i.test(l.name));
  return !!bone && (!pleura || bone.a < pleura.a) && ribNumber(bone.name) != null;
};
// SP17–SP20 are the midpoint of the nipple line and the midaxillary line. The midaxillary line is SP21's x (the
// generator puts SP21 on it); the earlier 8-B-cun stand-in sat too medial, so the points read close to the nipple
// line (reviewer, 2026-09-26). The skin point is where the front chest ring reaches the midpoint x.
const midaxillaryX = JSON.parse(fs.readFileSync(new URL('data/meridians/SP.json', REPO), 'utf8')).points.find((p) => p.code === 'SP21').seed[0];
const spMidpoint = (y) => {
  const target = (mammillaryX(y) + midaxillaryX) / 2, { ring, index, toRight } = trunkRing(y);
  let i = index;
  for (let guard = 0; guard < ring.length && ring[i].x > target; guard++) i = (i + toRight + ring.length) % ring.length;
  return ring[i].clone();
};
const onLine = (cun) => (y) => chestLateralOnSkin(y, cun);
// ST14: the 1st intercostal space from the rib bands on the 4 B-cun line (the generator's rule, before the 09-25 lift).
const ICS1_Y = intercostalOnChestLine(1, 4);
const cv16Y = JSON.parse(fs.readFileSync(new URL('data/meridians/CV.json', REPO), 'utf8')).points.find((p) => p.code === 'CV16').seed[1];
// [surface at height, intercostal space, options]. `y` overrides the reviewed height; `recentre: false` keeps it.
const EDITS = {
  // ST12, ST13 (reviewer, 2026-09-26): on the mammillary line, which starts at the clavicle midpoint. ST13 hugs the
  // clavicle's lower edge; ST14 comes down ~11 mm, undoing most of the 2026-09-25 lift that left it level with the clavicle.
  ST: { ST12: ['seed', 0, { seed: (p) => [round(clavicleMidX), p.seed[1], p.seed[2]], why: 'on the mammillary line (clavicle-midpoint x) (reviewer, 2026-09-26)' }], ST13: ['seed', 0, { seed: (p) => [round(clavicleMidX), round(CLAVICLE_LOW - 0.001), p.seed[2]], why: 'on the mammillary line, immediately against the lower edge of the clavicle (reviewer, 2026-09-26)' }], ST14: [onLine(4), 1, { y: ICS1_Y, recentre: false, why: 'lowered out of the clavicle level to the middle of the 1st intercostal space on the rib bands (reviewer, 2026-09-26; the skin-normal ray scan reads the space at clavicle level here because the skin faces upward)' }], ST15: [onLine(4), 2], ST16: [onLine(4), 3], ST17: ['nipple', 0], ST18: [onLine(4), 5] },
  // KI22 (reviewer): lying in the 5th intercostal space matters more than matching CV16; start at CV16 height, re-centre.
  KI: { KI22: [onLine(2), 5, { y: cv16Y, why: 'from the CV16 level into the 5th intercostal space (reviewer, 2026-09-26)' }], KI23: [onLine(2), 4], KI24: [onLine(2), 3], KI25: [onLine(2), 2] },
  LR: { LR14: [onLine(4), 6] },
  // PC1: 1 B-cun lateral of the nipple at the nipple's height (reviewer: too high once re-centred laterally).
  PC: { PC1: [onLine(5), 4, { y: nippleY, recentre: 'if-on-rib', why: 'at the height of the nipple (reviewer, 2026-09-26)' }] },
  SP: { SP17: [spMidpoint, 5], SP18: [spMidpoint, 4], SP19: [spMidpoint, 3], SP20: [spMidpoint, 2] },
};
const NOTE = '2026-09-26 유두선 곡선 반영';
const place = (surfaceAt, y) => { const surface = surfaceAt(y), normal = ringNormal(surface); return { seed: surface.clone().addScaledVector(normal, -0.01), normal }; };
const changes = [];
for (const [id, edits] of Object.entries(EDITS)) {
  const file = new URL(`data/meridians/${id}.json`, REPO), data = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const point of data.points) {
    const edit = edits[point.code]; if (!edit) continue;
    const [surfaceAt, ics, options = {}] = edit, before = [...point.seed];
    let result, why;
    if (surfaceAt === 'seed') {
      point.seed = options.seed(point);
      point.rule = point.rule.replace(/ · 2026-09-26 [^·]*$/, '') + ` · 2026-09-26 검수 반영: ${options.why}`;
      changes.push(`${point.code}\tx ${(before[0] * 1000).toFixed(0)} → ${(point.seed[0] * 1000).toFixed(0)}\ty ${(before[1] * 1000).toFixed(1)} → ${(point.seed[1] * 1000).toFixed(1)}`);
      continue;
    }
    if (surfaceAt === 'nipple') {
      const surface = nippleSurface(), normal = ringNormal(surface);
      result = { seed: surface.clone().addScaledVector(normal, -0.01), normal };
      why = 'centre of the nipple on the mammillary line';
    } else {
      const y0 = options.y ?? point.seed[1];
      result = place(surfaceAt, y0);
      let dy = 0;
      if (options.recentre !== false) {
        // Points at the edge of the chest ray scan may find no clear space; then the height is kept.
        try { dy = intercostalOffset(result.seed.toArray(), result.normal, ics); } catch { why = `no clear intercostal space ${ics} found on the new line; height kept`; }
        // 'if-on-rib': only move when the height itself is on a rib, not merely off-centre in the space.
        if (options.recentre === 'if-on-rib' && dy && onRib(result, ics) === false) dy = 0;
      }
      if (dy) result = place(surfaceAt, y0 + dy / 1000);
      const reason = options.why ? `${options.why}; ` : '';
      why ??= options.recentre === false ? `${reason}on the curved mammillary-line scale` : `${reason}onto the curved mammillary-line scale, ${dy ? `re-centred in intercostal space ${ics} (${dy >= 0 ? '+' : ''}${dy} mm)` : `inside intercostal space ${ics}`}`;
    }
    point.seed = result.seed.toArray().map(round);
    point.outward = result.normal.toArray().map(round);
    point.rule = point.rule.replace(/ · 2026-09-26 유두선 곡선 반영:[^·]*$/, '') + ` · ${NOTE}: ${why}`;
    const moved = Math.hypot(...point.seed.map((v, i) => v - before[i])) * 1000;
    changes.push(`${point.code}\t${moved.toFixed(1)} mm\tx ${(before[0] * 1000).toFixed(0)} → ${(point.seed[0] * 1000).toFixed(0)}\ty ${(before[1] * 1000).toFixed(0)} → ${(point.seed[1] * 1000).toFixed(0)}`);
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 1) + '\n');
}
console.log(changes.join('\n'));
// The nipple presentation (app/nipple-presentation.ts) reads the same definition. st.mjs writes this file too, but
// rerunning it would undo the reviewed ST seeds, so the post-process keeps it in step.
{
  const nipple = nippleSurface(), normal = ringNormal(nipple);
  fs.writeFileSync(new URL('data/nipple.json', REPO), JSON.stringify({
    generatedBy: 'scripts/needling/relocate-mammillary-2026-09-26.mjs (definition: scripts/trunk-arc.mjs)',
    rule: 'lower lateral edge of the pectoral mound: where the front chest contour turns past 25° (reviewer, 2026-09-26); height just above the 5th rib (4th intercostal space) on the clavicle-midpoint line; right side, the viewer mirrors x for the left',
    internippleMm: +(-2 * nippleX * 1000).toFixed(1),
    centre: nipple.toArray().map((n) => +n.toFixed(4)), normal: normal.toArray().map((n) => +n.toFixed(4)),
  }, null, 1) + '\n');
}

if (process.argv.includes('--gb')) {
  // GB24: 7th intercostal space on the mammillary line, straight below the nipple (photo archive GB24).
  // app/gb-points.ts projects GB24 anteriorly, so the seed sits 10 mm behind the skin along +z.
  // The ray scan finds no clear 7th space here (costal cartilage), so the height is the rib-band gap on the line;
  // the needle ray from that placement is then checked not to meet a rib before the pleura.
  const y = intercostalOnChestLine(7, 4), surface = chestLateralOnSkin(y, 4), normal = ringNormal(surface);
  const clear = !onRib({ seed: surface.clone().addScaledVector(normal, -0.01), normal });
  console.log('GB24 seed', [surface.x, surface.y, surface.z - 0.01].map(round), `(7th intercostal space from the rib bands; needle ray ${clear ? 'clears the ribs' : 'MEETS A RIB'})`);
}
