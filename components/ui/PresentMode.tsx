"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { loadSnapshot, type Editor, type TLComponents } from "tldraw";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { customShapeUtils } from "@/components/editor/shapes/customShapes";

const Tldraw = dynamic(() => import("tldraw").then((m) => m.Tldraw), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-white/50">
      Loading…
    </div>
  ),
});

type Props = {
  open: boolean;
  onClose: () => void;
  snapshot: unknown | null;
};

// Strip every piece of tldraw's UI — in presentation mode the document is
// the only thing that matters.
const HIDDEN_UI: TLComponents = {
  MenuPanel: null,
  PageMenu: null,
  ActionsMenu: null,
  HelpMenu: null,
  SharePanel: null,
  DebugMenu: null,
  StylePanel: null,
  Toolbar: null,
  NavigationPanel: null,
  QuickActions: null,
  ZoomMenu: null,
  KeyboardShortcutsDialog: null,
};

export function PresentMode({ open, onClose, snapshot }: Props) {
  const editorRef = useRef<Editor | null>(null);
  const [pageIdx, setPageIdx] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [pageName, setPageName] = useState("");
  const [fullscreen, setFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleMount = (ed: Editor) => {
    editorRef.current = ed;
    ed.user.updateUserPreferences({ colorScheme: "dark" });
    if (snapshot) {
      try {
        loadSnapshot(
          ed.store,
          snapshot as Parameters<typeof loadSnapshot>[1],
        );
      } catch {
        /* ignore — invalid snapshot just leaves the preview blank */
      }
    }
    ed.updateInstanceState({ isReadonly: true });
    // Jump to the first page so the presentation always starts at slide 1.
    const firstPage = ed.getPages()[0];
    if (firstPage) ed.setCurrentPage(firstPage.id);
    refresh(ed);
    requestAnimationFrame(() => {
      ed.zoomToFit({ animation: { duration: 200 } });
    });
  };

  const refresh = (ed: Editor) => {
    const pages = ed.getPages();
    const current = ed.getCurrentPage();
    const idx = pages.findIndex((p) => p.id === current.id);
    setPageIdx(Math.max(0, idx));
    setPageCount(pages.length);
    setPageName(current.name);
  };

  const go = (direction: 1 | -1) => {
    const ed = editorRef.current;
    if (!ed) return;
    const pages = ed.getPages();
    const currentIdx = pages.findIndex((p) => p.id === ed.getCurrentPageId());
    const next = currentIdx + direction;
    if (next < 0 || next >= pages.length) return;
    ed.setCurrentPage(pages[next].id);
    ed.zoomToFit({ animation: { duration: 300 } });
    refresh(ed);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        onClose();
      } else if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(-1);
      } else if (e.key.toLowerCase() === "f") {
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, [open, onClose]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      containerRef.current.requestFullscreen().catch(() => {});
    }
  };

  const shapeUtils = useMemo(() => customShapeUtils, []);

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-canvas-wash"
      style={{ zIndex: 2000 }}
      role="dialog"
      aria-modal="true"
      aria-label="Presentation mode"
    >
      <div className="absolute inset-0">
        <Tldraw
          shapeUtils={shapeUtils}
          onMount={handleMount}
          components={HIDDEN_UI}
          hideUi
        />
      </div>

      {/* Overlay chrome (only the minimum needed) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-between p-4">
        <div className="glass-strong pointer-events-auto flex items-center gap-3 rounded-xl px-3 py-2 text-sm">
          <span className="text-white/50">Presenting</span>
          <span className="font-semibold">{pageName || "—"}</span>
          <span className="text-white/50">
            {pageIdx + 1} / {pageCount}
          </span>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="glass-strong btn-ghost flex h-9 items-center gap-2 rounded-xl px-3 text-sm"
            title="Toggle fullscreen (F)"
          >
            {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            {fullscreen ? "Exit fullscreen" : "Fullscreen"}
          </button>
          <button
            onClick={() => {
              if (document.fullscreenElement)
                document.exitFullscreen().catch(() => {});
              onClose();
            }}
            className="glass-strong btn-ghost flex h-9 items-center gap-2 rounded-xl px-3 text-sm"
            title="Exit (Esc)"
          >
            <X size={14} /> Exit
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center">
        <div className="glass-strong pointer-events-auto flex items-center gap-1 rounded-2xl px-2 py-1.5 shadow-glass">
          <button
            className="btn-ghost flex h-9 w-9 items-center justify-center rounded-lg disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => go(-1)}
            disabled={pageIdx === 0}
            title="Previous (←)"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="px-3 text-xs text-white/60">← / Space / → to navigate</div>
          <button
            className="btn-ghost flex h-9 w-9 items-center justify-center rounded-lg disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => go(1)}
            disabled={pageIdx === pageCount - 1}
            title="Next (→ / Space)"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
