"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Side = "left" | "right";

export type UsePanelWidthOptions = {
  /** Storage key. Persisted across sessions. */
  key: string;
  /** Pixel width to use before the user has dragged. */
  defaultWidth: number;
  /** Smallest the panel can shrink to. */
  min: number;
  /** Largest the panel can grow to. */
  max: number;
  /**
   * Which side the resize handle lives on.
   *  - "right": handle is on the right edge of a left-anchored panel
   *  - "left":  handle is on the left edge of a right-anchored panel
   */
  side: Side;
};

/**
 * Persistable panel-width hook. Returns the current width and an
 * `onResizeStart` handler to wire to a draggable handle. Stores the result
 * in localStorage so the panel layout survives reloads.
 */
export function usePanelWidth(opts: UsePanelWidthOptions) {
  const { key, defaultWidth, min, max, side } = opts;
  const [width, setWidth] = useState<number>(defaultWidth);
  const startStateRef = useRef<{ x: number; w: number } | null>(null);

  // Load persisted width once.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = parseInt(raw, 10);
        if (Number.isFinite(parsed)) {
          setWidth(Math.max(min, Math.min(max, parsed)));
        }
      }
    } catch {
      /* private mode etc. */
    }
  }, [key, min, max]);

  const persist = useCallback(
    (next: number) => {
      try {
        window.localStorage.setItem(key, String(Math.round(next)));
      } catch {
        /* ignore */
      }
    },
    [key],
  );

  const onResizeStart = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const target = e.currentTarget;
      target.setPointerCapture(e.pointerId);
      startStateRef.current = { x: e.clientX, w: width };

      const onMove = (ev: PointerEvent) => {
        if (!startStateRef.current) return;
        const dx = ev.clientX - startStateRef.current.x;
        const delta = side === "right" ? dx : -dx;
        const next = Math.max(
          min,
          Math.min(max, startStateRef.current.w + delta),
        );
        setWidth(next);
      };
      const onUp = (ev: PointerEvent) => {
        target.releasePointerCapture?.(ev.pointerId);
        if (startStateRef.current) {
          const dx = ev.clientX - startStateRef.current.x;
          const delta = side === "right" ? dx : -dx;
          const final = Math.max(
            min,
            Math.min(max, startStateRef.current.w + delta),
          );
          persist(final);
        }
        startStateRef.current = null;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        document.body.style.removeProperty("cursor");
        document.body.style.removeProperty("user-select");
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [width, min, max, side, persist],
  );

  return { width, onResizeStart };
}
