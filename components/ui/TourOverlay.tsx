"use client";

import { useEffect, useState } from "react";
import { ChevronRight, X } from "lucide-react";

export type TourStep = {
  /** A CSS selector for the element to highlight. */
  selector: string;
  title: string;
  body: string;
  /** Where to anchor the popover relative to the target. */
  placement?: "right" | "bottom" | "left" | "top";
};

type Props = {
  open: boolean;
  steps: TourStep[];
  onClose: () => void;
};

/*
 * Lightweight tour overlay. Highlights an element behind a dimmed scrim and
 * floats a popover next to it with title/body/Next/Done. No external deps —
 * recomputes the highlight rect on every tick of the active step.
 */
export function TourOverlay({ open, steps, onClose }: Props) {
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Reset to first step every time the tour opens.
  useEffect(() => {
    if (open) setIdx(0);
  }, [open]);

  const current = steps[idx];

  useEffect(() => {
    if (!open || !current) {
      setRect(null);
      return;
    }
    let frame = 0;
    const update = () => {
      const el = document.querySelector(current.selector) as HTMLElement | null;
      setRect(el?.getBoundingClientRect() ?? null);
      frame = window.requestAnimationFrame(update);
    };
    frame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frame);
  }, [open, current]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Enter" || e.key === "ArrowRight") {
        e.preventDefault();
        if (idx < steps.length - 1) setIdx((i) => i + 1);
        else onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIdx((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, idx, steps.length, onClose]);

  if (!open || !current) return null;

  const placement = current.placement ?? "right";
  const popoverWidth = 320;
  const popoverHeight = 150;
  const margin = 12;

  let popLeft = window.innerWidth / 2 - popoverWidth / 2;
  let popTop = window.innerHeight / 2 - popoverHeight / 2;
  if (rect) {
    if (placement === "right") {
      popLeft = rect.right + margin;
      popTop = rect.top;
    } else if (placement === "left") {
      popLeft = rect.left - popoverWidth - margin;
      popTop = rect.top;
    } else if (placement === "bottom") {
      popLeft = rect.left;
      popTop = rect.bottom + margin;
    } else if (placement === "top") {
      popLeft = rect.left;
      popTop = rect.top - popoverHeight - margin;
    }
  }
  // Keep the popover on screen
  popLeft = Math.max(
    margin,
    Math.min(popLeft, window.innerWidth - popoverWidth - margin),
  );
  popTop = Math.max(
    margin,
    Math.min(popTop, window.innerHeight - popoverHeight - margin),
  );

  const isLast = idx === steps.length - 1;

  return (
    <div
      className="fixed inset-0"
      style={{ zIndex: 1300, pointerEvents: "auto" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Tour step ${idx + 1} of ${steps.length}`}
    >
      {/* Dim scrim with a punch-hole around the highlighted element. We use
          four boxes to fake a cut-out without needing an SVG mask. */}
      {rect ? (
        <>
          <div className="tour-scrim" style={{ top: 0, left: 0, right: 0, height: rect.top }} />
          <div className="tour-scrim" style={{ top: rect.bottom, left: 0, right: 0, bottom: 0 }} />
          <div className="tour-scrim" style={{ top: rect.top, height: rect.height, left: 0, width: rect.left }} />
          <div className="tour-scrim" style={{ top: rect.top, height: rect.height, left: rect.right, right: 0 }} />
          {/* Outline */}
          <div
            className="pointer-events-none absolute rounded-2xl"
            style={{
              top: rect.top - 4,
              left: rect.left - 4,
              width: rect.width + 8,
              height: rect.height + 8,
              boxShadow: "0 0 0 2px #a78bfa, 0 0 28px rgba(167,139,250,0.6)",
              transition: "all 200ms ease",
            }}
          />
        </>
      ) : (
        <div className="tour-scrim" style={{ inset: 0 }} />
      )}

      <div
        className="glass-strong animate-pop-in absolute rounded-2xl p-4 shadow-glass"
        onClick={(e) => e.stopPropagation()}
        style={{
          left: popLeft,
          top: popTop,
          width: popoverWidth,
        }}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/45">
              Tour · step {idx + 1} of {steps.length}
            </div>
            <div className="text-sm font-bold">{current.title}</div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/75">
              {current.body}
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost -mt-1 flex h-7 w-7 items-center justify-center rounded-md"
            aria-label="Skip tour"
          >
            <X size={12} />
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="btn-ghost rounded-md px-2.5 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
          >
            Back
          </button>
          <button
            onClick={() => {
              if (isLast) onClose();
              else setIdx((i) => i + 1);
            }}
            className="btn-primary flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold"
          >
            {isLast ? "Got it" : "Next"}
            {!isLast && <ChevronRight size={12} />}
          </button>
        </div>
      </div>

    </div>
  );
}
