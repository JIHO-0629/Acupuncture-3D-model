import {useCallback,useEffect,useRef,useState} from 'react';
import {COMPACT_TOUR_STEPS,MINI_TOURS,type MiniTourId,type TutorialStep} from './tutorial';

const STORAGE_KEY='acupoint-atlas-exploration-tutorial-v1';
const INTRO_SEEN_KEY='acupoint-atlas-exploration-intro-seen-v1';
const HINT_PREFIX='acupoint-atlas-feature-hint-v1:';
const MINI_PREFIX='acupoint-atlas-mini-tour-v1:';
function read(key:string){try{return localStorage.getItem(key);}catch{return null;}}
function write(key:string,value:string){try{localStorage.setItem(key,value);}catch{/* browsing still works without storage */}}

export function useTutorial(ready:boolean,compact:boolean){
 const [step,setStep]=useState<TutorialStep|null>(null);
 const [hint,setHint]=useState<string|null>(null);
 const [miniTour,setMiniTour]=useState<{id:MiniTourId;index:number}|null>(null);
 const initialized=useRef(false),orbitDone=useRef({rotate:false,zoom:false});
 useEffect(()=>{if(!ready||initialized.current)return;initialized.current=true;if(!read(INTRO_SEEN_KEY)){write(INTRO_SEEN_KEY,'1');setStep('invite');}},[ready]);
 useEffect(()=>{if(step)write(STORAGE_KEY,`in-progress:${step}`);},[step]);
 // Phones get the short tour only: the panels the rest of it points at are tablet layouts.
 useEffect(()=>{if(compact&&step&&step!=='invite'&&step!=='finish'&&!(COMPACT_TOUR_STEPS as readonly string[]).includes(step))setStep('finish');},[compact,step]);
 const advance=useCallback((from:TutorialStep,to:TutorialStep)=>setStep(current=>current===from?to:current),[]);
 /** The first step wants both gestures, in either order. */
 const orbit=useCallback((kind:'rotate'|'zoom')=>{
  orbitDone.current[kind]=true;
  if(orbitDone.current.rotate&&orbitDone.current.zoom)setStep(current=>current==='orbit'?'meridian':current);
 },[]);
 const replay=useCallback(()=>{setHint(null);setMiniTour(null);setStep('invite');},[]);
 const start=useCallback(()=>{orbitDone.current={rotate:false,zoom:false};setStep('orbit');},[]);
 const close=useCallback((status:'complete'|'skipped')=>{write(STORAGE_KEY,status);setStep(null);},[]);
 const clearHint=useCallback(()=>setHint(null),[]);
 const showHintOnce=useCallback((key:string,text:string)=>{
  if(step||read(HINT_PREFIX+key))return;
  write(HINT_PREFIX+key,'shown');setHint(text);
 },[step]);
 /** A feature's short tour, the first time it opens. Not during the main tour, which covers the basics itself. */
 const openMiniTourOnce=useCallback((id:MiniTourId)=>{
  if(step||compact||read(MINI_PREFIX+id))return;
  write(MINI_PREFIX+id,'shown');setHint(null);setMiniTour({id,index:0});
 },[step,compact]);
 const showMiniTour=useCallback((id:MiniTourId)=>{write(MINI_PREFIX+id,'shown');setHint(null);setMiniTour({id,index:0});},[]);
 const nextMiniCard=useCallback(()=>setMiniTour(current=>current&&current.index<MINI_TOURS[current.id].cards.length-1?{...current,index:current.index+1}:null),[]);
 const closeMiniTour=useCallback(()=>setMiniTour(null),[]);
 return {step,advance,orbit,replay,start,close,hint,clearHint,showHintOnce,miniTour,openMiniTourOnce,showMiniTour,nextMiniCard,closeMiniTour};
}
