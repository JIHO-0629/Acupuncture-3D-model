/** Correct display-system assignments that the source system map got wrong.
 *
 * The packed atlas carries one `system` per mesh, and the needling path treats
 * `skeletal` as a hard stop in every region (app/scene.tsx, dangerousSystems).
 * A muscle or a ligament filed under `skeletal` therefore halts the needle at
 * its surface as if it were bone — the iliotibial tract stopped a thigh needle
 * about 2 mm in — and it is also drawn and toggled with the skeleton.
 *
 * These are classification errors in the imported map, not modelling choices.
 * Ligaments and aponeuroses belong to `connective`, which the path treats as a
 * layer to pass through; muscles belong to `muscular`.
 *
 * The script edits `system` only. Geometry, ids, names, concepts and chunk
 * offsets are untouched, so it needs no re-pack and is safe to re-run.
 *
 * Usage: node scripts/reclassify-parts.mjs [--check]
 */
import fs from 'node:fs';

/** [matcher on the side-stripped name, expected current system, corrected system, reason] */
const CORRECTIONS = [
 [/^tibialis (anterior|posterior)$/i, 'skeletal', 'muscular', 'muscle of the leg, not bone'],
 [/^fibularis (longus|brevis|tertius)$/i, 'skeletal', 'muscular', 'muscle of the leg, not bone'],
 [/^levator scapulae$/i, 'skeletal', 'muscular', 'muscle of the neck, not bone'],
 [/^subscapularis$/i, 'skeletal', 'muscular', 'rotator cuff muscle, not bone'],
 [/^iliotibial tract$/i, 'skeletal', 'connective', 'dense fascial band; a needle passes through it'],
 [/^tensor fasciae latae$/i, 'connective', 'muscular', 'muscle that tenses the tract, not the tract itself'],
 [/^flexor retinaculum of (right|left) wrist$/i, 'sensory', 'connective', 'carpal retinaculum is connective tissue, not a sense organ'],
];

const check = process.argv.includes('--check');
const path = new URL('../public/models/atlas.json', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(path, 'utf8'));
const stripSide = (name) => name.replace(/^(Right|Left)\s+/i, '');

const changed = [], already = [], unexpected = [];
for (const part of manifest.parts) {
 const bare = stripSide(part.name);
 const rule = CORRECTIONS.find(([pattern]) => pattern.test(bare));
 if (!rule) continue;
 const [, from, to, reason] = rule;
 if (part.system === to) { already.push(part.name); continue; }
 if (part.system !== from) { unexpected.push(`${part.name}: expected ${from}, found ${part.system}`); continue; }
 part.system = to;
 changed.push(`${part.name}: ${from} -> ${to} (${reason})`);
}
if (unexpected.length) throw new Error(`unexpected current systems:\n${unexpected.join('\n')}`);
for (const [pattern] of CORRECTIONS)
 if (![...changed, ...already].some((line) => pattern.test(stripSide(line.split(':')[0]))))
  throw new Error(`no mesh matched ${pattern}`);

if (changed.length && !check) fs.writeFileSync(path, JSON.stringify(manifest));
console.log(changed.length ? changed.join('\n') : 'no change');
console.log(`${changed.length} corrected, ${already.length} already correct${check ? ' (check only, nothing written)' : ''}`);
if (check && changed.length) process.exitCode = 1;
