import {useCallback,useEffect,useRef,useState,type KeyboardEvent,type PointerEvent} from 'react';

export interface RailTab{id:string;code:string;label:string;short:string}
interface MeridianRailProps{
 tabs:RailTab[];
 activeId:string;
 onCommit:(id:string)=>void;
 disabled?:boolean;
}

/**
 * Fourteen tabs on one axis, with a detent between each.
 *
 * Choosing a meridian sits above choosing a point, so it has to feel like a decision
 * rather than a swipe. Two things do that here, and neither is a delay: the axes are
 * separated (meridian moves only left-right, the point rail only up-down, enforced by
 * touch-action so the browser agrees), and nothing commits until the pointer lifts.
 * Drag past a detent and the tabs step and the caption previews, but the 3D model is
 * not touched until release - which also means dragging across ten meridians reloads
 * nothing.
 *
 * Weight comes from resistance, not from waiting. A press answers immediately, a small
 * wobble does nothing at all, and the step arrives when the travel earns it.
 */
const ENGAGE=14;      // px of horizontal travel before a drag is a drag
const DETENT=26;      // px per step once engaged
const BIAS=1.35;      // how much more horizontal than vertical the travel must be
const SLIP=10;        // px of drift still counted as a tap on the same tab

export function MeridianRail({tabs,activeId,onCommit,disabled}:MeridianRailProps){
 const rail=useRef<HTMLDivElement>(null);
 const gesture=useRef<{id:number,x:number,y:number,from:number,dragging:boolean,tab:number}|null>(null);
 const [pressed,setPressed]=useState(-1);
 const [preview,setPreview]=useState<number|null>(null);
 const activeIndex=Math.max(0,tabs.findIndex(tab=>tab.id===activeId));
 const shownIndex=preview??activeIndex;
 const shown=tabs[shownIndex]??tabs[0];

 // A preview belongs to the gesture that made it; a selection from elsewhere clears it.
 useEffect(()=>{if(!gesture.current)setPreview(null);},[activeId]);

 const indexAt=useCallback((clientX:number)=>{
  const host=rail.current;
  if(!host)return -1;
  const box=host.getBoundingClientRect();
  const slot=box.width/tabs.length;
  return Math.min(tabs.length-1,Math.max(0,Math.floor((clientX-box.left)/slot)));
 },[tabs.length]);

 const down=(event:PointerEvent<HTMLDivElement>)=>{
  if(disabled||gesture.current)return;
  const tab=indexAt(event.clientX);
  gesture.current={id:event.pointerId,x:event.clientX,y:event.clientY,from:activeIndex,dragging:false,tab};
  setPressed(tab);
  event.currentTarget.setPointerCapture(event.pointerId);
 };

 const move=(event:PointerEvent<HTMLDivElement>)=>{
  const state=gesture.current;
  if(!state||state.id!==event.pointerId)return;
  const dx=event.clientX-state.x,dy=event.clientY-state.y;
  if(!state.dragging){
   // Vertical travel never becomes a meridian change, however far it goes.
   if(Math.abs(dx)<ENGAGE||Math.abs(dx)<Math.abs(dy)*BIAS){
    if(Math.abs(dx)>SLIP||Math.abs(dy)>SLIP)setPressed(-1);
    return;
   }
   state.dragging=true;
   state.x=event.clientX;
   setPressed(-1);
  }
  const steps=Math.round((event.clientX-state.x)/DETENT);
  const next=Math.min(tabs.length-1,Math.max(0,state.from+steps));
  setPreview(current=>current===next?current:next);
 };

 const up=(event:PointerEvent<HTMLDivElement>)=>{
  const state=gesture.current;
  if(!state||state.id!==event.pointerId)return;
  gesture.current=null;
  event.currentTarget.releasePointerCapture?.(event.pointerId);
  const landed=state.dragging?preview:(indexAt(event.clientX)===state.tab?state.tab:-1);
  setPressed(-1);
  setPreview(null);
  if(landed===null||landed===undefined||landed<0)return;
  if(tabs[landed]&&tabs[landed].id!==activeId)onCommit(tabs[landed].id);
 };

 const cancel=()=>{gesture.current=null;setPressed(-1);setPreview(null);};

 // Arrows work here and only here; the page does not claim them.
 const key=(event:KeyboardEvent<HTMLDivElement>)=>{
  if(disabled)return;
  const step=event.key==='ArrowLeft'?-1:event.key==='ArrowRight'?1:0;
  const jump=event.key==='Home'?0:event.key==='End'?tabs.length-1:-1;
  if(!step&&jump<0)return;
  event.preventDefault();
  const next=step?Math.min(tabs.length-1,Math.max(0,activeIndex+step)):jump;
  if(tabs[next]&&tabs[next].id!==activeId)onCommit(tabs[next].id);
 };

 return (
  <div className="meridian-rail-shell">
   <div
    ref={rail}
    className="meridian-rail"
    role="tablist"
    aria-label="경맥 선택"
    aria-orientation="horizontal"
    tabIndex={disabled?-1:0}
    onPointerDown={down}
    onPointerMove={move}
    onPointerUp={up}
    onPointerCancel={cancel}
    onKeyDown={key}
   >
    {tabs.map((tab,index)=>(
     <button
      key={tab.id}
      type="button"
      role="tab"
      tabIndex={-1}
      disabled={disabled}
      aria-selected={index===shownIndex}
      className={`meridian-tab${index===shownIndex?' engaged':''}${index===pressed?' pressed':''}`}
      // Keep focus on the rail, so the keyboard has one owner and a click never leaves a
      // focus ring around a single tab.
      onMouseDown={event=>event.preventDefault()}
      // The pointer handlers own the gesture; this is here for assistive technology.
      onClick={event=>{event.preventDefault();}}
     >
      <i>{tab.short}</i>
      <span>{tab.code}</span>
     </button>
    ))}
   </div>
   <p className="meridian-caption" aria-live="polite">{shown?`${shown.code} · ${shown.label}`:''}</p>
  </div>
 );
}
