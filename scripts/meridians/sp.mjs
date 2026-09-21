/** SP1–SP21 (족태음비경). KCMRIC → WHO 2008 → local photo archive. */
import * as T from 'three';
import {atlas,mesh,centroid,v,mid,most,landmark,meridianWriter,UP,DOWN,MEDIAL,ANTERIOR,POSTERIOR} from '../acupoint-kit.mjs';

const W=meridianWriter('SP');
const pts=(part,filter=()=>true)=>{const out=[];for(let i=0;i<part.vertexCount;i++){const p=v(part.positions[i*3],part.positions[i*3+1],part.positions[i*3+2]);if(filter(p))out.push(p);}return out;};
const lowest=(points)=>most(points,DOWN),highest=(points)=>most(points,UP);
const exists=(name)=>{try{mesh(atlas,name);return true;}catch{return false;}};
const place=(code,p,out,regions,rule)=>W.put(code,p.clone().addScaledVector(out,-0.004),out,regions,rule);
const skinMedial=v(0.85,0,0.35).normalize(), footUp=v(0.35,0.9,0.15).normalize();

// Medial hallux and first ray.
const dp=mesh(atlas,'Distal phalanx of right big toe'), pp=mesh(atlas,'Proximal phalanx of right big toe');
const mt1=mesh(atlas,'Right first metatarsal bone'), nav=mesh(atlas,'Navicular bone of right foot'), tibia=mesh(atlas,'Right tibia');
const halluxAxis=centroid(dp).sub(centroid(pp)).normalize();
const nail=most(pts(dp),v(0.7,0.35,0.45).normalize()).addScaledVector(halluxAxis,-0.0018);
place('SP1',nail,skinMedial,['foot-R'],'hallux medial nail-root corner · 0.1 F-cun proximal-medial');
const mtHead=most(pts(mt1),v(0,0,1)), mtBase=most(pts(mt1),v(0,0,-1));
place('SP2',mid(centroid(pp),mtHead).add(v(0.004,-0.003,-0.004)),v(0.45,-0.82,0.35).normalize(),['foot-R'],'distal depression of the 1st metatarsophalangeal joint · plantar side of the red-white border');
place('SP3',mtHead.clone().add(v(0.004,-0.005,-0.009)),v(0.45,-0.86,0.25).normalize(),['foot-R'],'proximal depression of the 1st metatarsophalangeal joint · plantar side of the red-white border');
place('SP4',mtBase.clone().add(v(0.004,-0.005,0.002)),v(0.5,-0.84,0.2).normalize(),['foot-R'],'anteroinferior to the base of the 1st metatarsal · plantar side of the red-white border');
const medialMalleolus=most(pts(tibia,p=>p.y<tibia.box.min.y+0.045),MEDIAL);
place('SP5',mid(medialMalleolus,most(pts(nav),MEDIAL)).add(v(0,0.006,0)),skinMedial,['foot-R','leg-R'],'depression between medial malleolus prominence and navicular tuberosity · superior correction');

// Medial tibial line: medial malleolus → medial tibial condyle is 13 B-cun.
const medialCondyle=most(pts(tibia,p=>p.y>tibia.box.max.y-0.07),MEDIAL);
const leg=(cun,posterior=0)=>medialMalleolus.clone().lerp(medialCondyle,cun/13).add(v(0.003,0,-posterior));
place('SP6',leg(3,0),skinMedial,['leg-R'],'3 B-cun above medial malleolus · medial border of tibia');
place('SP7',leg(6,0),skinMedial,['leg-R'],'6 B-cun above medial malleolus · medial border of tibia');
place('SP8',leg(10,0.002),skinMedial,['leg-R'],'3 B-cun below SP9 · medial border of tibia');
place('SP9',medialCondyle.clone().add(v(0.004,-0.012,0.002)),v(0.82,0,-0.25).normalize(),['leg-R','knee-R'],'KCMRIC/WHO: depression at the angle between the inferior border of the medial tibial condyle and medial border of tibia · anterior correction');

const femur=mesh(atlas,'Right femur'), sartorius=mesh(atlas,'Right sartorius'), adductor=mesh(atlas,'Right adductor longus');
// WHO: superior border of the pubic symphysis → base of the patella = 18 B-cun. SP10 and SP11 are measured from the
// patella base itself; the knee joint line used before sits 30 mm lower and left SP10 at 0.8 B-cun.
const patellaBase=landmark('patella_base'), pubis=landmark('pubic_symphysis_superior',null);
const thighY=(cun)=>patellaBase.y+(pubis.y-patellaBase.y)*(cun/18);
const medialThigh=(y,zBias=0)=>{const band=[...pts(sartorius,p=>Math.abs(p.y-y)<0.008),...pts(adductor,p=>Math.abs(p.y-y)<0.008)];const p=most(band.length?band:pts(femur,p=>Math.abs(p.y-y)<0.015),MEDIAL);return v(p.x+0.004,y,p.z+zBias);};
// Reviewer (2026-09-21): the needle belongs in vastus medialis, so the point is its anteromedial bulge at this level.
const spOut10=v(0.55,0,0.83).normalize(), vm10=most(pts(mesh(atlas,'Right vastus medialis'),p=>Math.abs(p.y-thighY(2))<0.004),spOut10);
place('SP10',vm10.clone().setY(thighY(2)).addScaledVector(spOut10,-0.004),spOut10,['thigh-R','knee-R'],'2 B-cun above the medial end of the patella base · prominence of vastus medialis');
place('SP11',medialThigh(thighY(12),0.005),MEDIAL,['thigh-R'],'junction of the upper 1/3 and lower 2/3 of the medial patella-base–SP12 line · between sartorius and adductor longus, near femoral artery');

// Abdomen: SP12–SP15 at 4 B-cun lateral; SP16–SP20 at 4–6 B-cun lateral.
const navel=landmark('umbilicus',null), trunkOut=ANTERIOR, lowerSpan=navel.y-pubis.y, lowerCun=lowerSpan/5;
const abdomen=(code,y,x,rule)=>place(code,v(x,y,0.07),trunkOut,['thigh-R','pelvis','lumbar','thorax'],rule);
abdomen('SP12',pubis.y,-0.078,'superior border of pubic symphysis · 4 B-cun lateral to anterior median line');
abdomen('SP13',pubis.y+lowerCun,-0.078,'1 B-cun above SP12 · 4 B-cun lateral to anterior median line');
// Sheet/KCMRIC: 1.3 B-cun below the umbilicus, which also lands above the ASIS, as the reviewer expected. The old
// formula placed it 3 B-cun below and then clamped it up to the ASIS level.
abdomen('SP14',navel.y-1.3*lowerCun,-0.078,'1.3 B-cun below the centre of the umbilicus · 4 B-cun lateral to anterior median line');
abdomen('SP15',navel.y,-0.078,'level of umbilicus · 4 B-cun lateral to anterior median line');
abdomen('SP16',navel.y+0.087,-0.078,'3 B-cun above umbilicus (Jianli level) · 4 B-cun lateral');
const ribParts=['first','second','third','fourth','fifth','sixth'].map((name)=>
  [`Right ${name} rib`,`Right ${name} costal cartilage`].filter(exists).map((part)=>mesh(atlas,part)));
const ribBand=(number,x)=>{
  const column=ribParts[number-1].flatMap((part)=>pts(part,(p)=>Math.abs(p.x-x)<0.005&&p.z>0.015));
  const sample=column.length?column:ribParts[number-1].flatMap((part)=>pts(part,(p)=>p.x>x&&p.x<x+0.04&&p.z>0));
  if(!sample.length)throw new Error(`rib ${number} not found near x=${x}`);
  return {low:lowest(sample).y,high:highest(sample).y};
};
const intercostal=(number,x)=>(ribBand(number,x).low+ribBand(number+1,x).high)/2;
for(const [i,number] of [5,4,3,2].entries()){
  const y=intercostal(number,-0.116);
  abdomen(`SP${17+i}`,y,-0.116,`${{2:"2nd",3:"3rd",4:"4th",5:"5th"}[number]} intercostal space measured from the actual lateral rib curve · 6 B-cun lateral to anterior median line`);
}
place('SP21',v(-0.17,1.245,0),v(-1,0,0),['thorax'],'midaxillary line · 6th intercostal space');

const english=['Yinbai','Dadu','Taibai','Gongsun','Shangqiu','Sanyinjiao','Lougu','Diji','Yinlingquan','Xuehai','Jimen','Chongmen','Fushe','Fujie','Daheng','Fuai','Shidou','Tianxi','Xiongxiang','Zhourong','Dabao'];
const overrides=Object.fromEntries(english.map((name,i)=>[`SP${i+1}`,{english:name}]));
overrides.SP9.location='종아리 안쪽면, 정강뼈 안쪽관절융기 아래모서리와 정강뼈 안쪽모서리가 이루는 각의 오목한 곳 (KCMRIC·WHO 기준; 사진의 2촌 표기는 수업 참고)';
W.write({label:'비경',name:'족태음비경',english:'SPLEEN MERIDIAN',primarySource:'https://m.kmcric.com/knowledge/acupoint/SP',secondarySource:'https://iris.who.int/handle/10665/353407'},overrides);
