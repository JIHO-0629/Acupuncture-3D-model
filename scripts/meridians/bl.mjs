/** BL1–BL67 (족태양방광경). KCMRIC → WHO 2008 → local photo archive. */
import {atlas,mesh,centroid,v,mid,most,landmark,meridianWriter,LATERAL,MEDIAL,ANTERIOR,POSTERIOR,UP,DOWN} from '../acupoint-kit.mjs';

const W=meridianWriter('BL');
const pts=(part,filter=()=>true)=>{const out=[];for(let i=0;i<part.vertexCount;i++){const p=v(part.positions[i*3],part.positions[i*3+1],part.positions[i*3+2]);if(filter(p))out.push(p);}return out;};
const place=(code,p,out,regions,rule)=>W.put(code,p.clone().addScaledVector(out,-0.004),out,regions,rule);
const headOut=(p)=>p.clone().sub(v(0,1.60,-0.01)).normalize();

// Face and the 1.5 B-cun paramedian scalp line.
place('BL1',v(-0.010,1.596,0.072),v(-0.2,0,0.98).normalize(),['face'],'depression between superomedial canthus and medial orbital wall');
place('BL2',v(-0.012,1.615,0.070),v(-0.2,0.15,0.97).normalize(),['face','head'],'depression at medial end of eyebrow · supraorbital notch');
const scalp=[[-.025,1.671,.052],[-.025,1.679,.044],[-.025,1.688,.030],[-.025,1.696,.012],[-.025,1.699,-.008],[-.025,1.696,-.030],[-.025,1.688,-.050],[-.025,1.676,-.066]];
for(let i=0;i<scalp.length;i++){const p=v(...scalp[i]);place(`BL${i+3}`,p,headOut(p),['head'],`1.5 B-cun lateral scalp line · BL${i+3} standard hairline/vertex level`);}

// First posterior line: 1.5 B-cun lateral, indexed by vertebral inferior border.
const innerLevels=[['BL11','T1'],['BL12','T2'],['BL13','T3'],['BL14','T4'],['BL15','T5'],['BL16','T6'],['BL17','T7'],['BL18','T9'],['BL19','T10'],['BL20','T11'],['BL21','T12'],['BL22','L1'],['BL23','L2'],['BL24','L3'],['BL25','L4'],['BL26','L5']];
for(const [code,level] of innerLevels){const lm=landmark(`spinous_process_${level}.inferior_border`,null);place(code,v(-0.031,lm.y,lm.z),POSTERIOR,level.startsWith('L')?['lumbar','pelvis']:['thorax'],`inferior border of ${level} spinous process · 1.5 B-cun lateral to posterior median line`);}
// Posterior sacral foramina levels and neighbouring inner line.
const sacY=[.953,.925,.895,.872];
for(let i=0;i<4;i++) place(`BL${27+i}`,v(-.031,sacY[i],-.081),POSTERIOR,['pelvis','lumbar'],`S${i+1} posterior sacral foramen level · 1.5 B-cun lateral line`);
for(let i=0;i<4;i++) place(`BL${31+i}`,v(-.020,sacY[i],-.088),POSTERIOR,['pelvis','lumbar'],`${i+1}${['st','nd','rd','th'][i]} posterior sacral foramen`);
place('BL35',v(-.012,.848,-.091),POSTERIOR,['pelvis'],'0.5 B-cun lateral to tip of coccyx');

// Posterior thigh and popliteal crease.
const pop=landmark('popliteal_crease');
place('BL36',v(-.085,.755,-.102),POSTERIOR,['pelvis','thigh-R'],'centre of gluteal fold');
place('BL37',v(-.087,.650,-.098),POSTERIOR,['thigh-R'],'6 B-cun below centre of gluteal fold · posterior thigh');
place('BL38',v(-.100,.485,-.088),POSTERIOR,['thigh-R','knee-R'],'1 B-cun above BL39 · medial to biceps femoris tendon');
place('BL39',v(-.100,.463,-.091),POSTERIOR,['thigh-R','knee-R','leg-R'],'lateral end of popliteal crease · medial to biceps femoris tendon');
place('BL40',pop,POSTERIOR,['knee-R','leg-R'],'midpoint of popliteal crease');

// Outer posterior line: 3 B-cun lateral. T2–T7, T9–T12, L1–L2, then S2/S4.
const outerLevels=[['BL41','T2'],['BL42','T3'],['BL43','T4'],['BL44','T5'],['BL45','T6'],['BL46','T7'],['BL47','T9'],['BL48','T10'],['BL49','T11'],['BL50','T12'],['BL51','L1'],['BL52','L2']];
for(const [code,level] of outerLevels){const lm=landmark(`spinous_process_${level}.inferior_border`,null);place(code,v(-0.064,lm.y,lm.z+0.003),POSTERIOR,level.startsWith('L')?['thorax','lumbar','pelvis']:['thorax','shoulder'],`inferior border of ${level} spinous process · 3 B-cun lateral to posterior median line`);}
place('BL53',v(-.064,sacY[1],-.074),POSTERIOR,['pelvis','lumbar'],'S2 level · 3 B-cun lateral to posterior median line');
place('BL54',v(-.064,sacY[3],-.078),POSTERIOR,['pelvis'],'S4 level · 3 B-cun lateral to posterior median line');

// Posterior lower leg: popliteal crease → BL60 is 16 B-cun.
const fibula=mesh(atlas,'Right fibula'), calcaneus=mesh(atlas,'Right calcaneus'), achilles=mesh(atlas,'Right calcaneal tendon');
const lateralMalleolus=landmark('lateral_malleolus_prominence');
const heelSide=most(pts(achilles,p=>Math.abs(p.y-lateralMalleolus.y)<.02),LATERAL), bl60=mid(lateralMalleolus,heelSide).add(v(0,0,-.004));
const legAt=(fromKnee)=>pop.clone().lerp(bl60,fromKnee/16);
place('BL55',legAt(2),POSTERIOR,['leg-R','knee-R'],'2 B-cun distal to popliteal crease · between gastrocnemius heads');
place('BL56',legAt(5),POSTERIOR,['leg-R'],'5 B-cun distal to popliteal crease · between gastrocnemius bellies');
place('BL57',legAt(8),POSTERIOR,['leg-R'],'8 B-cun distal to popliteal crease · junction of gastrocnemius bellies and calcaneal tendon');
place('BL58',legAt(9).add(v(-.010,0,0)),v(-.45,0,-.89).normalize(),['leg-R'],'1 B-cun distal and lateral to BL57 · 7 B-cun proximal to BL60');
place('BL59',legAt(13),v(-.55,0,-.84).normalize(),['leg-R'],'3 B-cun proximal to BL60 · posterior border of fibula');
place('BL60',bl60,v(-.75,0,-.66).normalize(),['leg-R','foot-R'],'depression between lateral malleolus prominence and calcaneal tendon');

// Lateral foot and little toe.
const mt5=mesh(atlas,'Right fifth metatarsal bone'), pp5=mesh(atlas,'Proximal phalanx of right little toe'), dp5=mesh(atlas,'Distal phalanx of right little toe');
const footOut=v(-.75,.45,-.48).normalize(), mtBase=most(pts(mt5),v(0,0,-1)), mtHead=most(pts(mt5),v(0,0,1));
place('BL61',most(pts(calcaneus),v(-1,-.5,-.5).normalize()),footOut,['foot-R'],'inferior-posterior to BL60 · lateral calcaneus');
W.putNearest('BL62',v(lateralMalleolus.x,lateralMalleolus.y-.025,lateralMalleolus.z+.008),['foot-R'],'directly inferior to lateral malleolus prominence');
W.putNearest('BL63',mid(lateralMalleolus,mtBase).add(v(-.006,-.002,.010)),['foot-R'],'anterior-inferior to lateral malleolus · posterior to 5th metatarsal tuberosity');
W.putNearest('BL64',mtBase.clone().add(v(-.005,0,.008)),['foot-R'],'distal to tuberosity of 5th metatarsal · red-white border');
W.putNearest('BL65',mtHead.clone().add(v(-.005,0,-.010)),['foot-R'],'proximal depression of 5th metatarsophalangeal joint · red-white border');
W.putNearest('BL66',mid(centroid(pp5),mtHead).add(v(-.004,0,.004)),['foot-R'],'distal depression of 5th metatarsophalangeal joint · red-white border');
const toeAxis=centroid(dp5).sub(centroid(pp5)).normalize(), nail=most(pts(dp5),v(-.7,.4,.5).normalize()).addScaledVector(toeAxis,-.0018);
place('BL67',nail,footOut,['foot-R'],'little-toe lateral nail-root corner · 0.1 F-cun proximal');

const english=['Jingming','Zanzhu','Meichong','Qucha','Wuchu','Chengguang','Tongtian','Luoque','Yuzhen','Tianzhu','Dashu','Fengmen','Feishu','Jueyinshu','Xinshu','Dushu','Geshu','Ganshu','Danshu','Pishu','Weishu','Sanjiaoshu','Shenshu','Qihaishu','Dachangshu','Yuanguanshu','Xiaochangshu','Pangguangshu','Zhonglvshu','Baihuanshu','Shangliao','Ciliao','Zhongliao','Xialiao','Huiyang','Chengfu','Yinmen','Fuxi','Weiyang','Weizhong','Fufen','Pohu','Gaohuangshu','Shentang','Yixi','Geguan','Hunmen','Yanggang','Yishe','Weicang','Huangmen','Zhishi','Baohuang','Zhibian','Heyang','Chengjin','Chengshan','Feiyang','Fuyang','Kunlun','Pucan','Shenmai','Jinmen','Jinggu','Shugu','Zutonggu','Zhiyin'];
const overrides=Object.fromEntries(english.map((name,i)=>[`BL${i+1}`,{english:name}]));
overrides.BL21.location='등 위쪽, 열두째 등뼈(T12) 가시돌기 아래모서리와 같은 높이, 뒤정중선에서 가쪽으로 1.5촌 (KCMRIC·WHO 기준; 로컬 자료의 열두째 갈비 표기는 사용하지 않음)';
W.write({label:'방광경',name:'족태양방광경',english:'BLADDER MERIDIAN',primarySource:'https://m.kmcric.com/knowledge/acupoint/BL',secondarySource:'https://iris.who.int/handle/10665/353407'},overrides);
