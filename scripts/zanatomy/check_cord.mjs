// 척수·경막이 아틀라스 척추관 안에 있는지 확인
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const REPO = 'C:/Users/jiho3/Documents/Codex/2026-09-09/we-are-building-an-acupuncture-anatomy/human-atlas';
const T = await import(pathToFileURL(`${REPO}/node_modules/three/build/three.module.js`).href);
const { loadAtlas, threeMesh } = await import(pathToFileURL(`${REPO}/scripts/atlas-geometry.mjs`).href);
const atlas = loadAtlas();
const dir = `${REPO}/public/models/zanatomy/`, zm = JSON.parse(fs.readFileSync(dir + 'zanatomy.json', 'utf8'));
const bufs = zm.chunks.map((c) => { const f = fs.readFileSync(dir + c.url.split('/').pop()); return f.buffer.slice(f.byteOffset, f.byteOffset + f.byteLength); });
const vertebrae = atlas.parts.filter((p) => p.system === 'skeletal' && /(cervical|thoracic|lumbar) vertebra$|^(atlas|axis)$/i.test(p.name)).map((p) => ({ p, o: threeMesh(p) }));
console.log('atlas vertebrae:', vertebrae.length);
const rc = new T.Raycaster(), dirs = [new T.Vector3(0.577, 0.577, 0.577), new T.Vector3(-0.707, 0.1, 0.7).normalize(), new T.Vector3(0.1, -0.99, 0.1).normalize()];
const inside = (o, q) => dirs.filter((d) => { rc.set(q, d); return rc.intersectObject(o, false).length % 2 === 1; }).length >= 2;
for (const name of ['White matter of spinal cord', 'Spinal dura']) {
  const part = zm.parts.find((x) => x.name === name);
  if (!part) { console.log(name, 'NOT in export'); continue; }
  const a = new Float32Array(bufs[part.chunk], part.positions, part.vertexCount * 3);
  let n = 0, inBone = 0, inCanalBox = 0;
  for (let i = 0; i < part.vertexCount; i += 25) {
    const q = new T.Vector3(a[i * 3], a[i * 3 + 1], a[i * 3 + 2]); n++;
    const near = vertebrae.filter(({ p }) => q.y >= p.bounds[0][1] - 0.01 && q.y <= p.bounds[1][1] + 0.01);
    if (near.some(({ o }) => inside(o, q))) inBone++;
    if (near.some(({ p }) => q.x > p.bounds[0][0] && q.x < p.bounds[1][0] && q.z > p.bounds[0][2] && q.z < p.bounds[1][2])) inCanalBox++;
  }
  console.log(`${part.id} ${name}: y ${part.bounds[0][1].toFixed(3)}–${part.bounds[1][1].toFixed(3)} m | in vertebral bone ${(inBone / n * 100).toFixed(1)}% | within vertebra x/z extent ${(inCanalBox / n * 100).toFixed(1)}% | ${part.registration}`);
}
