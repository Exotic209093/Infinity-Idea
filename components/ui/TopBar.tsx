"use client";

import { useState } from "react";
import {
  Sparkles,
  FilePlus2,
  Save,
  Download,
  Undo2,
  Redo2,
  LayoutTemplate,
  Keyboard,
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
  onUndo: () => void;
  onRedo: () => void;
  onOpenTemplates: () => void;
  onOpenShortcuts: () => void;
};

export function TopBar({
  onNew,
  onOpen,
  onSave,
  onExportPng,
  onExportSvg,
  onExportPdf,
  onUndo,
  onRedo,
  onOpenTemplates,
  onOpenShortcuts,
}: Props) {
  const [fileOpen, setFileOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center p-3">
      <div className="glass-strong animate-fade-down pointer-events-auto flex items-center gap-2 rounded-2xl px-3 py-2 shadow-glass">
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
          <div className="text-sm font-semibold tracking-tight">
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
          className="btn-ghost flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm"
          onClick={onOpenTemplates}
          title="Browse templates"
        >
          <LayoutTemplate size={14} /> Templates
        </button>

        <button
          className="btn-ghost rounded-lg px-2.5 py-1.5"
          onClick={onOpenShortcuts}
          title="Keyboard shortcuts (?)"
        >
          <Keyboard size={14} />
        </button>

        <Separator />

        <button
          className="btn-primary flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium"
          onClick={onSave}
          title="Save a .infidoc.json snapshot (Ctrl+S)"
        >
          <Save size={14} /> Save
        </button>
      </div>
    </div>
  );
}

function Separator() {
  return <div className="mx-1 h-6 w-px bg-white/10" />;
}
