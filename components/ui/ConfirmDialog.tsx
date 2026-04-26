"use client";

import { Dialog } from "./Dialog";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  destructive = false,
}: Props) {
  return (
    <Dialog open={open} onClose={onClose} title={title} widthClass="max-w-md">
      {body && <p className="text-sm text-white/70">{body}</p>}
      <div className="mt-6 flex items-center justify-end gap-2">
        <button
          type="button"
          className="btn-ghost rounded-lg px-3 py-1.5 text-sm"
          onClick={onClose}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className={[
            "rounded-lg px-3 py-1.5 text-sm font-semibold",
            destructive
              ? "bg-red-500/80 text-white hover:bg-red-500"
              : "btn-primary",
          ].join(" ")}
          onClick={() => {
            onConfirm();
            onClose();
          }}
          autoFocus
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
