import {useEffect,useState} from 'react';

export type TutorialStep='invite'|'rotate'|'zoom'|'point'|'landmark'|'play'|'strata'|'finish';
type Box={left:number;top:number;width:number;height:number};
const copy:Record<Exclude<TutorialStep,'invite'>,{title:string;body:string;selector:string}>={
 rotate:{title:'몸을 돌려 보세요',body:'3D 몸을 드래그해 다른 방향에서 살펴보세요.',selector:'.scene canvas'},
 zoom:{title:'가까이 확대해 보세요',body:'스크롤하거나 두 손가락으로 벌려 확대해 보세요.',selector:'.scene canvas'},
 point:{title:'GB34 양릉천을 눌러 보세요',body:'다리 바깥쪽의 GB34 마커를 직접 누르세요.',selector:'.atlas-annotation.is-visible:not(.is-occluded) .atlas-annotation-anchor'},
 landmark:{title:'비골을 확인해 보세요',body:'위치 설명에서 ‘비골’을 눌러 3D 구조를 강조하세요.',selector:'[data-tutorial="fibula"]'},
 play:{title:'자침 경로를 재생해 보세요',body:'재생 버튼을 누르고 움직임이 끝날 때까지 지켜보세요. Needle\'s Eye 화면 위에서 스크롤하면 바늘도 함께 움직입니다.',selector:'[data-tutorial="play"]'},
 strata:{title:'지나가는 층을 확인해 보세요',body:'층서 행 하나를 눌러 3D에서 해당 구조를 보세요.',selector:'.strata-label.pickable'},
 finish:{title:'이제 혼자 탐색할 수 있어요',body:'아래 도구에서 다른 기능을 열 수 있고, 오른쪽 위 ?에서 언제든 다시 볼 수 있습니다.',selector:'[data-tutorial="help"]'},
};
const clamp=(n:number,low:number,high:number)=>Math.max(low,Math.min(n,high));

export function Tutorial({step,compact,onStart,onSkip,onDone}:{step:TutorialStep;compact:boolean;onStart:()=>void;onSkip:()=>void;onDone:()=>void}){
 const [target,setTarget]=useState<Box|null>(null),[shake,setShake]=useState(0);
 useEffect(()=>{
  if(step==='invite')return;
  let frame=0,last='';
  const update=()=>{
   const node=document.querySelector(copy[step].selector),rect=node?.getBoundingClientRect();
   const box=rect&&rect.width&&rect.height?{left:rect.left,top:rect.top,width:rect.width,height:rect.height}:null;
   const key=box?[box.left,box.top,box.width,box.height].map(n=>Math.round(n)).join(':'):'none';
   if(key!==last){last=key;setTarget(box);}
   frame=requestAnimationFrame(update);
  };
  update();return()=>cancelAnimationFrame(frame);
 },[step]);
 useEffect(()=>{
  if(step==='invite'||step==='finish')return;
  const offTarget=(event:PointerEvent)=>{
   if((event.target as Element)?.closest?.('.tutorial-card'))return;
   const node=document.querySelector(copy[step].selector);
   if(node&&node.contains(event.target as Node))return;
   if(step==='point'&&node){const rect=node.getBoundingClientRect();if(event.clientX>=rect.left-26&&event.clientX<=rect.right+26&&event.clientY>=rect.top-26&&event.clientY<=rect.bottom+26)return;}
   setShake(value=>value+1);
  };
  document.addEventListener('pointerdown',offTarget,true);
  return()=>document.removeEventListener('pointerdown',offTarget,true);
 },[step]);
 useEffect(()=>{
  if(step!=='landmark'&&step!=='play'&&step!=='strata')return;
  const id=window.setTimeout(()=>document.querySelector(copy[step].selector)?.scrollIntoView({block:'center',behavior:'smooth'}),120);
  return()=>window.clearTimeout(id);
 },[step]);
 if(step==='invite')return <div className="tutorial-layer"><div className="tutorial-invite tutorial-card" role="dialog" aria-modal="false" aria-labelledby="tutorial-invite-title"><small>처음 방문하셨나요?</small><h2 id="tutorial-invite-title">2분만 직접 해 볼까요?</h2><p>몸을 돌리고, 혈을 찾고, 그 아래 구조까지 직접 확인해 보세요.</p><div className="tutorial-actions"><button type="button" onClick={onStart}>직접 해보기</button><button type="button" onClick={onSkip}>나중에</button></div></div></div>;
 const info=copy[step],padding=step==='point'?26:step==='rotate'||step==='zoom'?0:10;
 const ring=target?{left:Math.max(4,target.left-padding),top:Math.max(4,target.top-padding),width:Math.min(window.innerWidth-8,target.width+padding*2),height:Math.min(window.innerHeight-8,target.height+padding*2)}:null;
 const bubbleWidth=Math.min(310,window.innerWidth-24);
 const bubbleLeft=ring?clamp(ring.left+ring.width/2-bubbleWidth/2,12,window.innerWidth-bubbleWidth-12):clamp(window.innerWidth/2-bubbleWidth/2,12,window.innerWidth-bubbleWidth-12);
 const below=ring?ring.top+ring.height+176<window.innerHeight:false;
 const bubbleTop=step==='rotate'||step==='zoom'?clamp(window.innerHeight-(compact?245:220),92,window.innerHeight-176):ring?clamp(below?ring.top+ring.height+16:ring.top-168,78,window.innerHeight-170):clamp(window.innerHeight/2-80,78,window.innerHeight-170);
 return <div className="tutorial-layer" aria-live="polite">
  {ring&&step!=='rotate'&&step!=='zoom'&&<div className="tutorial-spotlight" style={{left:ring.left,top:ring.top,width:ring.width,height:ring.height}}/>}
  <div key={`${step}-${shake}`} className={`tutorial-card tutorial-bubble${shake?' tutorial-shake':''}`} style={{left:bubbleLeft,top:bubbleTop,width:bubbleWidth}} role="status">
   <small>{step==='finish'?'완료':`탐색 · ${['rotate','zoom','point','landmark','play','strata'].indexOf(step)+1}/${compact?3:6}`}</small><h2>{info.title}</h2><p>{info.body}</p>
   <div className="tutorial-actions">{step==='finish'?<button type="button" onClick={onDone}>닫기</button>:<button type="button" onClick={onSkip}>건너뛰기</button>}</div>
  </div>
 </div>;
}

export function FeatureHint({text,onClose}:{text:string;onClose:()=>void}){
 useEffect(()=>{const id=window.setTimeout(onClose,4600);return()=>window.clearTimeout(id);},[text,onClose]);
 return <div className="feature-hint" role="status"><span>{text}</span><button type="button" aria-label="힌트 닫기" onClick={onClose}>×</button></div>;
}
