"use client";

import { useEffect, useState } from "react";
import { Dialog } from "./Dialog";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  submitLabel?: string;
  cancelLabel?: string;
};

export function PromptDialog({
  open,
  onClose,
  onSubmit,
  title,
  label,
  defaultValue = "",
  placeholder,
  submitLabel = "Save",
  cancelLabel = "Cancel",
}: Props) {
  const [value, setValue] = useState(defaultValue);

  // Reset to the supplied default each time the dialog (re-)opens.
  useEffect(() => {
    if (open) setValue(defaultValue);
  }, [open, defaultValue]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      onClose();
      return;
    }
    onSubmit(trimmed);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title={title} widthClass="max-w-md">
      <label className="flex flex-col gap-1.5">
        {label && (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
            {label}
          </span>
        )}
        <input
          autoFocus
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-400"
        />
      </label>
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
          className="btn-primary rounded-lg px-3 py-1.5 text-sm font-semibold"
          onClick={submit}
        >
          {submitLabel}
        </button>
      </div>
    </Dialog>
  );
}
