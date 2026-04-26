"use client";

import { useEffect, useState } from "react";
import { Dialog } from "./Dialog";
import { StructuredEditor } from "./StructuredEditor";
import type { ColumnSchema } from "@/lib/shapeSchemas";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  schema: ColumnSchema;
  shapeProps: Record<string, unknown>;
  onChange: (patch: Record<string, string>) => void;
};

type ViewMode = "visual" | "raw";

export function StructuredEditorDialog({
  open,
  onClose,
  title,
  schema,
  shapeProps,
  onChange,
}: Props) {
  const [view, setView] = useState<ViewMode>("visual");

  // The raw textareas show one prop at a time. For multi-prop shapes
  // (Checklist) we just show the primary key with a hint that the rest
  // round-trips through Visual mode.
  const rawKey = schema.rawKey ?? Object.keys(schema.serialize([]))[0];
  const [rawValue, setRawValue] = useState<string>(String(shapeProps[rawKey] ?? ""));

  // Re-sync rawValue ONLY when the user transitions into raw mode (or the
  // rawKey changes). While in raw mode, rawValue is the source of truth;
  // we must NOT resync from shapeProps mid-typing — the visual editor's
  // debounce flush would otherwise race in and clobber unsaved keystrokes.
  // shapeProps is intentionally absent from the deps.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (view === "raw") setRawValue(String(shapeProps[rawKey] ?? ""));
  }, [view, rawKey]);

  const onRawChange = (next: string) => {
    setRawValue(next);
    onChange({ [rawKey]: next });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      subtitle={schema.helpHeader}
      widthClass="max-w-4xl"
    >
      <div
        role="tablist"
        aria-label="Editor mode"
        className="mb-4 flex items-center gap-1 self-start rounded-lg border border-white/10 bg-white/5 p-0.5"
      >
        <ToggleButton
          active={view === "visual"}
          onClick={() => setView("visual")}
          id="se-tab-visual"
          controlsId="se-panel-visual"
        >
          Visual
        </ToggleButton>
        <ToggleButton
          active={view === "raw"}
          onClick={() => setView("raw")}
          id="se-tab-raw"
          controlsId="se-panel-raw"
        >
          Raw text
        </ToggleButton>
      </div>

      <div
        role="tabpanel"
        id={view === "visual" ? "se-panel-visual" : "se-panel-raw"}
        aria-labelledby={view === "visual" ? "se-tab-visual" : "se-tab-raw"}
      >
        {view === "visual" ? (
          <StructuredEditor
            mode="full"
            schema={schema}
            shapeProps={shapeProps}
            onChange={onChange}
          />
        ) : (
          <textarea
            className="w-full min-h-[300px] resize-y rounded-md border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white outline-none focus:border-brand-400"
            value={rawValue}
            spellCheck={false}
            onChange={(e) => onRawChange(e.target.value)}
          />
        )}
      </div>
    </Dialog>
  );
}

function ToggleButton({
  active,
  onClick,
  id,
  controlsId,
  children,
}: {
  active: boolean;
  onClick: () => void;
  id: string;
  controlsId: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      id={id}
      role="tab"
      aria-selected={active}
      aria-controls={controlsId}
      onClick={onClick}
      className={[
        "rounded-md px-3 py-1 text-xs font-semibold transition",
        active ? "bg-white/10 text-white" : "text-white/55 hover:text-white",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
