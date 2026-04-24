"use client";

import { Dialog } from "./Dialog";

type Props = {
  open: boolean;
  onClose: () => void;
};

type Shortcut = { keys: string; label: string };
type Group = { title: string; items: Shortcut[] };

const GROUPS: Group[] = [
  {
    title: "File",
    items: [
      { keys: "Ctrl+N", label: "New document" },
      { keys: "Ctrl+O", label: "Open a save file" },
      { keys: "Ctrl+S", label: "Save current document" },
      { keys: "T", label: "Browse templates" },
    ],
  },
  {
    title: "Edit",
    items: [
      { keys: "Ctrl+Z", label: "Undo" },
      { keys: "Ctrl+Shift+Z", label: "Redo" },
      { keys: "Ctrl+D", label: "Duplicate selection" },
      { keys: "Del", label: "Delete selection" },
      { keys: "Ctrl+A", label: "Select all" },
    ],
  },
  {
    title: "View",
    items: [
      { keys: "Ctrl+0", label: "Reset zoom" },
      { keys: "Shift+1", label: "Zoom to fit" },
      { keys: "Ctrl+=", label: "Zoom in" },
      { keys: "Ctrl+-", label: "Zoom out" },
    ],
  },
  {
    title: "Tools",
    items: [
      { keys: "V", label: "Select" },
      { keys: "H", label: "Hand (pan)" },
      { keys: "D", label: "Draw" },
      { keys: "E", label: "Eraser" },
      { keys: "A", label: "Arrow" },
      { keys: "R", label: "Rectangle" },
      { keys: "T", label: "Text" },
    ],
  },
];

export function ShortcutsDialog({ open, onClose }: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Keyboard shortcuts"
      subtitle="Press ? any time to open this dialog."
      widthClass="max-w-2xl"
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {GROUPS.map((g) => (
          <div key={g.title}>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/50">
              {g.title}
            </div>
            <div className="flex flex-col gap-1.5">
              {g.items.map((s) => (
                <div
                  key={s.keys}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-white/5"
                >
                  <span className="text-white/85">{s.label}</span>
                  <Kbd>{s.keys}</Kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Dialog>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="rounded-md border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-[11px] text-white/80"
      style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.06) inset" }}
    >
      {children}
    </kbd>
  );
}
