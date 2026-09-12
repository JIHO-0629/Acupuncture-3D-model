/** Add structures that BodyParts3D 4.0 dropped but 3.0 still ships.
 *
 * BodyParts3D 4.0 has no muscles of facial expression, no muscles of mastication,
 * no epicranial aponeurosis, no lung surfaces, no latissimus dorsi and no rectus
 * abdominis. Release 3.0 carries all of them in the same coordinate frame, so the
 * 4.0 converter's axis transform places them directly onto the bundled 4.0 skeleton
 * with no registration step.
 *
 * Usage: node scripts/add-bp3-structures.mjs OBJ_DIRECTORY
 * where OBJ_DIRECTORY holds the .obj files from BodyParts3D_3.0_obj_99.zip.
 *
 * The script only appends: existing chunks and parts are never rewritten. Run
 * `node scripts/compress-models.mjs` afterwards to refresh the gzip payloads.
 */
import fs from 'node:fs';
import {MeshoptSimplifier} from 'meshoptimizer';

// sourceId: BodyParts3D 3.0 concept id and .obj filename. Names follow the release's
// English parts list; display systems match this viewer's curated groupings.
const STRUCTURES=[
 ['FMA49007','Right temporalis','muscular'],['FMA49008','Left temporalis','muscular'],
 ['FMA49001','Superficial part of right masseter','muscular'],['FMA49002','Superficial part of left masseter','muscular'],
 ['FMA49004','Deep part of right masseter','muscular'],['FMA49005','Deep part of left masseter','muscular'],
 ['FMA49012','Right medial pterygoid','muscular'],['FMA49013','Left medial pterygoid','muscular'],
 ['FMA49024','Upper head of right lateral pterygoid','muscular'],['FMA49025','Upper head of left lateral pterygoid','muscular'],
 ['FMA49022','Lower head of right lateral pterygoid','muscular'],['FMA49023','Lower head of left lateral pterygoid','muscular'],
 ['FMA46768','Aponeurosis of epicranius','connective'],
 ['FMA46782','Orbital part of right orbicularis oculi','muscular'],['FMA46783','Orbital part of left orbicularis oculi','muscular'],
 ['FMA46785','Palpebral part of right orbicularis oculi','muscular'],['FMA46786','Palpebral part of left orbicularis oculi','muscular'],
 ['FMA46841','Orbicularis oris','muscular'],
 ['FMA46796','Right corrugator supercilii','muscular'],['FMA46797','Left corrugator supercilii','muscular'],
 ['FMA55610','Right procerus','muscular'],['FMA55611','Left procerus','muscular'],
 ['FMA55606','Right nasalis','muscular'],['FMA55607','Left nasalis','muscular'],
 ['FMA55608','Right depressor septi nasi','muscular'],['FMA55609','Left depressor septi nasi','muscular'],
 ['FMA46835','Right buccinator','muscular'],['FMA46836','Left buccinator','muscular'],
 ['FMA46803','Right levator labii superioris alaeque nasi','muscular'],['FMA46804','Left levator labii superioris alaeque nasi','muscular'],
 ['FMA46806','Right levator labii superioris','muscular'],['FMA46807','Left levator labii superioris','muscular'],
 ['FMA46823','Right levator anguli oris','muscular'],['FMA46824','Left levator anguli oris','muscular'],
 ['FMA46829','Right depressor anguli oris','muscular'],['FMA46830','Left depressor anguli oris','muscular'],
 ['FMA46817','Right depressor labii inferioris','muscular'],['FMA46818','Left depressor labii inferioris','muscular'],
 ['FMA46812','Right zygomaticus major','muscular'],['FMA46813','Left zygomaticus major','muscular'],
 ['FMA46814','Right zygomaticus minor','muscular'],['FMA46815','Left zygomaticus minor','muscular'],
 ['FMA46839','Right risorius','muscular'],['FMA46840','Left risorius','muscular'],
 ['FMA46826','Right mentalis','muscular'],['FMA46827','Left mentalis','muscular'],
 ['FMA13358','Right latissimus dorsi','muscular'],['FMA13359','Left latissimus dorsi','muscular'],
 ['FMA13377','Right rectus abdominis','muscular'],['FMA13378','Left rectus abdominis','muscular'],
 ['FMA7333','Upper lobe of right lung','respiratory'],['FMA7337','Lower lobe of right lung','respiratory'],
 ['FMA7383','Middle lobe of lung','respiratory'],['FMA7370','Upper lobe of left lung','respiratory'],
 ['FMA7371','Lower lobe of left lung','respiratory'],
];

const source=process.argv[2];
if(!source)throw new Error('Usage: node scripts/add-bp3-structures.mjs OBJ_DIRECTORY');
await MeshoptSimplifier.ready;
const dir=new URL('../public/models/',import.meta.url),manifestPath=new URL('atlas.json',dir);
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const existingParts=new Set(manifest.parts.map(p=>p.id));
const conceptById=new Map(manifest.concepts.map(c=>[c.id,c]));

// Continue the existing chunk series instead of rewriting packed geometry.
let chunkIndex=manifest.chunks.length,segments=[],bytes=0,addedTriangles=0,maxError=0;
const chunks=[];
const flush=()=>{
 if(!bytes)return;
 const url=`/models/body-${chunkIndex}.bin`;
 fs.writeFileSync(new URL(url.split('/').pop(),dir),Buffer.concat(segments));
 chunks.push({url,bytes});chunkIndex++;segments=[];bytes=0;
};
const append=a=>{
 const padding=(4-bytes%4)%4;
 if(padding){segments.push(Buffer.alloc(padding));bytes+=padding;}
 const offset=bytes,b=Buffer.from(a.buffer,a.byteOffset,a.byteLength);
 segments.push(b);bytes+=b.length;return offset;
};

// Millimetre/Z-up source coordinates become metre/Y-up viewer coordinates. This is the
// same transform scripts/convert-anatomy.py applies to the 4.0 geometry.
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
 if(existingParts.has(id))throw new Error(`${id} is already present; the atlas has been augmented before`);
 const mesh=readObj(new URL(`${sourceId}.obj`,`file:///${source.replace(/\\/g,'/').replace(/\/?$/,'/')}`));
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
 if(bytes>4_000_000)flush();
 const low=[Infinity,Infinity,Infinity],high=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<positions.length;i++){const axis=i%3;if(positions[i]<low[axis])low[axis]=positions[i];if(positions[i]>high[axis])high[axis]=positions[i];}
 const bounds=[low,high];
 const part={id,name,conceptId:sourceId,system,chunk:chunkIndex,positions:append(positions),normals:append(normals),indices:append(simplified),vertexCount:count,indexCount:simplified.length,bounds};
 manifest.parts.push(part);
 addedTriangles+=simplified.length/3;
 // Lung lobe concepts already exist and group the bronchial and vascular trees; the
 // surface joins them rather than creating a duplicate concept.
 const concept=conceptById.get(sourceId);
 if(concept)concept.elements.push(id);
 else manifest.concepts.push({id:sourceId,name:name.toLowerCase(),elements:[id]});
 added.push(`${name} (${simplified.length/3} triangles)`);
}
flush();
manifest.chunks.push(...chunks);
manifest.triangles+=addedTriangles;
manifest.supplements=[...(manifest.supplements??[]),{source:'BodyParts3D 3.0',archive:'BodyParts3D_3.0_obj_99.zip',structures:STRUCTURES.length,triangles:addedTriangles,reason:'Structures absent from BodyParts3D 4.0'}];
fs.writeFileSync(manifestPath,JSON.stringify(manifest));
console.log(JSON.stringify({added:STRUCTURES.length,parts:manifest.parts.length,concepts:manifest.concepts.length,triangles:manifest.triangles,newChunks:chunks.length,newBytes:chunks.reduce((n,c)=>n+c.bytes,0),maxError},null,1));
console.log(added.join('\n'));
