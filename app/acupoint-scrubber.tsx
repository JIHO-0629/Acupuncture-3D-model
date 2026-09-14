import {useEffect,useLayoutEffect,useRef,type KeyboardEvent} from 'react';

export interface ScrubberPoint{code:string;primary:string;secondary?:string}
interface AcupointScrubberProps{
 points:ScrubberPoint[];
 activeCode:string;
 onPointChange:(code:string)=>void;
 label?:string;
 /** Quiet time after the last scroll movement before a card counts as settled. */
 settleMs?:number;
}
interface Motion{current:number;target:number;frame:number;lastFrame:number;animating:boolean;touching:boolean;idle:ReturnType<typeof setTimeout>|undefined;reduce:boolean;step:number}

/**
 * Vertical card rail. Scroll position, damping and card emphasis live in refs + rAF;
 * React (and therefore the 3D scene) only hears about a card once scrolling has settled.
 */
export function AcupointScrubber({points,activeCode,onPointChange,label='경혈 탐색',settleMs=120}:AcupointScrubberProps){
 const rail=useRef<HTMLDivElement>(null);
 const cards=useRef<(HTMLButtonElement|null)[]>([]);
 const live=useRef({points,activeCode,onPointChange});
 live.current={points,activeCode,onPointChange};
 const motion=useRef<Motion>({current:0,target:0,frame:0,lastFrame:0,animating:false,touching:false,idle:undefined,reduce:false,step:1});
 const api=useRef<{glide:(to:number)=>void;nearest:()=>number;measure:(keepIndex?:number)=>void}|null>(null);
 cards.current.length=points.length;

 useLayoutEffect(()=>{
  const el=rail.current;if(!el)return;
  const m=motion.current;
  const clamp=(value:number)=>Math.max(0,Math.min(el.scrollHeight-el.clientHeight,value));
  const nearest=()=>Math.max(0,Math.min(live.current.points.length-1,Math.round(el.scrollTop/m.step)));
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
  const finish=()=>{cancelAnimationFrame(m.frame);m.current=m.target;el.scrollTop=m.target;m.animating=false;m.frame=0;paint();};
  const tick=(now:number)=>{
   const diff=m.target-m.current;
   if(Math.abs(diff)<.5){finish();schedule();return;}
   // Exponential damping normalised to 60 fps, so 120 Hz displays glide at the same speed.
   const dt=Math.min(64,now-(m.lastFrame||now-16.7));
   m.lastFrame=now;
   m.current+=diff*(1-Math.pow(1-.16,dt/16.7));
   el.scrollTop=m.current;
   paint();
   m.frame=requestAnimationFrame(tick);
  };
  const glide=(to:number)=>{
   m.target=clamp(to);
   if(m.reduce){m.current=m.target;el.scrollTop=m.target;paint();schedule();return;}
   if(!m.animating){m.current=el.scrollTop;m.animating=true;m.lastFrame=0;m.frame=requestAnimationFrame(tick);}
   schedule();
  };
  const settle=()=>{
   // Frames throttled (hidden/background tab): land immediately instead of never settling.
   if(m.animating&&performance.now()-m.lastFrame>250)finish();
   if(m.touching||m.animating){schedule();return;}
   const index=nearest(),to=index*m.step;
   if(Math.abs(el.scrollTop-to)>1){glide(to);return;}
   el.dataset.scrolling='false';
   const code=live.current.points[index]?.code;
   if(code&&code!==live.current.activeCode)live.current.onPointChange(code);
  };
  const measure=(keepIndex?:number)=>{
   const index=keepIndex??nearest();
   const first=cards.current[0],second=cards.current[1];
   m.step=first?(second?second.offsetTop-first.offsetTop:first.offsetHeight)||1:1;
   m.current=m.target=clamp(index*m.step);
   el.scrollTop=m.current;
   paint();
  };
  const cancel=()=>{if(m.animating){cancelAnimationFrame(m.frame);m.animating=false;}};
  const onWheel=(event:WheelEvent)=>{
   if(m.reduce||event.ctrlKey)return; // native scroll (+ snap) under reduced motion; ctrl = browser zoom
   event.preventDefault();
   const unit=event.deltaMode===1?16:event.deltaMode===2?el.clientHeight:1;
   glide((m.animating?m.target:el.scrollTop)+event.deltaY*unit);
   el.dataset.scrolling='true';
  };
  const onScroll=()=>{if(!m.animating)m.current=el.scrollTop;el.dataset.scrolling='true';paint();schedule();};
  const onTouchStart=()=>{m.touching=true;cancel();};
  const onTouchEnd=()=>{m.touching=false;schedule();};
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
  media.addEventListener('change',onMotion);
  api.current={glide,nearest,measure};
  return()=>{
   cancel();clearTimeout(m.idle);resize.disconnect();media.removeEventListener('change',onMotion);
   el.removeEventListener('wheel',onWheel);el.removeEventListener('scroll',onScroll);
   el.removeEventListener('touchstart',onTouchStart);el.removeEventListener('touchend',onTouchEnd);el.removeEventListener('touchcancel',onTouchEnd);
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
  if(!el||!api.current||m.touching)return;
  const index=live.current.points.findIndex(point=>point.code===activeCode);
  if(index<0)return;
  const to=index*m.step;
  if(Math.abs((m.animating?m.target:el.scrollTop)-to)>1)api.current.glide(to);
 },[activeCode]);

 const onKeyDown=(event:KeyboardEvent<HTMLDivElement>)=>{
  const move={ArrowDown:1,ArrowUp:-1,PageDown:3,PageUp:-3}[event.key as 'ArrowDown'];
  const edge=event.key==='Home'?0:event.key==='End'?points.length-1:undefined;
  if(move===undefined&&edge===undefined)return;
  event.preventDefault();
  const m=motion.current,current=Math.round((m.animating?m.target:rail.current?.scrollTop??0)/m.step);
  const index=Math.max(0,Math.min(points.length-1,edge??current+move));
  api.current?.glide(index*m.step);
 };

 return <div ref={rail} className="acupoint-scrubber" data-scrolling="false" tabIndex={0} role="group" aria-roledescription="card rail" aria-label={label} onKeyDown={onKeyDown}>
  <div className="scrub-spacer" aria-hidden="true"/>
  {points.map((point,index)=><button key={point.code} ref={node=>{cards.current[index]=node;}} type="button" tabIndex={-1} className="scrub-card" aria-current={point.code===activeCode?'true':undefined} onClick={()=>api.current?.glide(index*motion.current.step)}>
   <strong>{point.code}</strong>
   <span><b>{point.primary}</b>{point.secondary&&<small>{point.secondary}</small>}</span>
  </button>)}
  <div className="scrub-spacer" aria-hidden="true"/>
 </div>;
}
