/** Needle's-eye view: the cross-section around the needle axis at the current insertion depth.
 *
 * Data comes from data/needle-eye.json (scripts/needling/build-needle-eye.mjs), loaded on demand
 * so the 180 KB table stays out of the first bundle. Distances and bearings are atlas-relative
 * teaching data, not patient-specific safety margins.
 */
import {useEffect,useMemo,useRef,useState} from 'react';
import {Maximize2,Minimize2} from 'lucide-react';

export type NeedleEyeStructure={
  id:string;label:string;english:string|null;kind:'nerve'|'artery'|'vein'|'bundle'|'boundary';relation:'cross'|'near'|'concept';
  depthMm:number|null;endMm:number|null;literatureReferenceMm:number|null;depthSource:'참조 모델'|'문헌값'|'해부 개념';
  emph:boolean;note:string|null;basis:string|null;
  bearing:null|{status:'axis-crossing'|'model-nearest';xMm:number;yMm:number;distanceMm:number};
  /** [depthMm, xMm, yMm]: the structure's offset in the cross-section at that depth. */
  track:number[][]|null;beyondReach:boolean;beyondBone:boolean;refs:string[];
};
export type NeedleEyeProfile={region:string;modelMaxMm:number|null;boneMm:number|null;orientation:{up:string;down:string;right:string;left:string;view:string};structures:NeedleEyeStructure[]};
type NeedleEyeReference={short:string;citation:string;url:string;claim:string};
export type NeedleEyeData={points:Record<string,NeedleEyeProfile>;references:Record<string,NeedleEyeReference>};

let pending:Promise<NeedleEyeData>|null=null;
const loadNeedleEye=()=>pending??=import('../data/needle-eye.json').then(module=>{
  const raw=(module as {default?:unknown}).default??module;
  const data=raw as unknown as {points:Record<string,NeedleEyeProfile>;_references:Record<string,NeedleEyeReference>};
  return {points:data.points,references:data._references};
});
export function useNeedleEyeData(){
  const [data,setData]=useState<NeedleEyeData|null>(null);
  useEffect(()=>{let live=true;loadNeedleEye().then(value=>{if(live)setData(value);}).catch(()=>{pending=null;});return()=>{live=false;};},[]);
  return data;
}

/** Model depth in mm for a slider ratio; the viewer's slider percent is of modelMaxMm and stops at bone. */
export const needleEyeDepthMm=(profile:NeedleEyeProfile|undefined,ratio:number)=>profile?.modelMaxMm!=null?profile.modelMaxMm*ratio/100:null;

/** The cross-section sample nearest the current depth, if the structure is in that section. */
function sectionAt(structure:NeedleEyeStructure,currentMm:number){
  if(!structure.track?.length)return null;
  let best:number[]|null=null;
  for(const sample of structure.track)if(!best||Math.abs(sample[0]-currentMm)<Math.abs(best[0]-currentMm))best=sample;
  if(!best||Math.abs(best[0]-currentMm)>2)return null;
  return {xMm:best[1],yMm:best[2],radialMm:Math.hypot(best[1],best[2]),deltaMm:Math.abs(best[0]-currentMm)};
}
function structureOpacity(currentMm:number|null,progress:number,structure:NeedleEyeStructure){
  if(structure.relation==='concept')return structure.kind==='boundary'?.14+progress*.007:.18;
  const section=currentMm==null?null:sectionAt(structure,currentMm);
  if(!section)return 0;
  return 1-Math.min(1,section.deltaMm/2)*.5;
}
function structurePosition(structure:NeedleEyeStructure,currentMm:number,index:number){
  const section=sectionAt(structure,currentMm);
  if(!section)return null;
  if(section.radialMm<1)return {x:150,y:150,radius:12+index*3,crossing:true};
  const radius=Math.max(28,Math.min(94,28+section.radialMm*2.7));
  return {x:150+(section.xMm/section.radialMm)*radius,y:150-(section.yMm/section.radialMm)*radius,radius:structure.kind==='nerve'?8:11,crossing:false};
}
function relationLabel(structure:NeedleEyeStructure){
  if(structure.relation==='concept')return '';
  const limit=structure.beyondBone?'뼈 너머':structure.beyondReach?'자침 상한 너머':'';
  if(structure.relation==='cross')return limit?`연장선 교차 · ${limit} · `:'경로 교차 · ';
  return `침축 곁 ${structure.bearing?.distanceMm??'?'} mm${limit?` · ${limit}`:''} · `;
}
function depthLabel(structure:NeedleEyeStructure,currentMm:number|null){
  if(structure.depthSource==='문헌값')return '문헌 근거 · 개인차 큼';
  if(structure.depthMm==null)return `${structure.depthSource} · 모델 위치 없음`;
  const ahead=currentMm!=null&&structure.depthMm-currentMm>2?` · 앞 ${Math.round(structure.depthMm-currentMm)} mm`:'';
  return `모델 깊이 ${structure.depthMm} mm${ahead}`;
}

export function NeedleEyeCompass({profile,references,depth,onSimulationGesture}:{profile:NeedleEyeProfile;references:NeedleEyeData['references'];depth:number;onSimulationGesture?:(direction:-1|1)=>void}){
  const currentMm=needleEyeDepthMm(profile,depth);
  const pinchDistance=useRef<number|null>(null);
  const visibleStructures=useMemo(()=>profile.structures
    .map((structure,index)=>({structure,index,opacity:structureOpacity(currentMm,depth,structure)}))
    .filter(item=>item.opacity>.04),[currentMm,depth,profile]);
  const {orientation}=profile;
  return <section className="needle-eye-compass" aria-label="현재 자침 단면의 주변 구조">
    <div className="compass-heading"><div><b>Needle’s-eye Compass</b><span>시술자 시점 단면 · 재생 연동</span></div><em>모델 기준 · 비척도</em></div>
    <div className="compass-plot-wrap" onWheel={event=>{if(!onSimulationGesture||event.deltaY===0)return;event.preventDefault();onSimulationGesture(event.deltaY>0?1:-1);}} onTouchStart={event=>{if(event.touches.length!==2)return;const first=event.touches.item(0),second=event.touches.item(1);if(first&&second)pinchDistance.current=Math.hypot(first.clientX-second.clientX,first.clientY-second.clientY);}} onTouchMove={event=>{if(!onSimulationGesture||event.touches.length!==2)return;const first=event.touches.item(0),second=event.touches.item(1);if(!first||!second)return;const next=Math.hypot(first.clientX-second.clientX,first.clientY-second.clientY),previous=pinchDistance.current;if(previous!=null&&Math.abs(next-previous)>=10){event.preventDefault();onSimulationGesture(next>previous?1:-1);pinchDistance.current=next;}}} onTouchEnd={()=>{pinchDistance.current=null;}}>
      <svg className="compass-plot" viewBox="0 0 300 300" role="img" aria-labelledby="compass-title compass-desc">
        <title id="compass-title">침 축을 중심으로 본 주변 위험 구조</title>
        <desc id="compass-desc">{`${orientation.view}. 위는 ${orientation.up}, 오른쪽은 ${orientation.right}, 아래는 ${orientation.down}, 왼쪽은 ${orientation.left}입니다.`}</desc>
        <text className="direction direction-front" x="150" y="18">{orientation.up}</text>
        <path className="direction-mark" d="M150 31v20m0-20-5 7m5-7 5 7"/>
        <text className="direction direction-lateral" x="279" y="159">{orientation.right}</text>
        <path className="direction-mark" d="M249 150h19m0 0-7-5m7 5-7 5"/>
        <text className="direction direction-bottom" x="150" y="294">{orientation.down}</text>
        <text className="direction direction-left" x="21" y="159">{orientation.left}</text>
        <circle className="range-ring range-ring-outer" cx="150" cy="150" r="105"/>
        <circle className="range-ring range-ring-inner" cx="150" cy="150" r="62"/>
        <text className="ring-label" x="150" y="82">주변권</text>
        <text className="ring-label" x="150" y="118">근접권</text>
        {visibleStructures.filter(({structure})=>structure.kind==='boundary').map(({structure,opacity})=><g key={structure.id} className="structure boundary" style={{opacity}}>
          <circle className="boundary-band" cx="150" cy="150" r="113"/>
          <text x="241" y="75">{structure.label.replace(/\s*\(.+\)$/,'')}</text>
        </g>)}
        {currentMm!=null&&visibleStructures.filter(({structure})=>structure.kind!=='boundary').slice(0,4).map(({structure,index,opacity})=>{
          const position=structurePosition(structure,currentMm,index);
          if(!position)return null;
          const labelX=position.x<150?position.x-12:position.x+12,labelAnchor=position.x<150?'end':'start';
          return <g key={structure.id} className={`structure ${structure.kind} ${position.crossing?'is-crossing':''}`} style={{opacity}}>
            <circle cx={position.x} cy={position.y} r={position.radius}/>
            <text x={labelX} y={position.y+4} textAnchor={labelAnchor}>{structure.label}</text>
          </g>;
        })}
        <circle className="needle-axis-halo" cx="150" cy="150" r="17"/>
        <circle className="needle-axis" cx="150" cy="150" r="4"/>
        <text className="axis-label" x="150" y="177">침 축</text>
      </svg>
    </div>
    <div className="compass-reading" aria-live="polite">
      <div className="compass-structure-list">
        {profile.structures.map(structure=><span key={structure.id} style={{opacity:Math.max(.34,structureOpacity(currentMm,depth,structure))}} title={structure.note??undefined}>
          <i className={`legend ${structure.kind}-legend`}/>
          <b>{structure.label}</b>
          <em>{relationLabel(structure)}{depthLabel(structure,currentMm)}</em>
          {structure.refs.length?<small className="structure-refs">근거{' '}{structure.refs.map((id,order)=>{const reference=references[id];return reference?<a key={id} href={reference.url} target="_blank" rel="noreferrer" title={`${reference.citation} — ${reference.claim}`}>{order?' · ':''}{reference.short}</a>:null;})}</small>:null}
        </span>)}
      </div>
      <small>링은 상대 거리 구역입니다. 수치는 환자 안전거리가 아니라 출처가 표시된 모델·문헌 깊이입니다.</small>
    </div>
  </section>;
}

export function NeedleEyeHud({profile,references,depth,pointCode,pointName,expanded,onExpand,onSimulationGesture}:{profile:NeedleEyeProfile;references:NeedleEyeData['references'];depth:number;pointCode:string;pointName:string;expanded:boolean;onExpand:()=>void;onSimulationGesture:(direction:-1|1)=>void}){
  const mm=needleEyeDepthMm(profile,depth),clamped=Math.max(0,Math.min(100,depth));
  return <aside className={`needle-eye-hud ${expanded?'is-expanded':''}`} aria-label="Needle's Eye 관찰 모드">
    <header><div><span>NEEDLE’S EYE</span><b>{pointCode} · {pointName}</b></div>
      <button type="button" aria-label={expanded?'Needle’s Eye 축소':'Needle’s Eye 확대'} onClick={onExpand}>{expanded?<Minimize2 size={15}/>:<Maximize2 size={15}/>}</button></header>
    {!expanded&&<NeedleEyeCompass profile={profile} references={references} depth={depth} onSimulationGesture={onSimulationGesture}/>}
    <div className="hud-depth">
      <div><span>MODEL {mm==null?'—':mm.toFixed(1).replace(/\.0$/,'')} mm</span><small>재생 연동</small></div>
      <div className="hud-depth-track" aria-label={`모델 자침 진행 ${depth}%`}><i style={{width:`${clamped}%`}}/><b style={{left:`${clamped}%`}}/></div>
    </div>
  </aside>;
}

export function NeedleEyeLauncher({active,available,onToggle}:{active:boolean;available:boolean;onToggle:()=>void}){
  return <nav className="needle-eye-launcher" aria-label="관찰 모드와 보조 도구">
    <button type="button" className={active?'is-active':''} aria-label={available?'Needle’s Eye':'이 혈자리는 주요 위험구조 Needle’s Eye 대상이 아닙니다'} aria-pressed={active} disabled={!available} onClick={onToggle}><i/><span className="sr-only">Needle’s Eye</span></button>
  </nav>;
}
