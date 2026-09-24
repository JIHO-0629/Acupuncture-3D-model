import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {allPoints} from '../needling/points_all.mjs';

const read=path=>readFileSync(path,'utf8');
const atlas=JSON.parse(read('public/models/atlas.json'));
assert.equal(atlas.parts.length,2297,'base anatomy part count changed');
assert.ok(atlas.parts.some(part=>part.id.startsWith('BP3_')),'reviewed BP3 recovery meshes are missing');
const ids=new Set(atlas.parts.map(part=>part.id));
assert.equal(ids.size,atlas.parts.length,'duplicate part id');
for(const concept of atlas.concepts)for(const id of concept.elements)assert.ok(ids.has(id),`${concept.id}: dangling member ${id}`);

const buffers=atlas.chunks.map(chunk=>readFileSync(`public/models/${chunk.url.split('/').pop()}`));
let triangles=0;
for(const part of atlas.parts){
 const buffer=buffers[part.chunk];
 assert.ok(buffer,`${part.id}: missing chunk`);
 assert.ok(part.positions+part.vertexCount*12<=buffer.length,`${part.id}: position range outside chunk`);
 assert.ok(part.normals+part.vertexCount*6<=buffer.length,`${part.id}: normal range outside chunk`);
 assert.ok(part.indices+part.indexCount*4<=buffer.length,`${part.id}: index range outside chunk`);
 const positions=new Float32Array(buffer.buffer,buffer.byteOffset+part.positions,part.vertexCount*3);
 const indices=new Uint32Array(buffer.buffer,buffer.byteOffset+part.indices,part.indexCount);
 for(const value of positions)assert.ok(Number.isFinite(value),`${part.id}: non-finite position`);
 for(const index of indices)assert.ok(index<part.vertexCount,`${part.id}: invalid index`);
 for(let axis=0;axis<3;axis++){
  let min=Infinity,max=-Infinity;
  for(let i=axis;i<positions.length;i+=3){min=Math.min(min,positions[i]);max=Math.max(max,positions[i]);}
  assert.ok(Math.abs(min-part.bounds[0][axis])<1e-5&&Math.abs(max-part.bounds[1][axis])<1e-5,`${part.id}: stale bounds`);
 }
 triangles+=part.indexCount/3;
}
assert.equal(atlas.triangles,triangles,'triangle total is stale');
const reviewedAtlas=JSON.parse(execFileSync('git',['show','44f9d83:public/models/atlas.json'],{encoding:'utf8',maxBuffer:32*1024*1024}));
const reviewedParts=new Map(reviewedAtlas.parts.map(part=>[part.id,part]));
for(const chunk of [1,2,9,10,11,13]){
 const path=`public/models/body-${chunk}.bin`,current=readFileSync(path);
 const reviewed=execFileSync('git',['show',`44f9d83:${path}`],{maxBuffer:128*1024*1024});
 for(const part of atlas.parts.filter(item=>item.chunk===chunk)){
  const baseline=reviewedParts.get(part.id);
  if(!baseline||baseline.vertexCount!==part.vertexCount)continue;
  const bytes=part.vertexCount*3*4;
  assert.ok(current.subarray(part.positions,part.positions+bytes).equals(reviewed.subarray(baseline.positions,baseline.positions+bytes)),`${part.id}: not the reviewed 09-23 position fit`);
 }
}

const points=allPoints(),pointCodes=new Set(points.map(point=>point.code));
assert.equal(points.length,361,'standard point count changed');
assert.equal(pointCodes.size,361,'duplicate point code');
const direct=JSON.parse(read('data/needling-direct.json'));
assert.equal(Object.keys(direct).length,358,'straight-path profile count changed');
assert.deepEqual([...pointCodes].filter(code=>!direct[code]).sort(),['CV8','ST17','ST7'],'only ST7, ST17 and CV8 may lack a simulation profile');
assert.equal(direct.CV14.minCun,.4,'CV14 分 conversion failed');
assert.equal(direct.CV14.maxCun,.8,'CV14 分 conversion failed');
for(const code of ['LI3','BL61','GV22'])assert.ok(direct[code]?.modelMaxMm>0,`${code}: source technique was dropped`);
assert.equal(direct.ST22.modelMaxMm,direct.KI18.modelMaxMm,'same-height upper-abdominal points use different model units');
assert.equal(direct.ST22.modelMaxMm,direct.CV11.modelMaxMm,'same-height upper-abdominal points use different model units');
for(const code of ['LI4','LI12','LI14','HT2','ST11','CV1','GB28','ST19','ST20','ST21','ST22','SP16','KI19','KI20','KI21','CV13','CV15'])
 assert.ok(direct[code]?.cunBasis,`${code}: WHO body-region override missing`);
const review=JSON.parse(read('data/needling-review.json'));
assert.equal(review.length,361,'needling review ledger is incomplete');
assert.equal(review.filter(row=>row.status==='open').length,273,'open review count changed');
assert.equal(review.filter(row=>row.status==='review_required').length,85,'high-risk review queue changed');
assert.deepEqual(review.filter(row=>row.status==='locked').map(row=>row.point).sort(),['CV8','ST17','ST7'],'locked review set changed');

const page=read('app/page.tsx'),anatomy=read('app/anatomy.ts'),acupoints=read('app/acupoints.ts'),scene=read('app/scene.tsx');
assert.match(page,/fetch\('\/models\/zanatomy\/zanatomy\.json'/,'Z-Anatomy supplement is not loaded');
assert.match(page,/needle:\{enabled:true/,'needling does not start enabled');
assert.match(page,/showLines:false/,'meridian lines must start hidden');
assert.match(anatomy,/DEFAULT_VISIBLE:SystemId\[\] = \['muscular'\]/,'default view must remain muscle-only');
assert.ok(!anatomy.includes('forFirstStudyRelease'),'anatomy is still globally filtered');
assert.match(acupoints,/ALL_POINTS[^\n]+GB_POINTS[^\n]+buildLiPoints[^\n]+GENERATED/,'361-point collection is not exposed');
assert.ok(!acupoints.includes('RELEASE_NEEDLING_LOCK'),'global needling lock remains');
assert.match(acupoints,/review\.status!=='review_required'/,'high-risk per-point review gate is missing');
for(const required of [
 'pointMaterial = new T.MeshBasicMaterial({ color: 0x152f3a, depthTest: true })',
 'selectedPointMaterial = new T.MeshBasicMaterial({ color: 0x102c36, depthTest: true })',
])assert.ok(scene.includes(required),'acupoint depth testing changed');

console.log(`First-study gate verified: ${atlas.parts.length} base structures, ${triangles.toLocaleString()} triangles, 361 points, 358 needling profiles.`);
console.log('Status: 273 open, 85 high-risk review required, 3 source-locked (ST7, ST17, CV8). Neural and vascular layers remain hidden by default but participate in path calculation.');
