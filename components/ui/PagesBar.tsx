"use client";

import { memo, useEffect, useRef, useState } from "react";
import {
  getIndexAbove,
  getIndexBelow,
  getIndexBetween,
  type Editor,
  type IndexKey,
  type TLPage,
  type TLPageId,
} from "tldraw";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  FileText,
  Sparkles,
  StickyNote,
  GripVertical,
  Copy,
} from "lucide-react";

type Props = {
  editor: Editor | null;
  onAddPageFromTemplate: () => void;
  onEditNotes: () => void;
};

type PagesSnapshot = {
  pages: readonly TLPage[];
  currentId: TLPageId;
};

function pagesSnapshotEqual(a: PagesSnapshot, b: PagesSnapshot): boolean {
  if (a.currentId !== b.currentId) return false;
  if (a.pages === b.pages) return true;
  if (a.pages.length !== b.pages.length) return false;
  for (let i = 0; i < a.pages.length; i++) {
    // Page records are immutable in tldraw — reference equality is sufficient
    // and catches name / index / meta changes via record replacement.
    if (a.pages[i] !== b.pages[i]) return false;
  }
  return true;
}

export const PagesBar = memo(function PagesBar({
  editor,
  onAddPageFromTemplate,
  onEditNotes,
}: Props) {
  const [snap, setSnap] = useState<PagesSnapshot | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Only re-render when pages or the current page id actually change. The
  // listener fires on every store tick (including camera moves) so we dedup
  // here to keep the bar idle during canvas interaction.
  useEffect(() => {
    if (!editor) return;
    const sync = () => {
      const next: PagesSnapshot = {
        pages: editor.getPages(),
        currentId: editor.getCurrentPageId(),
      };
      setSnap((prev) => (prev && pagesSnapshotEqual(prev, next) ? prev : next));
    };
    sync();
    const dispose = editor.store.listen(sync, { scope: "all" });
    return () => dispose();
  }, [editor]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  if (!editor || !snap) return null;

  const pages = snap.pages;
  const current = pages.find((p) => p.id === snap.currentId) ?? pages[0];
  const idx = pages.findIndex((p) => p.id === current.id);
  const hasPrev = idx > 0;
  const hasNext = idx < pages.length - 1;
  const currentNotes =
    ((current.meta as { notes?: string } | undefined)?.notes ?? "").trim();

  const go = (id: TLPageId) => {
    editor.setCurrentPage(id);
    editor.zoomToFit({ animation: { duration: 300 } });
    setMenuOpen(false);
  };

  const addPage = () => {
    const name = `Page ${pages.length + 1}`;
    editor.markHistoryStoppingPoint("add-page");
    editor.createPage({ name });
    const newPages = editor.getPages();
    const created = newPages[newPages.length - 1];
    if (created) go(created.id);
  };

  const renameCurrent = () => {
    const next = window.prompt("Rename page", current.name);
    if (!next || next.trim() === current.name) return;
    editor.markHistoryStoppingPoint("rename-page");
    editor.renamePage(current.id, next.trim());
  };

  const deleteCurrent = () => {
    if (pages.length <= 1) return;
    if (!window.confirm(`Delete "${current.name}"? This can't be undone.`)) return;
    editor.markHistoryStoppingPoint("delete-page");
    editor.deletePage(current.id);
    setMenuOpen(false);
  };

  const duplicateCurrent = () => {
    editor.markHistoryStoppingPoint("duplicate-page");
    editor.duplicatePage(current.id);
    editor.zoomToFit({ animation: { duration: 300 } });
    setMenuOpen(false);
  };

  const movePage = (from: number, to: number) => {
    if (from === to) return;
    const id = pages[from].id;
    let index: IndexKey;
    const below = from > to ? pages[to - 1] : pages[to];
    const above = from > to ? pages[to] : pages[to + 1];
    if (below && !above) index = getIndexAbove(below.index);
    else if (!below && above) index = getIndexBelow(pages[0].index);
    else if (below && above) index = getIndexBetween(below.index, above.index);
    else return;
    if (index === pages[from].index) return;
    editor.markHistoryStoppingPoint("move-page");
    editor.updatePage({ id, index });
  };

  return (
    <div className="pointer-events-none absolute bottom-20 left-1/2 z-10 -translate-x-1/2">
      <div className="glass-strong hud-layer pointer-events-auto flex items-center gap-1 rounded-2xl px-2 py-1.5 shadow-glass">
        <button
          className="btn-ghost flex h-8 w-8 items-center justify-center rounded-lg disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => hasPrev && go(pages[idx - 1].id)}
          disabled={!hasPrev}
          title="Previous page"
        >
          <ChevronLeft size={14} />
        </button>

        <div className="relative">
          <button
            className="btn-ghost flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold"
            onClick={() => setMenuOpen((v) => !v)}
            title="Pages"
          >
            <FileText size={12} />
            <span className="max-w-[140px] truncate">{current.name}</span>
            <span className="text-white/45">
              {idx + 1} / {pages.length}
            </span>
            {currentNotes && (
              <StickyNote
                size={11}
                className="text-amber-300"
                aria-label="Has notes"
              />
            )}
          </button>

          {menuOpen && (
            <div
              ref={menuRef}
              className="glass-strong animate-fade-down absolute bottom-[calc(100%+8px)] left-1/2 z-30 w-72 -translate-x-1/2 overflow-hidden rounded-xl shadow-glass"
            >
              <div className="max-h-60 overflow-y-auto border-b border-white/10 py-1">
                {pages.map((p, i) => {
                  const isDragging = dragFrom === i;
                  const isDragOver = dragOver === i && dragFrom !== null && dragFrom !== i;
                  const hasNotes =
                    ((p.meta as { notes?: string } | undefined)?.notes ?? "").trim() !== "";
                  return (
                    <div
                      key={p.id}
                      draggable
                      onDragStart={(e) => {
                        setDragFrom(i);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(i);
                        e.dataTransfer.dropEffect = "move";
                      }}
                      onDragLeave={() => setDragOver((v) => (v === i ? null : v))}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (dragFrom !== null) movePage(dragFrom, i);
                        setDragFrom(null);
                        setDragOver(null);
                      }}
                      onDragEnd={() => {
                        setDragFrom(null);
                        setDragOver(null);
                      }}
                      className={[
                        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition",
                        p.id === current.id
                          ? "bg-white/10 text-white"
                          : "text-white/80 hover:bg-white/5",
                        isDragging ? "opacity-50" : "",
                        isDragOver ? "shadow-[inset_0_2px_0_#8b5cf6]" : "",
                      ].join(" ")}
                    >
                      <GripVertical
                        size={12}
                        className="cursor-grab text-white/35"
                      />
                      <button
                        onClick={() => go(p.id)}
                        className="flex flex-1 items-center gap-2 text-left"
                      >
                        <span className="w-5 text-xs text-white/45">{i + 1}</span>
                        <span className="flex-1 truncate font-medium">
                          {p.name}
                        </span>
                        {hasNotes && (
                          <StickyNote
                            size={11}
                            className="text-amber-300"
                            aria-label="Has notes"
                          />
                        )}
                        {p.id === current.id && (
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: "#8b5cf6" }}
                          />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-1 p-1">
                <button
                  onClick={() => {
                    addPage();
                    setMenuOpen(false);
                  }}
                  className="btn-ghost flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold"
                >
                  <Plus size={12} /> Add blank
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onAddPageFromTemplate();
                  }}
                  className="btn-ghost flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold"
                  title="Add a new page from a template"
                >
                  <Sparkles size={12} /> Template
                </button>
              </div>
              <div className="flex items-center gap-1 border-t border-white/10 p-1">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEditNotes();
                  }}
                  className="btn-ghost flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold"
                  title="Edit speaker notes for this page"
                >
                  <StickyNote size={12} /> Notes
                </button>
                <button
                  onClick={duplicateCurrent}
                  className="btn-ghost flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold"
                  title="Duplicate this page and its content"
                >
                  <Copy size={12} /> Duplicate
                </button>
              </div>
              <div className="flex items-center gap-1 border-t border-white/10 p-1">
                <button
                  onClick={() => {
                    renameCurrent();
                    setMenuOpen(false);
                  }}
                  className="btn-ghost flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold"
                >
                  <Pencil size={12} /> Rename
                </button>
                <button
                  onClick={deleteCurrent}
                  disabled={pages.length <= 1}
                  className="btn-ghost flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          className="btn-ghost flex h-8 w-8 items-center justify-center rounded-lg disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => hasNext && go(pages[idx + 1].id)}
          disabled={!hasNext}
          title="Next page"
        >
          <ChevronRight size={14} />
        </button>

        <div className="mx-1 h-5 w-px bg-white/10" />

        <button
          className="btn-ghost flex h-8 w-8 items-center justify-center rounded-lg"
          onClick={addPage}
          title="Add new page"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
});
