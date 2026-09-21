/** GV1–GV28 (독맥). KCMRIC → WHO 2008 → local GV01–GV28 images, all 1:1 checked. */
import fs from 'node:fs';
import {atlas,mesh,v,most,landmark,meridianWriter,ANTERIOR,POSTERIOR} from '../acupoint-kit.mjs';
import {pts,section,nearestIndex,stepToward,advance,arcTo} from '../trunk-arc.mjs';

const W=meridianWriter('GV');
const place=(code,p,out,regions,rule,projection)=>W.put(code,p.clone().addScaledVector(out,-0.004),out,regions,rule,{projection});
const head=JSON.parse(fs.readFileSync(new URL('../../data/head-cun.json',import.meta.url),'utf8')).scalp;

place('GV1',v(0,.850,-.082),POSTERIOR,['pelvis'],'midpoint of coccyx tip and anus · posterior median line','posterior');
place('GV2',landmark('sacral_hiatus',null),POSTERIOR,['pelvis','lumbar'],'sacral hiatus · posterior median line','posterior');
const levels=[['GV3','L4'],['GV4','L2'],['GV5','L1'],['GV6','T11'],['GV7','T10'],['GV8','T9'],['GV9','T7'],['GV10','T6'],['GV11','T5'],['GV12','T3'],['GV13','T1'],['GV14','C7']];
for(const [code,level] of levels){const p=landmark(`spinous_process_${level}.inferior_border`,null);place(code,p,POSTERIOR,level.startsWith('L')?['lumbar','pelvis']:['thorax','neck'],`posterior median line · depression inferior to ${level} spinous process`,'posterior');}
const gv14Surface=W.get('GV14');
W.putDirect('GV14',v(0,gv14Surface.y,gv14Surface.z),POSTERIOR,'thorax','posterior median line · depression inferior to C7 spinous process · centred',{projection:'posterior'});

// Suboccipital levels from bone (reviewer, 2026-09-21). GV15 sat over the C2 spinous process itself (its tip + 10 mm is
// still below its top) and GV16 was a fixed point 14 mm under the protuberance, 91 mm above GV15 where WHO has 0.5 B-cun.
// GV15: the depression between the C2 spinous process and the posterior arch of the atlas.
// GV16: the depression between the atlas and the lower edge of the occipital squama, still on the vertical below the EOP.
const axis=mesh(atlas,'Axis'),axisSpinousTop=most(pts(axis,(p)=>p.z<axis.box.min.z+0.008),v(0,1,0));
const atlasArch=most(pts(mesh(atlas,'Atlas')),POSTERIOR);
const occipitalEdge=most(pts(mesh(atlas,'Occipital bone'),(p)=>Math.abs(p.x)<0.01&&p.z<-0.04),v(0,-1,0));
place('GV15',v(0,(axisSpinousTop.y+atlasArch.y)/2,Math.min(axisSpinousTop.z,atlasArch.z)),POSTERIOR,['neck','head'],'posterior median line · depression superior to C2 spinous process (between C2 and the atlas)','posterior');
place('GV16',v(0,(atlasArch.y+occipitalEdge.y)/2,Math.min(atlasArch.z,occipitalEdge.z)),POSTERIOR,['neck','head'],'posterior median line · depression between the trapezius origins below the external occipital protuberance (occiput–atlas interval)','posterior');
place('GV17',v(...head.externalOccipitalProtuberance).add(v(0,-0.006,0)),v(0,.25,-1).normalize(),['head'],'posterior median line · depression at the external occipital protuberance · inferior correction','head');
// GV18–GV20 (reviewer, 2026-09-21: "one slot too far forward"). WHO spaces GV17 → GV18 → GV19 → GV20 1.5 B-cun apart
// with GV17 2.5 B-cun above the posterior hairline, i.e. 9.5 B-cun behind the anterior hairline. The shared scalp scale in
// head-cun.json takes anterior hairline → EOP as 11 B-cun, so every point measured from the front sat 1.5 B-cun short
// of its place. Here the scale is the skin arc from the anterior hairline to GV17 over 9.5 B-cun, which satisfies both
// ends at once (GV20 5 B-cun from the front and 4.5 B-cun above GV17). The GB head points and GV21–GV24 keep the shared
// scale; they were reviewed as correct.
const scalpMidline=section('x',0,v(0,1.6,-0.012),0.32);
const anteriorIndex=nearestIndex(scalpMidline,v(...head.anteriorHairline)),backward=stepToward(scalpMidline,anteriorIndex,'y',1);
const gv17Index=nearestIndex(scalpMidline,W.get('GV17'));
const GV_CUN=arcTo(scalpMidline,anteriorIndex,backward,(p)=>p===scalpMidline[gv17Index])/9.5;
for(const [code,cun,rule] of [['GV18',8,'4 B-cun above the posterior hairline · 1.5 B-cun above GV17'],['GV19',6.5,'5.5 B-cun above the posterior hairline · 1.5 B-cun above GV18'],['GV20',5,'5 B-cun behind the anterior hairline · 4.5 B-cun above GV17']]){
 const p=advance(scalpMidline,anteriorIndex,backward,cun*GV_CUN),out=p.clone().sub(v(0,1.59,0)).normalize();
 place(code,p.clone().addScaledVector(out,-0.004),out,['head'],`median scalp geodesic · ${rule} (GV scale ${(GV_CUN*1000).toFixed(1)} mm/B-cun)`,'head');
}
for(const code of ['GV21','GV22','GV23','GV24']){
 const cun={GV21:'anterior hairline +3.5 B-cun',GV22:'anterior hairline +2 B-cun',GV23:'anterior hairline +1 B-cun',GV24:'anterior hairline +0.5 B-cun'}[code];
 const p=v(...head.gvMidline[code]),out=p.clone().sub(v(0,1.59,0)).normalize();place(code,p,out,['head'],`median scalp geodesic · ${cun}`,'head');
}
// Reviewer (2026-09-21): the fixed point sat above the tip. Take the most anterior midline skin of the nose.
const noseTip=most(pts(mesh(atlas,'Skin'),(p)=>Math.abs(p.x)<0.004&&p.y>1.54&&p.y<1.60&&p.z>0.07),ANTERIOR);
place('GV25',noseTip.clone().setX(0),ANTERIOR,['face'],'apex of nose (most anterior midline skin of the nose)','anterior');
place('GV26',v(0,1.552,.094),ANTERIOR,['face'],'midline of philtrum · midpoint (WHO alternative: upper one-third / lower two-thirds junction)','anterior');
place('GV27',v(0,1.542,.092),ANTERIOR,['face'],'midpoint of tubercle of upper lip','anterior');

// GV28 is oral mucosa. Keep it on the actual upper-gingiva mesh; never project it to external facial skin.
const gingiva=mesh(atlas,'Gingiva of upper jaw'),midline=[];
for(let i=0;i<gingiva.vertexCount;i++){const p=v(gingiva.positions[i*3],gingiva.positions[i*3+1],gingiva.positions[i*3+2]);if(Math.abs(p.x)<.004)midline.push(p);}
const gv28=most(midline,ANTERIOR);
W.putDirect('GV28',v(0,gv28.y,gv28.z),ANTERIOR,'oral-mucosa','junction of superior labial frenulum and upper gingiva',{status:'implemented_unverified'});

W.write({label:'독맥',name:'독맥',english:'GOVERNOR VESSEL',primarySource:'https://m.kmcric.com/knowledge/acupoint/GV',secondarySource:'https://iris.who.int/handle/10665/353407'});
