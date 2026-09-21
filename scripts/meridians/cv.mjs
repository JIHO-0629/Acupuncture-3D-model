/** CV1–CV24 (임맥). KCMRIC → WHO 2008 → local CV01–CV24 images, all 1:1 checked. */
import {atlas,mesh,v,landmark,meridianWriter,ANTERIOR,DOWN} from '../acupoint-kit.mjs';

const W=meridianWriter('CV');
const place=(code,p,out=ANTERIOR,regions=['thorax'],rule,extra={})=>W.put(code,p.clone().addScaledVector(out,-0.004),out,regions,rule,{projection:out===ANTERIOR?'anterior':'lateral',...extra});
const lerp=(a,b,t)=>a.clone().lerp(b,t);
const umbilicus=landmark('umbilicus',null),pubis=landmark('pubic_symphysis_superior',null),xiphi=landmark('xiphisternal_junction',null),notch=landmark('suprasternal_notch',null);

// Perineum and lower abdominal 5 B-cun axis (pubic-symphysis superior border ↔ umbilicus).
place('CV1',v(0,.850,-.036),DOWN,['pelvis'],'male perineum · midpoint of anus and posterior border of scrotum',{projection:'lateral'});
place('CV2',pubis,ANTERIOR,['pelvis'],'anterior median line · superior border of pubic symphysis');
for(const [code,cun] of [['CV3',4],['CV4',3],['CV5',2],['CV6',1.5],['CV7',1]])place(code,lerp(umbilicus,pubis,cun/5),ANTERIOR,['pelvis','lumbar'],`anterior median line · ${cun} B-cun inferior to umbilicus on 5 B-cun lower-abdominal axis`);
place('CV8',umbilicus,ANTERIOR,['pelvis','lumbar','thorax'],'centre of umbilicus · absolute no-needling point');

// Upper abdominal 8 B-cun axis (umbilicus ↔ xiphisternal junction).
for(const [code,cun] of [['CV9',1],['CV10',2],['CV11',3],['CV12',4],['CV13',5],['CV14',6]])place(code,lerp(umbilicus,xiphi,cun/8),ANTERIOR,['pelvis','thorax','lumbar'],`anterior median line · ${cun} B-cun superior to umbilicus on 8 B-cun upper-abdominal axis`);
const xiphoid=mesh(atlas,'Xiphoid process');
place('CV15',v(0,landmark('xiphoid_tip',null).y,xiphoid.box.max.z),ANTERIOR,['thorax'],'anterior median line · tip of the xiphoid process (registered surface landmark)');
place('CV16',xiphi,ANTERIOR,['thorax'],'anterior median line · midpoint of xiphisternal junction');

// Sternal interspaces: the body-of-sternum superior edge is the sternal-angle reference.
const sternalAngle=mesh(atlas,'Body of sternum').box.max.y;
for(const [code,offset,n] of [['CV20',.006,1],['CV19',-.020,2],['CV18',-.046,3],['CV17',-.072,4]]){
 const y=sternalAngle+offset;place(code,v(0,y,.083),ANTERIOR,['thorax'],`anterior median line · level with ${n}${n===1?'st':n===2?'nd':n===3?'rd':'th'} intercostal space · sternal-angle frame`);
}
place('CV21',lerp(notch,xiphi,1/9),ANTERIOR,['thorax','neck'],'anterior median line · 1 B-cun inferior to suprasternal fossa on 9 B-cun sternal axis');
place('CV22',notch,ANTERIOR,['neck','thorax'],'centre of suprasternal fossa · trachea lies deep');
const hyoid=mesh(atlas,'Hyoid bone'),hyoidTop=v(0,hyoid.box.max.y,hyoid.box.max.z),submentalOut=v(0,-.7,.7).normalize();
place('CV23',hyoidTop,submentalOut,['neck','face'],'anterior median line · submental depression superior to hyoid bone');
place('CV24',v(0,1.516,.084),ANTERIOR,['face'],'centre of mentolabial sulcus');

W.write({label:'임맥',name:'임맥',english:'CONCEPTION VESSEL',primarySource:'https://m.kmcric.com/knowledge/acupoint/CV',secondarySource:'https://iris.who.int/handle/10665/353407'});
