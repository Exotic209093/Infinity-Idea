"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Plus, Trash2, GripVertical } from "lucide-react";
import type { Column, ColumnSchema, Row } from "@/lib/shapeSchemas";

type Mode = "compact" | "full";

type Props = {
  mode: Mode;
  schema: ColumnSchema;
  shapeProps: Record<string, unknown>;
  onChange: (patch: Record<string, string>) => void;
  onOpenFull?: () => void;
};

export function StructuredEditor({ mode, schema, shapeProps, onChange, onOpenFull }: Props) {
  const initialRows = useMemo(() => schema.parse(shapeProps), [schema, shapeProps]);
  const [rows, setRows] = useState<Row[]>(initialRows);

  // For Table (dynamicColumns) we infer columns from row width.
  const columns: ReadonlyArray<Column> = useMemo(() => {
    if (!schema.dynamicColumns) return schema.columns;
    const colCount = rows.reduce(
      (m, r) => Math.max(m, Object.keys(r).reduce((mm, k) => Math.max(mm, Number(k) + 1), 0)),
      0,
    );
    const cols: Column[] = [];
    for (let i = 0; i < colCount; i++) {
      cols.push({ key: String(i), label: String.fromCharCode(65 + (i % 26)), kind: "text", width: "auto" });
    }
    return cols;
  }, [rows, schema]);

  const showHeaders = mode === "full" || columns.length > 2;
  const compact = mode === "compact";

  const pendingPatchRef = useRef<Record<string, string> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Always call the latest `onChange`, not the one captured at first render.
  // This matters for the unmount-flush effect, whose cleanup runs once with
  // the closure from the render where the effect mounted.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // External-edit reconciliation. When `shapeProps` references change, we
  // re-parse and compare with current `rows`. If they differ, an external
  // write happened (e.g. the popout dialog flushed while the compact editor
  // is also mounted) and we accept the new state. JSON-equal compare on the
  // SERIALISED form keeps it stable across flag-array reorderings etc.
  useEffect(() => {
    const fromProps = schema.parse(shapeProps);
    const fromPropsKey = JSON.stringify(schema.serialize(fromProps));
    const localKey = JSON.stringify(schema.serialize(rows));
    if (fromPropsKey !== localKey) setRows(fromProps);
    // `rows` deliberately omitted from deps — we only resync when shapeProps
    // (the external source of truth) ticks, not on every local edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapeProps, schema]);

  const cancelDebounce = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  };

  const flushPending = () => {
    cancelDebounce();
    const pending = pendingPatchRef.current;
    if (pending) {
      pendingPatchRef.current = null;
      onChangeRef.current(pending);
    }
  };

  // Flush in-flight changes when the editor unmounts so closing the popout
  // or deselecting the shape never loses the last 40 ms of typing.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => flushPending(), []);

  const flush = (next: Row[]) => {
    setRows(next);
    pendingPatchRef.current = schema.serialize(next);
    cancelDebounce();
    debounceRef.current = setTimeout(flushPending, 40);
  };

  const setCell = (rowIdx: number, key: string, value: unknown) => {
    const next = rows.map((r, i) => (i === rowIdx ? { ...r, [key]: value } : r));
    flush(next);
  };

  // For dynamic-column shapes (Table), pad the new row with empty strings up
  // to the current column count so the editor doesn't render a zero-column row.
  const addRow = () => {
    const fresh: Row = schema.dynamicColumns
      ? Object.fromEntries(columns.map((c) => [c.key, ""]))
      : schema.emptyRow();
    flush([...rows, fresh]);
  };

  const removeRow = (rowIdx: number) => flush(rows.filter((_, i) => i !== rowIdx));

  // Only meaningful for dynamicColumns shapes (Table). Pads each existing row
  // with one new empty column at the end, so the next column-count inference
  // picks up an extra column.
  const addColumn = () => {
    if (!schema.dynamicColumns) return;
    const newKey = String(columns.length);
    const next = rows.length === 0
      ? [{ [newKey]: "" } as Row]
      : rows.map((r) => ({ ...r, [newKey]: "" }));
    flush(next);
  };

  const [dragFrom, setDragFrom] = useState<number | null>(null);

  const onDragStart = (i: number) => (e: React.DragEvent) => {
    setDragFrom(i);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const onDrop = (i: number) => () => {
    if (dragFrom === null || dragFrom === i) {
      setDragFrom(null);
      return;
    }
    const next = [...rows];
    const [moved] = next.splice(dragFrom, 1);
    next.splice(i, 0, moved);
    flush(next);
    setDragFrom(null);
  };

  return (
    <div className={compact ? "flex flex-col gap-1" : "flex flex-col gap-3"}>
      {!compact && schema.helpHeader && (
        <p className="text-xs text-white/55">{schema.helpHeader}</p>
      )}

      {showHeaders && (
        <div className={`flex items-center gap-1 px-1 ${compact ? "text-[10px]" : "text-[11px]"} font-semibold uppercase tracking-wider text-white/45`}>
          <span className="w-4" />
          {columns.map((c) => (
            <span key={c.key} className={widthClass(c.width)}>{c.label}</span>
          ))}
          <span className="w-6" />
        </div>
      )}

      <div
        className={compact ? "max-h-56 overflow-y-auto pr-1" : ""}
        onBlur={flushPending}
      >
        {rows.map((row, rowIdx) => (
          // We key by index rather than a stable id. Inputs are fully controlled
          // (value comes from row[c.key]), so React re-applies the right value
          // when rows swap positions on reorder. The known caveat is that an
          // active input's cursor position / IME composition belongs to the DOM
          // node and survives the swap, so dragging while a cell is focused can
          // briefly show the wrong cursor context. Acceptable today; revisit if
          // we add features (e.g. autofill, drag-without-blur) that lean on
          // stable identity.
          <div
            key={rowIdx}
            draggable
            onDragStart={onDragStart(rowIdx)}
            onDragOver={onDragOver}
            onDrop={onDrop(rowIdx)}
            onDragEnd={() => setDragFrom(null)}
            className={`flex items-center gap-1 ${compact ? "py-0.5" : "py-1.5"} ${dragFrom === rowIdx ? "opacity-50" : ""}`}
          >
            <span
              className="cursor-grab text-white/30"
              role="button"
              tabIndex={-1}
              aria-label="Drag to reorder"
              title="Drag to reorder"
            >
              <GripVertical size={12} />
            </span>
            {columns.map((c) => (
              <div key={c.key} className={widthClass(c.width)}>
                <CellInput
                  column={c}
                  value={row[c.key]}
                  onChange={(next) => setCell(rowIdx, c.key, next)}
                  compact={compact}
                />
              </div>
            ))}
            <button
              type="button"
              className="btn-ghost flex h-6 w-6 items-center justify-center rounded"
              aria-label="Delete row"
              onClick={() => removeRow(rowIdx)}
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="btn-ghost flex items-center gap-1 rounded px-2 py-1 text-xs"
            onClick={addRow}
          >
            <Plus size={12} /> Add row
          </button>
          {schema.dynamicColumns && (
            <button
              type="button"
              className="btn-ghost flex items-center gap-1 rounded px-2 py-1 text-xs"
              onClick={addColumn}
            >
              <Plus size={12} /> Add column
            </button>
          )}
        </div>
        {compact && onOpenFull && (
          <button
            type="button"
            className="btn-ghost flex items-center gap-1 rounded px-2 py-1 text-xs"
            onClick={onOpenFull}
          >
            <Maximize2 size={12} /> Edit fully
          </button>
        )}
      </div>
    </div>
  );
}

function widthClass(w: Column["width"]): string {
  switch (w) {
    case "narrow": return "w-7 flex-shrink-0";
    case "auto":   return "w-24 flex-shrink-0";
    case "flex":
    default:       return "min-w-0 flex-1";
  }
}

type CellProps = {
  column: Column;
  value: unknown;
  onChange: (next: unknown) => void;
  compact: boolean;
};

function CellInput({ column, value, onChange, compact }: CellProps) {
  const baseInput = `w-full rounded border border-white/10 bg-white/5 ${compact ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-sm"} text-white outline-none focus:border-brand-400`;

  switch (column.kind) {
    case "text":
      return (
        <input
          className={baseInput}
          value={String(value ?? "")}
          placeholder={column.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "multitext":
      return (
        <textarea
          rows={compact ? 1 : 2}
          className={`${baseInput} resize-y`}
          value={String(value ?? "")}
          placeholder={column.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "select":
      return (
        <select
          className={baseInput}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        >
          {column.options.map((o) => (
            <option key={o.value} value={o.value} className="bg-[#1a1a2e]">
              {o.label}
            </option>
          ))}
        </select>
      );
    case "checkbox":
      return (
        <input
          type="checkbox"
          className="h-4 w-4 cursor-pointer accent-brand-400"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
        />
      );
    case "flag-list": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div role="group" aria-label={column.label} className="flex flex-wrap gap-1">
          {column.flags.map((f) => {
            const on = selected.includes(f.key);
            return (
              <button
                type="button"
                key={f.key}
                aria-label={f.label}
                aria-pressed={on}
                onClick={() => {
                  const next = on ? selected.filter((k) => k !== f.key) : [...selected, f.key];
                  onChange(next);
                }}
                className={[
                  "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  on
                    ? "bg-brand-500/30 text-brand-100 border border-brand-400/60"
                    : "bg-white/5 text-white/55 border border-white/10 hover:text-white/80",
                ].join(" ")}
              >
                {f.key}
              </button>
            );
          })}
        </div>
      );
    }
  }
}
