import {useEffect,useState,type ReactNode} from 'react';

export type TutorialStep='invite'|'orbit'|'meridian'|'scroll'|'landmark'|'locator'|'play'|'strata'|'needle-eye'|'finish';
export type MiniTourId='needle-eye'|'locator'|'layers'|'search';
type Box={left:number;top:number;width:number;height:number};
/** A step points at the first selector that is on screen, so one step can follow a panel as it opens. */
type Card={title:string;body:string;selector:string[]};

const copy:Record<Exclude<TutorialStep,'invite'>,Card>={
 orbit:{title:'몸을 돌리고 확대해 보세요',body:'드래그하면 돌아가고, 스크롤하거나 두 손가락으로 벌리면 확대됩니다. 두 가지를 모두 해 보세요.',selector:['.scene canvas']},
 meridian:{title:'경락을 담경으로 바꿔 보세요',body:'14경맥이 탭 하나씩 놓여 있습니다. 끌거나 ←→ 키로 옮기고, ‘담’을 고르세요.',selector:['.meridian-rail-shell']},
 scroll:{title:'혈 목록을 굴려 GB34로 가세요',body:'목록 위에서 휠을 굴리거나 위아래로 쓸면 혈이 빠르게 넘어갑니다. 3D 마커를 직접 누르기 어려울 때 가장 빠른 방법입니다.',selector:['.acupoint-scrubber']},
 landmark:{title:'비골을 눌러 보세요',body:'위치 설명에서 밑줄 친 용어는 누를 수 있습니다. 3D에서 주황색으로 강조되는 것이 취혈 기준 구조입니다.',selector:['[data-tutorial="fibula"]']},
 locator:{title:'취혈 가이드를 켜 보세요',body:'혈을 찾는 기준이 되는 뼈와 근육·힘줄이 3D에 이름표로 붙고, 찾는 요령이 함께 나옵니다.',selector:['[data-tutorial="locator"]']},
 play:{title:'자침 경로를 재생해 보세요',body:'바늘이 문헌의 자침 방향과 깊이로 들어갑니다. 움직임이 끝날 때까지 지켜보세요.',selector:['[data-tutorial="play"]']},
 strata:{title:'층서 바를 끌어 깊이를 바꿔 보세요',body:'청록은 바늘이 지나는 층, 점선은 모델에 없어 문헌으로 채운 층, 빨간 태그는 가까이 있지만 지나지 않는 위험 구조, 굵은 선은 더 들어가지 않는 경계입니다. 층 이름을 누르면 3D에서 강조됩니다.',selector:['.strata-column [aria-label="자침 진행"]','.strata-column']},
 'needle-eye':{title:'Needle’s Eye를 열고 그 위에서 스크롤하세요',body:'바늘 끝에서 본 주변의 위험 구조(신경·혈관·장기 경계) 지도입니다. 원형 화면 위에서 스크롤하면 바늘과 층서가 함께 움직입니다.',selector:['.needle-eye-hud .compass-plot-wrap','.needle-eye-launcher']},
 finish:{title:'이제 혼자 탐색할 수 있어요',body:'해부 도구, 검색, Needle’s Eye, 취혈 가이드는 처음 열 때 짧은 안내가 한 번 나옵니다. 오른쪽 위 ?에서 이 투어를 다시 볼 수 있습니다.',selector:['[data-tutorial="help"]']},
};
const TOUR_STEPS=['orbit','meridian','scroll','landmark','locator','play','strata','needle-eye'] as const;
export const COMPACT_TOUR_STEPS=['orbit','meridian','scroll'] as const;

/** Shown once, the first time each feature opens (and again from the About sheet). */
export const MINI_TOURS:Record<MiniTourId,{name:string;cards:Card[]}>={
 'needle-eye':{name:'Needle’s Eye',cards:[
  {title:'바늘 끝에서 본 단면',body:'가운데 점이 침 축이고, 가장자리 글자는 해부학적 방향입니다. 안쪽 원은 근접권, 바깥 원은 주변권으로, 실제 거리 눈금이 아닌 상대 구역입니다.',selector:['.needle-eye-hud .compass-plot-wrap','.compass-plot-wrap']},
  {title:'보이는 것은 모두 위험 구조입니다',body:'보라색은 신경, 적갈색 실선은 동맥, 적갈색 점선은 정맥, 보라색 점선은 신경혈관다발입니다. 테두리가 굵으면 바늘 경로가 그 구조를 지나고, 바깥 갈색 띠는 흉막·복막 같은 장기 경계입니다.',selector:['.needle-eye-hud .compass-plot-wrap','.compass-plot-wrap']},
  {title:'목록과 조작',body:'이름을 누르면 3D에서 강조됩니다. 깊이는 모델과 문헌의 값이며 환자의 안전거리가 아닙니다. 원형 화면 위에서 스크롤하거나 두 손가락으로 쓸면 바늘이 움직입니다.',selector:['.needle-eye-hud .compass-structure-list','.compass-structure-list']},
 ]},
 locator:{name:'취혈 가이드',cards:[
  {title:'기준 구조 이름표',body:'혈을 찾을 때 기준이 되는 뼈와 근육·힘줄입니다. 뼈와 연부조직은 색으로 나뉘고, ‘근사’가 붙은 이름표는 모델에서 추정한 위치입니다.',selector:['.locator-tag']},
  {title:'찾는 요령',body:'이 혈을 손으로 찾는 요령과 기준 구조 목록입니다. 실제 사람에게서 짚을 때 이 순서대로 확인해 보세요.',selector:['.locator-caption']},
 ]},
 layers:{name:'해부 도구',cards:[
  {title:'계통 레이어',body:'색 점 하나가 계통 하나입니다. 스위치로 켜고 끄고, 위쪽 버튼으로 한 번에 바꿉니다.',selector:['.layers-panel .system-list','.layers-panel']},
  {title:'모델 분리',body:'슬라이더를 올리면 구조가 흩어져 가려진 것을 하나씩 볼 수 있습니다.',selector:['.layers-panel details','.layers-panel']},
  {title:'한 층 벗기기',body:'3D에서 구조를 누른 뒤 이 버튼을 누르면 그 구조만 숨겨 아래가 보입니다. 되돌리기로 다시 보이게 합니다.',selector:['[aria-label="선택한 구조 한 층 벗기기"]']},
 ]},
 search:{name:'검색',cards:[
  {title:'혈자리와 구조 찾기',body:'코드(GB34), 한글(양릉천), 한자, 초성(ㅇㄹㅊ)으로 찾을 수 있고 일부만 입력해도 됩니다. 예: ‘삼음’ → 삼음교. 해부 구조 이름도 찾습니다.',selector:['.search-panel']},
  {title:'단축키',body:'/ 키로 어디서든 열고, Esc로 닫습니다.',selector:['.search-panel']},
 ]},
};

const clamp=(n:number,low:number,high:number)=>Math.max(low,Math.min(n,high));
const find=(selectors:string[])=>{for(const selector of selectors){const node=document.querySelector(selector),rect=node?.getBoundingClientRect();if(node&&rect&&rect.width&&rect.height)return node;}return null;};

/** Follows the first on-screen target of `selectors`, frame by frame, as panels move and open. */
function useTarget(selectors:string[]|null){
 const [target,setTarget]=useState<Box|null>(null);
 const key=selectors?.join('|')??'';
 useEffect(()=>{
  if(!selectors){setTarget(null);return;}
  let frame=0,last='';
  const update=()=>{
   const rect=find(selectors)?.getBoundingClientRect();
   const box=rect?{left:rect.left,top:rect.top,width:rect.width,height:rect.height}:null;
   const next=box?[box.left,box.top,box.width,box.height].map(n=>Math.round(n)).join(':'):'none';
   if(next!==last){last=next;setTarget(box);}
   frame=requestAnimationFrame(update);
  };
  update();return()=>cancelAnimationFrame(frame);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[key]);
 return target;
}

function Bubble({target,padding,wide,label,card,shake,children}:{target:Box|null;padding:number;wide:boolean;label:string;card:Card;shake:number;children:ReactNode}){
 const ring=target?{left:Math.max(4,target.left-padding),top:Math.max(4,target.top-padding),width:Math.min(window.innerWidth-8,target.width+padding*2),height:Math.min(window.innerHeight-8,target.height+padding*2)}:null;
 const bubbleWidth=Math.min(wide?340:310,window.innerWidth-24);
 const bubbleLeft=ring&&!wide?clamp(ring.left+ring.width/2-bubbleWidth/2,12,window.innerWidth-bubbleWidth-12):ring&&wide?clamp(window.innerWidth/2-bubbleWidth/2,12,window.innerWidth-bubbleWidth-12):clamp(window.innerWidth/2-bubbleWidth/2,12,window.innerWidth-bubbleWidth-12);
 const room=200,below=ring?ring.top+ring.height+room<window.innerHeight:false,beside=ring&&!below&&ring.top-room<78;
 // A target too tall for a card above or below (a side panel) gets the card beside it.
 const sideLeft=ring?(ring.left>bubbleWidth+28?ring.left-bubbleWidth-16:ring.left+ring.width+16):0;
 const style=wide?{left:bubbleLeft,top:clamp(window.innerHeight-230,92,window.innerHeight-200),width:bubbleWidth}
  :beside?{left:clamp(sideLeft,12,window.innerWidth-bubbleWidth-12),top:clamp(ring!.top+ring!.height/2-100,78,window.innerHeight-210),width:bubbleWidth}
  :{left:bubbleLeft,top:ring?clamp(below?ring.top+ring.height+16:ring.top-room,78,window.innerHeight-200):clamp(window.innerHeight/2-90,78,window.innerHeight-200),width:bubbleWidth};
 return <div className="tutorial-layer" aria-live="polite">
  {ring&&!wide&&<div className="tutorial-spotlight" style={{left:ring.left,top:ring.top,width:ring.width,height:ring.height}}/>}
  <div key={shake} className={`tutorial-card tutorial-bubble${shake?' tutorial-shake':''}`} style={style} role="status">
   <small>{label}</small><h2>{card.title}</h2><p>{card.body}</p>
   <div className="tutorial-actions">{children}</div>
  </div>
 </div>;
}

export function Tutorial({step,compact,onStart,onSkip,onDone}:{step:TutorialStep;compact:boolean;onStart:()=>void;onSkip:()=>void;onDone:()=>void}){
 const [shake,setShake]=useState(0);
 const card=step==='invite'?null:copy[step];
 const target=useTarget(card?.selector??null);
 useEffect(()=>{
  if(step==='invite'||step==='finish')return;
  const offTarget=(event:PointerEvent)=>{
   if((event.target as Element)?.closest?.('.tutorial-card'))return;
   if(step==='orbit')return;
   const node=find(copy[step].selector);
   if(node&&node.contains(event.target as Node))return;
   setShake(value=>value+1);
  };
  document.addEventListener('pointerdown',offTarget,true);
  return()=>document.removeEventListener('pointerdown',offTarget,true);
 },[step]);
 useEffect(()=>{
  if(step!=='landmark'&&step!=='play'&&step!=='strata')return;
  const id=window.setTimeout(()=>find(copy[step].selector)?.scrollIntoView({block:'center',behavior:'smooth'}),120);
  return()=>window.clearTimeout(id);
 },[step]);
 if(step==='invite')return <div className="tutorial-layer"><div className="tutorial-invite tutorial-card" role="dialog" aria-modal="false" aria-labelledby="tutorial-invite-title"><small>처음 방문하셨나요?</small><h2 id="tutorial-invite-title">3분만 직접 해 볼까요?</h2><p>몸을 돌리고, 혈을 찾고, 바늘이 지나는 층과 주변 위험 구조까지 직접 확인해 보세요.</p><div className="tutorial-actions"><button type="button" onClick={onStart}>직접 해보기</button><button type="button" onClick={onSkip}>나중에</button></div></div></div>;
 const steps:readonly string[]=compact?COMPACT_TOUR_STEPS:TOUR_STEPS;
 return <Bubble target={target} padding={step==='orbit'?0:10} wide={step==='orbit'} label={step==='finish'?'완료':`탐색 · ${steps.indexOf(step)+1}/${steps.length}`} card={card!} shake={shake}>
  {step==='finish'?<button type="button" onClick={onDone}>닫기</button>:<button type="button" onClick={onSkip}>건너뛰기</button>}
 </Bubble>;
}

export function MiniTour({id,index,onNext,onClose}:{id:MiniTourId;index:number;onNext:()=>void;onClose:()=>void}){
 const tour=MINI_TOURS[id],card=tour.cards[index],last=index===tour.cards.length-1;
 const target=useTarget(card.selector);
 useEffect(()=>{const key=(event:KeyboardEvent)=>{if(event.key==='Escape')onClose();};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[onClose]);
 return <Bubble target={target} padding={8} wide={false} label={`${tour.name} 안내 · ${index+1}/${tour.cards.length}`} card={card} shake={0}>
  {!last&&<button type="button" onClick={onClose}>닫기</button>}
  <button type="button" onClick={last?onClose:onNext}>{last?'확인':'다음'}</button>
 </Bubble>;
}

export function FeatureHint({text,onClose}:{text:string;onClose:()=>void}){
 useEffect(()=>{const id=window.setTimeout(onClose,4600);return()=>window.clearTimeout(id);},[text,onClose]);
 return <div className="feature-hint" role="status"><span>{text}</span><button type="button" aria-label="힌트 닫기" onClick={onClose}>×</button></div>;
}
