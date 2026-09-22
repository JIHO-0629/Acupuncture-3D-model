import {useEffect,useLayoutEffect,useRef,type KeyboardEvent} from 'react';

export interface ScrubberPoint{code:string;primary:string;secondary?:string}
interface AcupointScrubberProps{
 points:ScrubberPoint[];
 activeCode:string;
 onPointChange:(code:string)=>void;
 label?:string;
 /** Quiet time after the last user input before the landing card is committed. */
 settleMs?:number;
 /** Also respond to ↑ ↓ / PageUp PageDown when focus is elsewhere on the page (not in fields/sliders). */
 hotkeys?:boolean;
}
interface Motion{current:number;target:number;frame:number;lastFrame:number;animating:boolean;touching:boolean;idle:ReturnType<typeof setTimeout>|undefined;reduce:boolean;step:number;committed:string}

/**
 * Vertical card rail. Scroll position, damping and card emphasis live in refs + rAF;
 * React (and therefore the 3D scene) only hears about a card once input has settled.
 * The landing card is committed from the glide TARGET, so the 3D move starts while the
 * roller is still easing into place instead of after the animation tail.
 */
export function AcupointScrubber({points,activeCode,onPointChange,label='경혈 탐색',settleMs=120,hotkeys=false}:AcupointScrubberProps){
 const rail=useRef<HTMLDivElement>(null);
 const cards=useRef<(HTMLButtonElement|null)[]>([]);
 const live=useRef({points,activeCode,onPointChange,hotkeys});
 live.current={points,activeCode,onPointChange,hotkeys};
 const motion=useRef<Motion>({current:0,target:0,frame:0,lastFrame:0,animating:false,touching:false,idle:undefined,reduce:false,step:1,committed:activeCode});
 const api=useRef<{glide:(to:number,commitAfter?:boolean)=>void;measure:(keepIndex?:number)=>void;key:(key:string)=>boolean}|null>(null);
 cards.current.length=points.length;

 useLayoutEffect(()=>{
  const el=rail.current;if(!el)return;
  const m=motion.current;
  const last=()=>live.current.points.length-1;
  const clamp=(value:number)=>Math.max(0,Math.min(el.scrollHeight-el.clientHeight,value));
  const indexAt=(position:number)=>Math.max(0,Math.min(last(),Math.round(position/m.step)));
  const destination=()=>m.animating?m.target:el.scrollTop;
  const paint=()=>{
   const position=el.scrollTop/m.step;
   cards.current.forEach((card,index)=>{
    if(!card)return;
    const signed=index-position,d=Math.abs(signed);
    // Single-slot roller: neighbours only peek (≤ .35) and vanish by 1.5 slots away.
    const opacity=d<1?1-.65*d:Math.max(0,.35-.7*(d-1));
    card.style.opacity=opacity.toFixed(3);
    card.style.visibility=d>1.6?'hidden':'';
    // Soft drum roll (flip-clock idea without the hard hinge): tilt away as a card leaves the slot.
    const tilt=-Math.max(-1,Math.min(1,signed))*42;
    card.style.transform=m.reduce?'':`perspective(700px) rotateX(${tilt.toFixed(2)}deg) scale(${(1-.06*Math.min(d,1)).toFixed(4)})`;
    const active=d<.5;
    if((card.dataset.active==='true')!==active)card.dataset.active=String(active);
   });
  };
  const schedule=()=>{clearTimeout(m.idle);m.idle=setTimeout(settle,settleMs);};
  const finish=()=>{cancelAnimationFrame(m.frame);m.current=m.target;el.scrollTop=m.target;m.animating=false;m.frame=0;paint();el.dataset.scrolling='false';};
  const tick=(now:number)=>{
   const diff=m.target-m.current;
   if(Math.abs(diff)<.5){finish();return;}
   // Exponential damping normalised to 60 fps, so 120 Hz displays glide at the same speed.
   const dt=Math.min(64,now-(m.lastFrame||now-16.7));
   m.lastFrame=now;
   m.current+=diff*(1-Math.pow(1-.16,dt/16.7));
   el.scrollTop=m.current;
   paint();
   m.frame=requestAnimationFrame(tick);
  };
  const glide=(to:number,commitAfter=true)=>{
   m.target=clamp(to);
   el.dataset.scrolling='true';
   if(m.reduce){m.current=m.target;el.scrollTop=m.target;paint();if(commitAfter)schedule();return;}
   if(!m.animating){m.current=el.scrollTop;m.animating=true;m.lastFrame=0;m.frame=requestAnimationFrame(tick);}
   if(commitAfter)schedule();else clearTimeout(m.idle);
  };
  const commit=(index:number)=>{
   const code=live.current.points[index]?.code;
   if(!code||code===m.committed||code===live.current.activeCode){if(code)m.committed=code;return;}
   m.committed=code;
   live.current.onPointChange(code);
  };
  // Runs once input has been quiet for settleMs — not when the easing tail ends.
  const settle=()=>{
   if(!el.clientHeight||!el.scrollHeight)return;
   // Frames throttled (hidden/background tab): land immediately instead of hanging mid-glide.
   if(m.animating&&performance.now()-m.lastFrame>250)finish();
   if(m.touching){schedule();return;}
   const index=indexAt(destination());
   const to=index*m.step;
   if(Math.abs(destination()-to)>1){m.target=clamp(to);if(!m.animating&&!m.reduce){m.current=el.scrollTop;m.animating=true;m.lastFrame=0;m.frame=requestAnimationFrame(tick);}else if(m.reduce){finish();}}
   // Already aligned (e.g. native/programmatic scroll that needed no glide): hide the scrollbar again.
   if(!m.animating)el.dataset.scrolling='false';
   commit(index);
  };
  const measure=(keepIndex?:number)=>{
   if(!el.clientHeight)return;
   const index=keepIndex??indexAt(el.scrollTop);
   const first=cards.current[0],second=cards.current[1];
   m.step=first?(second?second.offsetTop-first.offsetTop:first.offsetHeight)||1:1;
   m.current=m.target=clamp(index*m.step);
   m.committed=live.current.activeCode;
   el.scrollTop=m.current;
   paint();
  };
  const key=(name:string)=>{
   const move={ArrowDown:1,ArrowUp:-1,PageDown:3,PageUp:-3}[name as 'ArrowDown'];
   const edge=name==='Home'?0:name==='End'?last():undefined;
   if(move===undefined&&edge===undefined)return false;
   const index=Math.max(0,Math.min(last(),edge??indexAt(destination())+move));
   glide(index*m.step);
   return true;
  };
  const cancel=()=>{if(m.animating){cancelAnimationFrame(m.frame);m.animating=false;}};
  const onWheel=(event:WheelEvent)=>{
   if(m.reduce||event.ctrlKey)return; // native scroll (+ snap) under reduced motion; ctrl = browser zoom
   event.preventDefault();
   const unit=event.deltaMode===1?16:event.deltaMode===2?el.clientHeight:1;
   glide(destination()+event.deltaY*unit);
  };
  // Only native movement (touch momentum, scrollbar drag) restarts the settle clock; our own glide frames do not.
  const onScroll=()=>{if(!el.clientHeight)return;paint();if(m.animating||Math.abs(el.scrollTop-m.target)<1&&m.committed===live.current.activeCode)return;m.current=el.scrollTop;el.dataset.scrolling='true';schedule();};
  const onTouchStart=()=>{m.touching=true;cancel();};
  const onTouchEnd=()=>{m.touching=false;schedule();};
  const editable='input,textarea,select,[contenteditable=""],[contenteditable=true],[role=slider],[role=spinbutton],[role=listbox],[role=menu],[role=dialog]';
  const onGlobalKey=(event:globalThis.KeyboardEvent)=>{
   if(!live.current.hotkeys||event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey)return;
   const target=event.target;
   if(target instanceof Node&&el.contains(target))return; // the rail's own handler covers focus inside it
   if(target instanceof Element&&target.closest(editable))return;
   if(!['ArrowUp','ArrowDown','PageUp','PageDown'].includes(event.key))return;
   if(key(event.key))event.preventDefault();
  };
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const onMotion=()=>{m.reduce=media.matches;paint();};
  onMotion();
  const resize=new ResizeObserver(()=>measure());
  resize.observe(el);
  el.addEventListener('wheel',onWheel,{passive:false});
  el.addEventListener('scroll',onScroll,{passive:true});
  el.addEventListener('touchstart',onTouchStart,{passive:true});
  el.addEventListener('touchend',onTouchEnd,{passive:true});
  el.addEventListener('touchcancel',onTouchEnd,{passive:true});
  window.addEventListener('keydown',onGlobalKey);
  media.addEventListener('change',onMotion);
  api.current={glide,measure,key};
  return()=>{
   cancel();clearTimeout(m.idle);resize.disconnect();media.removeEventListener('change',onMotion);
   el.removeEventListener('wheel',onWheel);el.removeEventListener('scroll',onScroll);
   el.removeEventListener('touchstart',onTouchStart);el.removeEventListener('touchend',onTouchEnd);el.removeEventListener('touchcancel',onTouchEnd);
   window.removeEventListener('keydown',onGlobalKey);
   api.current=null;
  };
 },[settleMs]);

 // New point set (e.g. meridian switch): jump without animation, centred on the active card.
 const pointKey=points.map(point=>point.code).join('|');
 useLayoutEffect(()=>{
  const index=live.current.points.findIndex(point=>point.code===live.current.activeCode);
  api.current?.measure(Math.max(0,index));
 },[pointKey]);

 // Selection made elsewhere (3D click, search, ← →): glide the rail to it.
 useEffect(()=>{
  const el=rail.current,m=motion.current;
  m.committed=activeCode;
  if(!el||!el.clientHeight||!api.current||m.touching)return;
  const index=live.current.points.findIndex(point=>point.code===activeCode);
  if(index<0)return;
  const to=index*m.step;
  if(Math.abs((m.animating?m.target:el.scrollTop)-to)>1)api.current.glide(to,false);
 },[activeCode]);

 const onKeyDown=(event:KeyboardEvent<HTMLDivElement>)=>{if(api.current?.key(event.key))event.preventDefault();};

 return <div ref={rail} className="acupoint-scrubber" data-scrolling="false" tabIndex={0} role="group" aria-roledescription="card rail" aria-label={label} aria-keyshortcuts="ArrowUp ArrowDown PageUp PageDown" onKeyDown={onKeyDown}>
  <div className="scrub-spacer" aria-hidden="true"/>
  {points.map((point,index)=><button key={point.code} ref={node=>{cards.current[index]=node;}} type="button" tabIndex={-1} className="scrub-card" aria-current={point.code===activeCode?'true':undefined} onClick={()=>api.current?.glide(index*motion.current.step)}>
   <strong>{point.code}</strong>
   <span><b>{point.primary}</b>{point.secondary&&<small>{point.secondary}</small>}</span>
  </button>)}
  <div className="scrub-spacer" aria-hidden="true"/>
 </div>;
}
