import { loadFbx } from './inspect_fbx.mjs';
import { pathToFileURL } from 'node:url';
const REPO = 'C:/Users/jiho3/Documents/Codex/2026-09-09/we-are-building-an-acupuncture-anatomy/human-atlas';
const { loadAtlas } = await import(pathToFileURL(`${REPO}/scripts/atlas-geometry.mjs`).href);
const atlas = loadAtlas(), have = (re) => atlas.parts.filter((p) => re.test(p.name)).length;
const RE = /spinal|rami|ramus|disc|disk|flavum|ligament|dura|arachnoid|filum|cauda|ganglion|nerve root|intercostal|phrenic|vagus|sympathetic|meningeal/i;
for (const [file, tag] of [['NervousSystem100.fbx', 'nerve'], ['Joints100.fbx', 'joint'], ['SkeletalSystem100.fbx', 'bone']]) {
  const { meshes } = await loadFbx(file);
  const hits = meshes.filter((m) => RE.test(m.name) && m.geometry.attributes.position.count > 200);
  const groups = new Map();
  for (const m of hits) { const k = m.name.replace(/[rlji]$/, '').replace(/_/g, ' '); groups.set(k, (groups.get(k) ?? 0) + 1); }
  console.log(`\n### ${file} (${hits.length} meshes)`);
  for (const [k, n] of [...groups].sort()) console.log(`${k}${n > 1 ? ` ×${n}` : ''} | atlas: ${have(new RegExp(k.split(' ').slice(-2).join(' '), 'i'))}`);
}
