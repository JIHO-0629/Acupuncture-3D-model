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

// Occiput and suboccipital levels from bone (reviewer, 2026-09-21).
// External occipital protuberance: the registered surface landmark (data/landmarks.json) — the lower edge of the
// posterior occipital bulge, where the reviewer marked it, not the rearmost point 30 mm higher.
const eop=landmark('external_occipital_protuberance',null);
// GV15: the depression between the C2 spinous process and the posterior arch of the atlas.
const axis=mesh(atlas,'Axis'),axisSpinousTop=most(pts(axis,(p)=>p.z<axis.box.min.z+0.008),v(0,1,0));
const atlasArch=most(pts(mesh(atlas,'Atlas')),POSTERIOR);
place('GV15',v(0,(axisSpinousTop.y+atlasArch.y)/2,Math.min(axisSpinousTop.z,atlasArch.z)),POSTERIOR,['neck','head'],'posterior median line · depression superior to C2 spinous process (between C2 and the atlas)','posterior');
// GV16: directly below the protuberance, in the depression between the trapezius origins.
place('GV16',v(0,eop.y-0.015,eop.z+0.006),POSTERIOR,['neck','head'],'posterior median line · depression directly inferior to the external occipital protuberance, between the trapezius origins','posterior');
// GV17: the depression directly above the protuberance.
place('GV17',v(0,eop.y+0.008,eop.z),v(0,.25,-1).normalize(),['head'],'posterior median line · depression superior to the external occipital protuberance','head');

// GV20 (reviewer sketch, 2026-09-21): where the line of the auricles, carried up along their long axis, crosses the
// midline. Both auricles lean back, so the plane holding their lobule→apex axes is tilted posteriorly; GV20 is its
// intersection with the scalp midline. Auricle landmarks are the presentation's own (app/ear-anatomy.ts, see te.mjs).
const EAR_APEX=v(-0.0737,1.6226,-0.0298),EAR_LOBULE=v(-0.0656,1.5666,-0.0082);
const earAxis=EAR_APEX.clone().sub(EAR_LOBULE).normalize(),earPlaneNormal=v(1,0,0).cross(earAxis).normalize();
const earPlane=(p)=>earPlaneNormal.dot(p.clone().sub(EAR_APEX));
const scalpMidline=section('x',0,v(0,1.6,-0.012),0.32);
const anteriorIndex=nearestIndex(scalpMidline,v(...head.anteriorHairline)),backward=stepToward(scalpMidline,anteriorIndex,'y',1);
const gv20Index=scalpMidline.reduce((b,p,i)=>(p.y>1.66&&Math.abs(earPlane(p))<Math.abs(earPlane(scalpMidline[b]))?i:b),nearestIndex(scalpMidline,v(0,1.72,-0.03)));
const arcFromFront=(index)=>arcTo(scalpMidline,anteriorIndex,backward,(p)=>p===scalpMidline[index]);
// Head proportional cun: GV20 is 5 B-cun behind the anterior hairline, which sets the scale for GV21–GV24.
const HEAD_CUN=arcFromFront(gv20Index)/5;
const gv20=scalpMidline[gv20Index],headOut=(p)=>p.clone().sub(v(0,1.59,0)).normalize();
place('GV20',gv20.clone().addScaledVector(headOut(gv20),-0.004),headOut(gv20),['head'],`median scalp · where the plane of the auricular long axes crosses the midline · 5 B-cun behind the anterior hairline (head scale ${(HEAD_CUN*1000).toFixed(1)} mm/B-cun)`,'head');
// GV18/GV19: WHO spaces GV17 → GV18 → GV19 → GV20 1.5 B-cun apart, so the GV20–GV17 arc is split into thirds.
const gv17Index=nearestIndex(scalpMidline,W.get('GV17'));
const toGv17=arcFromFront(gv17Index)-arcFromFront(gv20Index);
for(const [code,share,rule] of [['GV19',1/3,'1.5 B-cun below GV20 toward GV17 (5.5 B-cun above the posterior hairline)'],['GV18',2/3,'1.5 B-cun above GV17 (4 B-cun above the posterior hairline)']]){
 const p=advance(scalpMidline,gv20Index,backward,share*toGv17);
 place(code,p.clone().addScaledVector(headOut(p),-0.004),headOut(p),['head'],`median scalp · ${rule} · GV20–GV17 arc in thirds (${(toGv17/4.5*1000).toFixed(1)} mm/B-cun)`,'head');
}
for(const [code,cun] of [['GV21',3.5],['GV22',2],['GV23',1],['GV24',0.5]]){
 const p=advance(scalpMidline,anteriorIndex,backward,cun*HEAD_CUN);
 place(code,p.clone().addScaledVector(headOut(p),-0.004),headOut(p),['head'],`median scalp · ${cun} B-cun behind the anterior hairline (head scale set by GV20)`,'head');
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
