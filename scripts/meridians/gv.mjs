/** GV1–GV28 (독맥). KCMRIC → WHO 2008 → local GV01–GV28 images, all 1:1 checked. */
import fs from 'node:fs';
import {atlas,mesh,v,most,landmark,meridianWriter,ANTERIOR,POSTERIOR} from '../acupoint-kit.mjs';

const W=meridianWriter('GV');
const place=(code,p,out,regions,rule,projection)=>W.put(code,p.clone().addScaledVector(out,-0.004),out,regions,rule,{projection});
const head=JSON.parse(fs.readFileSync(new URL('../../data/head-cun.json',import.meta.url),'utf8')).scalp;

place('GV1',v(0,.850,-.082),POSTERIOR,['pelvis'],'midpoint of coccyx tip and anus · posterior median line','posterior');
place('GV2',landmark('sacral_hiatus',null),POSTERIOR,['pelvis','lumbar'],'sacral hiatus · posterior median line','posterior');
const levels=[['GV3','L4'],['GV4','L2'],['GV5','L1'],['GV6','T11'],['GV7','T10'],['GV8','T9'],['GV9','T7'],['GV10','T6'],['GV11','T5'],['GV12','T3'],['GV13','T1'],['GV14','C7']];
for(const [code,level] of levels){const p=landmark(`spinous_process_${level}.inferior_border`,null);place(code,p,POSTERIOR,level.startsWith('L')?['lumbar','pelvis']:['thorax','neck'],`posterior median line · depression inferior to ${level} spinous process`,'posterior');}
const gv14Surface=W.get('GV14');
W.putDirect('GV14',v(0,gv14Surface.y,gv14Surface.z),POSTERIOR,'thorax','posterior median line · depression inferior to C7 spinous process · centred',{projection:'posterior'});

const axis=mesh(atlas,'Axis'),axisSpinous=most(Array.from({length:axis.vertexCount},(_,i)=>v(axis.positions[i*3],axis.positions[i*3+1],axis.positions[i*3+2])).filter((p)=>p.z<axis.box.min.z+0.012),POSTERIOR);
place('GV15',v(0,axisSpinous.y+0.010,axisSpinous.z),POSTERIOR,['neck','head'],'posterior median line · immediately superior to C2 spinous process','posterior');
place('GV16',v(0,1.615,-.118),POSTERIOR,['neck','head'],'depression between trapezius origins directly inferior to external occipital protuberance','posterior');
place('GV17',v(...head.externalOccipitalProtuberance).add(v(0,-0.006,0)),v(0,.25,-1).normalize(),['head'],'posterior median line · depression at the external occipital protuberance · inferior correction','head');
for(const code of ['GV18','GV19','GV20','GV21','GV22','GV23','GV24']){
 const cun={GV18:'posterior hairline +4 B-cun',GV19:'posterior hairline +5.5 B-cun',GV20:'anterior hairline +5 B-cun',GV21:'anterior hairline +3.5 B-cun',GV22:'anterior hairline +2 B-cun',GV23:'anterior hairline +1 B-cun',GV24:'anterior hairline +0.5 B-cun'}[code];
 const posteriorCorrection={GV18:-.014,GV19:-.012,GV20:-.003}[code]??0;
 const p=v(...head.gvMidline[code]).add(v(0,0,posteriorCorrection)),out=p.clone().sub(v(0,1.59,0)).normalize();place(code,p,out,['head'],`median scalp geodesic · ${cun}${posteriorCorrection?' · posterior manual correction':''}`,'head');
}
place('GV25',v(0,1.572,.108),ANTERIOR,['face'],'apex of nose','anterior');
place('GV26',v(0,1.552,.094),ANTERIOR,['face'],'midline of philtrum · midpoint (WHO alternative: upper one-third / lower two-thirds junction)','anterior');
place('GV27',v(0,1.542,.092),ANTERIOR,['face'],'midpoint of tubercle of upper lip','anterior');

// GV28 is oral mucosa. Keep it on the actual upper-gingiva mesh; never project it to external facial skin.
const gingiva=mesh(atlas,'Gingiva of upper jaw'),midline=[];
for(let i=0;i<gingiva.vertexCount;i++){const p=v(gingiva.positions[i*3],gingiva.positions[i*3+1],gingiva.positions[i*3+2]);if(Math.abs(p.x)<.004)midline.push(p);}
const gv28=most(midline,ANTERIOR);
W.putDirect('GV28',v(0,gv28.y,gv28.z),ANTERIOR,'oral-mucosa','junction of superior labial frenulum and upper gingiva',{status:'implemented_unverified'});

W.write({label:'독맥',name:'독맥',english:'GOVERNOR VESSEL',primarySource:'https://m.kmcric.com/knowledge/acupoint/GV',secondarySource:'https://iris.who.int/handle/10665/353407'});
