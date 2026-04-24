"use client";

import { useEffect, useRef } from "react";
import { FileImage, FileType, FileText } from "lucide-react";

type Props = {
  onClose: () => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  onExportPdf: () => void;
};

export function ExportMenu({
  onClose,
  onExportPng,
  onExportSvg,
  onExportPdf,
}: Props) {
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
      className="glass-strong animate-fade-down absolute left-0 top-[calc(100%+8px)] z-30 w-56 overflow-hidden rounded-xl shadow-glass"
    >
      <MenuItem
        icon={<FileText size={14} />}
        label="Export PDF"
        hint=".pdf"
        onClick={() => {
          onExportPdf();
          onClose();
        }}
      />
      <MenuItem
        icon={<FileImage size={14} />}
        label="Export PNG"
        hint=".png · 2×"
        onClick={() => {
          onExportPng();
          onClose();
        }}
      />
      <MenuItem
        icon={<FileType size={14} />}
        label="Export SVG"
        hint=".svg"
        onClick={() => {
          onExportSvg();
          onClose();
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
