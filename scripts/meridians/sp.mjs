/** SP1–SP21 (족태음비경). KCMRIC → WHO 2008 → local photo archive. */
import * as T from 'three';
import {atlas,mesh,centroid,v,mid,most,landmark,meridianWriter,UP,MEDIAL,ANTERIOR,POSTERIOR} from '../acupoint-kit.mjs';

const W=meridianWriter('SP');
const pts=(part,filter=()=>true)=>{const out=[];for(let i=0;i<part.vertexCount;i++){const p=v(part.positions[i*3],part.positions[i*3+1],part.positions[i*3+2]);if(filter(p))out.push(p);}return out;};
const place=(code,p,out,regions,rule)=>W.put(code,p.clone().addScaledVector(out,-0.004),out,regions,rule);
const skinMedial=v(0.85,0,0.35).normalize(), footUp=v(0.35,0.9,0.15).normalize();

// Medial hallux and first ray.
const dp=mesh(atlas,'Distal phalanx of right big toe'), pp=mesh(atlas,'Proximal phalanx of right big toe');
const mt1=mesh(atlas,'Right first metatarsal bone'), nav=mesh(atlas,'Navicular bone of right foot'), tibia=mesh(atlas,'Right tibia');
const halluxAxis=centroid(dp).sub(centroid(pp)).normalize();
const nail=most(pts(dp),v(0.7,0.35,0.45).normalize()).addScaledVector(halluxAxis,-0.0018);
place('SP1',nail,skinMedial,['foot-R'],'hallux medial nail-root corner · 0.1 F-cun proximal-medial');
const mtHead=most(pts(mt1),v(0,0,1)), mtBase=most(pts(mt1),v(0,0,-1));
place('SP2',mid(centroid(pp),mtHead).add(v(0.004,0,0.003)),footUp,['foot-R'],'distal depression of the 1st metatarsophalangeal joint · red-white border');
place('SP3',mtHead.clone().add(v(0.004,0,-0.009)),footUp,['foot-R'],'proximal depression of the 1st metatarsophalangeal joint · red-white border');
place('SP4',mtBase.clone().add(v(0.004,0,0.006)),footUp,['foot-R'],'anteroinferior to the base of the 1st metatarsal · red-white border');
const medialMalleolus=most(pts(tibia,p=>p.y<tibia.box.min.y+0.045),MEDIAL);
place('SP5',mid(medialMalleolus,most(pts(nav),MEDIAL)),skinMedial,['foot-R','leg-R'],'depression midway between medial malleolus prominence and navicular tuberosity');

// Medial tibial line: medial malleolus → medial tibial condyle is 13 B-cun.
const medialCondyle=most(pts(tibia,p=>p.y>tibia.box.max.y-0.07),MEDIAL);
const leg=(cun,posterior=0)=>medialMalleolus.clone().lerp(medialCondyle,cun/13).add(v(0.003,0,-posterior));
place('SP6',leg(3,0.006),skinMedial,['leg-R'],'3 B-cun above medial malleolus · posterior border of tibia');
place('SP7',leg(6,0.006),skinMedial,['leg-R'],'6 B-cun above medial malleolus · posterior border of tibia');
place('SP8',leg(10,0.009),skinMedial,['leg-R'],'3 B-cun below SP9 · posterior border of tibia');
place('SP9',medialCondyle.clone().add(v(0.004,-0.012,-0.010)),v(0.7,0,-0.7).normalize(),['leg-R','knee-R'],'KCMRIC/WHO: depression at the angle between the inferior border of the medial tibial condyle and posterior border of tibia (photo 2-cun note retained as teaching note only)');

const femur=mesh(atlas,'Right femur'), sartorius=mesh(atlas,'Right sartorius'), adductor=mesh(atlas,'Right adductor longus');
const kneeY=landmark('knee_joint_line').y, pubis=landmark('pubic_symphysis_superior',null);
const thighY=(cun)=>kneeY+(pubis.y-kneeY)*(cun/18);
const medialThigh=(y,zBias=0)=>{const band=[...pts(sartorius,p=>Math.abs(p.y-y)<0.008),...pts(adductor,p=>Math.abs(p.y-y)<0.008)];const p=most(band.length?band:pts(femur,p=>Math.abs(p.y-y)<0.015),MEDIAL);return v(p.x+0.004,y,p.z+zBias);};
place('SP10',medialThigh(thighY(2),0.012),v(0.75,0,0.65).normalize(),['thigh-R','knee-R'],'2 B-cun above medial patella base · vastus medialis prominence');
place('SP11',medialThigh(thighY(6),0.005),MEDIAL,['thigh-R'],'6 B-cun above SP10 level · between sartorius and adductor longus, near femoral artery');

// Abdomen: SP12–SP15 at 4 B-cun lateral; SP16–SP20 at 4–6 B-cun lateral.
const navel=landmark('umbilicus',null), trunkOut=ANTERIOR, lowerSpan=navel.y-pubis.y, lowerCun=lowerSpan/5;
const abdomen=(code,y,x,rule)=>place(code,v(x,y,0.07),trunkOut,['thigh-R','pelvis','lumbar','thorax'],rule);
abdomen('SP12',pubis.y,-0.078,'superior border of pubic symphysis · 4 B-cun lateral to anterior median line');
abdomen('SP13',pubis.y+lowerCun,-0.078,'1 B-cun above SP12 · 4 B-cun lateral to anterior median line');
abdomen('SP14',pubis.y+2*lowerCun,-0.078,'2 B-cun below umbilicus · 4 B-cun lateral to anterior median line');
abdomen('SP15',navel.y,-0.078,'level of umbilicus · 4 B-cun lateral to anterior median line');
abdomen('SP16',navel.y+0.087,-0.078,'3 B-cun above umbilicus (Jianli level) · 4 B-cun lateral');
const thoracicY=[1.215,1.255,1.292,1.325];
for(const [i,y] of thoracicY.entries()) abdomen(`SP${17+i}`,y,-0.116,`${5-i}th intercostal region · 6 B-cun lateral to anterior median line`);
place('SP21',v(-0.17,1.245,0),v(-1,0,0),['thorax'],'midaxillary line · 6th intercostal space');

const english=['Yinbai','Dadu','Taibai','Gongsun','Shangqiu','Sanyinjiao','Lougu','Diji','Yinlingquan','Xuehai','Jimen','Chongmen','Fushe','Fujie','Daheng','Fuai','Shidou','Tianxi','Xiongxiang','Zhourong','Dabao'];
const overrides=Object.fromEntries(english.map((name,i)=>[`SP${i+1}`,{english:name}]));
overrides.SP9.location='종아리 안쪽면, 정강뼈 안쪽관절융기 아래모서리와 정강뼈 안쪽모서리가 이루는 각의 오목한 곳 (KCMRIC·WHO 기준; 사진의 2촌 표기는 수업 참고)';
W.write({label:'비경',name:'족태음비경',english:'SPLEEN MERIDIAN',primarySource:'https://m.kmcric.com/knowledge/acupoint/SP',secondarySource:'https://iris.who.int/handle/10665/353407'},overrides);
