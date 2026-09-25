/** Builds data/needling-paths.json: the reviewed needle path of each multi-layer point.
 *
 * For every point in REVIEWED it projects the seed onto the skin the way app/scene.tsx does,
 * picks the needle direction (path-spec.mjs), walks the ray through the atlas and turns what it
 * meets into an ordered, anatomically checked list:
 *  - layers   what the needle passes, superficial to deep. Model layers keep their model depth.
 *             A model layer that sits out of anatomical order, or a structure the atlas lacks
 *             (fascia, missing muscles), becomes a concept layer without a depth of its own.
 *             Gaps of 10 mm or more with nothing modelled are named as fat/connective tissue.
 *  - hazards  vessels, nerves, pleura and organs. They are NEVER drawn as a passed layer; the
 *             panel lists them with a depth only (the proximity lane is a separate, later design).
 *  - boneMm   the first bone, where the needle stops.
 * Also writes reports/needling-paths-<date>.md for review.
 */
import fs from 'node:fs';
import {V,partNamed,atlas,landmark,projectToSkin,smoothSkinNormal,rayLayers,approach,REPO} from './path-geometry.mjs';
import {allPoints} from './points_all.mjs';
import {SPEC,REVIEWED,regionOf} from './path-spec.mjs';
import {koreanOf,baseName} from './anatomy-ko.mjs';

const DATE='2026-09-25';
const direct=JSON.parse(fs.readFileSync(new URL('data/needling-direct.json',REPO),'utf8'));
const defs=new Map(allPoints().map((point)=>[point.code,point]));
const HAZARD_SYSTEMS=new Set(['arterial','venous','nervous','respiratory','digestive','urinary','reproductive','cardiac']);
const MINOR=/segment(?!.*hepato)|tributar|Taenia|Mesentery|mesocolon|tract|fasciculus|nucleus|horn|substance|canal|cutaneous|Muscular branch|Nerve to|root of|Spinal ganglion|ganglion|Set of|lymph|duct|pharyngeal|Tongue|Gingiva|tooth|genicular|recurrent|colic|gastro|epiploic|mesenteric|Pancreaticoduodenal|Pectoral branch|Branch of|Sympathetic|Central canal|reticular|White matter of cerebral|gyrus|lobe$|Tentorium|ventricle|Pineal|Pons|Cerebellum|circumflex scapular|interosseous (artery|nerve)|median antebrachial|thoraco-acromial/i;
const deg=(a,b)=>Math.acos(Math.min(1,Math.max(-1,a.dot(b))))*180/Math.PI;
const round=(v,d=1)=>+v.toFixed(d);
const ko=(name)=>koreanOf(name)??name;

// Anatomical order for structures that the atlas can place in the wrong sequence.
const RANKS=[
 {when:/back|neck|shoulder/,list:[[/trapezius|latissimus/i,1],[/rhomboid|levator scapulae/i,2],[/serratus posterior/i,3],[/splenius/i,4],[/iliocostalis|longissimus|spinalis/i,5],[/semispinalis/i,6],[/multifidus/i,7],[/rotator|interspinales|intertransvers|levatores costarum/i,8],[/quadratus lumborum/i,9],[/psoas/i,10]]},
 {when:/neck/,list:[[/platysma/i,1],[/sternocleidomastoid/i,2],[/sternohyoid|omohyoid/i,3],[/sternothyroid|thyrohyoid/i,4]]},
 {when:/chest/,list:[[/pectoralis major/i,1],[/pectoralis minor|serratus anterior|external oblique/i,2],[/external intercostal/i,3],[/internal intercostal/i,4],[/innermost intercostal/i,5],[/transversus thoracis/i,6]]},
 {when:/abdomen/,list:[[/external oblique/i,1],[/internal oblique/i,2],[/transversus abdominis/i,3]]},
];
const FASCIA={
 thigh:['넙다리근막','Fascia lata'],knee:['오금근막','Popliteal fascia'],leg:['종아리근막','Crural fascia'],arm:['위팔근막','Brachial fascia'],forearm:['아래팔근막','Antebrachial fascia'],
 gluteal:['볼기근막','Gluteal fascia'],neck:['목근막 얕은층','Investing layer of deep cervical fascia'],
};
const LUMBAR=/^(BL2[0-6]|BL5[0-2]|GV[3-6]|GB25)$/;
const ARCUATE_Y=(()=>{const u=landmark('umbilicus').y,p=landmark('pubic_symphysis_superior').y;return u-(u-p)/3;})();

function directionFor(code,spec,point,face,faceNormal,outward){
 // The projection direction, not the face, filters the averaged triangles: a wrong face normal is what this corrects.
 const smooth=face==null?null:smoothSkinNormal(point,face,15,outward);
 const deviation=smooth?deg(smooth,faceNormal):0;
 const d=spec.dir;
 let dir=null,basis='피부 삼각형 면 법선(뷰어 기본)';
 if(d==='face'){basis='검수 결정: 현재 방향 유지';}
 else if(d==='midline'){dir=(smooth??faceNormal).clone().negate();dir.x=0;dir.normalize();basis='정중선 평면 안의 평균 피부 법선(좌우 기울기 제거)';}
 else if(d==='horizontal'){dir=(smooth??faceNormal).clone().negate();dir.y=0;dir.normalize();basis='평균 피부 법선에서 위아래 기울기를 뺀 수평 방향';}
 else if(d?.vector){dir=V(...d.vector).normalize();basis=`고정 방향 (${d.vector.join(', ')})`;}
 else if(d?.toward){const target=d.toward==='left_pupil'?(()=>{const p=landmark('pupil_center');return V(-p.x,point.y,p.z);})():Array.isArray(d.toward)?V(...d.toward):landmark(d.toward);dir=target.sub(point).normalize();basis=d.toward==='left_pupil'?'반대쪽 눈 방향(수평면 안, 뒤통수뼈 아래로)':`${d.toward} 방향`;}
 else if(smooth&&(d==='smooth'||deviation>=15)){dir=smooth.clone().negate();basis=`같은 피부 영역 15 mm 평균 법선 (면 법선과 ${round(deviation,0)}° 차이)`;}
 return {dir,basis,deviation:round(deviation,0)};
}

function mergeRuns(list){
 const out=[];
 for(const item of list){const last=out.find((o)=>o.name===item.name&&item.a-(o.b??o.a)<3);if(last){last.b=Math.max(last.b??last.a,item.b??item.a);continue;}out.push({...item});}
 return out.sort((x,y)=>x.a-y.a);
}

function build(code){
 const def=defs.get(code),spec=SPEC[code]??{},region=regionOf(code);
 if(!def)throw new Error(`no definition for ${code}`);
 if(spec.blocked)return {region,blocked:spec.blocked};
 const outward=def.outward?V(...def.outward).normalize():def.projection==='anterior'?V(0,0,1):def.projection==='posterior'?V(0,0,-1):V(-1,0,0);
 const seed=V(...def.seed);
 const hit=def.projection==='direct'?{point:seed.clone(),face:null,faceNormal:outward.clone()}:projectToSkin(seed,outward);
 const {dir,basis,deviation}=directionFor(code,spec,hit.point,hit.face,hit.faceNormal,outward);
 const ray=dir??hit.faceNormal.clone().negate(),origin=hit.point.clone().addScaledVector(ray,0.00015);
 const raw=rayLayers(origin,ray,110).filter((l)=>!HAZARD_SYSTEMS.has(l.system)?!/Gingiva|tooth|Intertransverse ligaments/i.test(l.name):!MINOR.test(l.name)||/Hepatovenous/i.test(l.name));
 const drop=spec.drop?new RegExp(spec.drop,'i'):null;
 const dropped=[];
 // The first organ ends the path: nothing past it is a layer the needle could reach.
 const ORGAN=new Set(['respiratory','digestive','urinary','cardiac']);
 const organ=mergeRuns(raw.filter((l)=>ORGAN.has(l.system)&&!(drop?.test(l.name))))[0];
 const organAt=organ?.a??Infinity; // Structures along the ray until the first bone.
 let structures=[],bone=null;
 for(const l of mergeRuns(raw.filter((l)=>!HAZARD_SYSTEMS.has(l.system)))){
  if(drop?.test(l.name)){dropped.push(l);continue;}
  if(l.a>organAt)break;
  if(l.system==='skeletal'){bone=l;break;}
  structures.push(l);
 }
 const stopAt=bone?.a??110;
 // Abdominal wall: the atlas files the rectus sheath under the oblique muscles' names.
 if(region==='abdomen'){
  const rectus=structures.find((l)=>/rectus abdominis/i.test(l.name)),linea=structures.find((l)=>/Linea alba/i.test(l.name));
  const flat=/external oblique|internal oblique|transversus abdominis/i;
  if(rectus){
   const front=structures.filter((l)=>flat.test(l.name)&&l.a<rectus.a),back=structures.filter((l)=>flat.test(l.name)&&l.a>rectus.a);
   const rest=structures.filter((l)=>!flat.test(l.name)&&!/rectus abdominis/i.test(l.name));
   const out=[];
   if(front.length)out.push({name:'__sheath_front',ko:'복직근집 앞층',en:'Anterior layer of rectus sheath',a:front[0].a,b:Math.max(...front.map((f)=>f.b??f.a)),kind:'model'});
   else out.push({name:'__sheath_front',ko:'복직근집 앞층',en:'Anterior layer of rectus sheath',a:null,kind:'concept'});
   out.push({...rectus,a:Math.min(...structures.filter((l)=>/rectus abdominis/i.test(l.name)).map((l)=>l.a)),b:Math.max(...structures.filter((l)=>/rectus abdominis/i.test(l.name)).map((l)=>l.b??l.a))});
   if(hit.point.y>ARCUATE_Y)out.push(back.length?{name:'__sheath_back',ko:'복직근집 뒤층',en:'Posterior layer of rectus sheath',a:back[0].a,b:Math.max(...back.map((f)=>f.b??f.a)),kind:'model'}:{name:'__sheath_back',ko:'복직근집 뒤층',en:'Posterior layer of rectus sheath',a:null,kind:'concept'});
   structures=[...out,...rest.filter((l)=>!/Linea alba/i.test(l.name))];
  }else if(linea&&linea.a<=Math.min(...structures.map((l)=>l.a))+1){
   structures=[linea,...structures.filter((l)=>!flat.test(l.name)&&l!==linea)];
  }
 }
 // Anatomical order check.
 const layers=structures.map((l)=>({name:l.name,ko:l.ko??ko(l.name),en:l.en??l.name.replace(/^Right /,''),mm:l.a,end:l.b,kind:l.kind??'model'}));
 for(const rank of RANKS){
  if(!rank.when.test(region))continue;
  const idx=layers.map((l,i)=>({i,r:rank.list.find(([re])=>re.test(l.name))?.[1]})).filter((x)=>x.r!=null);
  const sorted=[...idx].sort((x,y)=>x.r-y.r||layers[x.i].mm-layers[y.i].mm);
  const moved=idx.map((x,k)=>({slot:x.i,item:layers[sorted[k].i],changed:sorted[k].i!==x.i}));
  const copy=moved.map((m)=>({...m.item,...(m.changed?{mm:null,end:null,kind:'reordered',why:`모델 위치(${m.item.mm} mm)가 해부학 순서와 달라 순서대로 표시`}:{})}));
  moved.forEach((m,k)=>{layers[m.slot]=copy[k];});
 }
 // Concept layers requested by the reviewer.
 for(const add of spec.add??[]){
  const layer={name:null,ko:add.ko,en:add.en,mm:null,end:null,kind:'concept'};
  let at=layers.length;
  if(add.after){const i=layers.findIndex((l)=>new RegExp(add.after,'i').test(l.name??l.en));if(i>=0)at=i+1;}
  else if(add.before){const i=layers.findIndex((l)=>new RegExp(add.before,'i').test(l.name??l.en));at=i>=0?i:(add.before==='humerus'||add.before==='radius'?layers.length:0);}
  else at=0;
  layers.splice(at,0,layer);
 }
 // Regional fascia (not in the atlas).
 const fascia=FASCIA[region];
 const firstMuscle=layers.findIndex((l)=>l.kind!=='concept');
 if(fascia&&!layers.some((l)=>/iliotibial/i.test(l.name??''))&&code!=='BL40')layers.splice(0,0,{name:null,ko:fascia[0],en:fascia[1],mm:null,end:null,kind:'concept'});
 if(LUMBAR.test(code)){const i=layers.findIndex((l)=>/iliocostalis|longissimus|spinalis|multifidus/i.test(l.name??''));if(i>=0)layers.splice(i,0,{name:null,ko:'등허리근막',en:'Thoracolumbar fascia',mm:null,end:null,kind:'concept'});}
 if(/^GV/.test(code)&&region!=='neck'){
  if(!layers.some((l)=>/Interspinous/i.test(l.name??'')))layers.push({name:null,ko:'가시사이인대',en:'Interspinous ligament',mm:null,end:null,kind:'concept'});
  if(!layers.some((l)=>/flava/i.test(l.name??'')))layers.push({name:null,ko:'황색인대',en:'Ligamentum flavum',mm:null,end:null,kind:'concept'});
 }
 // Hazards met by the ray (never drawn as passed layers).
 const hazards=[];
 const addHazard=(h)=>{if(hazards.some((x)=>x.ko===h.ko))return;hazards.push(h);};
 for(const l of mergeRuns(raw.filter((l)=>HAZARD_SYSTEMS.has(l.system))).filter((l)=>l.a<=Math.min(organAt,bone?.a??Infinity,80)).slice(0,5)){
  if(drop?.test(l.name))continue;
  addHazard({ko:ko(l.name),en:l.name.replace(/^Right /,''),mm:l.a,source:'model',relation:'cross'});
 }
 for(const n of spec.near??[]){
  const re=new RegExp(n.match,'i');const parts=atlas.parts.filter((p)=>re.test(p.name)&&!/(^Left |\bleft )/.test(p.name));
  let best=null;for(const p of parts){const a=approach(p,origin,ray,110);if(!best||a.distMm<best.distMm)best=a;}
  const existing=hazards.find((h)=>h.ko===n.ko||re.test(h.en));
  if(existing){Object.assign(existing,{emph:n.emph??existing.emph,note:n.note??existing.note});continue;}
  hazards.push({ko:n.ko,en:parts[0]?.name.replace(/^Right /,'')??n.ko,mm:best&&best.distMm<=25?best.atMm:null,source:best&&best.distMm<=25?'model':'concept',relation:'near',emph:n.emph,note:n.note});
 }
 for(const h of spec.hazards??[]){
  const existing=hazards.find((x)=>x.ko===h.ko||(h.ko.includes('흉막')&&/흉막|허파/.test(x.ko))||(h.ko==='콩팥'&&x.ko==='콩팥'));
  if(existing){Object.assign(existing,{ko:h.ko,emph:h.emph??existing.emph,note:h.note??existing.note,basis:h.basis??existing.basis,...(h.mm!=null?{literatureMm:h.mm}:{})});continue;}
  hazards.push({ko:h.ko,en:h.en,mm:h.mm??null,source:h.mm!=null?'literature':'concept',relation:'concept',emph:h.emph,note:h.note,basis:h.basis});
 }
 // Pleura: the endothoracic fascia sits just in front of it.
 if(region==='chest'||(region==='back'&&hazards.some((h)=>/흉막/.test(h.ko)))){const i=layers.findIndex((l)=>/innermost intercostal/i.test(l.name??''));const at=i>=0?i+1:layers.length;if(layers.some((l)=>/intercostal/i.test(l.name??'')))layers.splice(at,0,{name:null,ko:'가슴속근막',en:'Endothoracic fascia',mm:null,end:null,kind:'concept'});}
 if(region==='abdomen'&&!/^(SP12|LR12|ST30|GB28|LR11|CV1)$/.test(code)){
  layers.push({name:null,ko:'가로근막',en:'Transversalis fascia',mm:null,end:null,kind:'concept'},{name:null,ko:'복막밖지방·복막',en:'Extraperitoneal fat / peritoneum',mm:null,end:null,kind:'concept'});
 }
 // One entry per structure: a muscle met twice keeps its first run.
 for(let i=layers.length-1;i>0;i--)if(layers[i].name&&layers.findIndex((l)=>l.name===layers[i].name)<i)layers.splice(i,1);
 // Void spans (nothing modelled for 10 mm or more).
 const withVoids=[];let reach=0;
 for(const l of layers){
  if(l.mm!=null){if(l.mm-reach>=10)withVoids[reach<1?'unshift':'push']({name:null,ko:reach<1?'피하지방·얕은근막':'근육 사이 결합조직·지방',en:reach<1?'Subcutaneous fat (not modelled)':'Connective tissue / fat (not modelled)',mm:reach<1?Math.min(2,round(l.mm/2)):round(reach),end:l.mm,kind:'void'});reach=Math.max(reach,l.end??l.mm);}
  withVoids.push(l);
 }
 hazards.sort((x,y)=>(x.mm??999)-(y.mm??999));
 const profile=direct[code];
 return {region,
  ...(dir?{direction:dir.toArray().map((v)=>round(v,4))}:{}),directionBasis:basis,faceDeviationDeg:deviation,
  surface:hit.point.toArray().map((v)=>round(v,4)),
  layers:withVoids.map(({name,...rest})=>({...rest,...(name?{atlas:name}:{})})),
  hazards,...(bone?{bone:{ko:ko(bone.name),en:bone.name.replace(/^Right /,''),mm:bone.a}}:{}),
  ...(dropped.length?{dropped:{names:[...new Set(dropped.map((d)=>ko(d.name)))],why:spec.dropWhy}}:{}),
  ...(spec.note?{note:spec.note}:{}),...(spec.posture?{posture:spec.posture}:{}),...(spec.zone?{zone:spec.zone}:{}),
  modelMaxMm:profile?.modelMaxMm??null};
}

const out={_about:`Reviewed needle paths (${DATE}), built by scripts/needling/build-needle-paths.mjs from path-spec.mjs. direction is the right-side inward unit vector; layers are superficial→deep; hazards are never passed layers.`};
const report=[`# 자침 경로 빌드 결과 (${DATE})`,'','| 혈 | 방향 | 층 (깊이 mm, * 개념층 · ~ 순서 보정 · ░ 빈 구간) | 뼈 | 위험 구조 |','|---|---|---|---|---|'];
for(const code of REVIEWED){
 const row=build(code);out[code]=row;
 if(row.blocked){report.push(`| ${code} | — | 시뮬레이션 차단 | | ${row.blocked} |`);continue;}
 const layerText=row.layers.map((l)=>`${l.kind==='concept'?'*':l.kind==='reordered'?'~':l.kind==='void'?'░':''}${l.ko}${l.mm!=null?' '+l.mm:''}`).join(' → ');
 report.push(`| ${code} | ${row.direction?row.directionBasis:'유지'} | ${layerText} | ${row.bone?`${row.bone.ko} ${row.bone.mm}`:'—'} | ${row.hazards.map((h)=>`${h.emph?'**':''}${h.ko}${h.mm!=null?' '+h.mm:''}${h.emph?'**':''}`).join(', ')} |`);
}
fs.writeFileSync(new URL('data/needling-paths.json',REPO),JSON.stringify(out,null,1)+'\n');
fs.writeFileSync(new URL(`reports/needling-paths-${DATE}.md`,REPO),report.join('\n')+'\n');
console.log('points',REVIEWED.length,'with direction override',Object.values(out).filter((r)=>r.direction).length);
