"use client";

import { memo, useState } from "react";
import {
  Sparkles,
  FilePlus2,
  Save,
  Download,
  Undo2,
  Redo2,
  LayoutTemplate,
  Search as SearchIcon,
  Play,
} from "lucide-react";
import { FileMenu } from "./FileMenu";
import { ExportMenu } from "./ExportMenu";

type Props = {
  onNew: () => void;
  onOpen: (file: File) => void;
  onSave: () => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  onExportPdf: () => void;
  onExportPdfAll: () => void;
  pageCount: number;
  onUndo: () => void;
  onRedo: () => void;
  onOpenTemplates: () => void;
  onOpenShortcuts: () => void;
  onPresent: () => void;
  onOpenPalette: () => void;
};

export const TopBar = memo(function TopBar({
  onNew,
  onOpen,
  onSave,
  onExportPng,
  onExportSvg,
  onExportPdf,
  onExportPdfAll,
  pageCount,
  onUndo,
  onRedo,
  onOpenTemplates,
  onOpenShortcuts,
  onPresent,
  onOpenPalette,
}: Props) {
  const [fileOpen, setFileOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-start p-3 pl-16">
      <div className="glass-strong hud-layer animate-fade-down pointer-events-auto flex items-center gap-2 rounded-2xl px-3 py-2 shadow-glass">
        <div className="flex items-center gap-2 pr-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{
              background:
                "linear-gradient(135deg, #6c63ff 0%, #a855f7 50%, #ec4899 100%)",
            }}
          >
            <Sparkles size={16} className="text-white" />
          </div>
          <div className="whitespace-nowrap text-sm font-semibold tracking-tight">
            Infinite Idea
          </div>
        </div>

        <Separator />

        <div className="relative">
          <button
            className="btn-ghost flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm"
            onClick={() => {
              setFileOpen((v) => !v);
              setExportOpen(false);
            }}
          >
            <FilePlus2 size={14} /> File
          </button>
          {fileOpen && (
            <FileMenu
              onClose={() => setFileOpen(false)}
              onNew={onNew}
              onOpen={onOpen}
              onSave={onSave}
            />
          )}
        </div>

        <div className="relative">
          <button
            className="btn-ghost flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm"
            onClick={() => {
              setExportOpen((v) => !v);
              setFileOpen(false);
            }}
          >
            <Download size={14} /> Export
          </button>
          {exportOpen && (
            <ExportMenu
              onClose={() => setExportOpen(false)}
              onExportPng={onExportPng}
              onExportSvg={onExportSvg}
              onExportPdf={onExportPdf}
              onExportPdfAll={onExportPdfAll}
              pageCount={pageCount}
            />
          )}
        </div>

        <Separator />

        <button
          className="btn-ghost rounded-lg px-2.5 py-1.5"
          title="Undo"
          onClick={onUndo}
        >
          <Undo2 size={14} />
        </button>
        <button
          className="btn-ghost rounded-lg px-2.5 py-1.5"
          title="Redo"
          onClick={onRedo}
        >
          <Redo2 size={14} />
        </button>

        <Separator />

        <button
          data-tour="search"
          className="btn-ghost flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm"
          onClick={onOpenPalette}
          title="Search blocks, templates, actions (Ctrl+K)"
        >
          <SearchIcon size={14} />
          <span
            className="rounded-md border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/65"
            style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.06) inset" }}
          >
            ⌘K
          </span>
        </button>

        <button
          data-tour="templates"
          className="btn-ghost flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm"
          onClick={onOpenTemplates}
          title="Browse templates (T)"
          aria-label="Templates"
        >
          <LayoutTemplate size={14} />
        </button>

        <button
          data-tour="present"
          className="btn-ghost flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm"
          onClick={onPresent}
          title="Enter presentation mode"
          aria-label="Present"
        >
          <Play size={14} />
        </button>

        <Separator />

        <button
          className="btn-primary flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium"
          onClick={onSave}
          title="Save a .infidoc.json snapshot (Ctrl+S)"
          aria-label="Save"
        >
          <Save size={14} />
        </button>
      </div>
    </div>
  );
});

function Separator() {
  return <div className="mx-1 h-6 w-px bg-white/10" />;
}
