"use client";

import { Dialog } from "./Dialog";
import { BLANK_TEMPLATE, TEMPLATES, type Template } from "@/lib/templates";
import { FilePlus2, Sparkles } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (template: Template) => void;
  mode?: "current" | "new-page";
};

export function TemplatesDialog({
  open,
  onClose,
  onPick,
  mode = "current",
}: Props) {
  const title = mode === "new-page" ? "Add a new page" : "Start a document";
  const subtitle =
    mode === "new-page"
      ? "Pick a template or add a blank page."
      : "Pick a template or begin from a blank canvas.";
  return (
    <Dialog open={open} onClose={onClose} title={title} subtitle={subtitle}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          onClick={() => onPick(BLANK_TEMPLATE)}
          className="template-card group flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-white/30 hover:bg-white/10"
        >
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <FilePlus2 size={18} />
          </div>
          <div>
            <div className="text-sm font-semibold">Blank canvas</div>
            <div className="mt-0.5 text-xs text-white/55">
              Start from nothing and build your own.
            </div>
          </div>
        </button>

        {TEMPLATES.map((t, i) => (
          <button
            key={t.id}
            onClick={() => onPick(t)}
            className="template-card group flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-white/30 hover:bg-white/10"
            style={{ animationDelay: `${60 + i * 40}ms` }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${t.accent}66, ${t.accent}aa)`,
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold">{t.name}</div>
              <div className="mt-0.5 text-xs text-white/55">{t.description}</div>
            </div>
          </button>
        ))}
      </div>
    </Dialog>
  );
}
