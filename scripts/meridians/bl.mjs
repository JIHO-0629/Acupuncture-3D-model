/** BL1–BL67 (족태양방광경). KCMRIC → WHO 2008 → local photo archive. */
import fs from 'node:fs';
import * as T from 'three';
import {atlas,mesh,centroid,v,mid,most,landmark,meridianWriter,toSkin,LATERAL,MEDIAL,ANTERIOR,POSTERIOR,UP,DOWN} from '../acupoint-kit.mjs';
import {threeMesh} from '../atlas-geometry.mjs';

const W=meridianWriter('BL');
const pts=(part,filter=()=>true)=>{const out=[];for(let i=0;i<part.vertexCount;i++){const p=v(part.positions[i*3],part.positions[i*3+1],part.positions[i*3+2]);if(filter(p))out.push(p);}return out;};
const place=(code,p,out,regions,rule)=>W.put(code,p.clone().addScaledVector(out,-0.004),out,regions,rule);
const headOut=(p)=>p.clone().sub(v(0,1.60,-0.01)).normalize();

// Face and the 1.5 B-cun paramedian scalp line.
place('BL1',v(-0.010,1.596,0.072),v(-0.2,0,0.98).normalize(),['face'],'depression between superomedial canthus and medial orbital wall');
place('BL2',v(-0.012,1.615,0.070),v(-0.2,0.15,0.97).normalize(),['face','head'],'depression at medial end of eyebrow · supraorbital notch');
const scalp=[[-.025,1.671,.052],[-.025,1.679,.044],[-.025,1.688,.030],[-.025,1.696,.012],[-.025,1.699,-.008],[-.025,1.696,-.030],[-.025,1.688,-.050],[-.025,1.676,-.066]];
for(let i=0;i<scalp.length;i++){const p=v(...scalp[i]);place(`BL${i+3}`,p,headOut(p),['head'],`1.5 B-cun lateral scalp line · BL${i+3} standard hairline/vertex level`);}
// Reviewer corrections (2026-09-21). The array above ran BL9/BL10 over the vertex, 78 mm above the protuberance and
// 170 mm above C2; they are re-anchored on bone. BL3 goes on the vertical through BL2, not on the 1.5 B-cun line.
{const p=v(-0.012,scalp[0][1],scalp[0][2]);place('BL3',p,headOut(p),['head','face'],'directly superior to BL2 (medial end of the eyebrow) · 0.5 B-cun into the anterior hairline');}
const gvRows=JSON.parse(fs.readFileSync(new URL('../../data/meridians/GV.json',import.meta.url),'utf8')).points;
const gvSeed=(code)=>v(...gvRows.find((p)=>p.code===code).seed);
const headCun=JSON.parse(fs.readFileSync(new URL('../../data/head-cun.json',import.meta.url),'utf8'));
const x13=-1.3*headCun.posteriorTransverse.cunMm/1000;
// BL9: level with the superior border of the external occipital protuberance, i.e. with GV17, 1.3 B-cun lateral.
place('BL9',v(x13,gvSeed('GV17').y,-0.105),POSTERIOR,['head','neck'],'level with the superior border of the external occipital protuberance (GV17) · 1.3 B-cun lateral to the posterior median line');
// BL10: level with the superior border of the C2 spinous process. Reviewer: height only for now; the trapezius edge
// itself needs a rendering fix before the lateral position can be judged.
const axisBone=mesh(atlas,'Axis'),c2Top=most(pts(axisBone,(p)=>p.z<axisBone.box.min.z+0.008),UP);
place('BL10',v(-0.032,c2Top.y,-0.075),POSTERIOR,['neck','head'],'level with the superior border of the C2 spinous process · lateral to the trapezius, 1.3 B-cun lateral');

// First posterior line: 1.5 B-cun lateral, indexed by vertebral inferior border.
const innerLevels=[['BL11','T1'],['BL12','T2'],['BL13','T3'],['BL14','T4'],['BL15','T5'],['BL16','T6'],['BL17','T7'],['BL18','T9'],['BL19','T10'],['BL20','T11'],['BL21','T12'],['BL22','L1'],['BL23','L2'],['BL24','L3'],['BL25','L4'],['BL26','L5']];
for(const [code,level] of innerLevels){const lm=landmark(`spinous_process_${level}.inferior_border`,null);place(code,v(-0.031,lm.y,lm.z),POSTERIOR,level.startsWith('L')?['lumbar','pelvis']:['thorax'],`inferior border of ${level} spinous process · 1.5 B-cun lateral to posterior median line`);}
// Posterior sacral foramina levels and neighbouring inner line.
// Posterior sacral foramina, found on the sacrum itself (reviewer, 2026-09-21: the fixed heights sat 17–46 mm low).
// Rays cast forward from behind the sacrum on a 1 mm grid: a foramen is where the ray passes through (a hole) or lands
// well anterior of the bone ring around it. The four strongest such cells, top to bottom, are S1–S4.
const sacrum=mesh(atlas,'Sacrum'),sacrumObject=threeMesh(sacrum),sacralCaster=new T.Raycaster();
const sacralDepth=(x,y)=>{sacralCaster.set(v(x,y,-0.25),v(0,0,1));sacralCaster.far=0.3;const hit=sacralCaster.intersectObject(sacrumObject,false)[0];return hit?hit.point.z:null;};
const foramina=(()=>{
  const cells=[];
  for(let y=0.905;y<=0.99;y+=0.001)for(let x=-0.032;x<=-0.008;x+=0.001){
    const ring=[];for(let k=0;k<12;k++){const a=k/12*Math.PI*2;ring.push(sacralDepth(x+Math.cos(a)*0.007,y+Math.sin(a)*0.007));}
    const bone=ring.filter((z)=>z!==null);if(bone.length<11)continue;
    const reference=bone.sort((a,b)=>a-b)[Math.floor(bone.length/2)],z=sacralDepth(x,y);
    cells.push({x,y,score:z===null?0.03:z-reference,z:z??reference});
  }
  const picked=[];
  for(const c of cells.sort((a,b)=>b.score-a.score)){if(c.score<0.006)break;if(picked.every((p)=>Math.hypot(p.x-c.x,p.y-c.y)>0.012))picked.push(c);if(picked.length===4)break;}
  if(picked.length!==4)throw new Error(`found ${picked.length} posterior sacral foramina, expected 4`);
  return picked.sort((a,b)=>b.y-a.y);
})();
for(let i=0;i<4;i++) place(`BL${27+i}`,v(-.031,foramina[i].y,-.081),POSTERIOR,['pelvis','lumbar'],`S${i+1} posterior sacral foramen level · 1.5 B-cun lateral line`);
for(let i=0;i<4;i++) place(`BL${31+i}`,v(foramina[i].x,foramina[i].y,foramina[i].z),POSTERIOR,['pelvis','lumbar'],`${i+1}${['st','nd','rd','th'][i]} posterior sacral foramen (detected on the sacrum)`);
// BodyParts3D has no separate coccyx; the sacrum mesh ends in it. BL35 is level with that tip.
place('BL35',v(-.012,sacrum.box.min.y,-.091),POSTERIOR,['pelvis'],'0.5 B-cun lateral to the tip of the coccyx (lower end of the sacrococcygeal mesh)');

// Posterior thigh and popliteal crease.
const pop=landmark('popliteal_crease');
// Reviewer (2026-09-21): BL36 height only — the lower border of gluteus maximus.
const gmBorder=most(pts(mesh(atlas,'Right gluteus maximus'),(p)=>Math.abs(p.x+.085)<.006&&p.z<-.06),DOWN);
const bl36=v(-.085,gmBorder.y,-.102);
place('BL36',bl36,POSTERIOR,['pelvis','thigh-R'],'centre of the gluteal fold · lower border of gluteus maximus');
// BL40: centre of the popliteal crease, midway between the semitendinosus (medial end) and biceps femoris (lateral end).
const bfLong=mesh(atlas,'Long head of right biceps femoris');
const creaseMedial=most(pts(mesh(atlas,'Right semitendinosus'),(p)=>Math.abs(p.y-pop.y)<.004),MEDIAL),creaseLateral=most(pts(bfLong,(p)=>Math.abs(p.y-pop.y)<.004),LATERAL);
const bl40=v((creaseMedial.x+creaseLateral.x)/2,pop.y,pop.z);
// BL37: on the BL36–BL40 line, 6 of the 14 B-cun from the gluteal fold to the popliteal crease.
place('BL37',bl36.clone().lerp(bl40,6/14),POSTERIOR,['thigh-R'],'on the BL36–BL40 line · 6 B-cun below the centre of the gluteal fold');
// BL38/BL39 hug the medial border of the biceps femoris long head (the first correction overshot onto the muscle).
const bfMedial=(y)=>most(pts(bfLong,(p)=>Math.abs(p.y-y)<.004),MEDIAL);
for(const [code,y,z,rule] of [['BL38',.485,-.088,'1 B-cun above BL39 · immediately medial to the long head of biceps femoris'],['BL39',.463,-.091,'lateral end of popliteal crease · immediately medial to the biceps femoris tendon']])
  place(code,v(bfMedial(y).x+.003,y,z),POSTERIOR,['thigh-R','knee-R','leg-R'],rule);
// 2026-09-23: at the crease the two gastrocnemius heads meet in this model; the skin normal tilted the needle into
// the lateral head. The point is where they meet, and the needle goes straight forward into the fossa.
{
  const heads=[mesh(atlas,'Lateral head of right gastrocnemius'),mesh(atlas,'Medial head of right gastrocnemius')];
  const y=bl40.y,inner=[most(pts(heads[0],p=>Math.abs(p.y-y)<.004),MEDIAL),most(pts(heads[1],p=>Math.abs(p.y-y)<.004),LATERAL)];
  const x=(inner[0].x+inner[1].x)/2;
  W.putDirect('BL40',toSkin(v(x,y,-0.06),POSTERIOR,['knee-R','leg-R']).point,POSTERIOR,'knee-R','midpoint of popliteal crease (between the semitendinosus and biceps femoris ends) · between the gastrocnemius heads');
}

// Outer posterior line: 3 B-cun lateral. T2–T7, T9–T12, L1–L2, then S2/S4.
const outerLevels=[['BL41','T2'],['BL42','T3'],['BL43','T4'],['BL44','T5'],['BL45','T6'],['BL46','T7'],['BL47','T9'],['BL48','T10'],['BL49','T11'],['BL50','T12'],['BL51','L1'],['BL52','L2']];
for(const [code,level] of outerLevels){const lm=landmark(`spinous_process_${level}.inferior_border`,null);place(code,v(-0.064,lm.y,lm.z+0.003),POSTERIOR,level.startsWith('L')?['thorax','lumbar','pelvis']:['thorax','shoulder'],`inferior border of ${level} spinous process · 3 B-cun lateral to posterior median line`);}
place('BL53',v(-.064,foramina[1].y,-.074),POSTERIOR,['pelvis','lumbar'],'S2 level · 3 B-cun lateral to posterior median line');
place('BL54',v(-.064,foramina[3].y,-.078),POSTERIOR,['pelvis'],'S4 level · 3 B-cun lateral to posterior median line');

// Posterior lower leg: popliteal crease → BL60 is 16 B-cun.
const fibula=mesh(atlas,'Right fibula'), calcaneus=mesh(atlas,'Right calcaneus'), achilles=mesh(atlas,'Right calcaneal tendon');
const gastLat=mesh(atlas,'Lateral head of right gastrocnemius'),gastMed=mesh(atlas,'Medial head of right gastrocnemius');
const lateralMalleolus=landmark('lateral_malleolus_prominence');
const heelSide=most(pts(achilles,p=>Math.abs(p.y-lateralMalleolus.y)<.02),LATERAL), bl60=mid(lateralMalleolus,heelSide).add(v(0,0,-.004));
const legAt=(fromKnee)=>pop.clone().lerp(bl60,fromKnee/16);
const y55=legAt(2).y,innerLat=most(pts(gastLat,p=>Math.abs(p.y-y55)<.006),MEDIAL),innerMed=most(pts(gastMed,p=>Math.abs(p.y-y55)<.006),LATERAL);
// BL57: the inverted V where the two bellies part, centred between their inner edges (it had sat on the lateral belly).
const y57=Math.max(gastLat.box.min.y,gastMed.box.min.y)+.012;
const inner57=[most(pts(gastLat,p=>Math.abs(p.y-y57)<.005),MEDIAL),most(pts(gastMed,p=>Math.abs(p.y-y57)<.005),LATERAL)];
const bl55=mid(innerLat,innerMed).setY(y55),bl57=v((inner57[0].x+inner57[1].x)/2,y57,Math.min(inner57[0].z,inner57[1].z));
place('BL55',bl55,POSTERIOR,['leg-R','knee-R'],'2 B-cun distal to popliteal crease · junction between gastrocnemius heads');
place('BL56',mid(bl55,bl57),POSTERIOR,['leg-R'],'midpoint of BL55–BL57 · between gastrocnemius bellies');
place('BL57',bl57,POSTERIOR,['leg-R'],'inferior split of gastrocnemius bellies · junction with calcaneal tendon');
place('BL58',legAt(9).setY(gastLat.box.min.y+.010).add(v(-.010,0,0)),v(-.45,0,-.89).normalize(),['leg-R'],'inferior end of lateral gastrocnemius · lateral to BL57');
place('BL59',v(bl60.x,legAt(13).y,bl60.z),v(-.55,0,-.84).normalize(),['leg-R'],'3 B-cun vertically proximal to BL60 · posterior border of fibula');
// 2026-09-23: the lateral projection landed on the malleolus side and the needle went through fibularis longus into
// the fibula. The depression is halfway between the fibula's posterior border and the tendon's lateral edge; the
// needle points across it toward KI3.
{
  const y=lateralMalleolus.y,fib=most(pts(fibula,p=>Math.abs(p.y-y)<.004),POSTERIOR),tendon=most(pts(achilles,p=>Math.abs(p.y-y)<.004),LATERAL);
  const out=v(-.6,0,-.8).normalize();
  W.putDirect('BL60',toSkin(mid(fib,tendon).setY(y),out,['leg-R','foot-R']).point,out,'foot-R','depression between lateral malleolus prominence and calcaneal tendon · level with malleolus prominence');
}

// Lateral foot and little toe.
const mt5=mesh(atlas,'Right fifth metatarsal bone'), pp5=mesh(atlas,'Proximal phalanx of right little toe'), dp5=mesh(atlas,'Distal phalanx of right little toe');
const footOut=v(-.75,.45,-.48).normalize(), mtBase=most(pts(mt5),v(0,0,-1)), mtHead=most(pts(mt5),v(0,0,1));
const calcaneusFloor=most(pts(calcaneus),v(-.5,-1,-.2).normalize());
place('BL61',mid(bl60,calcaneusFloor),footOut,['foot-R'],'midpoint between BL60 and the inferior lateral calcaneus · red-white border');
// Reviewer (2026-09-21): straight below the fibular tip; nearest-skin snapping pulled it anterior.
const fibulaTip=most(pts(fibula),DOWN);
place('BL62',v(lateralMalleolus.x+.012,fibulaTip.y-.007,lateralMalleolus.z),v(-1,-.2,0).normalize(),['foot-R'],'directly inferior to the lateral malleolus prominence · depression between the tip of the fibula and the calcaneus');
const cuboid=mesh(atlas,'Right cuboid bone');
W.putNearest('BL63',most(pts(cuboid),LATERAL),['foot-R'],'lateral prominence of the cuboid · posterior to 5th metatarsal tuberosity');
W.putNearest('BL64',mtBase.clone().add(v(-.005,0,.008)),['foot-R'],'distal to tuberosity of 5th metatarsal · red-white border');
place('BL65',mtHead.clone().add(v(-.005,-.004,-.010)),v(-.55,-.78,.3).normalize(),['foot-R'],'proximal depression of 5th metatarsophalangeal joint · plantar side of red-white border');
W.putNearest('BL66',mid(centroid(pp5),mtHead).add(v(-.004,0,.004)),['foot-R'],'distal depression of 5th metatarsophalangeal joint · red-white border');
const toeAxis=centroid(dp5).sub(centroid(pp5)).normalize(), nail=most(pts(dp5),v(-.7,.4,.5).normalize()).addScaledVector(toeAxis,-.0018);
place('BL67',nail,footOut,['foot-R'],'little-toe lateral nail-root corner · 0.1 F-cun proximal');

const english=['Jingming','Zanzhu','Meichong','Qucha','Wuchu','Chengguang','Tongtian','Luoque','Yuzhen','Tianzhu','Dashu','Fengmen','Feishu','Jueyinshu','Xinshu','Dushu','Geshu','Ganshu','Danshu','Pishu','Weishu','Sanjiaoshu','Shenshu','Qihaishu','Dachangshu','Yuanguanshu','Xiaochangshu','Pangguangshu','Zhonglvshu','Baihuanshu','Shangliao','Ciliao','Zhongliao','Xialiao','Huiyang','Chengfu','Yinmen','Fuxi','Weiyang','Weizhong','Fufen','Pohu','Gaohuangshu','Shentang','Yixi','Geguan','Hunmen','Yanggang','Yishe','Weicang','Huangmen','Zhishi','Baohuang','Zhibian','Heyang','Chengjin','Chengshan','Feiyang','Fuyang','Kunlun','Pucan','Shenmai','Jinmen','Jinggu','Shugu','Zutonggu','Zhiyin'];
const overrides=Object.fromEntries(english.map((name,i)=>[`BL${i+1}`,{english:name}]));
overrides.BL21.location='등 위쪽, 열두째 등뼈(T12) 가시돌기 아래모서리와 같은 높이, 뒤정중선에서 가쪽으로 1.5촌 (KCMRIC·WHO 기준; 로컬 자료의 열두째 갈비 표기는 사용하지 않음)';
W.write({label:'방광경',name:'족태양방광경',english:'BLADDER MERIDIAN',primarySource:'https://m.kmcric.com/knowledge/acupoint/BL',secondarySource:'https://iris.who.int/handle/10665/353407'},overrides);
