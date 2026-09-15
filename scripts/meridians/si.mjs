/** SI1–SI19 (수태양소장경). KCMRIC → WHO 2008 → local photo archive. */
import {atlas,mesh,centroid,v,mid,most,landmark,upperLimb,perp,radialFrom,meridianWriter,LATERAL,MEDIAL,POSTERIOR,UP} from '../acupoint-kit.mjs';

const W=meridianWriter('SI'), L=upperLimb();
const pts=(part,filter=()=>true)=>{const out=[];for(let i=0;i<part.vertexCount;i++){const p=v(part.positions[i*3],part.positions[i*3+1],part.positions[i*3+2]);if(filter(p))out.push(p);}return out;};
const place=(code,p,out,regions,rule)=>W.put(code,p.clone().addScaledVector(out,-0.004),out,regions,rule);
const dorsal=v(0,0,-1), ulnar=v(0.85,0,-0.35).normalize();

const dp=mesh(atlas,'Distal phalanx of right little finger'), pp=mesh(atlas,'Proximal phalanx of right little finger'), mc5=mesh(atlas,'Right fifth metacarpal bone');
const axis=centroid(dp).sub(centroid(pp)).normalize(), nail=most(pts(dp),ulnar.clone().addScaledVector(dorsal,0.5).normalize()).addScaledVector(axis,-0.0018);
place('SI1',nail,ulnar,['hand-R'],'little-finger ulnar nail-root corner · 0.1 F-cun proximal');
const mcHead=most(pts(mc5),v(0,0,1)), mcBase=most(pts(mc5),v(0,0,-1));
place('SI2',mid(centroid(pp),mcHead).add(v(0.004,0,-0.002)),ulnar,['hand-R'],'distal depression of 5th metacarpophalangeal joint · ulnar red-white border');
place('SI3',mcHead.clone().add(v(0.004,0,-0.010)),ulnar,['hand-R'],'proximal depression of 5th metacarpophalangeal joint · ulnar red-white border');
place('SI4',mcBase.clone().add(v(0.004,0,0.003)),ulnar,['hand-R'],'depression between base of 5th metacarpal and triquetrum · red-white border');
const triquetrum=mesh(atlas,'Right triquetral');
place('SI5',mid(L.ulnarHead,centroid(triquetrum)).add(v(0.004,0,-0.004)),ulnar,['hand-R'],'dorsal wrist depression between ulnar styloid and triquetrum');
place('SI6',L.ulnarHead.clone().add(v(-0.001,0.008,0)),LATERAL,['forearm-R','hand-R'],'WHO/KCMRIC: radial side of the head of ulna, in the cleft revealed with palm on chest');
const wrist=W.get('SI5'), forearmOut=radialFrom(mid(wrist,L.elbowCentre),L.wristCentre,L.elbowCentre).addScaledVector(POSTERIOR,0.7).normalize();
place('SI7',wrist.clone().lerp(L.elbowCentre,5/12),forearmOut,['forearm-R'],'SI5–SI8 line · 5 B-cun proximal to dorsal wrist crease');
place('SI8',L.medialEpicondyle.clone().add(v(0.004,-0.005,-0.012)),v(0.6,0,-0.8).normalize(),['upper-arm-R','forearm-R'],'depression between medial epicondyle of humerus and olecranon');

const scapula=mesh(atlas,'Right scapula'), humerus=mesh(atlas,'Right humerus');
const postArm=v(-0.55,0,-0.84).normalize(), shoulder=['upper-arm-R','shoulder'];
place('SI9',v(-0.178,1.307,-0.052),postArm,shoulder,'1 B-cun superior to posterior axillary fold');
place('SI10',v(-0.166,1.340,-0.058),postArm,shoulder,'depression inferior to scapular spine · arm raised');
const inferiorAngle=most(pts(scapula),v(0,-1,-0.2).normalize()), spineRoot=most(pts(scapula),v(0,0,-1));
place('SI11',centroid(scapula),POSTERIOR,['shoulder','thorax'],'centre of infraspinous fossa · scapular triangular reference');
place('SI12',v(-0.115,1.401,-0.079),POSTERIOR,['shoulder','thorax'],'centre of supraspinous fossa');
place('SI13',v(-0.079,1.407,-0.083),POSTERIOR,['shoulder','thorax'],'medial end of scapular spine · midway from SI10 to T2 spinous process');
place('SI14',v(-0.034,landmark('spinous_process_T1.inferior_border',null).y,-0.083),POSTERIOR,['thorax','shoulder'],'3 B-cun lateral to inferior border of T1 spinous process');
W.putNearest('SI15',v(-0.042,landmark('spinous_process_C7.inferior_border',null).y+0.018,-0.073),['neck','shoulder'],'2 B-cun lateral to posterior median line · C7 region · nearest posterior neck skin');

const neckOut=v(-0.65,0,-0.76).normalize(), mandible=mesh(atlas,'Mandible');
place('SI16',v(-0.055,1.514,-0.025),neckOut,['neck','face'],'posterior border of sternocleidomastoid · level of thyroid cartilage superior border');
place('SI17',v(-0.047,1.535,-0.018),v(-0.65,0,0.76).normalize(),['neck','face'],'depression posterior to angle of mandible · anterior border of sternocleidomastoid');
place('SI18',v(-0.055,1.565,0.045),v(-0.5,0,0.87).normalize(),['face'],'directly below lateral canthus · inferior border of zygomatic bone');
place('SI19',v(-0.069,1.596,-0.004),v(-1,0,0),['face','head'],'mouth-open depression between tragus and mandibular condyle · level of centre of tragus');

const english=['Shaoze','Qiangu','Houxi','Wangu','Yanggu','Yanglao','Zhizheng','Xiaohai','Jianzhen','Naoshu','Tianzong','Bingfeng','Quyuan','Jianwaishu','Jianzhongshu','Tianchuang','Tianrong','Quanliao','Tinggong'];
const overrides=Object.fromEntries(english.map((name,i)=>[`SI${i+1}`,{english:name}]));
overrides.SI6.location='아래팔 뒤안쪽면, 자뼈머리의 노쪽 오목한 곳 (손바닥을 가슴에 댈 때 나타나는 뼈틈)';
W.write({label:'소장경',name:'수태양소장경',english:'SMALL INTESTINE MERIDIAN',primarySource:'https://m.kmcric.com/knowledge/acupoint/SI',secondarySource:'https://iris.who.int/handle/10665/353407'},overrides);
