// Z-Anatomy FBX 내용 확인: 메시 이름, 정점 수, 월드 좌표 경계
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const REPO = 'C:/Users/jiho3/Documents/Codex/2026-09-09/we-are-building-an-acupuncture-anatomy/human-atlas';
globalThis.self ??= globalThis;
const T = await import(pathToFileURL(`${REPO}/node_modules/three/build/three.module.js`).href);
const { FBXLoader } = await import(pathToFileURL(`${REPO}/node_modules/three/examples/jsm/loaders/FBXLoader.js`).href);

export async function loadFbx(file) {
  const buf = fs.readFileSync(file);
  const group = new FBXLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '');
  group.updateMatrixWorld(true);
  const meshes = [];
  group.traverse((o) => { if (o.isMesh) meshes.push(o); });
  return { group, meshes, T };
}

if (process.argv[2]) {
  const { meshes } = await loadFbx(process.argv[2]);
  const re = process.argv[3] ? new RegExp(process.argv[3], 'i') : null;
  console.log('meshes', meshes.length);
  for (const m of meshes) {
    if (re && !re.test(m.name)) continue;
    const box = new T.Box3().setFromObject(m);
    console.log(m.name.padEnd(50), String(m.geometry.attributes.position.count).padStart(7), box.min.toArray().map((n) => n.toFixed(1)).join(','), '|', box.max.toArray().map((n) => n.toFixed(1)).join(','));
  }
}
