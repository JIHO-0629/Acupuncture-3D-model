import { useEffect, useRef } from "react";
import type { AnnotationChannel, AnnotationFrame } from "./annotation-overlay";
import { locatorItems } from "./locator-data";

const POINT_HINT: Record<string, string> = {
  KI3: "두 구조 사이의 오목한 곳",
  KI4: "발꿈치뼈 위쪽의 오목한 곳",
  KI5: "태계에서 아래 1촌, 발꿈치뼈융기 앞쪽",
};

const clamp = (value: number, low: number, high: number) =>
  Math.min(Math.max(value, low), high);

export function LocatorGuide({
  code, name, channel, revision,
}: {
  code: string;
  name: string;
  channel: AnnotationChannel;
  revision: number;
}) {
  const root = useRef<HTMLDivElement>(null);
  const items = locatorItems(code);
  useEffect(() => channel.subscribe((frame: AnnotationFrame | null) => {
    const element = root.current;
    if (!element || !frame || frame.id !== code) {
      element?.classList.remove("is-visible");
      return;
    }
    element.style.setProperty("--locator-x", `${frame.x}px`);
    element.style.setProperty("--locator-y", `${frame.y}px`);
    const svg = element.querySelector("svg");
    svg?.setAttribute("viewBox", `0 0 ${frame.width} ${frame.height}`);
    items.forEach((_, index) => {
      const key = `l${index}`;
      const anchor = frame.landmarks?.[key];
      const tag = element.querySelector<HTMLElement>(`[data-tag="${key}"]`);
      const path = element.querySelector<SVGPathElement>(`[data-leader="${key}"]`);
      const pin = element.querySelector<HTMLElement>(`[data-anchor="${key}"]`);
      const shown = !!anchor && anchor.x >= 0 && anchor.x <= frame.width &&
        anchor.y >= 0 && anchor.y <= frame.height;
      tag?.classList.toggle("is-anchored", shown);
      pin?.classList.toggle("is-anchored", shown);
      path?.classList.toggle("is-anchored", shown);
      if (!shown || !anchor || !tag || !pin || !path) return;
      const direction = anchor.x < frame.width * .52 ? 1 : -1;
      const x = clamp(anchor.x + direction * 58, 16, frame.width - 16);
      const y = clamp(anchor.y - 27 + (index % 3) * 27, 40, frame.height - 40);
      tag.style.left = `${x}px`;
      tag.style.top = `${y}px`;
      tag.style.transform = direction === 1 ? "none" : "translateX(-100%)";
      pin.style.left = `${anchor.x}px`;
      pin.style.top = `${anchor.y}px`;
      const endX = x - direction * 7, endY = y + 14;
      path.setAttribute("d",
        `M${anchor.x} ${anchor.y} C${anchor.x + direction * 18} ${anchor.y} ${endX - direction * 18} ${endY} ${endX} ${endY}`);
    });
    element.classList.toggle("is-visible", frame.visible && !frame.occluded);
    element.classList.toggle("is-moving", frame.moving);
  }), [channel, code, items, revision]);

  return <div ref={root} className="locator-guide" aria-live="polite">
    <svg className="locator-leaders" aria-hidden="true">
      {items.map((item, i) => <path key={item.key} data-leader={`l${i}`} className={item.color}/>)}
    </svg>
    {items.map((item, i) => <span key={item.key} data-anchor={`l${i}`} className={`locator-anchor ${item.color}`} aria-hidden="true"/>)}
    {items.map((item, i) => <span key={item.key} data-tag={`l${i}`} className={`locator-tag ${item.color}`}>
      <i/>{item.ko}{item.status === "부분 가능" && <small>근사</small>}
    </span>)}
    <div className="locator-caption">
      <small>Landmark Locator · {code}</small>
      <b>{name} 찾기</b>
      <p>{POINT_HINT[code] ?? "표지점의 위치와 경혈점을 함께 확인하세요."}</p>
      <ul>{items.map(item => <li key={item.key} className={item.color}>
        <i/><span>{item.ko}</span>{item.status === "부분 가능" && <em title={item.note}>근사</em>}
      </li>)}</ul>
    </div>
  </div>;
}
