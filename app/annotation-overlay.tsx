import { useEffect, useRef } from "react";

export type AnnotationRect = { left: number; top: number; right: number; bottom: number };
export type AnnotationFrame = { id: string; x: number; y: number; width: number; height: number; visible: boolean; occluded: boolean; moving: boolean; obstacles?: AnnotationRect[]; landmarks?: Record<string,{x:number;y:number}> };
export type AtlasAnnotation = { id: string; primary: string; secondary?: string };

/** Camera frames bypass React state and leave the inspector/strata untouched. */
export function createAnnotationChannel() {
  let latest: AnnotationFrame | null = null;
  const listeners = new Set<(frame: AnnotationFrame | null) => void>();
  return {
    publish(frame: AnnotationFrame | null) { latest = frame; listeners.forEach(listener => listener(frame)); },
    subscribe(listener: (frame: AnnotationFrame | null) => void) {
      listeners.add(listener); listener(latest);
      return () => { listeners.delete(listener); };
    },
  };
}
export type AnnotationChannel = ReturnType<typeof createAnnotationChannel>;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function AnnotationOverlay({ annotation, channel }: { annotation: AtlasAnnotation; channel: AnnotationChannel }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current!;
    const svg = element.querySelector('svg')!, line = element.querySelector('polyline')!, marker = element.querySelector('i')!, label = element.querySelector('span')!;
    let side: 'left' | 'right' = 'right', uiDirty = true, lastLayout = -Infinity;
    let uiRects: AnnotationRect[] = [];
    let target: {x:number;y:number;side:'left'|'right'} | null = null;
    let current: {x:number;y:number} | null = null;
    let latest: AnnotationFrame | null = null, animation = 0, lastTime = performance.now();
    const invalidate = () => { uiDirty = true; lastLayout = -Infinity; };
    const resizeObserver = new ResizeObserver(invalidate);
    const mutationObserver = new MutationObserver(invalidate);
    mutationObserver.observe(element.parentElement!, {childList:true});
    window.addEventListener('resize', invalidate);
    const paint = (now: number) => {
      animation = 0;
      if (!latest || !target || !current) return;
      const alpha = 1 - Math.exp(-30 * Math.min(.05, Math.max(0, (now - lastTime) / 1000)));
      current.x += (target.x-current.x)*alpha; current.y += (target.y-current.y)*alpha;
      lastTime = now;
      label.style.left = current.x+'px'; label.style.top = current.y+'px';
      const endX = side === 'right' ? current.x-10 : current.x+190, endY = current.y+12;
      // A frame whose projection is not ready yet (or is behind the camera) arrives as NaN.
      // Drawing it makes the browser reject the whole attribute, so skip that frame instead.
      if (!Number.isFinite(latest.x) || !Number.isFinite(latest.y)) return;
      line.setAttribute('points', latest.x+','+latest.y+' '+(endX+(side==='right'?-38:38))+','+endY+' '+endX+','+endY);
      if (Math.abs(current.x-target.x)+Math.abs(current.y-target.y) > .1) animation=requestAnimationFrame(paint);
    };
    const unsubscribe = channel.subscribe(frame => {
      latest = frame;
      if (!frame || frame.id !== annotation.id) { element.className='atlas-annotation'; return; }
      const now = performance.now();
      if (uiDirty) {
        resizeObserver.disconnect(); uiRects=[];
        document.querySelectorAll('.acupuncture-panel,.identity,.atlas-point-identifier,.top-actions,.view-controls,.auxiliary-tools,.detail-sheet').forEach(node => {
          resizeObserver.observe(node);
          const rect=node.getBoundingClientRect(); if(rect.width&&rect.height) uiRects.push(rect);
        });
        uiDirty=false;
      }
      if (!target || now-lastLayout >= 80) {
        const obstacles=[...(frame.obstacles??[]),...uiRects];
        let best: {side:'left'|'right';x:number;y:number;score:number} | null=null;
        for(const candidateSide of ['left','right'] as const) for(const offset of [96,180,280,400,520]) for(const vertical of [-30,-100,50]) {
          const x=clamp(candidateSide==='right'?frame.x+offset:frame.x-offset-180,24,frame.width-204), y=clamp(frame.y+vertical,100,frame.height-92);
          const overlap=obstacles.reduce((area,r)=>area+(uiRects.includes(r)?100:1)*Math.max(0,Math.min(x+194,r.right)-Math.max(x-14,r.left))*Math.max(0,Math.min(y+64,r.bottom)-Math.max(y-12,r.top)),0);
          const score=overlap*10+offset+Math.abs(vertical+30)*2+(candidateSide!==side?1600:0);
          if(!best||score<best.score) best={side:candidateSide,x,y,score};
        }
        target=best!; side=target.side; lastLayout=now;
      }
      element.className='atlas-annotation '+(frame.visible?'is-visible ':'')+(frame.occluded?'is-occluded ':'')+(frame.moving?'is-moving':'');
      svg.setAttribute('viewBox','0 0 '+frame.width+' '+frame.height); svg.setAttribute('width',''+frame.width); svg.setAttribute('height',''+frame.height);
      marker.style.left=frame.x+'px'; marker.style.top=frame.y+'px';
      label.className='atlas-annotation-label is-'+side;
      // Leader and label share smoothing; the anchor always updates immediately.
      label.style.transition='none';
      if(!current) current={x:target!.x,y:target!.y};
      if(animation) cancelAnimationFrame(animation);
      paint(now);
    });
    return () => { unsubscribe(); resizeObserver.disconnect(); mutationObserver.disconnect(); window.removeEventListener('resize',invalidate); if(animation) cancelAnimationFrame(animation); };
  }, [channel, annotation.id]);
  return <div ref={root} className="atlas-annotation" aria-hidden="true">
    <svg className="atlas-annotation-line"><polyline /></svg>
    <i className="atlas-annotation-anchor" />
    <span className="atlas-annotation-label"><b>{annotation.primary}</b>{annotation.secondary&&<small>{annotation.secondary}</small>}</span>
  </div>;
}
