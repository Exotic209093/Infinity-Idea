"use client";

import { Dialog } from "./Dialog";
import {
  Sparkles,
  LayoutTemplate,
  Search as SearchIcon,
  Compass,
} from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onBrowseTemplates: () => void;
  onStartTour: () => void;
};

/*
 * One-off welcome card the first time someone lands on the app. The
 * top-level CanvasEditor gates this on a localStorage flag.
 */
export function WelcomeDialog({
  open,
  onClose,
  onBrowseTemplates,
  onStartTour,
}: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Welcome to Infinite Idea"
      subtitle="A canvas for client documentation that's stateless, fast, and beautiful by default."
      widthClass="max-w-2xl"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          onClick={() => {
            onBrowseTemplates();
            onClose();
          }}
          className="template-card flex flex-col items-start gap-2 rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:border-white/30 hover:bg-white/10"
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{
              background:
                "linear-gradient(135deg, rgba(108,99,255,0.55), rgba(236,72,153,0.55))",
            }}
          >
            <LayoutTemplate size={16} />
          </div>
          <div>
            <div className="text-sm font-semibold">Pick a template</div>
            <div className="mt-0.5 text-[11.5px] text-white/55">
              6 starting layouts ready to go.
            </div>
          </div>
        </button>

        <button
          onClick={onClose}
          className="template-card flex flex-col items-start gap-2 rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:border-white/30 hover:bg-white/10"
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <Sparkles size={16} />
          </div>
          <div>
            <div className="text-sm font-semibold">Start blank</div>
            <div className="mt-0.5 text-[11.5px] text-white/55">
              Drop blocks from the toolbox or search with{" "}
              <kbd className="rounded bg-white/10 px-1 py-0.5 font-mono text-[9.5px]">
                ⌘K
              </kbd>
              .
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            onClose();
            onStartTour();
          }}
          className="template-card flex flex-col items-start gap-2 rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:border-white/30 hover:bg-white/10"
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ background: "rgba(34,211,238,0.15)" }}
          >
            <Compass size={16} className="text-cyan-300" />
          </div>
          <div>
            <div className="text-sm font-semibold">Quick tour</div>
            <div className="mt-0.5 text-[11.5px] text-white/55">
              30 seconds — show me the highlights.
            </div>
          </div>
        </button>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[12px] text-white/65">
        <SearchIcon size={14} className="flex-shrink-0 text-white/55" />
        <span>
          Press{" "}
          <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/80">
            ⌘K
          </kbd>{" "}
          any time to search blocks, templates, and actions.
        </span>
      </div>
    </Dialog>
  );
}
