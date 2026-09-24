/** Restore the reviewed 2026-09-23 body fit, then rebuild catalogue invariants. */
import {execFileSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {readFileSync,writeFileSync} from 'node:fs';

const REVIEWED_REF='44f9d83';
const CHUNKS=[1,2,9,10,11,13];
const SMOOTH_NORMAL_REF='9536bfe';
const atlasPath='public/models/atlas.json';
const atlas=JSON.parse(readFileSync(atlasPath,'utf8'));

for(const chunk of CHUNKS){
 const path=`public/models/body-${chunk}.bin`;
 const reviewed=Buffer.from(execFileSync('git',['show',`${REVIEWED_REF}:${path}`],{maxBuffer:128*1024*1024}));
 writeFileSync(path,reviewed);
 writeFileSync(`${path}.gz`,gzipSync(reviewed,{level:9}));
 console.log(`restored reviewed geometry: ${path}`);
}

// The 09-23 fit keeps the corrected vertex positions, but its regenerated normals
// expose the web mesh triangulation as spikes at study-level zoom. Reuse the original
// artist-smoothed normals; normals affect lighting only, never collision or path depth.
const smoothAtlas=JSON.parse(execFileSync('git',['show',`${SMOOTH_NORMAL_REF}:${atlasPath}`],{encoding:'utf8',maxBuffer:32*1024*1024}));
const smoothParts=new Map(smoothAtlas.parts.map(part=>[part.id,part]));
for(const chunkIndex of [1,2,9,10,11,13,15,17]){
 const chunk=atlas.chunks[chunkIndex],path=`public/models/${chunk.url.split('/').pop()}`;
 const current=Buffer.from(readFileSync(path));
 const sourceChunk=smoothAtlas.chunks[chunkIndex];
 const source=execFileSync('git',['show',`${SMOOTH_NORMAL_REF}:public/models/${sourceChunk.url.split('/').pop()}`],{maxBuffer:128*1024*1024});
 let copied=0;
 for(const part of atlas.parts.filter(item=>item.chunk===chunkIndex)){
  const original=smoothParts.get(part.id);
  if(!original||original.vertexCount!==part.vertexCount)continue;
  const bytes=part.vertexCount*3*2;
  source.copy(current,part.normals,original.normals,original.normals+bytes);
  copied++;
 }
 writeFileSync(path,current);
 writeFileSync(`${path}.gz`,gzipSync(current,{level:9}));
 console.log(`restored smooth normals: ${path} (${copied} parts)`);
}

const validIds=new Set(atlas.parts.map(part=>part.id));
atlas.concepts=atlas.concepts.map(concept=>({...concept,elements:concept.elements.filter(id=>validIds.has(id))})).filter(concept=>concept.elements.length>0);
const buffers=atlas.chunks.map(chunk=>readFileSync(`public/models/${chunk.url.split('/').pop()}`));
for(const part of atlas.parts){
 const buffer=buffers[part.chunk];
 const positions=new Float32Array(buffer.buffer,buffer.byteOffset+part.positions,part.vertexCount*3);
 const bounds=[[Infinity,Infinity,Infinity],[-Infinity,-Infinity,-Infinity]];
 for(let i=0;i<positions.length;i+=3)for(let axis=0;axis<3;axis++){
  bounds[0][axis]=Math.min(bounds[0][axis],positions[i+axis]);
  bounds[1][axis]=Math.max(bounds[1][axis],positions[i+axis]);
 }
 part.bounds=bounds;
}
atlas.triangles=atlas.parts.reduce((sum,part)=>sum+part.indexCount/3,0);
writeFileSync(atlasPath,JSON.stringify(atlas));
console.log(`reviewed 09-23 fit restored; ${atlas.parts.length} parts, ${atlas.triangles} triangles`);
