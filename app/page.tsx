import {flushSync} from 'react-dom';
import {registerAtlasTools} from './agent-tools';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {Activity,ArrowLeft,ArrowRight,ArrowUpRight,ChevronDown,ChevronRight,ChevronUp,Focus,Info,Layers3,Move,Pause,RotateCcw,RotateCw,Search,Sparkles,Undo2,X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Slider} from '@/components/ui/slider';
import {Switch} from '@/components/ui/switch';
import {Sheet,SheetContent,SheetTitle,SheetDescription} from '@/components/ui/sheet';
import {Combobox,ComboboxInput,ComboboxContent,ComboboxList,ComboboxItem,ComboboxEmpty} from '@/components/ui/combobox';
import AnatomyScene from './scene';
import {AnnotationOverlay,createAnnotationChannel} from './annotation-overlay';
import StrataColumn from './strata';
import {DEFAULT_VISIBLE,SYSTEMS,EXPLANATIONS,explanation,bilingualPartName,withSupplement,type Atlas,type Concept,type NeedleReport,type SceneState,type Supplement,type SystemId,type View} from './anatomy';
import {atlasPoints,meridianOf,MERIDIANS,needleProfile,needlingReviewOf,ALL_POINTS,RELEASE_POINT_NOTE,type AcupointDefinition} from './acupoints';
import {AcupointScrubber} from './acupoint-scrubber';
import {MeridianRail} from './meridian-rail';
import {LocatorGuide} from './locator-guide';
import {hasLocatorItems} from './locator-data';
import {FeedbackButton} from './feedback';
import {reviewMode} from './review-mode';
import {createFocusChannel,focusTargetProps,NO_INSETS,type SceneInsets,type StructureFocus} from './focus-channel';
import {locatorItems} from './locator-data';
import {NeedleEyeCompass,NeedleEyeHud,NeedleEyeLauncher,useNeedleEyeData} from './needle-eye';
import './needle-eye.css';
const initial:SceneState={explode:0,visible:DEFAULT_VISIBLE,selected:[],isolate:false,view:'three-quarter',rotate:false,reset:0,needle:{enabled:true,depthRatio:0,revision:0},acupuncture:{visible:true,selectedCode:'GB34',showAll:true,showLines:false}};
const RELATION_LABEL={INTERSECT:'지나감',APPROACH:'근접',AVOID:'피해야 함'} as const;
type SheetDetent='peek'|'half'|'full';
const SHEET_ORDER:SheetDetent[]=['peek','half','full'];
const COMPACT_QUERY='(max-width: 767px)';
/** Region framing for a selected point. `region` keeps the bony landmarks around it in frame; `close` is the point itself. */
const focusRadiusMm=(point:AcupointDefinition,zoom:'region'|'close')=>{
 const trunk=Math.abs(point.seed[0])<.16&&point.seed[1]>.72&&point.seed[1]<1.52,foot=point.projection==='dorsal-foot';
 return zoom==='close'?(trunk?120:foot?80:70):(trunk?220:foot?110:150);
};
const escapeRegExp=(text:string)=>text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

export default function Home(){
 const detailTitle=useRef<HTMLHeadingElement>(null);
  const acupuncturePanel=useRef<HTMLElement>(null);
  const needlePanel=useRef<HTMLDivElement>(null);
  const panelDrag=useRef<{pointerId:number,startX:number,startY:number,left:number,top:number}|null>(null);
  const [atlas,setAtlas]=useState<Atlas|null>(null),[state,setState]=useState(initial),[progress,setProgress]=useState(0),[error,setError]=useState(''),[panel,setPanel]=useState<'layers'|'search'|null>(null),[details,setDetails]=useState(false),[about,setAbout]=useState(false),[query,setQuery]=useState(''),[pointQuery,setPointQuery]=useState('GB34'),[chosen,setChosen]=useState<Concept|null>(null),[needleReport,setNeedleReport]=useState<NeedleReport|null>(null);
  const [panelPosition,setPanelPosition]=useState<{left:number,top:number}|null>(null);
  const [panelCollapsed,setPanelCollapsed]=useState(false);
  const [locatorActive,setLocatorActive]=useState(false),[locatorRevision,setLocatorRevision]=useState(0);
  const [hiddenGroups,setHiddenGroups]=useState<string[][]>([]);
  const hiddenParts=useMemo(()=>hiddenGroups.flat(),[hiddenGroups]);
  const hiddenSet=useMemo(()=>new Set(hiddenParts),[hiddenParts]);
  const regionRadius=70;
  const insertionFrame=useRef<number|null>(null);
  const insertionRestoreTimeout=useRef<number|null>(null);
  const annotationChannel=useMemo(createAnnotationChannel,[]);
  const needle=state.needle??{enabled:false,depthRatio:0,revision:0};
  const allPoints=useMemo<AcupointDefinition[]>(()=>atlas?atlasPoints(atlas):ALL_POINTS,[atlas]);
  const selectedGbPoint=allPoints.find(point=>point.code===state.acupuncture?.selectedCode)??allPoints[0];
  const meridian=MERIDIANS[meridianOf(selectedGbPoint.code)];
  // Same test the scene uses to fade the opposite limb: a point below the knee whose
  // surface faces the midline. The knee line is the patella's lower edge on this body.
  const medialBelowKnee=selectedGbPoint.seed[1]<0.4396+0.03&&(selectedGbPoint.outward?.[0]??0)>0.2;
  const meridianPoints=allPoints.filter(point=>meridianOf(point.code)===meridian.id);
  const selectedGbIndex=meridianPoints.findIndex(point=>point.code===selectedGbPoint.code);
  const scrubPoints=useMemo(()=>allPoints.filter(point=>meridianOf(point.code)===meridian.id).map(point=>({code:point.code,primary:point.korean,secondary:`${point.hanja} · ${point.english}`})),[allPoints,meridian.id]);
  const availableMeridians=useMemo(()=>Object.values(MERIDIANS),[]);
  const profile=needleProfile(selectedGbPoint.code);
  const needlingReview=needlingReviewOf(selectedGbPoint.code);
  // Reviewers (?review on the dev server) see the release pipeline state; learners only see what is still under review.
  const pointStatus=reviewMode
   ?`${selectedGbPoint.status==='registered'?'위치 등록':'위치 검수 중'} · ${needlingReview.status==='open'?'경로 공개':needlingReview.status==='review_required'?'검수용 경로 · 배포 잠금':'원문상 자침 잠금'}`
   :[selectedGbPoint.status!=='registered'&&'위치 검수 중',needlingReview.status==='review_required'&&'자침 경로 검수 중'].filter(Boolean).join(' · ');
  // Needle's-eye view: the HUD opens over the scene; expanding it widens the panel and puts the compass beside the strata.
  const needleEye=useNeedleEyeData(),needleEyeProfile=needleEye?.points[selectedGbPoint.code],needleEyeAvailable=!!needleEyeProfile;
  const [needleEyeOpen,setNeedleEyeOpen]=useState(false),[needleEyeWorkspace,setNeedleEyeWorkspace]=useState(false);
  // Phones get the panel as a bottom sheet with three resting heights; the scene frames into what it leaves.
  const [compact,setCompact]=useState(()=>typeof window!=='undefined'&&window.matchMedia(COMPACT_QUERY).matches);
  const [sheetDetent,setSheetDetent]=useState<SheetDetent>('peek');
  const [viewInsets,setViewInsets]=useState<SceneInsets>(NO_INSETS);
  const sheetDrag=useRef<{pointerId:number,y:number}|null>(null);
  useEffect(()=>{const query=window.matchMedia(COMPACT_QUERY),update=()=>setCompact(query.matches);query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
  const stepSheet=(direction:-1|1)=>setSheetDetent(current=>SHEET_ORDER[Math.max(0,Math.min(SHEET_ORDER.length-1,SHEET_ORDER.indexOf(current)+direction))]);
  // An action whose result is in the scene must leave the scene visible.
  const revealScene=(detent:SheetDetent='half')=>{if(compact)setSheetDetent(current=>SHEET_ORDER.indexOf(current)>SHEET_ORDER.indexOf(detent)?detent:current);};
  // One structure picked out across strata, compass, location text and scene (focus-channel.ts).
  const focusChannel=useMemo(createFocusChannel,[]);
  const [pinnedFocus,setPinnedFocus]=useState<StructureFocus|null>(null);
  const pinnedFocusRef=useRef<StructureFocus|null>(null);
  const previewFocus=(focus:StructureFocus|null)=>focusChannel.publish(focus??pinnedFocusRef.current);
  const pinFocus=(focus:StructureFocus|null)=>{pinnedFocusRef.current=focus;setPinnedFocus(focus);focusChannel.publish(focus);};
  // Measure what the panel, the Needle's-eye HUD and the header cover, so the scene frames into the rest.
  useEffect(()=>{
   const measure=()=>{
    const w=window.innerWidth,h=window.innerHeight,panelElement=acupuncturePanel.current,panelRect=panelElement?.getBoundingClientRect(),
     panelShown=!!panelRect&&!!panelElement&&getComputedStyle(panelElement).visibility!=='hidden'&&panelRect.width>0,
     hud=document.querySelector('.needle-eye-hud')?.getBoundingClientRect(),header=document.querySelector('.identity')?.getBoundingClientRect();
    let next:SceneInsets;
    if(compact){
     next={top:Math.round(Math.max(header?.bottom??0,hud?.bottom??0))+8,right:0,left:0,bottom:panelShown?Math.max(0,Math.round(h-panelRect!.top))+8:0};
    }else{
     const rail=document.querySelector('.acupoint-rail'),railRect=rail&&getComputedStyle(rail).display!=='none'?rail.getBoundingClientRect():null;
     next={top:72,bottom:56,left:Math.round(Math.max(hud?hud.right+16:0,railRect&&railRect.width?railRect.right+16:0)),right:0};
     if(panelShown&&!panelCollapsed){if(panelRect!.left+panelRect!.width/2>w/2)next.right=Math.round(w-panelRect!.left)+16;else next.left=Math.max(next.left,Math.round(panelRect!.right)+16);}
    }
    setViewInsets(current=>current.top===next.top&&current.right===next.right&&current.bottom===next.bottom&&current.left===next.left?current:next);
   };
   measure();
   const observer=new ResizeObserver(measure);
   if(acupuncturePanel.current)observer.observe(acupuncturePanel.current);
   const hud=document.querySelector('.needle-eye-hud');if(hud)observer.observe(hud);
   window.addEventListener('resize',measure);
   const settle=window.setTimeout(measure,400);
   return()=>{observer.disconnect();window.removeEventListener('resize',measure);window.clearTimeout(settle);};
  },[compact,sheetDetent,panelCollapsed,panelPosition,needleEyeOpen,needleEyeWorkspace,locatorActive]);
  useEffect(()=>{if(compact)setPanelCollapsed(false);},[compact]);
  const closeNeedleEye=()=>{setNeedleEyeOpen(false);setNeedleEyeWorkspace(false);};
  const toggleNeedleEye=()=>{if(needleEyeOpen){closeNeedleEye();return;}setLocatorActive(false);setPanel(p=>p==='layers'?null:p);setNeedleEyeOpen(true);};
  useEffect(()=>{if(needleEye&&!needleEyeAvailable){setNeedleEyeOpen(false);setNeedleEyeWorkspace(false);}},[needleEye,needleEyeAvailable]);
  const updateNeedle=(depthRatio:number)=>setState(s=>{const current=s.needle??needle;return{...s,needle:{...current,depthRatio,revision:current.revision+1}};});
  const [strataRefusal,setStrataRefusal]=useState(0);
  const adjustNeedleFromCompass=(direction:-1|1)=>{if(direction>0&&needle.depthRatio>=100)setStrataRefusal(value=>value+1);updateNeedle(Math.max(0,Math.min(100,needle.depthRatio+direction*5)));const panelElement=acupuncturePanel.current,simulation=needlePanel.current;if(!panelElement||!simulation)return;const offset=simulation.getBoundingClientRect().top-panelElement.getBoundingClientRect().top;panelElement.scrollTo({top:Math.max(0,panelElement.scrollTop+offset-12),behavior:'smooth'});};
  const selectAcupoint=(code:string,zoom:'region'|'close'|false='region')=>{const normalized=code.trim().toUpperCase().replace(/\s+/g,''),point=allPoints.find(item=>item.code===normalized)??allPoints.find(item=>item.korean===code.trim()||item.hanja===code.trim()||item.english.toUpperCase()===normalized);if(!point)return;// The scene only republishes a changed report, so a re-selected point keeps the one it has.
if(point.code!==selectedGbPoint.code){pinFocus(null);setNeedleReport(null);}setLocatorActive(current=>current&&hasLocatorItems(point.code));setPointQuery(point.code);setState(s=>({...s,selected:[],isolate:false,rotate:false,needle:{enabled:true,depthRatio:0,revision:(s.needle?.revision??0)+1},acupuncture:{visible:true,selectedCode:point.code,showAll:false,showLines:false},regionFocus:zoom?{center:point.seed,radiusMm:focusRadiusMm(point,zoom),viewHint:point.projection==='dorsal-foot'?'dorsal-foot':undefined,revision:(s.regionFocus?.revision??0)+1}:s.regionFocus}));setDetails(false);if(zoom)revealScene();};
  const toggleLocator=()=>{if(locatorActive){setLocatorActive(false);return;}closeNeedleEye();selectAcupoint(hasLocatorItems(selectedGbPoint.code)?selectedGbPoint.code:'KI4');if(compact)setSheetDetent('peek');else if(window.innerWidth<900)setPanelCollapsed(true);setLocatorRevision(value=>value+1);setLocatorActive(true);};
  // "전체 경혈 보기": keep the selection, show the whole meridian and return the camera to the overview.
  const showWholeMeridian=()=>{setState(s=>({...s,acupuncture:{visible:true,selectedCode:selectedGbPoint.code,showAll:true,showLines:false},regionFocus:undefined,reset:s.reset+1}));revealScene();};
  const moveGbPoint=(direction:-1|1)=>{const index=meridianPoints.findIndex(point=>point.code===selectedGbPoint.code),next=meridianPoints[index+direction];if(next)selectAcupoint(next.code);};
  // Playback frames the whole shaft from the side first (scene: viewHint needle-side), then drives the
  // depth. It ends where it ends: the reader keeps the view, and "전체 경혈 보기" is the way back.
  const animateInsertion=()=>{if(!needleReport?.available)return;if(insertionFrame.current!==null)cancelAnimationFrame(insertionFrame.current);if(insertionRestoreTimeout.current!==null)window.clearTimeout(insertionRestoreTimeout.current);if(compact)setSheetDetent('peek');setState(s=>({...s,needlePlayback:true,isolate:false,selected:[],rotate:false,regionFocus:{center:selectedGbPoint.seed,radiusMm:regionRadius,viewHint:'needle-side',revision:(s.regionFocus?.revision??0)+1}}));const target=needle.depthRatio>0?needle.depthRatio:100;let started=0;const tick=(now:number)=>{if(!started)started=now+450;const linear=Math.max(0,Math.min(1,(now-started)/1600)),ratio=Math.round(target*(1-Math.pow(1-linear,3)));setState(s=>{const current=s.needle??needle;return current.depthRatio===ratio?s:{...s,needle:{...current,depthRatio:ratio,revision:current.revision+1}};});if(linear<1)insertionFrame.current=requestAnimationFrame(tick);else{insertionFrame.current=null;setState(s=>({...s,needlePlayback:false}));}};updateNeedle(0);insertionFrame.current=requestAnimationFrame(tick);};
  useEffect(()=>()=>{if(insertionFrame.current!==null)cancelAnimationFrame(insertionFrame.current);if(insertionRestoreTimeout.current!==null)window.clearTimeout(insertionRestoreTimeout.current);},[]);
  const updateAnnotation=annotationChannel.publish;
 useEffect(()=>{const abort=new AbortController();setProgress(0);setError('');setAtlas(null);setChosen(null);setDetails(false);setState({...initial,visible:DEFAULT_VISIBLE});Promise.all([fetch('/models/atlas.json',{signal:abort.signal}),fetch('/models/zanatomy/zanatomy.json',{signal:abort.signal})]).then(async([atlasResponse,supplementResponse])=>{if(!atlasResponse.ok)throw new Error('The anatomy catalogue could not be loaded.');const base=await atlasResponse.json() as Atlas;if(!supplementResponse.ok)return base;return withSupplement(base,await supplementResponse.json() as Supplement);}).then(setAtlas).catch(e=>{if(e.name!=='AbortError')setError(e.message);});return()=>abort.abort();},[]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='/'&&!(e.target instanceof HTMLInputElement)&&!(e.target instanceof HTMLTextAreaElement)){e.preventDefault();setPanel('search');setDetails(false);}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{const target=e.target;if(target instanceof HTMLInputElement||target instanceof HTMLTextAreaElement||target instanceof HTMLSelectElement||(target instanceof HTMLElement&&target.isContentEditable))return;if(e.key==='Escape'&&!e.defaultPrevented&&!panel&&!details&&!about&&!document.querySelector('[role=dialog]')){e.preventDefault();showWholeMeridian();}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[selectedGbPoint.code,panel,details,about]);
  const parts=useMemo(()=>new Map(atlas?.parts.map(p=>[p.id,p])),[atlas]);
  // Reviewed paths, hazards and the compass name structures in English, not by atlas id. Points sit
  // on the right side, so a right-sided mesh wins; "fibular" is "peroneal" in BodyParts3D.
  const partIdsFor=useCallback((name:string)=>{
   if(!atlas||!name.trim())return [] as string[];
   const wanted=name.toLowerCase().replace(/\s*\(.*\)$/,'').replace(/^(right|left)\s+/,'').trim(),variants=[wanted,wanted.replace(/fibular/g,'peroneal')];
   for(const variant of variants){
    const named=atlas.parts.filter(part=>{const own=part.name.toLowerCase();return own===variant||own===`right ${variant}`;});
    if(named.length)return named.map(part=>part.id);
    const loose=atlas.parts.filter(part=>{const own=part.name.toLowerCase();return own.includes(variant)&&!own.startsWith('left ');});
    if(loose.length)return loose.slice(0,3).map(part=>part.id);
   }
   return [] as string[];
  },[atlas]);
  // A tap in the scene on a structure the needle meets pins it and brings its strata row forward.
  const focusPathPart=(id:string,showRow=true)=>{
   const part=parts.get(id),hit=needleReport?.allHits?.find(item=>item.id===id);
   pinFocus({key:`part:${id}`,label:part?bilingualPartName(part.name):id,partIds:[id],depthMm:hit?.distanceMm??null,tone:needleReport?.hazardHits.some(item=>item.id===id)?'hazard':'layer',source:'scene',pinned:true});
   if(showRow&&compact&&sheetDetent==='peek')setSheetDetent('half');
  };
  // Phones in the peek state still see how deep the needle is and which layer the tip is in.
  const depthLayer=needleReport?.code===selectedGbPoint.code&&needle.depthRatio>0?needleReport.hits[needleReport.hits.length-1]:undefined;
  const depthStrip=needleReport?.code===selectedGbPoint.code&&needleReport.available&&(needle.depthRatio>0||state.needlePlayback)
   ?{percent:Math.round(needle.depthRatio),name:depthLayer?bilingualPartName(depthLayer.name).replace(new RegExp(` \\(${escapeRegExp(depthLayer.name)}\\)$`),''):'피부·피하조직',onClick:()=>{if(depthLayer)focusPathPart(depthLayer.id,false);}}
   :null;
  // Location text: the landmark words the locator knows become handles on their bones.
  const locationPieces=useMemo(()=>{
   const text=selectedGbPoint.location,items=locatorItems(selectedGbPoint.code).filter(item=>item.ko&&text.includes(item.ko));
   if(!items.length)return [text];
   const byName=new Map(items.map(item=>[item.ko,item]));
   return text.split(new RegExp(`(${[...byName.keys()].sort((a,b)=>b.length-a.length).map(escapeRegExp).join('|')})`)).filter(Boolean).map(piece=>byName.get(piece)??piece);
  },[selectedGbPoint.code,selectedGbPoint.location]);
  const compassFocus={pinned:pinnedFocus,preview:previewFocus,pin:pinFocus,partIdsFor};
  const landmarkFocus=(item:ReturnType<typeof locatorItems>[number],pinned:boolean):StructureFocus=>({key:`landmark:${item.key}`,label:item.ko,partIds:item.ids.filter(id=>parts.has(id)).slice(0,6),depthMm:null,tone:'landmark',source:'text',pinned});
  const needlePathPartIds=needleReport?.code===selectedGbPoint.code?[...new Set([...needleReport.pathHits.map(hit=>hit.id),...(needleReport.boundaryId?[needleReport.boundaryId]:[])])]:[];
  const showNeedlePath=()=>{if(!needlePathPartIds.length)return;setState(s=>({...s,selected:needlePathPartIds,isolate:true,explode:0,rotate:false,regionFocus:{center:selectedGbPoint.seed,radiusMm:regionRadius,revision:(s.regionFocus?.revision??0)+1}}));setDetails(false);revealScene();};
 const counts=useMemo(()=>Object.fromEntries(SYSTEMS.map(s=>[s.id,atlas?.parts.filter(p=>p.system===s.id).length??0])),[atlas]);
 const activeSystems=SYSTEMS.filter(s=>counts[s.id]>0);
 const selectedParts=state.selected.map(id=>parts.get(id)).filter(p=>!!p),selected=selectedParts[0],system=SYSTEMS.find(s=>s.id===selected?.system);
 const visibleCount=atlas?.parts.filter(p=>!hiddenSet.has(p.id)&&(state.isolate?state.selected.includes(p.id):state.visible.includes(p.system)||state.selected.includes(p.id))).length??0;
 const results=useMemo(()=>{if(!atlas)return[];const term=query.toLowerCase().trim();if(!term)return ['heart','brain','liver','stomach','spleen','pancreas','urinary bladder','trachea'].map(name=>atlas.concepts.find(c=>c.name.toLowerCase()===name)).filter((x):x is Concept=>!!x);return atlas.concepts.filter(c=>c.name.toLowerCase().includes(term)||c.id.toLowerCase().includes(term)||bilingualPartName(c.name).toLowerCase().includes(term)).sort((a,b)=>a.name.length-b.name.length).slice(0,80);},[atlas,query]);
 const choose=(c:Concept)=>{setChosen(c);setState(s=>({...s,selected:c.elements,isolate:false,rotate:false}));setDetails(true);setPanel(null);};
 useEffect(()=>{if(!atlas)return;return registerAtlasTools(atlas,c=>flushSync(()=>choose(c)));},[atlas]);
 const choosePart=(id:string)=>{const p=parts.get(id);if(!p)return;setChosen({id:p.conceptId,name:p.name,elements:[id]});setState(s=>({...s,selected:[id],isolate:false,rotate:false}));setDetails(true);setPanel(null);};
 // 한 층 벗기기는 근육만이 아니라 어떤 계통에도 쓴다. 인대·신경·디스크를 걷어내며 그 아래를 보는 학습용이다.
 const hideable=(p?:{system:SystemId})=>!!p&&p.system!=='integumentary';
 const hideMuscle=(id:string)=>{if(!hideable(parts.get(id))||hiddenSet.has(id))return;setHiddenGroups(groups=>[...groups,[id]]);setState(s=>({...s,selected:[],isolate:false}));setChosen(null);setDetails(false);};
 const undoMuscleHide=()=>setHiddenGroups(groups=>groups.slice(0,-1));
 const restoreMuscles=()=>setHiddenGroups([]);
 const toggle=(id:SystemId)=>{setDetails(false);setState(s=>({...s,selected:[],isolate:false,visible:s.visible.includes(id)?s.visible.filter(x=>x!==id):[...s.visible,id]}));};
 const reset=()=>{setState(s=>({...initial,visible:DEFAULT_VISIBLE,reset:s.reset+1}));restoreMuscles();setChosen(null);setDetails(false);setPanel(null);};
 const openPanel=(next:'layers'|'search')=>{setDetails(false);if(next==='layers')closeNeedleEye();setPanel(p=>p===next?null:next);};
 const clampPanelPosition=(left:number,top:number,width:number,height:number)=>{const margin=12;return{left:Math.min(Math.max(margin,left),Math.max(margin,window.innerWidth-width-margin)),top:Math.min(Math.max(margin,top),Math.max(margin,window.innerHeight-height-margin))};};
 const startPanelDrag=(event:React.PointerEvent<HTMLDivElement>)=>{if(event.button!==0||window.innerWidth<=767||!acupuncturePanel.current)return;const rect=acupuncturePanel.current.getBoundingClientRect();panelDrag.current={pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,left:rect.left,top:rect.top};event.currentTarget.setPointerCapture(event.pointerId);event.preventDefault();};
 const movePanelDrag=(event:React.PointerEvent<HTMLDivElement>)=>{const drag=panelDrag.current,panelElement=acupuncturePanel.current;if(!drag||drag.pointerId!==event.pointerId||!panelElement)return;const rect=panelElement.getBoundingClientRect();setPanelPosition(clampPanelPosition(drag.left+event.clientX-drag.startX,drag.top+event.clientY-drag.startY,rect.width,rect.height));};
 const endPanelDrag=(event:React.PointerEvent<HTMLDivElement>)=>{if(panelDrag.current?.pointerId!==event.pointerId)return;panelDrag.current=null;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);};
 const movePanelWithKeyboard=(event:React.KeyboardEvent<HTMLButtonElement>)=>{if(window.innerWidth<=767)return;const offsets:{[key:string]:[number,number]}={ArrowLeft:[-16,0],ArrowRight:[16,0],ArrowUp:[0,-16],ArrowDown:[0,16]};if(event.key==='Home'){event.preventDefault();event.stopPropagation();setPanelPosition(null);return;}const offset=offsets[event.key];if(!offset||!acupuncturePanel.current)return;event.preventDefault();event.stopPropagation();const rect=acupuncturePanel.current.getBoundingClientRect();setPanelPosition(current=>clampPanelPosition((current?.left??rect.left)+offset[0],(current?.top??rect.top)+offset[1],rect.width,rect.height));};
 useEffect(()=>{const keepPanelOnScreen=()=>setPanelPosition(current=>{if(!current||!acupuncturePanel.current)return current;const rect=acupuncturePanel.current.getBoundingClientRect(),next=clampPanelPosition(current.left,current.top,rect.width,rect.height);return next.left===current.left&&next.top===current.top?current:next;});window.addEventListener('resize',keepPanelOnScreen);return()=>window.removeEventListener('resize',keepPanelOnScreen);},[]);
 useEffect(()=>{const frame=requestAnimationFrame(()=>setPanelPosition(current=>{if(!current||!acupuncturePanel.current)return current;const rect=acupuncturePanel.current.getBoundingClientRect();return clampPanelPosition(current.left,current.top,rect.width,rect.height);}));return()=>cancelAnimationFrame(frame);},[panelCollapsed]);
 return <main className={`studio ${needleEyeOpen?'needle-eye-analysis':''} ${needleEyeWorkspace?'needle-eye-workspace':''} ${compact?'is-compact':''}`} style={{'--inset-top':`${viewInsets.top}px`,'--inset-right':`${viewInsets.right}px`,'--inset-bottom':`${viewInsets.bottom}px`,'--inset-left':`${viewInsets.left}px`} as React.CSSProperties}>
   {atlas&&<AnatomyScene atlas={atlas} state={{...state,needle,locatorGuide:locatorActive,inspectorOpen:details&&selectedParts.length>0,hiddenParts,viewInsets}} onSelect={choosePart} onPointSelect={code=>selectAcupoint(code,false)} onProgress={n=>{setProgress(n);if(n===100)setError('');}} onError={setError} onNeedleReport={setNeedleReport} onAnnotationFrame={updateAnnotation} focus={focusChannel} onPathPartTap={focusPathPart}/>}
  <div className="vignette"/>
  <header className="identity"><div className="eyebrow"><span className="status-dot"/> FIRST-STUDY EDITION</div><h1>Acupoint Atlas<Badge variant="outline" className="edition">3D</Badge></h1><div className="identity-meta">{atlas?atlas.parts.length.toLocaleString():'—'} anatomical structures <span>·</span> 361 acupoints</div></header><section className="acupoint-rail" aria-label="Selected acupoint"><div className="eyebrow">SELECTED ACUPOINT · {meridian.label}</div><AcupointScrubber points={scrubPoints} activeCode={selectedGbPoint.code} onPointChange={selectAcupoint} label={`${meridian.name} 경혈 탐색`} hotkeys/><div className="acupoint-rail-meta"><em>{selectedGbIndex+1} / {meridianPoints.length}</em></div><p className="acupoint-rail-hint">↑↓ Navigate · Esc Overview</p></section>
  {locatorActive
   ?<LocatorGuide key={`${selectedGbPoint.code}-${locatorRevision}`} code={selectedGbPoint.code} name={selectedGbPoint.korean} channel={annotationChannel} revision={locatorRevision}/>
   :<AnnotationOverlay annotation={{id:selectedGbPoint.code,primary:`${selectedGbPoint.code} · ${selectedGbPoint.korean}`,secondary:selectedGbPoint.code==='GB34'?'fibular head':selectedGbPoint.english}} channel={annotationChannel}/>
  }
  <nav className="top-actions" aria-label="Explorer panels"><Button variant="ghost" className={panel==='search'?'active':''} onClick={()=>openPanel('search')} aria-label="Search anatomy"><Search size={18}/><span>Find a structure</span><kbd>/</kbd></Button><Button variant="ghost" className="icon-button" aria-label="About this atlas" onClick={()=>{setDetails(false);setPanel(null);setAbout(true);}}><Info size={18}/></Button></nav>
  <NeedleEyeLauncher active={needleEyeOpen} available={needleEyeAvailable} onToggle={toggleNeedleEye}/>
  {needleEyeOpen&&needleEyeProfile&&needleEye&&<NeedleEyeHud profile={needleEyeProfile} references={needleEye.references} depth={needle.depthRatio} pointCode={selectedGbPoint.code} pointName={selectedGbPoint.korean} expanded={needleEyeWorkspace} onExpand={()=>setNeedleEyeWorkspace(value=>!value)} onSimulationGesture={adjustNeedleFromCompass} focus={compassFocus}/>}
  <nav className="auxiliary-tools glass" aria-label="보조 해부 도구"><Button variant="ghost" className={locatorActive?'active':''} onClick={toggleLocator} aria-pressed={locatorActive} title="표지점 구조물 취혈 가이드"><Sparkles size={18}/><span>{locatorActive?'가이드 닫기':'취혈 가이드'}</span></Button><Button variant="ghost" onClick={()=>openPanel('layers')} aria-expanded={panel==='layers'} aria-controls="anatomy-layers" title="해부 레이어와 모델 분리"><Layers3 size={19}/><span>해부 도구</span></Button><Button variant="ghost" onClick={()=>selected&&hideMuscle(selected.id)} disabled={progress<100||selectedParts.length!==1||!hideable(selected)||!state.visible.includes(selected!.system)||hiddenSet.has(selected?.id??'')} aria-label="선택한 구조 한 층 벗기기" title="선택한 구조 하나만 숨기기"><Layers3 size={18}/><span>한 층 벗기기</span></Button><Button variant="ghost" onClick={undoMuscleHide} disabled={!hiddenGroups.length} aria-label="마지막 숨김 되돌리기" title="마지막 숨김 되돌리기"><Undo2 size={18}/><span>되돌리기</span></Button><FeedbackButton acupoint={selectedGbPoint.code} meridian={meridian.id} toolbar/></nav>
  <section id="anatomy-layers" className={`layers-panel glass ${panel==='layers'?'mobile-open':''}`} aria-label="Anatomical layers">
   <div className="panel-heading"><span>해부 레이어</span><div className="panel-heading-actions"><Badge variant="secondary" className="small-number">{activeSystems.length}</Badge><Button variant="ghost" className="panel-close icon-button" onClick={()=>setPanel(null)} aria-label="해부 도구 닫기"><X size={17}/></Button></div></div>
   <div className="layer-presets"><Button variant="ghost" aria-pressed={activeSystems.every(x=>state.visible.includes(x.id))} onClick={()=>setState(s=>({...s,selected:[],isolate:false,visible:activeSystems.map(x=>x.id)}))}>All</Button><Button variant="ghost" aria-pressed={state.visible.length===1&&state.visible[0]==='skeletal'} onClick={()=>setState(s=>({...s,selected:[],isolate:false,visible:['skeletal']}))}>Skeleton</Button><Button variant="ghost" aria-pressed={state.visible.length===6&&['cardiac','respiratory','digestive','urinary','endocrine','reproductive'].every(id=>state.visible.includes(id as SystemId))} onClick={()=>setState(s=>({...s,selected:[],isolate:false,visible:['cardiac','respiratory','digestive','urinary','endocrine','reproductive']}))}>Organs</Button></div>
   <div className="system-list">{activeSystems.map(s=><div className={`system-row ${state.visible.includes(s.id)?'enabled':''}`} key={s.id}><Button variant="ghost" className="system-name" title={`Show only ${s.name.toLowerCase()}`} onClick={()=>setState(v=>({...v,visible:[s.id],isolate:false,selected:[]}))}><span className="system-dot" style={{background:s.color}}/>{s.name}<span className="system-count">{counts[s.id]}</span></Button><Switch checked={state.visible.includes(s.id)} onCheckedChange={()=>toggle(s.id)} aria-label={`Show ${s.name.toLowerCase()}`} /></div>)}</div>
   <div className="panel-foot"><span>{visibleCount.toLocaleString()} pieces visible</span><Button variant="ghost" onClick={()=>setState(s=>({...s,visible:[],selected:[],isolate:false}))}>Hide all</Button>{hiddenGroups.length>0&&<Button variant="ghost" onClick={restoreMuscles}>숨긴 구조 전체 복원 ({hiddenParts.length})</Button>}</div>
   <details className="advanced-model-tools"><summary>모델 분리 · 고급 도구</summary><div className="explode-label"><label id="drawer-explode-label">Explode anatomy</label><output>{Math.round(state.explode*100)}<span>%</span></output></div><Slider aria-labelledby="drawer-explode-label" min={0} max={100} step={1} value={[state.explode*100]} onValueChange={v=>setState(s=>({...s,explode:(Array.isArray(v)?v[0]:v)/100,view:(Array.isArray(v)?v[0]:v)>80?'front':s.view,rotate:false}))}/><div className="slider-endpoints"><span>Assembled</span><span>Every piece</span></div></details>
  </section>
  {panel==='search'&&<section className="search-panel glass" aria-label="Find anatomy"><div className="panel-heading"><span>Find a structure</span><Button variant="ghost" className="icon-button" onClick={()=>setPanel(null)} aria-label="Close search"><X size={18}/></Button></div><Combobox<Concept> items={results} value={null} onValueChange={value=>{if(value)choose(value);}} inputValue={query} onInputValueChange={setQuery} itemToStringLabel={c=>bilingualPartName(c.name)} filter={null} open onOpenChange={open=>{if(!open)setPanel(null);}}><ComboboxInput autoFocus placeholder="Heart, femur, cranial nerve…" aria-label="Search named anatomical structures" showTrigger={false}/><ComboboxContent className="anatomy-search-results"><ComboboxEmpty>No structures match your search.</ComboboxEmpty><ComboboxList>{(c:Concept)=><ComboboxItem key={c.id} value={c}><span className="search-result-name">{bilingualPartName(c.name)}</span><span className="small-number">{c.elements.length} {c.elements.length===1?'piece':'pieces'}</span></ComboboxItem>}</ComboboxList></ComboboxContent></Combobox><p className="search-note">{query?'Showing up to 80 matches. Refine your search to find smaller structures.':'Start with a major organ, or search every named structure.'}</p></section>}
  <nav className="view-controls glass" aria-label="Camera controls">{(['three-quarter','front','side','back'] as View[]).map((v,i)=><Button variant="ghost" key={v} className={state.view===v?'active':''} aria-pressed={state.view===v} disabled={state.explode>.8&&v!=='front'} onClick={()=>setState(s=>({...s,view:v,reset:s.reset+1,rotate:false}))} title={`${v} view`} aria-label={`${v} view`}><span>{['¾','F','S','B'][i]}</span></Button>)}<i/><Button variant="ghost" disabled={state.explode>=.4} aria-label={state.rotate?'Pause rotation':'Rotate body'} title="Auto rotate" className={state.rotate?'active':''} onClick={()=>setState(s=>({...s,rotate:!s.rotate}))}>{state.rotate?<Pause size={17}/>:<RotateCw size={18}/>}</Button><Button variant="ghost" aria-label="Reset view and layers" title="Reset" onClick={reset}><RotateCcw size={17}/></Button></nav>
   <div className="scene-caption"><span className="caption-line"/><span>{state.isolate?(chosen?bilingualPartName(chosen.name):'SELECTED STRUCTURE'):state.explode>.95?'ANATOMICAL INVENTORY':state.explode>.05?'SEPARATED STRUCTURES':'ADULT HUMAN · MALE'}</span><span className="caption-line"/></div>
   <section ref={acupuncturePanel} className={`acupuncture-panel glass ${panelPosition&&!compact?'is-moved':''} ${panelCollapsed&&!compact?'is-collapsed':''} ${compact?`is-sheet sheet-${sheetDetent}`:''}`} style={compact?undefined:panelPosition??undefined} aria-label={`${meridian.name} 경혈`}>
    {compact&&<button type="button" className="sheet-grabber" aria-label={`정보창 높이: ${{peek:'최소',half:'중간',full:'전체'}[sheetDetent]}. 위로 끌면 펼치고 아래로 끌면 접습니다`}
     onPointerDown={event=>{sheetDrag.current={pointerId:event.pointerId,y:event.clientY};event.currentTarget.setPointerCapture(event.pointerId);}}
     onPointerUp={event=>{const drag=sheetDrag.current;sheetDrag.current=null;if(!drag||drag.pointerId!==event.pointerId)return;const dy=event.clientY-drag.y;if(dy<-24)stepSheet(1);else if(dy>24)stepSheet(-1);else setSheetDetent(current=>current==='full'?'peek':SHEET_ORDER[SHEET_ORDER.indexOf(current)+1]);}}
     onPointerCancel={()=>{sheetDrag.current=null;}}
     onKeyDown={event=>{if(event.key==='ArrowUp'){event.preventDefault();stepSheet(1);}if(event.key==='ArrowDown'){event.preventDefault();stepSheet(-1);}}}><i/></button>}
    <div className="acupuncture-panel-head" title="드래그하여 정보창 이동 · 더블클릭하면 원위치" onPointerDown={startPanelDrag} onPointerMove={movePanelDrag} onPointerUp={endPanelDrag} onPointerCancel={endPanelDrag} onDoubleClick={()=>setPanelPosition(null)}><div><div className="eyebrow">{meridian.english} · {meridian.label}</div><h2>{selectedGbPoint.code} {selectedGbPoint.korean}</h2><p>{selectedGbPoint.hanja} · {selectedGbPoint.english}</p>{pointStatus&&<p><small>{pointStatus}</small></p>}
     {compact&&depthStrip&&<button type="button" className="sheet-depth" onClick={depthStrip.onClick} aria-label={`자침 ${depthStrip.percent}%, 현재 층 ${depthStrip.name}. 누르면 3D에서 강조`}><span><b>{depthStrip.percent}%</b>{depthStrip.name}</span><i><em style={{width:`${depthStrip.percent}%`}}/></i></button>}</div>
     <div className="acupuncture-panel-head-tools">{compact&&<div className="sheet-peek-nav"><button type="button" aria-label="이전 경혈" disabled={selectedGbIndex===0} onClick={()=>moveGbPoint(-1)}><ArrowLeft size={18}/></button><button type="button" aria-label="다음 경혈" disabled={selectedGbIndex===meridianPoints.length-1} onClick={()=>moveGbPoint(1)}><ArrowRight size={18}/></button></div>}<div className="panel-window-actions">{!compact&&<button type="button" className="panel-move-hint" aria-label="경혈 정보창 이동. 방향키로 이동하고 Home 키로 원위치" title="드래그 또는 방향키로 이동 · Home 키로 원위치" onKeyDown={movePanelWithKeyboard}><Move size={13}/><span>이동</span></button>}<button type="button" className="panel-collapse-button" aria-label={compact?(sheetDetent==='peek'?'경혈 정보창 펼치기':'경혈 정보창 접기'):panelCollapsed?'경혈 정보창 펼치기':'경혈 정보창 접기'} aria-expanded={compact?sheetDetent!=='peek':!panelCollapsed} onPointerDown={event=>event.stopPropagation()} onDoubleClick={event=>event.stopPropagation()} onClick={()=>compact?setSheetDetent(current=>current==='peek'?'half':'peek'):setPanelCollapsed(value=>!value)}>{(compact?sheetDetent==='peek':!panelCollapsed)?<ChevronUp size={16}/>:<ChevronDown size={16}/>}</button></div>{!compact&&<Badge variant="secondary">{selectedGbIndex+1} / {meridianPoints.length}</Badge>}</div></div>
    <MeridianRail tabs={availableMeridians.map(item=>({id:item.id,code:item.id,label:item.label,short:item.label.replace(/경$/,'')}))} activeId={meridian.id} disabled={!atlas} onCommit={id=>{const item=MERIDIANS[id as keyof typeof MERIDIANS];if(item)selectAcupoint(item.first);}}/>
    <div className="meridian-progress" role="progressbar" aria-label={`${meridian.label} 학습 진도`} aria-valuemin={1} aria-valuemax={meridianPoints.length} aria-valuenow={selectedGbIndex+1}><i style={{width:`${((selectedGbIndex+1)/meridianPoints.length)*100}%`}}/></div>
    <div className="archive-section">
    <div className="surface-toggle"><span><b>실제 체표 보기</b><small>경혈의 체표 위치 확인</small></span><button type="button" className="binary-toggle" role="switch" aria-label="실제 체표 보기" aria-checked={state.visible.length===1&&state.visible[0]==='integumentary'} onClick={()=>setState(s=>{const showingSurface=s.visible.length===1&&s.visible[0]==='integumentary';return {...s,visible:showingSurface?DEFAULT_VISIBLE:['integumentary'],selected:[],isolate:false};})}><i/></button></div>
    <form className="point-search" onSubmit={event=>{event.preventDefault();selectAcupoint(String(new FormData(event.currentTarget).get('gb-point')??pointQuery));}}><input name="gb-point" list="gb-point-options" aria-label="GB·LI 경혈 검색" value={pointQuery} onChange={event=>setPointQuery(event.target.value)} placeholder="GB34 / LI4 / 합곡"/><datalist id="gb-point-options">{allPoints.map(point=><option key={point.code} value={point.code}>{point.korean} · {point.english}</option>)}</datalist><Button variant="ghost" type="submit">검색·확대</Button></form>
    <div className="point-actions"><Button variant="ghost" onClick={showWholeMeridian} title="전체 경혈 보기 (Esc)" aria-keyshortcuts="Escape">전체 경혈 보기</Button><Button variant="ghost" onClick={()=>selectAcupoint(selectedGbPoint.code,'close')} title="오른쪽 몸의 이 혈을 가까이 확대">이 혈 확대 <Focus size={15}/></Button></div>
    <div className="point-navigation" aria-label="경혈 순차 탐색"><Button variant="ghost" disabled={selectedGbIndex===0} onClick={()=>moveGbPoint(-1)} aria-label="이전 경혈" title="이전 경혈 (←)"><ArrowLeft size={14}/> 이전</Button><span>{selectedGbPoint.code} · {selectedGbIndex+1} / {meridianPoints.length} <small>← · →</small></span><Button variant="ghost" disabled={selectedGbIndex===meridianPoints.length-1} onClick={()=>moveGbPoint(1)} aria-label="다음 경혈" title="다음 경혈 (→)">다음 <ArrowRight size={14}/></Button></div>
    <div className="line-toggle"><span>{meridian.id} 경맥 연결선</span><button type="button" className="binary-toggle" role="switch" aria-label={`${meridian.id} 경맥 연결선`} aria-checked={!!state.acupuncture?.showLines} disabled={!state.acupuncture?.showAll} onClick={()=>setState(s=>({...s,acupuncture:{...(s.acupuncture??initial.acupuncture!),showLines:!s.acupuncture?.showLines}}))}><i/></button></div>
    <article className="point-card"><div className="archive-index">01</div><div><h3>Location</h3><p className="point-name">{selectedGbPoint.korean}</p><p>{locationPieces.map((piece,index)=>typeof piece==='string'?piece:<span key={`${piece.key}-${index}`} className="landmark-chip" title={`${piece.ko}: 3D에서 보기`} {...focusTargetProps(compassFocus,pinned=>landmarkFocus(piece,pinned))}>{piece.ko}</span>)}</p>{selectedGbPoint.alternative&&<p><small>대안 위치: {selectedGbPoint.alternative}</small></p>}</div></article>
    {/* The viewer hides the opposite lower leg for these points, so say so: a reviewer must
        not read a hidden limb as anatomy the model does not have. */}
    {medialBelowKnee&&<p className="registration-note">내측 혈이라 시선이 반대쪽 다리를 통과합니다. 무릎 아래 반대쪽은 숨기고, 확대하면 다시 나타납니다.</p>}

    </div>
    <div className="archive-section">
    <div ref={needlePanel} className={`needle-panel needle-${profile.region}`}>
      <div className="archive-index">02</div>
      <div className="needle-heading"><b>Needling</b><span>{profile.probeDepthMm<=0?'자침 시뮬레이션 없음':'오른쪽 참조 모델 · 피부에 수직 자입'}</span></div>
      <div className="needling-source"><span>문헌 자침법</span><b>{profile.sourceNeedling}</b><small>{profile.depthValidation} · <a href={profile.validationSource} target="_blank" rel="noreferrer">검증 출처</a></small></div>
      <div className="archive-index profile-index">03</div>
      <div className="profile-heading">Needling Profile <span>자침 층서</span></div>
      <div className="point-actions">
        <Button variant="ghost" disabled={!needlePathPartIds.length} onClick={showNeedlePath}>경로 구조 보기 ({needlePathPartIds.length})</Button>
        <Button variant="ghost" disabled={!needleReport?.available} onClick={animateInsertion}>자침 경로 재생</Button>
        <FeedbackButton acupoint={selectedGbPoint.code} meridian={meridian.id}/>
      </div>
      {profile.probeDepthMm<=0?<p className="strata-empty">이 혈은 자침 시뮬레이션을 제공하지 않습니다.</p>:needleReport&&needleReport.code===selectedGbPoint.code?<StrataColumn report={needleReport} ratio={needle.depthRatio} onRatio={updateNeedle} refuseSignal={strataRefusal} focus={compassFocus}/>:<p className="strata-empty">경로를 계산하는 중입니다.</p>}
      {needleEyeWorkspace&&needleEyeProfile&&needleEye&&<NeedleEyeCompass profile={needleEyeProfile} references={needleEye.references} depth={needle.depthRatio} focus={compassFocus}/>}
      <p className={`safety-warning ${profile.region==='thorax'?'critical':''}`}>{profile.warning}{profile.pointRisk&&<><br/>{profile.pointRisk}</>}</p>
      {profile.probeDepthMm>0&&needleReport?.code===selectedGbPoint.code&&!needleReport.available&&<p className="needle-unavailable">이 경로에서는 깊이 조절을 할 수 없습니다.</p>}
      {!!profile.relations?.length&&<div className="reference-path"><b>문헌 구조 관계</b><ol>{profile.relations.map(({kind,structure})=><li key={`${kind}-${structure}`}>{RELATION_LABEL[kind]} · {structure}</li>)}</ol><small>문헌에 기록된 관계입니다. 이 모델의 경로와 다를 수 있습니다.</small></div>}
      <details><summary>모델 계산 정보</summary><p className="distance-warning">
        {profile.depthRangeCun?`문헌 직자 범위 ${profile.depthRangeCun[0]}–${profile.depthRangeCun[1]}촌 · ${needleReport?.sourceRangeBoundary?'모델 비례 범위 상한':'모델 위험 구조 이전 정지'}`:needleReport?.limitMm!=null?`시뮬레이션 상한 ${needleReport.limitMm.toFixed(1)} mm · 위험 경계 ${needleReport.boundaryMm?.toFixed(1)} mm`:'상한 산출 불가'}
        <br/>단일 성인 남성 참조 모델의 기하학적 경로이며 임상 안전심도가 아닙니다.{needleReport?.conceptual?' 흉막 경계는 개념 모델입니다.':''}
      </p></details>
    </div>

    </div>
   </section>
  <footer className="studio-footer"><span>{state.explode>.8?'Drag to pan':'Drag to orbit · Shift/right-drag to pan'} <b>·</b> Pinch/scroll to zoom <b>·</b> Tap to inspect</span><span className="footer-right"><span className="byline">BY J.H.Song (WKU. Korean Medicine)</span><Button variant="ghost" onClick={()=>{setDetails(false);setPanel(null);setAbout(true);}}>Source & credits <ArrowUpRight size={12}/></Button></span></footer>
  {progress<100&&!error&&<div className="loading glass" role="status"><Activity size={18}/><div><strong>Preparing the anatomy</strong><span>{progress}% · Loading {atlas?.parts.length.toLocaleString()??'2,289'} pieces</span><div className="loading-track"><i style={{width:`${progress}%`}}/></div></div></div>}
  {error&&<div className="loading glass error" role="alert"><p>{error}</p><Button variant="ghost" onClick={()=>location.reload()}>Reload viewer</Button></div>}
  <Sheet open={details&&selectedParts.length>0} modal={false} disablePointerDismissal onOpenChange={setDetails}><SheetContent initialFocus={detailTitle} className={`detail-sheet glass ${state.isolate?'is-isolated':''}`} showCloseButton={true}><div className="detail-header"><div className="detail-accent" style={{background:system?.color}}/><div className="eyebrow">{system?.name??'ANATOMY'}</div><SheetTitle ref={detailTitle} tabIndex={-1} className="structure-title">{chosen?bilingualPartName(chosen.name):null}</SheetTitle></div><div className="detail-scroll" key={`${chosen?.id}-${state.isolate}`}><SheetDescription className="structure-description">{chosen&&selected?explanation(chosen.name,selected.system):''}</SheetDescription>{chosen&&!EXPLANATIONS[chosen.name.toLowerCase()]&&<span className="context-note">System overview · structure identified from source anatomy</span>}{reviewMode&&<div className="structure-meta"><span>Atlas reference<strong>{chosen?.id}</strong></span><span>Selected pieces<strong>{state.selected.length.toLocaleString()}</strong></span></div>}{selectedParts.length>1&&<div className="member-list"><h3>Included structures</h3>{selectedParts.slice(0,50).map(p=><Button variant="ghost" key={p.id} onClick={()=>choosePart(p.id)}><span>{bilingualPartName(p.name)}</span><ChevronRight size={14}/></Button>)}{selectedParts.length>50&&<p>And {selectedParts.length-50} more modeled pieces.</p>}</div>}<a className="source-link" href="https://lifesciencedb.jp/bp3d/" target="_blank" rel="noreferrer">View anatomical source <ArrowUpRight size={14}/></a></div><div className="detail-actions">{selectedParts.length===1&&hideable(selected)&&<Button className="primary-action" onClick={()=>hideMuscle(selected.id)}>숨기기 <ChevronRight size={16}/></Button>}<Button variant="ghost" className="secondary-action" onClick={()=>{setState(s=>({...s,selected:[],isolate:false}));setDetails(false);}}>Clear selection</Button></div></SheetContent></Sheet>
  <Sheet open={about} onOpenChange={setAbout}><SheetContent className="about-sheet glass"><div className="eyebrow">SOURCE & STUDY SCOPE</div><SheetTitle className="structure-title">해부·경혈 위치 학습용 모델</SheetTitle><SheetDescription>문헌 자침 범위를 단일 참조 모델에 기하학적으로 표시합니다.</SheetDescription><div className="about-copy"><p><strong>첫 학습본의 범위</strong><br/>이 화면은 성인 남성 참조 해부와 경혈 위치 학습용입니다. 진단, 시술 계획, 안전 심도 결정 또는 자가 자침 지침이 아닙니다.</p><p>{RELEASE_POINT_NOTE}</p><p>寸은 문헌 원문 그대로 보존하며 mm는 이 모델의 비례 환산값입니다. 자침 경로는 개인차·자세·호흡·질환을 반영하지 못하므로 실제 시술의 안전 판정으로 사용할 수 없습니다.</p><p>신경·혈관과 보완 메시도 경로 계산에 포함되지만, 웹용 메시 단순화와 정합 오차가 있어 실제 환자의 구조를 대신할 수 없습니다.</p><h3>Source</h3><p>BodyParts3D 및 Z-Anatomy 기반 학습용 재구성입니다.</p><a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html" target="_blank" rel="noreferrer">Dataset license <ArrowUpRight size={14}/></a><a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html" target="_blank" rel="noreferrer">Original geometry & metadata <ArrowUpRight size={14}/></a><a href="https://academic.oup.com/nar/article/37/suppl_1/D782/1000752" target="_blank" rel="noreferrer">Read the source publication <ArrowUpRight size={14}/></a></div></SheetContent></Sheet>
 </main>;
}
