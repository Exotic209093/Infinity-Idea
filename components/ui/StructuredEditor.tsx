"use client";

import { useMemo, useState } from "react";
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

  const flush = (next: Row[]) => {
    setRows(next);
    onChange(schema.serialize(next));
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

      <div className={compact ? "max-h-56 overflow-y-auto pr-1" : ""}>
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
            <GripVertical size={12} className="text-white/30" />
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
        <button
          type="button"
          className="btn-ghost flex items-center gap-1 rounded px-2 py-1 text-xs"
          onClick={addRow}
        >
          <Plus size={12} /> Add row
        </button>
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
