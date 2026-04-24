"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  widthClass?: string;
};

export function Dialog({
  open,
  onClose,
  title,
  subtitle,
  children,
  widthClass = "max-w-3xl",
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="animate-fade-in fixed inset-0 flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        background: "rgba(8,8,16,0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div
        ref={cardRef}
        className={`glass-strong animate-pop-in flex w-full ${widthClass} flex-col overflow-hidden rounded-2xl shadow-glass`}
        style={{ maxHeight: "calc(100vh - 32px)" }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-4">
          <div>
            <h2 id="dialog-title" className="text-base font-bold">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-sm text-white/60">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="btn-ghost -mr-2 -mt-1 flex h-8 w-8 items-center justify-center rounded-lg"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
