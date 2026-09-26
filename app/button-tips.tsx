import { useEffect, useRef, useState } from "react";

/** What an icon button does, shown on hover or keyboard focus, and on a long press on touch screens.
 *
 * Buttons opt in with `data-tip="이름|설명"` and, when disabled, `data-tip-off="쓸 수 없는 이유"`. One floating
 * bubble serves them all, so a toolbar that clips its overflow (the Needle's Eye launcher) cannot cut it off.
 * Disabled buttons receive no pointer events, so hovering is found by hit-testing the pointer position.
 */
type Tip = { title: string; body: string; left: number; top: number; below: boolean };

const HOVER_DELAY = 350, PRESS_DELAY = 450, TOUCH_LINGER = 1600;
const tipTarget = (x: number, y: number) => {
  const hit = (document.elementsFromPoint(x, y).find((node) => node instanceof HTMLElement && node.closest("[data-tip]")) as HTMLElement | undefined)?.closest<HTMLElement>("[data-tip]");
  if (hit) return hit;
  // Disabled buttons carry pointer-events: none, so hit-testing skips them; test their boxes directly,
  // but only when nothing else sits on top at that point.
  const top = document.elementFromPoint(x, y);
  for (const element of document.querySelectorAll<HTMLElement>("[data-tip]")) {
    const rect = element.getBoundingClientRect();
    if (rect.width && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom && (!top || top === element || element.parentElement?.contains(top))) return element;
  }
  return null;
};

function tipFor(element: HTMLElement): Tip {
  const [title, body = ""] = (element.dataset.tip ?? "").split("|");
  const off = (element as HTMLButtonElement).disabled ? element.dataset.tipOff : undefined;
  const rect = element.getBoundingClientRect(), below = rect.top < 96;
  return { title, body: off ?? body, left: rect.left + rect.width / 2, top: below ? rect.bottom + 8 : rect.top - 8, below };
}

export function ButtonTips() {
  const [tip, setTip] = useState<Tip | null>(null);
  const bubble = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let current: HTMLElement | null = null, timer = 0, suppressClick = false;
    const clear = () => { window.clearTimeout(timer); timer = 0; };
    const hide = () => { clear(); current = null; setTip(null); };
    const showSoon = (element: HTMLElement, delay: number) => {
      clear();
      current = element;
      timer = window.setTimeout(() => { if (current === element && element.isConnected) setTip(tipFor(element)); }, delay);
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const element = tipTarget(event.clientX, event.clientY);
      if (element === current) return;
      if (element) showSoon(element, HOVER_DELAY); else hide();
    };
    const down = (event: PointerEvent) => {
      if (event.pointerType === "mouse") { hide(); return; }
      const element = tipTarget(event.clientX, event.clientY);
      if (!element) { hide(); return; }
      current = element;
      clear();
      timer = window.setTimeout(() => { setTip(tipFor(element)); suppressClick = true; }, PRESS_DELAY);
    };
    const up = (event: PointerEvent) => {
      if (event.pointerType === "mouse") return;
      if (!suppressClick) { hide(); return; }
      clear();
      timer = window.setTimeout(() => { current = null; setTip(null); }, TOUCH_LINGER);
    };
    // A long press shows the tip; it must not also fire the button.
    const click = (event: MouseEvent) => { if (!suppressClick) return; suppressClick = false; event.preventDefault(); event.stopPropagation(); };
    const focus = (event: FocusEvent) => {
      const element = (event.target as HTMLElement | null)?.closest?.<HTMLElement>("[data-tip]");
      if (element && element.matches(":focus-visible")) showSoon(element, 0); else if (!element) hide();
    };
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") hide(); };
    const contextMenu = (event: MouseEvent) => { if ((event.target as HTMLElement | null)?.closest?.("[data-tip]")) event.preventDefault(); };
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("pointerup", up, true);
    document.addEventListener("pointercancel", hide, true);
    document.addEventListener("click", click, true);
    document.addEventListener("focusin", focus);
    document.addEventListener("keydown", key);
    document.addEventListener("contextmenu", contextMenu);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      clear();
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerdown", down, true);
      document.removeEventListener("pointerup", up, true);
      document.removeEventListener("pointercancel", hide, true);
      document.removeEventListener("click", click, true);
      document.removeEventListener("focusin", focus);
      document.removeEventListener("keydown", key);
      document.removeEventListener("contextmenu", contextMenu);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, []);
  // Keep the bubble on screen: measure it once placed and nudge it inside the viewport.
  useEffect(() => {
    const node = bubble.current;
    if (!node || !tip) return;
    const width = node.offsetWidth, left = Math.min(Math.max(8 + width / 2, tip.left), window.innerWidth - 8 - width / 2);
    node.style.left = `${left}px`;
  }, [tip]);
  if (!tip) return null;
  return <div ref={bubble} className={`button-tip ${tip.below ? "is-below" : ""}`} role="tooltip" style={{ left: tip.left, top: tip.top }}>
    <b>{tip.title}</b>{tip.body && <span>{tip.body}</span>}
  </div>;
}
