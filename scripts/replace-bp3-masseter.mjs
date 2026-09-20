/** Replace the four reduced release-3.0 masseter meshes with the 95% OBJ set.
 *
 * Usage: node scripts/replace-bp3-masseter.mjs OBJ_DIRECTORY
 */
import fs from 'node:fs';
import {gzipSync} from 'node:zlib';

const PARTS=[
 ['FMA49001','Superficial part of right masseter'],
 ['FMA49002','Superficial part of left masseter'],
 ['FMA49004','Deep part of right masseter'],
 ['FMA49005','Deep part of left masseter'],
];
const source=process.argv[2];
if(!source)throw new Error('Usage: node scripts/replace-bp3-masseter.mjs OBJ_DIRECTORY');

// Release 3.0 and 4.0 use different body-coordinate generations. A similarity
// fit of the 3.0 mandible and bilateral zygomatic bones to their 4.0 meshes gives
// this registration (the three independent fits agree within 0.4 mm).
const REGISTRATION={scale:1.053,offset:[0,-.094,-.0094]};

const modelDir=new URL('../public/models/',import.meta.url);
const manifestUrl=new URL('atlas.json',modelDir);
const manifest=JSON.parse(fs.readFileSync(manifestUrl,'utf8'));
const outputName='body-masseter-95.bin',outputUrl=`/models/${outputName}`;
let chunkIndex=manifest.chunks.findIndex(chunk=>chunk.url===outputUrl);
if(chunkIndex<0){chunkIndex=manifest.chunks.length;manifest.chunks.push({url:outputUrl,bytes:0});}

const sourceRoot=new URL(`file:///${source.replace(/\\/g,'/').replace(/\/?$/,'/')}`);
const readObj=id=>{
 const positions=[],normals=[],indices=[];
 for(const line of fs.readFileSync(new URL(`${id}.obj`,sourceRoot),'utf8').split(/\r?\n/)){
  if(line.startsWith('v ')){
   const [x,y,z]=line.trim().split(/\s+/).slice(1,4).map(Number);
   const point=[x*.001,z*.001+.0781112,-y*.001-.1];
   positions.push(...point.map((value,axis)=>value*REGISTRATION.scale+REGISTRATION.offset[axis]));
  }else if(line.startsWith('vn ')){
   const [x,y,z]=line.trim().split(/\s+/).slice(1,4).map(Number);
   normals.push(Math.round(x*32767),Math.round(z*32767),Math.round(-y*32767));
  }else if(line.startsWith('f ')){
   const face=line.trim().split(/\s+/).slice(1).map(item=>Number(item.split('/')[0])-1);
   for(let i=1;i<face.length-1;i++)indices.push(face[0],face[i],face[i+1]);
  }
 }
 if(normals.length!==positions.length)throw new Error(`${id}: normal count does not match vertices`);
 return {positions:new Float32Array(positions),normals:new Int16Array(normals),indices:new Uint32Array(indices)};
};

const segments=[];let bytes=0;
const append=array=>{
 const padding=(4-bytes%4)%4;
 if(padding){segments.push(Buffer.alloc(padding));bytes+=padding;}
 const offset=bytes,buffer=Buffer.from(array.buffer,array.byteOffset,array.byteLength);
 segments.push(buffer);bytes+=buffer.length;return offset;
};

let oldTriangles=0,newTriangles=0;
for(const [id,name] of PARTS){
 const part=manifest.parts.find(item=>item.id===`BP3_${id}`);
 if(!part)throw new Error(`${id}: packed atlas part is missing`);
 oldTriangles+=part.indexCount/3;
 const mesh=readObj(id),low=[Infinity,Infinity,Infinity],high=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<mesh.positions.length;i++){
  const axis=i%3,value=mesh.positions[i];
  if(value<low[axis])low[axis]=value;if(value>high[axis])high[axis]=value;
 }
 Object.assign(part,{
  name,chunk:chunkIndex,positions:append(mesh.positions),normals:append(mesh.normals),indices:append(mesh.indices),
  vertexCount:mesh.positions.length/3,indexCount:mesh.indices.length,bounds:[low,high],
 });
 newTriangles+=mesh.indices.length/3;
 console.log(`${name}: ${mesh.indices.length/3} triangles`);
}

const packed=Buffer.concat(segments);
fs.writeFileSync(new URL(outputName,modelDir),packed);
const compressed=gzipSync(packed,{level:9});
fs.writeFileSync(new URL(`${outputName}.gz`,modelDir),compressed);
manifest.chunks[chunkIndex]={url:outputUrl,bytes:packed.length,gzip:`${outputUrl}.gz`,gzipBytes:compressed.length};
manifest.triangles+=newTriangles-oldTriangles;
manifest.supplements=(manifest.supplements??[]).filter(item=>item.refinement!=='masseter-95');
manifest.supplements.push({
 source:'BodyParts3D 3.0',archive:'BodyParts3D_3.0_obj_95.zip',structures:4,triangles:newTriangles,
 reason:'Higher-detail replacement for the superficial and deep masseter meshes',refinement:'masseter-95',
 registration:'similarity fit from release-3.0 mandible and bilateral zygomatic bones to release 4.0',
});
fs.writeFileSync(manifestUrl,JSON.stringify(manifest));
console.log(JSON.stringify({chunk:outputUrl,bytes:packed.length,oldTriangles,newTriangles},null,2));
