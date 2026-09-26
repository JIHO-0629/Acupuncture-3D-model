/** One structure picked out across the panel and the scene.
 *
 * The strata column, the Needle's-eye list, the location text and a tap in the scene all name the
 * same anatomy; whichever names it publishes here and the others follow. Like the annotation
 * channel it bypasses React, so hovering a row re-renders nothing: the scene reads the latest value
 * in its own frame loop.
 */
export type StructureFocus = {
  /** Stable identity of what was picked, e.g. a strata row id or `part:<id>`. */
  key: string;
  label: string;
  /** Atlas parts to show. Empty for a layer the model has no mesh for. */
  partIds: string[];
  /** Depth on the current needle path, when the structure has one. */
  depthMm: number | null;
  tone: "layer" | "hazard" | "landmark";
  source: "strata" | "scene" | "compass" | "text";
  pinned: boolean;
};

export type FocusChannel = ReturnType<typeof createFocusChannel>;

export function createFocusChannel() {
  let latest: StructureFocus | null = null;
  const listeners = new Set<(focus: StructureFocus | null) => void>();
  return {
    get latest() { return latest; },
    publish(focus: StructureFocus | null) {
      if (focus === latest || (focus && latest && focus.key === latest.key && focus.pinned === latest.pinned && focus.source === latest.source)) return;
      latest = focus;
      listeners.forEach((listener) => listener(focus));
    },
    subscribe(listener: (focus: StructureFocus | null) => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  };
}

/** What a panel needs to take part: hover previews, a tap pins, a second tap on the pinned one lets go.
 *  Nothing else is hidden: the pick is drawn through the anatomy around it, which stays as context. */
export type FocusHandlers = {
  pinned: StructureFocus | null;
  preview: (focus: StructureFocus | null) => void;
  pin: (focus: StructureFocus | null) => void;
  partIdsFor: (name: string) => string[];
};

export function activateFocus(handlers: FocusHandlers, focus: StructureFocus) {
  handlers.pin(handlers.pinned?.key === focus.key ? null : { ...focus, pinned: true });
}

/** Pointer and keyboard props for an element that stands for a structure. */
export function focusTargetProps(handlers: FocusHandlers | undefined, make: (pinned: boolean) => StructureFocus) {
  if (!handlers) return {};
  return {
    role: "button" as const,
    tabIndex: 0,
    "aria-pressed": handlers.pinned?.key === make(false).key,
    onPointerEnter: (event: { pointerType: string }) => { if (event.pointerType === "mouse") handlers.preview(make(false)); },
    onPointerLeave: (event: { pointerType: string }) => { if (event.pointerType === "mouse") handlers.preview(null); },
    onPointerDown: (event: { stopPropagation: () => void }) => event.stopPropagation(),
    onClick: () => activateFocus(handlers, make(true)),
    onKeyDown: (event: { key: string; preventDefault: () => void }) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      activateFocus(handlers, make(true));
    },
  };
}

/** The unobstructed part of the viewport, as distances in px from each edge. */
export type SceneInsets = { top: number; right: number; bottom: number; left: number };
export const NO_INSETS: SceneInsets = { top: 0, right: 0, bottom: 0, left: 0 };
