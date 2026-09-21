/** SI1–SI19 (수태양소장경). KCMRIC → WHO 2008 → local photo archive. */
import {atlas,mesh,extremeCluster,centroid,v,mid,most,landmark,upperLimb,perp,radialFrom,meridianWriter,LATERAL,MEDIAL,ANTERIOR,POSTERIOR,UP,DOWN} from '../acupoint-kit.mjs';

const W=meridianWriter('SI'), L=upperLimb();
const pts=(part,filter=()=>true)=>{const out=[];for(let i=0;i<part.vertexCount;i++){const p=v(part.positions[i*3],part.positions[i*3+1],part.positions[i*3+2]);if(filter(p))out.push(p);}return out;};
const place=(code,p,out,regions,rule)=>W.put(code,p.clone().addScaledVector(out,-0.004),out,regions,rule);
const dorsal=v(0,0,-1), ulnarDorsal=v(0.85,0,-0.35).normalize(), ulnarPalmar=v(0.9,0,0.32).normalize();

const dp=mesh(atlas,'Distal phalanx of right little finger'), pp=mesh(atlas,'Proximal phalanx of right little finger'), mc5=mesh(atlas,'Right fifth metacarpal bone');
const axis=centroid(dp).sub(centroid(pp)).normalize(), nail=most(pts(dp),ulnarDorsal.clone().addScaledVector(dorsal,0.5).normalize()).addScaledVector(axis,-0.0018);
place('SI1',nail,ulnarDorsal,['hand-R'],'little-finger ulnar nail-root corner · 0.1 F-cun proximal');
const ppBase=extremeCluster(pp,UP,0.03), ppTip=extremeCluster(pp,DOWN,0.03);
const mcHead=extremeCluster(mc5,DOWN,0.03), mcBase=extremeCluster(mc5,UP,0.03);
// Reviewer: SI2/SI3 belonged on the palmar side of the red-white border, not the dorsal hand.
place('SI2',ppBase.clone().lerp(ppTip,0.12),ulnarPalmar,['hand-R'],'distal depression of 5th MCP joint · ulnar red-white border with palmar bias');
place('SI3',mcHead.clone().lerp(mcBase,0.12),ulnarPalmar,['hand-R'],'proximal depression of 5th MCP joint · ulnar red-white border with palmar bias');
const triquetrum=mesh(atlas,'Right triquetral');
place('SI4',mid(mcBase,centroid(triquetrum)),ulnarPalmar,['hand-R'],'bony interval between base of 5th metacarpal and triquetrum · red-white border');
place('SI5',mid(L.ulnarHead,centroid(triquetrum)).add(v(0.004,0,-0.004)),ulnarDorsal,['hand-R'],'dorsal wrist depression between ulnar styloid and triquetrum');
place('SI6',L.ulnarHead.clone().add(v(-0.001,0.006,0)),ulnarDorsal,['forearm-R','hand-R'],'radial side of ulnar head · cleft exposed with palm on chest');
const wrist=W.get('SI5'), forearmOut=radialFrom(mid(wrist,L.elbowCentre),L.wristCentre,L.elbowCentre).addScaledVector(POSTERIOR,0.7).normalize();
place('SI7',wrist.clone().lerp(L.elbowCentre,5/12),forearmOut,['forearm-R'],'SI5–SI8 line · 5 B-cun proximal to dorsal wrist crease');
const olecranon=extremeCluster(L.ulna,UP,0.02,(p)=>p.z<centroid(L.ulna).z);
place('SI8',mid(L.medialEpicondyle,olecranon),v(0.55,0,-0.84).normalize(),['upper-arm-R','forearm-R'],'central depression between medial epicondyle of humerus and olecranon');

const scapula=mesh(atlas,'Right scapula'), humerus=mesh(atlas,'Right humerus');
const postArm=v(-0.55,0,-0.84).normalize(), shoulder=['upper-arm-R','shoulder'];
const teresMajor=mesh(atlas,'Right teres major');
const posteriorFold=extremeCluster(teresMajor,LATERAL,0.015,(p)=>p.y<teresMajor.box.min.y+0.04);
place('SI9',posteriorFold.clone().add(v(-0.004,L.armCun,-0.004)),postArm,shoulder,'1 B-cun superior to posterior axillary fold · posterior to deltoid');
const scapularSpineLateral=extremeCluster(scapula,LATERAL,0.015,(p)=>p.y>1.34);
place('SI10',scapularSpineLateral.clone().add(v(-0.003,-0.012,-0.004)),POSTERIOR,shoulder,'depression immediately inferior to lateral scapular spine · arm raised');
const inferiorAngle=most(pts(scapula),v(0,-1,-0.2).normalize());
place('SI11',centroid(mesh(atlas,'Right infraspinatus muscle')),POSTERIOR,['shoulder','thorax'],'centre of infraspinous fossa · midpoint below scapular spine toward inferior angle');
place('SI12',centroid(mesh(atlas,'Right supraspinatus')).add(v(0,0,-0.04)),POSTERIOR,['shoulder','thorax'],'centre of supraspinous fossa · superior to midpoint of scapular spine');
// The reference places SI13 just inferior to the medial/root end of the scapular spine.
const medialSpineRoot=extremeCluster(scapula,MEDIAL,0.008,(p)=>p.y>1.37&&p.y<1.41&&p.z<-0.08);
place('SI13',medialSpineRoot.clone().add(v(0,-0.004,0)),POSTERIOR,['shoulder','thorax'],'depression immediately inferior to medial end of scapular spine · midway from SI10 to T2 spinous process');
place('SI14',v(-0.034,landmark('spinous_process_T1.inferior_border',null).y,-0.083),POSTERIOR,['thorax','shoulder'],'3 B-cun lateral to inferior border of T1 spinous process');
W.putNearest('SI15',v(-0.042,landmark('spinous_process_C7.inferior_border',null).y+0.018,-0.073),['neck','shoulder'],'2 B-cun lateral to posterior median line · C7 region · nearest posterior neck skin');

const neckOut=v(-0.65,0,-0.76).normalize(), mandible=mesh(atlas,'Mandible');
place('SI16',v(-0.055,1.514,-0.025),neckOut,['neck','face'],'posterior border of sternocleidomastoid · level of thyroid cartilage superior border');
const mandibularAngle=extremeCluster(mandible,v(-1,-0.35,-0.25).normalize(),0.02,(p)=>p.x<0);
place('SI17',mandibularAngle.clone().add(v(-0.004,0,-0.004)),v(-0.55,0,0.83).normalize(),['neck','face'],'depression immediately posterior to angle of mandible · anterior border of sternocleidomastoid');
// Reviewer: the fixed coordinate was too lateral. Re-anchor beneath the lateral canthus on the zygomatic inferior border.
const zygomatic=mesh(atlas,'Right zygomatic bone');
const si18Bone=most(pts(zygomatic,(p)=>p.y<zygomatic.box.min.y+0.018&&p.x>-0.052),ANTERIOR);
place('SI18',si18Bone.clone().add(v(0,-0.004,0)),v(-0.28,0,0.96).normalize(),['face'],'inferior border of zygomatic bone · vertically below lateral canthus with medial correction');
place('SI19',v(-0.069,1.596,-0.004),v(-1,0,0),['face','head'],'mouth-open depression between tragus and mandibular condyle · level of centre of tragus');

const english=['Shaoze','Qiangu','Houxi','Wangu','Yanggu','Yanglao','Zhizheng','Xiaohai','Jianzhen','Naoshu','Tianzong','Bingfeng','Quyuan','Jianwaishu','Jianzhongshu','Tianchuang','Tianrong','Quanliao','Tinggong'];
const overrides=Object.fromEntries(english.map((name,i)=>[`SI${i+1}`,{english:name}]));
overrides.SI6.location='아래팔 뒤안쪽면, 자뼈머리의 노쪽 오목한 곳 (손바닥을 가슴에 댈 때 나타나는 뼈틈)';
W.write({label:'소장경',name:'수태양소장경',english:'SMALL INTESTINE MERIDIAN',primarySource:'https://m.kmcric.com/knowledge/acupoint/SI',secondarySource:'https://iris.who.int/handle/10665/353407'},overrides);
