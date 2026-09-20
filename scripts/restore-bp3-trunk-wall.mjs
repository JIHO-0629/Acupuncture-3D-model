/** Restore the deep trunk wall from BodyParts3D 3.0, which 4.0 dropped.
 *
 * Without these the viewer cannot answer the question it exists to answer. An
 * abdominal needle went skin -> external oblique -> rectus -> bowel with no
 * intermediate wall; a lumbar needle had nothing between erector spinae and the
 * retroperitoneum; and no inguinal structure marked where the femoral vessels
 * pass under a ligament at ST30.
 *
 *   internal oblique      FMA13892/3   the middle layer of the abdominal wall
 *   transversus abdominis FMA22344/5   the deepest layer; with no peritoneum in
 *                                      the model it is also the wall's inner edge
 *   inguinal ligament     FMA21964/5   ST30 and the inguinal points
 *   quadratus lumborum    FMA22348/9   the depth under the lumbar BL back-shu points
 *   multifidus            FMA22878/9   paravertebral and Huatuo Jiaji insertion
 *
 * Source: BodyParts3D_3.0_obj_99.zip, the same archive and the same axis
 * transform as scripts/add-bp3-structures.mjs, so no registration step is
 * needed. Verified before import: with every vertex tested by a ray leaving it
 * away from the body axis, all ten meshes lie entirely inside the bundled 4.0
 * skin (0.0% outside, against 14.4% for a control pushed out by 5 mm), and an
 * anterior ray through the flank meets external oblique, internal oblique and
 * transversus abdominis in that order.
 *
 * Usage: node scripts/restore-bp3-trunk-wall.mjs OBJ_DIRECTORY
 * where OBJ_DIRECTORY holds FMA13892.obj and the other nine named below. Run
 * `node scripts/compress-models.mjs` afterwards to refresh the gzip payloads.
 *
 * The script only appends; existing chunks and parts are never rewritten.
 */
import fs from 'node:fs';
import {MeshoptSimplifier} from 'meshoptimizer';

// The inguinal ligament is `connective`, not `skeletal`: the needling path treats
// connective tissue as a layer to pass through, which is what a ligament is. Filing
// a ligament under a danger-stop system is the mistake scripts/reclassify-parts.mjs
// had to undo for the iliotibial tract.
const STRUCTURES=[
 ['FMA13892','Right internal oblique','muscular'],['FMA13893','Left internal oblique','muscular'],
 ['FMA22344','Right transversus abdominis','muscular'],['FMA22345','Left transversus abdominis','muscular'],
 ['FMA21964','Right inguinal ligament','connective'],['FMA21965','Left inguinal ligament','connective'],
 ['FMA22348','Right quadratus lumborum','muscular'],['FMA22349','Left quadratus lumborum','muscular'],
 ['FMA22878','Right multifidus','muscular'],['FMA22879','Left multifidus','muscular'],
];
const CHUNK='body-trunk-wall.bin';

const source=process.argv[2];
if(!source)throw new Error('Usage: node scripts/restore-bp3-trunk-wall.mjs OBJ_DIRECTORY');
await MeshoptSimplifier.ready;
const dir=new URL('../public/models/',import.meta.url),manifestPath=new URL('atlas.json',dir);
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const existing=new Set(manifest.parts.map(p=>p.id));
const conceptById=new Map(manifest.concepts.map(c=>[c.id,c]));
const url=`/models/${CHUNK}`;
if(manifest.chunks.some(chunk=>chunk.url===url))throw new Error(`${url} already exists; the trunk wall has been restored before`);
const chunkIndex=manifest.chunks.length;

let segments=[],bytes=0,addedTriangles=0,maxError=0;
const append=a=>{
 const padding=(4-bytes%4)%4;
 if(padding){segments.push(Buffer.alloc(padding));bytes+=padding;}
 const offset=bytes,b=Buffer.from(a.buffer,a.byteOffset,a.byteLength);
 segments.push(b);bytes+=b.length;return offset;
};

// Millimetre/Z-up source coordinates become metre/Y-up viewer coordinates.
const readObj=path=>{
 const vertices=[],normals=[],indices=[];
 for(const line of fs.readFileSync(path,'utf8').split('\n')){
  if(line.startsWith('v ')){const [x,y,z]=line.split(/\s+/).slice(1,4).map(Number);vertices.push(x*.001,z*.001+.0781112,-y*.001-.1);}
  else if(line.startsWith('vn ')){const [x,y,z]=line.split(/\s+/).slice(1,4).map(Number);normals.push(Math.round(x*32767),Math.round(z*32767),Math.round(-y*32767));}
  else if(line.startsWith('f ')){
   const face=line.trim().split(/\s+/).slice(1).map(s=>Number(s.split('/')[0])-1);
   for(let j=1;j<face.length-1;j++)indices.push(face[0],face[j],face[j+1]);
  }
 }
 if(normals.length!==vertices.length)throw new Error(`${path}: normal count does not match vertices`);
 return {positions:new Float32Array(vertices),normals:new Int16Array(normals),indices:new Uint32Array(indices)};
};

const added=[];
for(const [sourceId,name,system] of STRUCTURES){
 const id=`BP3_${sourceId}`;
 if(existing.has(id))throw new Error(`${id} is already present`);
 const mesh=readObj(new URL(`${sourceId}.obj`,`file:///${source.split(String.fromCharCode(92)).join('/').replace(/\/?$/,'/')}`));
 // Match the 4.0 optimisation budget: keep every named mesh, bound the error at 0.2%.
 const target=Math.max(96,Math.floor(mesh.indices.length*.22/3)*3);
 const [simplified,error]=MeshoptSimplifier.simplify(mesh.indices,mesh.positions,3,Math.min(mesh.indices.length,target),.002);
 maxError=Math.max(maxError,error);
 const [remap,count]=MeshoptSimplifier.compactMesh(simplified);
 const positions=new Float32Array(count*3),normals=new Int16Array(count*3);
 for(let old=0;old<remap.length;old++){
  const n=remap[old];if(n===0xffffffff)continue;
  positions.set(mesh.positions.subarray(old*3,old*3+3),n*3);
  normals.set(mesh.normals.subarray(old*3,old*3+3),n*3);
 }
 const low=[Infinity,Infinity,Infinity],high=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<positions.length;i++){const axis=i%3;if(positions[i]<low[axis])low[axis]=positions[i];if(positions[i]>high[axis])high[axis]=positions[i];}
 manifest.parts.push({id,name,conceptId:sourceId,system,chunk:chunkIndex,
  positions:append(positions),normals:append(normals),indices:append(simplified),
  vertexCount:count,indexCount:simplified.length,bounds:[low,high]});
 addedTriangles+=simplified.length/3;
 const concept=conceptById.get(sourceId);
 if(concept)concept.elements.push(id);
 else manifest.concepts.push({id:sourceId,name:name.toLowerCase(),elements:[id]});
 added.push(`${name} [${system}] ${simplified.length/3} triangles`);
}

fs.writeFileSync(new URL(CHUNK,dir),Buffer.concat(segments));
manifest.chunks.push({url,bytes});
manifest.triangles+=addedTriangles;
manifest.supplements=[...(manifest.supplements??[]),{
 source:'BodyParts3D 3.0',archive:'BodyParts3D_3.0_obj_99.zip',structures:STRUCTURES.length,triangles:addedTriangles,
 reason:'Deep trunk wall absent from BodyParts3D 4.0: the layers a trunk needle passes and the inguinal ligament',
}];
fs.writeFileSync(manifestPath,JSON.stringify(manifest));
console.log(JSON.stringify({added:STRUCTURES.length,parts:manifest.parts.length,triangles:manifest.triangles,chunkBytes:bytes,maxError},null,1));
console.log(added.join('\n'));
