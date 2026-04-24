"use client";

import { useEffect, useRef } from "react";
import { FilePlus2, FolderOpen, Save } from "lucide-react";

type Props = {
  onClose: () => void;
  onNew: () => void;
  onOpen: (file: File) => void;
  onSave: () => void;
};

export function FileMenu({ onClose, onNew, onOpen, onSave }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="glass-strong absolute left-0 top-[calc(100%+8px)] z-30 w-56 overflow-hidden rounded-xl shadow-glass"
    >
      <MenuItem
        icon={<FilePlus2 size={14} />}
        label="New"
        hint="Blank canvas"
        onClick={() => {
          onNew();
          onClose();
        }}
      />
      <MenuItem
        icon={<FolderOpen size={14} />}
        label="Open…"
        hint=".infidoc.json"
        onClick={() => fileInputRef.current?.click()}
      />
      <MenuItem
        icon={<Save size={14} />}
        label="Save"
        hint="Download snapshot"
        onClick={() => {
          onSave();
          onClose();
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onOpen(file);
            onClose();
          }
          e.target.value = "";
        }}
      />
    </div>
  );
}

function MenuItem({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-white/90 hover:bg-white/10"
    >
      <span className="text-white/70">{icon}</span>
      <span className="flex-1 font-medium">{label}</span>
      {hint && <span className="text-xs text-white/40">{hint}</span>}
    </button>
  );
}
