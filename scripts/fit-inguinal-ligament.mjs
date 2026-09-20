/** Seat the inguinal ligament on its two bony attachments.
 *
 * BodyParts3D 3.0 models the ligament as the rolled free edge of the external
 * oblique aponeurosis, and on this body's 4.0 pelvis that edge floats: both ends
 * hang about 12 mm anterior to the bone, and the ASIS end sits 22 mm short of the
 * spine it is supposed to attach to. It reads as a cord hovering over the groin.
 *
 * The mesh itself is right — its chord is within 3 mm of the ASIS-to-tubercle
 * distance on this pelvis — so it is seated with a similarity transform rather
 * than reshaped: the minimal rotation that swings its long axis onto the
 * ASIS-tubercle axis, the scale that matches the two chords, and the translation
 * that lands it on the spine. Shape, curvature and twist are preserved.
 *
 * The ends are taken as the mean of the outermost 3% of vertices along the band's
 * own principal axis, not as single extreme vertices, so one stray vertex cannot
 * set the fit. That also leaves the real tips a few millimetres past each target,
 * which is what an attachment should look like.
 *
 * Usage: node scripts/fit-inguinal-ligament.mjs [--check]
 *
 * Re-running is safe: once the ends are on their targets the fit is the identity.
 */
import fs from 'node:fs';
import zlib from 'node:zlib';
import * as T from 'three';

const check=process.argv.includes('--check');
const dir=new URL('../public/models/',import.meta.url);
const manifestPath=new URL('atlas.json',dir);
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const landmarks=JSON.parse(fs.readFileSync(new URL('../data/landmarks.json',import.meta.url),'utf8')).landmarks;
const landmark=(id,side)=>{
 const found=landmarks.find(l=>l.id===id&&l.side===side);
 if(!found)throw new Error(`landmarks.json has no ${id}/${side}; run scripts/landmarks.mjs first`);
 return new T.Vector3(...found.point);
};

/** Principal axis by power iteration on the covariance; the band is long and thin. */
const principalAxis=points=>{
 const centre=new T.Vector3();
 for(const p of points)centre.add(p);
 centre.multiplyScalar(1/points.length);
 let axis=new T.Vector3(1,0,0);
 for(let step=0;step<64;step++){
  const next=new T.Vector3();
  for(const p of points){
   const d=p.clone().sub(centre);
   next.addScaledVector(d,d.dot(axis));
  }
  if(next.lengthSq()===0)break;
  axis=next.normalize();
 }
 return {centre,axis};
};

const report=[];
for(const [side,partId] of [['right','BP3_FMA21964'],['left','BP3_FMA21965']]){
 const part=manifest.parts.find(p=>p.id===partId);
 if(!part)throw new Error(`${partId} is not in the atlas; run scripts/restore-bp3-trunk-wall.mjs first`);
 const chunk=manifest.chunks[part.chunk];
 const file=new URL(chunk.url.split('/').pop(),dir);
 const buffer=fs.readFileSync(file);
 const positions=new Float32Array(buffer.buffer,buffer.byteOffset+part.positions,part.vertexCount*3);
 const normals=new Int16Array(buffer.buffer,buffer.byteOffset+part.normals,part.vertexCount*3);
 const points=Array.from({length:part.vertexCount},(_,i)=>new T.Vector3(positions[i*3],positions[i*3+1],positions[i*3+2]));

 const {centre,axis}=principalAxis(points);
 const scored=points.map(p=>[p.clone().sub(centre).dot(axis),p]).sort((a,b)=>a[0]-b[0]);
 const take=Math.max(1,Math.round(points.length*0.03));
 const endOf=slice=>slice.reduce((sum,[,p])=>sum.add(p),new T.Vector3()).multiplyScalar(1/slice.length);
 const low=endOf(scored.slice(0,take)),high=endOf(scored.slice(-take));
 // Lateral is the end further from the midline, whichever way the principal axis points.
 const [lateral,medial]=Math.abs(low.x)>Math.abs(high.x)?[low,high]:[high,low];

 const asis=landmark('asis',side),tubercle=landmark('pubic_tubercle',side);
 const from=medial.clone().sub(lateral),to=tubercle.clone().sub(asis);
 const rotation=new T.Quaternion().setFromUnitVectors(from.clone().normalize(),to.clone().normalize());
 const scale=to.length()/from.length();
 const apply=p=>p.clone().sub(lateral).applyQuaternion(rotation).multiplyScalar(scale).add(asis);

 const before={lateral:lateral.distanceTo(asis),medial:medial.distanceTo(tubercle)};
 const after={lateral:apply(lateral).distanceTo(asis),medial:apply(medial).distanceTo(tubercle)};
 const angle=2*Math.acos(Math.min(1,Math.abs(rotation.w)))*180/Math.PI;
 report.push(`${side}: ends were ${(before.lateral*1000).toFixed(1)} mm (ASIS) and ${(before.medial*1000).toFixed(1)} mm (tubercle) off; `
  +`fit rotates ${angle.toFixed(1)} deg, scales ${scale.toFixed(4)}, leaves ${(after.lateral*1000).toFixed(2)}/${(after.medial*1000).toFixed(2)} mm`);
 if(check)continue;

 const low3=[Infinity,Infinity,Infinity],high3=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<part.vertexCount;i++){
  const moved=apply(points[i]);
  positions[i*3]=moved.x;positions[i*3+1]=moved.y;positions[i*3+2]=moved.z;
  for(let a=0;a<3;a++){
   const value=moved.getComponent(a);
   if(value<low3[a])low3[a]=value;
   if(value>high3[a])high3[a]=value;
  }
  // The transform is a rotation and a uniform scale, so normals only rotate.
  const n=new T.Vector3(normals[i*3]/32767,normals[i*3+1]/32767,normals[i*3+2]/32767)
   .applyQuaternion(rotation).normalize();
  for(let a=0;a<3;a++)normals[i*3+a]=Math.max(-32767,Math.min(32767,Math.round(n.getComponent(a)*32767)));
 }
 part.bounds=[low3,high3];
 fs.writeFileSync(file,buffer);
 if(chunk.gzip){
  const packed=zlib.gzipSync(buffer,{level:9});
  fs.writeFileSync(new URL(chunk.gzip.split('/').pop(),dir),packed);
  chunk.gzipBytes=packed.length;
 }
}
if(!check)fs.writeFileSync(manifestPath,JSON.stringify(manifest));
console.log(report.join('\n'));
console.log(check?'(check only, nothing written)':'seated');
