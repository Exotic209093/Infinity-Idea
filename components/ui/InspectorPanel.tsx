"use client";

import { useMemo } from "react";
import type { Editor, TLShape } from "tldraw";
import { Bookmark } from "lucide-react";
import { CUSTOM_SHAPE_TYPES } from "@/types/shapes";

type Props = {
  editor: Editor | null;
  selectedShape: TLShape | null;
  onSaveAsBlock: () => void;
};

export function InspectorPanel({
  editor,
  selectedShape,
  onSaveAsBlock,
}: Props) {
  const title = useMemo(() => {
    if (!selectedShape) return "No selection";
    const t = selectedShape.type;
    if (t === CUSTOM_SHAPE_TYPES.processStep) return "Process Step";
    if (t === CUSTOM_SHAPE_TYPES.decisionGate) return "Decision Gate";
    if (t === CUSTOM_SHAPE_TYPES.milestone) return "Milestone";
    if (t === CUSTOM_SHAPE_TYPES.orgNode) return "Org Node";
    if (t === CUSTOM_SHAPE_TYPES.swimlane) return "Swimlane";
    if (t === CUSTOM_SHAPE_TYPES.titleBlock) return "Title Block";
    if (t === CUSTOM_SHAPE_TYPES.callout) return "Callout";
    if (t === CUSTOM_SHAPE_TYPES.checklist) return "Checklist";
    if (t === CUSTOM_SHAPE_TYPES.table) return "Table";
    if (t === CUSTOM_SHAPE_TYPES.quote) return "Quote";
    if (t === CUSTOM_SHAPE_TYPES.kpiStat) return "KPI Stat";
    if (t === CUSTOM_SHAPE_TYPES.sobject) return "Salesforce Object";
    return t.charAt(0).toUpperCase() + t.slice(1);
  }, [selectedShape]);

  return (
    <div className="glass-strong animate-slide-in-right pointer-events-auto absolute right-3 z-10 hidden w-72 flex-col overflow-hidden rounded-2xl shadow-glass md:flex"
         style={{ top: 320, maxHeight: "calc(100vh - 340px)", animationDelay: "160ms" }}>
      <div className="border-b border-white/10 p-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
          Inspector
        </div>
        <div className="mt-1 text-sm font-bold">{title}</div>
      </div>

      <div className="scroll-thin flex-1 overflow-y-auto p-3">
        {!selectedShape ? (
          <p className="text-sm text-white/50">
            Select something on the canvas to edit it.
          </p>
        ) : (
          <>
            <ShapeFields editor={editor} shape={selectedShape} />
            <button
              onClick={onSaveAsBlock}
              className="btn-ghost mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold"
              title="Save the current selection as a reusable block"
            >
              <Bookmark size={12} />
              Save as block
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ShapeFields({
  editor,
  shape,
}: {
  editor: Editor | null;
  shape: TLShape;
}) {
  const props = shape.props as Record<string, unknown>;

  const update = (partial: Record<string, unknown>) => {
    if (!editor) return;
    editor.updateShape({
      id: shape.id,
      type: shape.type,
      props: { ...props, ...partial },
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {typeof props.label === "string" && (
        <TextField
          label="Label"
          value={props.label}
          onChange={(v) => update({ label: v })}
          multiline
        />
      )}

      {shape.type === CUSTOM_SHAPE_TYPES.processStep && (
        <NumberField
          label="Step number"
          value={Number(props.stepNumber ?? 1)}
          onChange={(v) => update({ stepNumber: v })}
        />
      )}

      {shape.type === CUSTOM_SHAPE_TYPES.decisionGate && (
        <>
          <TextField
            label="Yes branch"
            value={String(props.yes ?? "")}
            onChange={(v) => update({ yes: v })}
          />
          <TextField
            label="No branch"
            value={String(props.no ?? "")}
            onChange={(v) => update({ no: v })}
          />
        </>
      )}

      {shape.type === CUSTOM_SHAPE_TYPES.milestone && (
        <TextField
          label="Date"
          value={String(props.date ?? "")}
          onChange={(v) => update({ date: v })}
          placeholder="e.g. Q3 2026"
        />
      )}

      {shape.type === CUSTOM_SHAPE_TYPES.orgNode && (
        <>
          <TextField
            label="Name"
            value={String(props.name ?? "")}
            onChange={(v) => update({ name: v })}
          />
          <TextField
            label="Role"
            value={String(props.role ?? "")}
            onChange={(v) => update({ role: v })}
          />
        </>
      )}

      {shape.type === CUSTOM_SHAPE_TYPES.swimlane && (
        <SelectField
          label="Orientation"
          value={String(props.orientation ?? "horizontal")}
          options={[
            { label: "Horizontal", value: "horizontal" },
            { label: "Vertical", value: "vertical" },
          ]}
          onChange={(v) => update({ orientation: v })}
        />
      )}

      {shape.type === CUSTOM_SHAPE_TYPES.titleBlock && (
        <TextField
          label="Subtitle"
          value={String(props.subtitle ?? "")}
          onChange={(v) => update({ subtitle: v })}
          multiline
        />
      )}

      {shape.type === CUSTOM_SHAPE_TYPES.callout && (
        <SelectField
          label="Tone"
          value={String(props.tone ?? "info")}
          options={[
            { label: "Info", value: "info" },
            { label: "Warning", value: "warning" },
            { label: "Success", value: "success" },
          ]}
          onChange={(v) => update({ tone: v })}
        />
      )}

      {shape.type === CUSTOM_SHAPE_TYPES.checklist && (
        <TextField
          label="Items (one per line)"
          value={String(props.items ?? "")}
          onChange={(v) => {
            const count = v.split("\n").length;
            const prev = String(props.checked ?? "");
            // Preserve existing check state; pad / trim to match new item count.
            const normalized = (prev + "0".repeat(count)).slice(0, count);
            update({ items: v, checked: normalized });
          }}
          multiline
        />
      )}

      {shape.type === CUSTOM_SHAPE_TYPES.table && (
        <TextField
          label="Rows (tab between cells, newline between rows)"
          value={String(props.cells ?? "")}
          onChange={(v) => update({ cells: v })}
          multiline
        />
      )}

      {shape.type === CUSTOM_SHAPE_TYPES.quote && (
        <>
          <TextField
            label="Author"
            value={String(props.author ?? "")}
            onChange={(v) => update({ author: v })}
          />
          <TextField
            label="Role"
            value={String(props.role ?? "")}
            onChange={(v) => update({ role: v })}
          />
        </>
      )}

      {shape.type === CUSTOM_SHAPE_TYPES.kpiStat && (
        <>
          <TextField
            label="Value"
            value={String(props.value ?? "")}
            onChange={(v) => update({ value: v })}
          />
          <TextField
            label="Delta"
            value={String(props.delta ?? "")}
            onChange={(v) => update({ delta: v })}
            placeholder="e.g. + 18%"
          />
          <SelectField
            label="Trend"
            value={String(props.trend ?? "up")}
            options={[
              { label: "Up", value: "up" },
              { label: "Flat", value: "flat" },
              { label: "Down", value: "down" },
            ]}
            onChange={(v) => update({ trend: v })}
          />
        </>
      )}

      {shape.type === CUSTOM_SHAPE_TYPES.sobject && (
        <>
          <TextField
            label="API name"
            value={String(props.apiName ?? "")}
            onChange={(v) => update({ apiName: v })}
            placeholder="e.g. Account, MyObject__c"
          />
          <SelectField
            label="Object type"
            value={String(props.sobjectType ?? "standard")}
            options={[
              { label: "Standard", value: "standard" },
              { label: "Custom", value: "custom" },
              { label: "External", value: "external" },
              { label: "Platform event", value: "platform" },
            ]}
            onChange={(v) => update({ sobjectType: v })}
          />
          <TextField
            label="Fields (one per line)"
            value={String(props.fields ?? "")}
            onChange={(v) => update({ fields: v })}
            placeholder="Name | type | flags | refTo"
            multiline
          />
          <div className="rounded-md border border-white/10 bg-white/[0.03] p-2 text-[11px] leading-snug text-white/55">
            <div className="mb-1 font-semibold text-white/75">Format</div>
            <code className="text-[10px] text-white/70">Name | type | flags | refTo</code>
            <div className="mt-2 text-white/55">
              Types: id, text, textarea, email, phone, url, number, currency,
              percent, date, datetime, time, picklist, multipicklist, checkbox,
              lookup, masterDetail, formula, autoNumber, rollup, geolocation.
            </div>
            <div className="mt-1 text-white/55">
              Flags: <code className="text-white/70">req</code>,{" "}
              <code className="text-white/70">unq</code>,{" "}
              <code className="text-white/70">ext</code>,{" "}
              <code className="text-white/70">pk</code>. refTo names another
              SObject (lookup / master-detail).
            </div>
          </div>
        </>
      )}

      <div className="mt-2 border-t border-white/10 pt-3 text-[11px] uppercase tracking-wider text-white/40">
        Tip
      </div>
      <p className="text-xs text-white/55">
        Use the top toolbar for colour, stroke, and text styling.
      </p>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
        {label}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="min-h-[48px] resize-y rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-brand-400"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-brand-400"
        />
      )}
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
        {label}
      </span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-brand-400"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-brand-400"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#1a1a2e]">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
