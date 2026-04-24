"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor, TLPageId } from "tldraw";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  FileText,
  Sparkles,
} from "lucide-react";

type Props = {
  editor: Editor | null;
  onAddPageFromTemplate: () => void;
};

export function PagesBar({ editor, onAddPageFromTemplate }: Props) {
  const [, force] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Re-render on page list / current-page changes.
  useEffect(() => {
    if (!editor) return;
    const sync = () => force((n) => n + 1);
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

  if (!editor) return null;

  const pages = editor.getPages();
  const current = editor.getCurrentPage();
  const idx = pages.findIndex((p) => p.id === current.id);
  const hasPrev = idx > 0;
  const hasNext = idx < pages.length - 1;

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

  return (
    <div className="pointer-events-none absolute bottom-20 left-1/2 z-10 -translate-x-1/2">
      <div className="glass-strong pointer-events-auto flex items-center gap-1 rounded-2xl px-2 py-1.5 shadow-glass">
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
          </button>

          {menuOpen && (
            <div
              ref={menuRef}
              className="glass-strong animate-fade-down absolute bottom-[calc(100%+8px)] left-1/2 z-30 w-64 -translate-x-1/2 overflow-hidden rounded-xl shadow-glass"
            >
              <div className="max-h-60 overflow-y-auto border-b border-white/10 py-1">
                {pages.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => go(p.id)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                      p.id === current.id
                        ? "bg-white/10 text-white"
                        : "text-white/80 hover:bg-white/5"
                    }`}
                  >
                    <span className="w-5 text-xs text-white/45">{i + 1}</span>
                    <span className="flex-1 truncate font-medium">{p.name}</span>
                    {p.id === current.id && (
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: "#8b5cf6" }}
                      />
                    )}
                  </button>
                ))}
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
}
