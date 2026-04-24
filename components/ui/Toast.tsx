"use client";

import { useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export type ToastKind = "success" | "error" | "info";

export type ToastMessage = {
  id: number;
  kind: ToastKind;
  text: string;
};

type Props = {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
};

export function ToastStack({ toasts, onDismiss }: Props) {
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icon =
    toast.kind === "error" ? (
      <AlertCircle size={16} className="text-pink-400" />
    ) : (
      <CheckCircle2 size={16} className="text-emerald-300" />
    );

  return (
    <div className="glass-strong animate-toast pointer-events-auto flex min-w-[280px] items-center gap-3 rounded-xl px-4 py-3 text-sm shadow-glass">
      {icon}
      <span className="flex-1">{toast.text}</span>
      <button
        className="text-white/50 hover:text-white"
        onClick={() => onDismiss(toast.id)}
      >
        <X size={14} />
      </button>
    </div>
  );
}
