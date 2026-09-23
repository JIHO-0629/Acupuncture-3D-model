/** Correct mesh names that the source atlas got wrong, and drop one duplicate trace.
 *
 * A needle path reports every mesh it crosses by name, so a wrong label is a wrong
 * anatomy statement: the foot showed a "dorsal metacarpal vein", the leg a "set of
 * dorsal digital arteries", and a subcutaneous vein of the lower abdomen called
 * itself the superior epigastric vein and stopped ST26-ST29 in the first millimetre.
 * Each correction below was identified from where the mesh lies, not from its label:
 *
 *  - FJ2186 / FJ2199 "Dorsal metacarpal vein" run over the metatarsals (y 0.02-0.06).
 *  - FJ2093 / FJ2197 "Set of dorsal digital arteries" run from ankle to knee behind the
 *    fibula, 12 mm from the fibular vein; that is the course of the fibular artery,
 *    which the atlas otherwise lacks.
 *  - FJ2091 / FJ2195 "Set of calcaneal branches of posterior tibial artery" lie in the
 *    upper thigh beside the femur, 10 mm from the lateral circumflex femoral vein.
 *  - FJ2349 / FJ2238-family "Proper palmar digital vein of right little finger" spans
 *    the whole palm under the lumbricals: the palmar digital veins as a set.
 *  - FJ3615 / FJ3530 "superior epigastric vein" follow the superficial epigastric vein
 *    vertex for vertex (same end points, same subcutaneous course), while the true
 *    superior epigastric vessels run behind the rectus above the umbilicus
 *    (FJ1936 artery). They are a second copy of the superficial vein under a wrong
 *    label and are removed from the manifest; their bytes stay in the chunk, unused.
 *
 * Usage: node scripts/relabel-parts.mjs [--check]. Safe to re-run.
 */
import fs from 'node:fs';

const RENAME = {
  FJ2186: 'Dorsal metatarsal veins of left foot', FJ2199: 'Dorsal metatarsal veins of right foot',
  FJ2093: 'Left fibular artery', FJ2197: 'Right fibular artery',
  FJ2091: 'Branch of left lateral circumflex femoral artery', FJ2195: 'Branch of right lateral circumflex femoral artery',
  FJ2349: 'Set of palmar digital veins of right hand',
};
const REMOVE = { FJ3615: 'duplicate of the right superficial epigastric vein', FJ3530: 'duplicate of the left superficial epigastric vein' };

const check = process.argv.includes('--check');
const path = new URL('../public/models/atlas.json', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(path, 'utf8'));
const log = [];
for (const part of manifest.parts) {
  const name = RENAME[part.id];
  if (name && part.name !== name) { log.push(`${part.id}: "${part.name}" -> "${name}"`); part.name = name; }
}
const before = manifest.parts.length;
manifest.parts = manifest.parts.filter((part) => {
  if (!REMOVE[part.id]) return true;
  log.push(`${part.id}: removed "${part.name}" (${REMOVE[part.id]})`);
  return false;
});
console.log(log.join('\n') || 'nothing to do');
if (!check && log.length) { fs.writeFileSync(path, JSON.stringify(manifest)); console.log(`${before} -> ${manifest.parts.length} parts`); }
