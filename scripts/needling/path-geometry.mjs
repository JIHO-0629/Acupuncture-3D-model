/** Geometry shared by the needle-path scripts: the packed atlas plus the Z-Anatomy supplement,
 * skin projection that matches app/scene.tsx, a skin normal averaged within one skin region,
 * and the ordered list of structures a straight ray meets.
 */
import fs from 'node:fs';
import * as T from 'three';
import {loadAtlas,threeMesh} from '../atlas-geometry.mjs';

export {T};
export const REPO=new URL('../../',import.meta.url);
const read=(path)=>JSON.parse(fs.readFileSync(new URL(path,REPO),'utf8'));

export const atlas=loadAtlas();
{
 const manifest=read('public/models/zanatomy/zanatomy.json');
 const buffers=manifest.chunks.map((chunk)=>{const file=fs.readFileSync(new URL(`public/models/zanatomy/${chunk.url.split('/').pop()}`,REPO));return file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength);});
 for(const part of manifest.parts)atlas.parts.push({...part,supplement:true,
  positions:new Float32Array(buffers[part.chunk],part.positions,part.vertexCount*3),
  indices:new Uint32Array(buffers[part.chunk],part.indices,part.indexCount),
  box:new T.Box3(new T.Vector3(...part.bounds[0]),new T.Vector3(...part.bounds[1]))});
}
const meshes=new Map();
export const meshOf=(part)=>{let mesh=meshes.get(part);if(!mesh){mesh=threeMesh(part);meshes.set(part,mesh);}return mesh;};
export const partNamed=(name)=>{const part=atlas.parts.find((item)=>item.name===name);if(!part)throw new Error(`atlas has no part "${name}"`);return part;};
export const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
export const vertices=(part,filter)=>{const out=[],a=part.positions;for(let i=0;i<a.length;i+=3){const v=V(a[i],a[i+1],a[i+2]);if(!filter||filter(v))out.push(v);}return out;};
const landmarks=read('data/landmarks.json').landmarks;
export const landmark=(id)=>{const found=landmarks.find((item)=>item.id===id&&item.side!=='left');if(!found?.point)throw new Error(`landmark ${id} missing`);return V(...found.point);};

const skinPart=partNamed('Skin'),skin=meshOf(skinPart);
const raycaster=new T.Raycaster();

/** Same rule as projectToSkin in app/scene.tsx: the skin hit nearest to the seed along -outward. */
export function projectToSkin(seed,outward){
 raycaster.set(seed.clone().addScaledVector(outward,0.24),outward.clone().negate());raycaster.far=Infinity;
 let best=null,bestDistance=Infinity;
 for(const hit of raycaster.intersectObject(skin,false)){const distance=hit.point.distanceTo(seed);if(distance<bestDistance){bestDistance=distance;best=hit;}}
 if(!best)return {point:seed.clone(),face:null,faceNormal:outward.clone(),gapMm:null};
 const faceNormal=best.face.normal.clone();if(faceNormal.dot(outward)<0)faceNormal.negate();
 return {point:best.point.clone(),face:best.faceIndex,faceNormal,gapMm:bestDistance*1000};
}

// Skin triangles carry a region label (data/skin-regions.json). Averaging stays inside one
// region group and side so the inner arm never borrows the chest wall it rests on.
const regions=read('data/skin-regions.json');
const regionOfTriangle=Uint8Array.from(Buffer.from(regions.regionOfTriangle,'base64'));
const regionKey=(triangle)=>{const region=regions.regions[regionOfTriangle[triangle]];return region?`${region.group}|${region.side??''}`:'?';};
const centres=[],normals=[],areas=[];
{
 const P=skinPart.positions,I=skinPart.indices,a=V(),b=V(),c=V(),ab=V(),ac=V();
 for(let t=0;t<I.length/3;t++){
  a.fromArray(P,I[t*3]*3);b.fromArray(P,I[t*3+1]*3);c.fromArray(P,I[t*3+2]*3);
  const n=ab.subVectors(b,a).clone().cross(ac.subVectors(c,a));
  areas.push(n.length()/2);normals.push(n.normalize());centres.push(a.clone().add(b).add(c).multiplyScalar(1/3));
 }
}
/** Area-weighted skin normal within radiusMm of point, restricted to the region of face. */
export function smoothSkinNormal(point,face,radiusMm=15,hint){
 const key=face==null?null:regionKey(face),sum=V();
 for(let t=0;t<centres.length;t++){
  const distance=centres[t].distanceTo(point)*1000;
  if(distance>radiusMm||(key&&regionKey(t)!==key))continue;
  // Folds and inner shells of the skin mesh face other ways; they would tip the average.
  if(hint&&normals[t].dot(hint)<0.3)continue;
  sum.addScaledVector(normals[t],areas[t]*(1-distance/radiusMm));
 }
 sum.normalize();if(hint&&sum.dot(hint)<0)sum.negate();return sum;
}

const votes=[[0.577,0.577,0.577],[-0.707,0.1,0.7],[0.1,-0.99,0.1]].map((d)=>V(...d).normalize());
/** Every structure a ray meets within maxMm, as entry/exit intervals (mm). Left-side parts are skipped. */
export function rayLayers(origin,direction,maxMm=110){
 const ray=new T.Ray(origin,direction),out=[];
 for(const part of atlas.parts){
  if(part.system==='integumentary'||part.id==='FJ2811'||/(^Left |\bleft )/.test(part.name))continue;
  const box=part.box.clone().expandByScalar(0.001),inBox=box.containsPoint(origin);
  if(!inBox){const hit=ray.intersectBox(box,V());if(!hit||hit.distanceTo(origin)>maxMm/1000)continue;}
  const mesh=meshOf(part);raycaster.set(origin,direction);raycaster.far=maxMm/1000;
  const hits=raycaster.intersectObject(mesh,false).map((hit)=>hit.distance).sort((a,b)=>a-b).filter((d,i,list)=>i===0||d-list[i-1]>1e-5);
  raycaster.far=Infinity;if(!hits.length)continue;
  const inside=inBox&&hits.length%2===1&&votes.filter((d)=>{raycaster.set(origin,d);return raycaster.intersectObject(mesh,false).length%2===1;}).length>=2;
  const sequence=inside?[0,...hits]:hits;
  for(let i=0;i<sequence.length;i+=2)out.push({id:part.id,name:part.name,system:part.system,a:+(sequence[i]*1000).toFixed(1),b:sequence[i+1]===undefined?null:+(sequence[i+1]*1000).toFixed(1)});
 }
 return out.sort((x,y)=>x.a-y.a);
}
/** Closest approach of a part's vertices to a segment, as {distMm, atMm}. */
export function approach(part,origin,direction,maxMm){
 const end=origin.clone().addScaledVector(direction,maxMm/1000),segment=new T.Line3(origin,end),closest=V(),v=V();
 let best=Infinity,at=0;const a=part.positions;
 for(let i=0;i<a.length;i+=3){v.set(a[i],a[i+1],a[i+2]);segment.closestPointToPoint(v,true,closest);const d=closest.distanceTo(v);if(d<best){best=d;at=closest.distanceTo(origin);}}
 return {distMm:+(best*1000).toFixed(1),atMm:+(at*1000).toFixed(1)};
}
