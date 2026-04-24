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
    if (t === CUSTOM_SHAPE_TYPES.apexClass) return "Apex Class";
    if (t === CUSTOM_SHAPE_TYPES.flowElement) return "Flow Element";
    if (t === CUSTOM_SHAPE_TYPES.permissionMatrix) return "Permission Matrix";
    if (t === CUSTOM_SHAPE_TYPES.connectedApp) return "Connected App";
    if (t === CUSTOM_SHAPE_TYPES.relationshipLabel) return "Relationship";
    if (t === CUSTOM_SHAPE_TYPES.soqlQuery) return "SOQL Query";
    if (t === CUSTOM_SHAPE_TYPES.validationRule) return "Validation Rule";
    if (t === CUSTOM_SHAPE_TYPES.approvalProcess) return "Approval Process";
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
          <HelpCard title="Format">
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
              SObject.
            </div>
          </HelpCard>
        </>
      )}

      {shape.type === CUSTOM_SHAPE_TYPES.apexClass && (
        <>
          <TextField
            label="API name"
            value={String(props.apiName ?? "")}
            onChange={(v) => update({ apiName: v })}
          />
          <SelectField
            label="Kind"
            value={String(props.classKind ?? "class")}
            options={[
              { label: "Class", value: "class" },
              { label: "Trigger", value: "trigger" },
              { label: "Interface", value: "interface" },
              { label: "Enum", value: "enum" },
              { label: "Test class", value: "test" },
            ]}
            onChange={(v) => update({ classKind: v })}
          />
          <SelectField
            label="Visibility"
            value={String(props.visibility ?? "public")}
            options={[
              { label: "Public", value: "public" },
              { label: "Global", value: "global" },
              { label: "Private", value: "private" },
            ]}
            onChange={(v) => update({ visibility: v })}
          />
          <SelectField
            label="Sharing"
            value={String(props.sharing ?? "with")}
            options={[
              { label: "With sharing", value: "with" },
              { label: "Without sharing", value: "without" },
              { label: "Inherited", value: "inherited" },
              { label: "Not specified", value: "none" },
            ]}
            onChange={(v) => update({ sharing: v })}
          />
          <TextField
            label="Members (one per line)"
            value={String(props.members ?? "")}
            onChange={(v) => update({ members: v })}
            placeholder="name(args): Return | modifiers"
            multiline
          />
          <HelpCard title="Format">
            <code className="text-[10px] text-white/70">
              methodName(args): Return | modifiers
            </code>
            <div className="mt-2 text-white/55">
              Modifiers comma-separated:{" "}
              <code className="text-white/70">public</code>,{" "}
              <code className="text-white/70">global</code>,{" "}
              <code className="text-white/70">private</code>,{" "}
              <code className="text-white/70">static</code>,{" "}
              <code className="text-white/70">virtual</code>,{" "}
              <code className="text-white/70">override</code>,{" "}
              <code className="text-white/70">abstract</code>.
            </div>
          </HelpCard>
        </>
      )}

      {shape.type === CUSTOM_SHAPE_TYPES.flowElement && (
        <>
          <SelectField
            label="Element type"
            value={String(props.elementType ?? "decision")}
            options={[
              { label: "Start", value: "start" },
              { label: "End", value: "end" },
              { label: "Screen", value: "screen" },
              { label: "Decision", value: "decision" },
              { label: "Assignment", value: "assignment" },
              { label: "Create Record", value: "createRecord" },
              { label: "Update Record", value: "updateRecord" },
              { label: "Delete Record", value: "deleteRecord" },
              { label: "Get Records", value: "getRecords" },
              { label: "Action", value: "action" },
              { label: "Loop", value: "loop" },
              { label: "Subflow", value: "subflow" },
            ]}
            onChange={(v) => update({ elementType: v })}
          />
          <TextField
            label="Details"
            value={String(props.details ?? "")}
            onChange={(v) => update({ details: v })}
            multiline
          />
        </>
      )}

      {shape.type === CUSTOM_SHAPE_TYPES.permissionMatrix && (
        <>
          <TextField
            label="Profile / Permission set"
            value={String(props.profile ?? "")}
            onChange={(v) => update({ profile: v })}
          />
          <TextField
            label="Rows (one per line)"
            value={String(props.rows ?? "")}
            onChange={(v) => update({ rows: v })}
            placeholder="Object | C | R | U | D | X"
            multiline
          />
          <HelpCard title="Format">
            <code className="text-[10px] text-white/70">
              Object | C | R | U | D | X
            </code>
            <div className="mt-2 text-white/55">
              Use <code className="text-white/70">1</code> /{" "}
              <code className="text-white/70">0</code> (or yes/no) per column.
              Columns are Create, Read, Update, Delete, Modify All.
            </div>
          </HelpCard>
        </>
      )}

      {shape.type === CUSTOM_SHAPE_TYPES.connectedApp && (
        <>
          <TextField
            label="Description"
            value={String(props.description ?? "")}
            onChange={(v) => update({ description: v })}
            multiline
          />
          <SelectField
            label="Auth type"
            value={String(props.authType ?? "oauth2")}
            options={[
              { label: "OAuth 2.0", value: "oauth2" },
              { label: "JWT Bearer", value: "jwt" },
              { label: "SAML", value: "saml" },
              { label: "API Key", value: "apiKey" },
              { label: "Basic Auth", value: "basic" },
            ]}
            onChange={(v) => update({ authType: v })}
          />
          <TextField
            label="Endpoint"
            value={String(props.endpoint ?? "")}
            onChange={(v) => update({ endpoint: v })}
            placeholder="https://…"
          />
          <TextField
            label="Scopes (comma separated)"
            value={String(props.scopes ?? "")}
            onChange={(v) => update({ scopes: v })}
            placeholder="accounting.transactions, accounting.contacts"
          />
        </>
      )}

      {shape.type === CUSTOM_SHAPE_TYPES.relationshipLabel && (
        <>
          <SelectField
            label="Cardinality"
            value={String(props.cardinality ?? "1:N")}
            options={[
              { label: "1 : 1", value: "1:1" },
              { label: "1 : N", value: "1:N" },
              { label: "N : 1", value: "N:1" },
              { label: "N : N", value: "N:N" },
            ]}
            onChange={(v) => update({ cardinality: v })}
          />
          <SelectField
            label="Kind"
            value={String(props.kind ?? "lookup")}
            options={[
              { label: "Lookup", value: "lookup" },
              { label: "Master-Detail", value: "masterDetail" },
              { label: "Hierarchy", value: "hierarchy" },
              { label: "Junction", value: "junction" },
            ]}
            onChange={(v) => update({ kind: v })}
          />
        </>
      )}

      {shape.type === CUSTOM_SHAPE_TYPES.validationRule && (
        <>
          <TextField
            label="API name"
            value={String(props.apiName ?? "")}
            onChange={(v) => update({ apiName: v })}
          />
          <SelectField
            label="Active"
            value={props.active ? "true" : "false"}
            options={[
              { label: "Active", value: "true" },
              { label: "Inactive", value: "false" },
            ]}
            onChange={(v) => update({ active: v === "true" })}
          />
          <TextField
            label="Formula"
            value={String(props.formula ?? "")}
            onChange={(v) => update({ formula: v })}
            multiline
          />
          <TextField
            label="Error message"
            value={String(props.errorMessage ?? "")}
            onChange={(v) => update({ errorMessage: v })}
            multiline
          />
          <TextField
            label="Error display field"
            value={String(props.errorDisplayField ?? "")}
            onChange={(v) => update({ errorDisplayField: v })}
            placeholder="e.g. Name"
          />
        </>
      )}

      {shape.type === CUSTOM_SHAPE_TYPES.approvalProcess && (
        <>
          <TextField
            label="API name"
            value={String(props.apiName ?? "")}
            onChange={(v) => update({ apiName: v })}
          />
          <TextField
            label="Object"
            value={String(props.objectName ?? "")}
            onChange={(v) => update({ objectName: v })}
            placeholder="e.g. Opportunity"
          />
          <SelectField
            label="Active"
            value={props.active ? "true" : "false"}
            options={[
              { label: "Active", value: "true" },
              { label: "Inactive", value: "false" },
            ]}
            onChange={(v) => update({ active: v === "true" })}
          />
          <TextField
            label="Entry criteria"
            value={String(props.entryCriteria ?? "")}
            onChange={(v) => update({ entryCriteria: v })}
            multiline
          />
          <TextField
            label="Steps (one per line)"
            value={String(props.steps ?? "")}
            onChange={(v) => update({ steps: v })}
            placeholder="Step name | Approver | Criteria"
            multiline
          />
          <HelpCard title="Step format">
            <code className="text-[10px] text-white/70">
              Step name | Approver | Criteria
            </code>
            <div className="mt-2 text-white/55">
              Approver is shown next to the step number; criteria appears below
              it in monospace.
            </div>
          </HelpCard>
        </>
      )}

      {shape.type === CUSTOM_SHAPE_TYPES.soqlQuery && (
        <>
          <TextField
            label="Query"
            value={String(props.rawQuery ?? "")}
            onChange={(v) => update({ rawQuery: v })}
            multiline
          />
          <TextField
            label="From object"
            value={String(props.fromObject ?? "")}
            onChange={(v) => update({ fromObject: v })}
          />
          <TextField
            label="Fields (comma separated)"
            value={String(props.fields ?? "")}
            onChange={(v) => update({ fields: v })}
            multiline
          />
          <TextField
            label="Where"
            value={String(props.conditions ?? "")}
            onChange={(v) => update({ conditions: v })}
            multiline
          />
          <TextField
            label="Order by"
            value={String(props.orderBy ?? "")}
            onChange={(v) => update({ orderBy: v })}
          />
          <TextField
            label="Limit"
            value={String(props.limit ?? "")}
            onChange={(v) => update({ limit: v })}
            placeholder="e.g. 100"
          />
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

function HelpCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.03] p-2 text-[11px] leading-snug text-white/55">
      <div className="mb-1 font-semibold text-white/75">{title}</div>
      {children}
    </div>
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
