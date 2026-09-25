/** Location fixes decided in the 2026-09-25 needling-path review (reports/needling-path-review-vscode.md).
 * Edits only the listed codes in data/meridians/*.json; the meridian generators are not idempotent
 * against the current meshes, so rerunning them would undo these. GB points are edited in
 * app/gb-points.ts by hand with the values this script prints (--gb).
 *
 * Every new seed is derived from a landmark or a mesh, never typed in:
 *  - intercostal points: the clear run between rib N and rib N+1 met by the same skin-averaged ray
 *    the viewer uses, scanned ±35 mm vertically; the seed moves to the centre of that run;
 *  - popliteal points: the crease is drawn 10 mm above the knee joint line (the model skin has no fold);
 *    BL39 sits 4 mm medial to the biceps femoris long head, KI10 3 mm lateral to semitendinosus,
 *    BL40 midway between them;
 *  - GV4/GV5: midway between the spinous process above and the one below (interspinous depression).
 */
import fs from 'node:fs';
import {V,landmark,partNamed,vertices,projectToSkin,smoothSkinNormal,rayLayers,REPO} from './path-geometry.mjs';

const ORD=['zero','first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth','eleventh','twelfth'];
const ribNumber=(name)=>{const m=name.match(/(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth) (rib|costal cartilage)/i);return m?ORD.indexOf(m[1].toLowerCase()):null;};

/** Vertical offset (mm) that centres the needle in intercostal space N, or 0 if it already sits there. */
function intercostalOffset(seed,outward,N){
 const rows=[];
 for(let dy=-35;dy<=35;dy++){
  const hit=projectToSkin(V(seed[0],seed[1]+dy/1000,seed[2]),outward),dir=smoothSkinNormal(hit.point,hit.face,15,outward).negate();
  const layers=rayLayers(hit.point.clone().addScaledVector(dir,0.00015),dir,70),bone=layers.find((l)=>l.system==='skeletal'),pleura=layers.find((l)=>/Pleura|lung/i.test(l.name));
  rows.push(bone&&(!pleura||bone.a<pleura.a)?ribNumber(bone.name)??-1:0);
 }
 // A rib must show on two neighbouring samples; single hits are the ray grazing a rib edge.
 const label=rows.map((v,i)=>v>0&&(rows[i-1]===v||rows[i+1]===v)?v:v>0?-2:v),runs=[];
 for(let i=0;i<label.length;i++){
  if(label[i]>0)continue;let j=i;while(j+1<label.length&&label[j+1]<=0)j++;
  let below=i-1;while(below>=0&&label[below]<=0)below--;let above=j+1;while(above<label.length&&label[above]<=0)above++;
  const clear=[];for(let k=i;k<=j;k++)if(label[k]===0)clear.push(k-35);
  if(clear.length)runs.push({lo:i-35,hi:j-35,below:below>=0?label[below]:null,above:above<label.length?label[above]:null,clear});i=j;
 }
 const valid=runs.filter((r)=>r.above===N&&r.below===N+1);
 if(!valid.length)throw new Error(`no intercostal space ${N} near ${seed}`);
 const run=valid.find((r)=>r.lo<=0&&r.hi>=0)??valid.sort((x,y)=>Math.min(Math.abs(x.lo),Math.abs(x.hi))-Math.min(Math.abs(y.lo),Math.abs(y.hi)))[0];
 const centre=run.clear[Math.floor(run.clear.length/2)];
 // Already inside the right space and not on its edge: leave it.
 return run.lo<=-3&&run.hi>=3&&run.lo<=0&&run.hi>=0?0:centre;
}
const slice=(name,y,t=0.003)=>vertices(partNamed(name),(v)=>Math.abs(v.y-y)<t);
const most=(list,score)=>list.reduce((a,b)=>score(b)>score(a)?b:a);

const CREASE_Y=+(landmark('knee_joint_line').y+0.010).toFixed(4);
const bicepsMedial=most(slice('Long head of right biceps femoris',CREASE_Y),(v)=>v.x).x;
const semitendinosusLateral=most(slice('Right semitendinosus',CREASE_Y),(v)=>-v.x).x;
const sacrumApex=most(vertices(partNamed('Sacrum')),(v)=>-v.y);
const round=(v)=>+v.toFixed(5);

const NOTE='2026-09-25 자침 경로 검수 반영';
const EDITS={
 KI22:{ics:5},KI24:{ics:3,centre:true},KI25:{ics:2,centre:true},KI26:{ics:1},ST14:{ics:1},ST15:{ics:2},ST16:{ics:3},SP17:{ics:5},SP19:{ics:3},SP20:{ics:2},
 ST9:{seed:(p)=>[-0.034,p.seed[1],0.014],why:'moved onto the anterior border of sternocleidomastoid at the C4 level (the old seed lay over the thyrohyoid, medial to the muscle)'},
 BL10:{seed:(p)=>{const edge=most(slice('Descending part of right trapezius',p.seed[1]),(v)=>-v.x);return [round(edge.x-0.0035),p.seed[1],-0.064];},outward:[-0.28,0,-0.96],why:'moved lateral to the lateral border of trapezius at the C2 level'},
 LR11:{seed:(p)=>{const edge=most(slice('Right adductor longus',p.seed[1],0.004),(v)=>-v.x);return [round(edge.x+0.014),p.seed[1],0.0484];},why:'moved medially onto adductor longus (the old seed lay over the femoral artery)'},
 KI12:{seed:(p)=>[-0.0135,p.seed[1],p.seed[2]],why:'0.5 B-cun measured to the rectus abdominis, off the linea alba'},
 KI13:{seed:(p)=>[-0.0135,p.seed[1],p.seed[2]],why:'0.5 B-cun measured to the rectus abdominis, off the linea alba'},
 CV15:{seed:(p)=>{const j=landmark('xiphisternal_junction'),u=landmark('umbilicus');return [0,round(j.y-(j.y-u.y)/8),p.seed[2]];},why:'1 B-cun below the xiphisternal junction (8 B-cun to the umbilicus); the old seed was the xiphoid tip itself'},
 GV4:{seed:(p)=>[0,round((landmark('spinous_process_L2.inferior_border').y+landmark('spinous_process_L3.superior_border').y)/2),p.seed[2]],why:'interspinous depression below the L2 spinous process'},
 GV5:{seed:(p)=>[0,round((landmark('spinous_process_L1.inferior_border').y+landmark('spinous_process_L2.superior_border').y)/2),p.seed[2]],why:'interspinous depression below the L1 spinous process'},
 BL40:{seed:()=>[round((bicepsMedial+semitendinosusLateral)/2),CREASE_Y,-0.0895],why:'on the popliteal crease line, midway between biceps femoris and semitendinosus'},
 BL39:{seed:()=>[round(bicepsMedial+0.004),CREASE_Y,-0.0767],why:'on the popliteal crease line, immediately medial to the biceps femoris long head'},
 KI10:{seed:()=>[round(semitendinosusLateral-0.003),CREASE_Y,-0.0723],why:'on the popliteal crease line, immediately lateral to the semitendinosus tendon'},
 // The atlas has no coccyx; the tip is taken 28 mm below the sacral apex along the sacral curve.
 BL35:{seed:()=>[-0.012,round(sacrumApex.y-0.028),round(sacrumApex.z-0.036)],why:'0.5 B-cun lateral to the estimated coccyx tip (the atlas has no coccyx mesh)'},
};

const files=['LU','ST','SP','HT','SI','BL','KI','PC','TE','LR','CV','GV'].map((id)=>({id,path:new URL(`data/meridians/${id}.json`,REPO)}));
const changes=[];
for(const file of files){
 const data=JSON.parse(fs.readFileSync(file.path,'utf8'));let touched=false;
 for(const point of data.points){
  const edit=EDITS[point.code];if(!edit)continue;
  const before=[...point.seed];
  if(edit.outward)point.outward=edit.outward;
  const outward=V(...point.outward).normalize();
  if(edit.ics){const dy=intercostalOffset(point.seed,outward,edit.ics);point.seed=[point.seed[0],round(point.seed[1]+dy/1000),point.seed[2]];edit.why=`centred in intercostal space ${edit.ics} (${dy>=0?'+':''}${dy} mm)`;}
  else point.seed=edit.seed(point);
  if(!point.rule.includes(NOTE))point.rule+=` · ${NOTE}: ${edit.why}`;
  changes.push(`${point.code}: ${before.join(',')} → ${point.seed.join(',')} (${edit.why})`);touched=true;
 }
 if(touched)fs.writeFileSync(file.path,JSON.stringify(data,null,1)+'\n');
}
console.log(changes.join('\n'));

if(process.argv.includes('--gb')){
 const trochanter=landmark('greater_trochanter'),hiatus=landmark('sacral_hiatus'),gb30=trochanter.clone().lerp(hiatus,1/3);
 const ligament=vertices(partNamed('Right inguinal ligament'),(v)=>Math.abs(v.x+0.12)<0.004),gb28Y=Math.max(...ligament.map((v)=>v.y))+0.006;
 const rib=landmark('rib_twelfth_free_end'),skin=partNamed('Skin');let near=null,best=Infinity;
 for(const v of vertices(skin)){const d=v.distanceTo(rib);if(d<best){best=d;near=v;}}
 console.log('GB30 seed',[gb30.x,gb30.y,-0.1].map(round),'GB28 y',round(gb28Y),'GB25 skin',near.toArray().map(round),'outward',near.clone().sub(rib).normalize().toArray().map(round),'crease y',CREASE_Y);
}
