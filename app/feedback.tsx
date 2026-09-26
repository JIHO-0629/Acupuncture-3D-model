import {MessageSquare} from 'lucide-react';
import packageJson from '../package.json';
import {Button} from '@/components/ui/button';

const TALLY_FORM_URL='https://tally.so/r/J97MQX';
const TALLY_FORM_ID='J97MQX';
const TALLY_SCRIPT_URL='https://tally.so/widgets/embed.js';
const TALLY_LOAD_TIMEOUT_MS=5000;

export type FeedbackContext={
  acupoint:string; meridian:string; side:'left'|'right'|'midline'|'unknown'; screen:string; mode:string;
  app_version:string; page_url:string; source:'atlas-feedback';
};
type TallyApi={openPopup?:(formId:string,options:{layout:'modal';hiddenFields:Record<string,string>})=>void};
declare global{interface Window{Tally?:TallyApi}}
let tallyScriptPromise:Promise<TallyApi>|null=null;

export function feedbackUrl(context:FeedbackContext){
  const url=new URL(TALLY_FORM_URL);
  Object.entries(context).forEach(([key,value])=>url.searchParams.set(key,value));
  return url.toString();
}

export function feedbackContext({acupoint,meridian}:{acupoint?:string;meridian?:string}):FeedbackContext{
  const point=acupoint??'';
  return {acupoint:point,meridian:meridian??'',side:point.startsWith('GV')||point.startsWith('CV')?'midline':point?'right':'unknown',screen:'3d',mode:'study',app_version:packageJson.version,page_url:window.location.href,source:'atlas-feedback'};
}

function loadTally(){
  if(window.Tally?.openPopup)return Promise.resolve(window.Tally);
  if(tallyScriptPromise)return tallyScriptPromise;
  tallyScriptPromise=new Promise<TallyApi>((resolve,reject)=>{
    const finish=()=>window.Tally?.openPopup?resolve(window.Tally):reject(new Error('Tally popup API unavailable'));
    const existing=document.querySelector<HTMLScriptElement>(`script[src="${TALLY_SCRIPT_URL}"]`);
    const script=existing??document.createElement('script');
    const timeout=window.setTimeout(()=>reject(new Error('Tally script timed out')),TALLY_LOAD_TIMEOUT_MS);
    const complete=()=>{window.clearTimeout(timeout);finish();};
    script.addEventListener('load',complete,{once:true});
    script.addEventListener('error',()=>{window.clearTimeout(timeout);reject(new Error('Tally script failed to load'));},{once:true});
    if(!existing){script.src=TALLY_SCRIPT_URL;script.async=true;document.head.appendChild(script);}
  }).catch(error=>{tallyScriptPromise=null;throw error;});
  return tallyScriptPromise;
}

export function FeedbackButton({acupoint,meridian,toolbar=false}:{acupoint?:string;meridian?:string;toolbar?:boolean}){
  const openFeedback=()=>{
    const context=feedbackContext({acupoint,meridian}),url=feedbackUrl(context);
    loadTally().then(tally=>tally.openPopup?.(TALLY_FORM_ID,{layout:'modal',hiddenFields:context})).catch(()=>window.open(url,'_blank','noopener,noreferrer'));
  };
  return <Button variant="ghost" className={`feedback-button ${toolbar?'feedback-button-toolbar':''}`} onClick={openFeedback} aria-label="현재 경혈에 대한 피드백 보내기" data-tip="피드백|이 혈과 화면에 대한 의견을 보냅니다"><MessageSquare size={toolbar?18:15}/><span>피드백</span></Button>;
}
