"use client";

import { Sparkles, ArrowLeft } from "lucide-react";

type Props = {
  onBrowseTemplates: () => void;
};

export function EmptyCanvas({ onBrowseTemplates }: Props) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center"
      aria-hidden="true"
    >
      <div className="animate-fade-up pointer-events-auto flex max-w-lg flex-col items-center gap-5 text-center">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-glow"
          style={{
            background:
              "linear-gradient(135deg, #6c63ff 0%, #a855f7 50%, #ec4899 100%)",
          }}
        >
          <Sparkles size={22} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Start designing your doc
          </h2>
          <p className="mt-2 text-sm text-white/60">
            Drop a block from the toolbox on the left, or start from a ready-made
            template.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onBrowseTemplates}
            className="btn-primary flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
          >
            <Sparkles size={14} /> Browse templates
          </button>
          <div className="flex items-center gap-1.5 text-xs text-white/50">
            <ArrowLeft size={12} /> or use the toolbox
          </div>
        </div>
      </div>
    </div>
  );
}
