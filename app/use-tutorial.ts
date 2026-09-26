import {useCallback,useEffect,useRef,useState} from 'react';
import type {TutorialStep} from './tutorial';

const STORAGE_KEY='acupoint-atlas-exploration-tutorial-v1';
const INTRO_SEEN_KEY='acupoint-atlas-exploration-intro-seen-v1';
const HINT_PREFIX='acupoint-atlas-feature-hint-v1:';
function read(key:string){try{return localStorage.getItem(key);}catch{return null;}}
function write(key:string,value:string){try{localStorage.setItem(key,value);}catch{/* browsing still works without storage */}}

export function useTutorial(ready:boolean,compact:boolean){
 const [step,setStep]=useState<TutorialStep|null>(null);
 const [hint,setHint]=useState<string|null>(null);
 const initialized=useRef(false);
 useEffect(()=>{if(!ready||initialized.current)return;initialized.current=true;if(!read(INTRO_SEEN_KEY)){write(INTRO_SEEN_KEY,'1');setStep('invite');}},[ready]);
 useEffect(()=>{if(step)write(STORAGE_KEY,`in-progress:${step}`);},[step]);
 useEffect(()=>{if(compact&&step&&['landmark','play','strata'].includes(step))setStep('finish');},[compact,step]);
 const advance=useCallback((from:TutorialStep,to:TutorialStep)=>setStep(current=>current===from?to:current),[]);
 const replay=useCallback(()=>{setHint(null);setStep('invite');},[]);
 const start=useCallback(()=>setStep('rotate'),[]);
 const close=useCallback((status:'complete'|'skipped')=>{write(STORAGE_KEY,status);setStep(null);},[]);
 const clearHint=useCallback(()=>setHint(null),[]);
 const showHintOnce=useCallback((key:string,text:string)=>{
  if(step||read(HINT_PREFIX+key))return;
  write(HINT_PREFIX+key,'shown');setHint(text);
 },[step]);
 return {step,advance,replay,start,close,hint,clearHint,showHintOnce};
}
