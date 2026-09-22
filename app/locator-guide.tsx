import { useEffect, useRef } from "react";
import type { AnnotationChannel, AnnotationFrame } from "./annotation-overlay";

const COPY: Record<string, { title: string; first: string; second: string; result: string }> = {
  KI3: { title: "태계 찾기", first: "안쪽복사 융기", second: "발꿈치힘줄", result: "두 구조 사이의 오목한 곳" },
  KI4: { title: "대종 찾기", first: "안쪽복사 아래뒤쪽", second: "발꿈치힘줄 안쪽 부착부", result: "발꿈치뼈 위쪽의 오목한 곳" },
  KI5: { title: "수천 찾기", first: "태계에서 아래 1촌", second: "발꿈치뼈융기 앞쪽", result: "두 기준이 만나는 오목한 곳" },
};

export function LocatorGuide({ code, channel, revision }: { code: string; channel: AnnotationChannel; revision: number }) {
  const root = useRef<HTMLDivElement>(null), copy = COPY[code] ?? COPY.KI4;
  useEffect(() => channel.subscribe((frame: AnnotationFrame | null) => {
    const element = root.current;
    if (!element || !frame || frame.id !== code) return element?.classList.remove("is-visible");
    element.style.setProperty("--locator-x", `${frame.x}px`);
    element.style.setProperty("--locator-y", `${frame.y}px`);
    const first=frame.landmarks?.first,second=frame.landmarks?.second;
    const firstLine=element.querySelector<SVGPolylineElement>('[data-leader="first"]'),secondLine=element.querySelector<SVGPolylineElement>('[data-leader="second"]');
    if(first){element.style.setProperty("--first-x",`${first.x}px`);element.style.setProperty("--first-y",`${first.y}px`);firstLine?.setAttribute('points',`${first.x},${first.y} ${first.x-24},${first.y} ${first.x-54},${first.y}`);}
    if(second){element.style.setProperty("--second-x",`${second.x}px`);element.style.setProperty("--second-y",`${second.y}px`);secondLine?.setAttribute('points',`${second.x},${second.y} ${second.x+24},${second.y} ${second.x+54},${second.y}`);}
    element.classList.toggle("is-visible", frame.visible && !frame.occluded);
    element.classList.toggle("is-moving", frame.moving);
  }), [channel, code, revision]);
  return <div ref={root} className="locator-guide" aria-live="polite">
    <svg className="locator-leaders" aria-hidden="true"><polyline data-leader="first"/><polyline data-leader="second"/></svg>
    <span className="locator-tag locator-tag-one">{copy.first}</span>
    <span className="locator-tag locator-tag-two">{copy.second}</span>
    <div className="locator-caption"><small>LANDMARK LOCATOR · {code}</small><b>{copy.title}</b><span><i /> {copy.result}</span></div>
  </div>;
}
