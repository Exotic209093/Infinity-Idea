"use client";

import {
  BaseBoxShapeUtil,
  HTMLContainer,
  Rectangle2d,
  T,
  type Geometry2d,
  type RecordProps,
  type TLBaseShape,
  type TLResizeInfo,
  resizeBox,
} from "tldraw";
import {
  CUSTOM_SHAPE_TYPES,
  SF_FIELD_FAMILIES,
  SF_FIELD_TYPES,
  FLOW_ELEMENT_TYPES,
  FLOW_ELEMENT_COLOURS,
  FLOW_ELEMENT_LABEL,
  type FlowElementType,
  type SFFieldType,
} from "@/types/shapes";

/*
 * Each custom shape is a self-contained, first-class tldraw shape:
 * selectable, resizable, connectable, undoable, serializable.
 */

const baseProps = {
  w: T.number,
  h: T.number,
  label: T.string,
};

function baseGeometry(shape: { props: { w: number; h: number } }): Geometry2d {
  return new Rectangle2d({
    width: shape.props.w,
    height: shape.props.h,
    isFilled: true,
  });
}

function onResize<S extends TLBaseShape<string, { w: number; h: number }>>(
  shape: S,
  info: TLResizeInfo<S>,
) {
  return resizeBox(shape, info);
}

/* ---------- Process Step ---------- */

export type ProcessStepShape = TLBaseShape<
  "processStep",
  { w: number; h: number; label: string; stepNumber: number; accent: string }
>;

export class ProcessStepShapeUtil extends BaseBoxShapeUtil<ProcessStepShape> {
  static override type = CUSTOM_SHAPE_TYPES.processStep;
  static override props: RecordProps<ProcessStepShape> = {
    ...baseProps,
    stepNumber: T.number,
    accent: T.string,
  };
  override getDefaultProps(): ProcessStepShape["props"] {
    return {
      w: 240,
      h: 110,
      label: "Describe this step",
      stepNumber: 1,
      accent: "#8b5cf6",
    };
  }
  override getGeometry(shape: ProcessStepShape) {
    return baseGeometry(shape);
  }
  override onResize(shape: ProcessStepShape, info: TLResizeInfo<ProcessStepShape>) {
    return onResize(shape, info);
  }
  override component(shape: ProcessStepShape) {
    return (
      <HTMLContainer style={blockShell(shape.props.w, shape.props.h, shape.props.accent)}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, height: "100%", padding: 16 }}>
          <div style={numberBubble(shape.props.accent)}>{shape.props.stepNumber}</div>
          <div style={{ flex: 1, fontSize: 16, lineHeight: 1.3, fontWeight: 600 }}>
            {shape.props.label}
          </div>
        </div>
      </HTMLContainer>
    );
  }
  override indicator(shape: ProcessStepShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={16} />;
  }
}

/* ---------- Decision Gate ---------- */

export type DecisionGateShape = TLBaseShape<
  "decisionGate",
  { w: number; h: number; label: string; yes: string; no: string }
>;

export class DecisionGateShapeUtil extends BaseBoxShapeUtil<DecisionGateShape> {
  static override type = CUSTOM_SHAPE_TYPES.decisionGate;
  static override props: RecordProps<DecisionGateShape> = {
    ...baseProps,
    yes: T.string,
    no: T.string,
  };
  override getDefaultProps(): DecisionGateShape["props"] {
    return {
      w: 220,
      h: 160,
      label: "Decision?",
      yes: "Yes",
      no: "No",
    };
  }
  override getGeometry(shape: DecisionGateShape) {
    return baseGeometry(shape);
  }
  override onResize(shape: DecisionGateShape, info: TLResizeInfo<DecisionGateShape>) {
    return onResize(shape, info);
  }
  override component(shape: DecisionGateShape) {
    const { w, h, label, yes, no } = shape.props;
    return (
      <HTMLContainer style={{ width: w, height: h, position: "relative" }}>
        <svg
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          <defs>
            <linearGradient id={`dg-${shape.id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.22" />
            </linearGradient>
          </defs>
          <polygon
            points={`${w / 2},4 ${w - 4},${h / 2} ${w / 2},${h - 4} 4,${h / 2}`}
            fill={`url(#dg-${shape.id})`}
            stroke="#f59e0b"
            strokeWidth={1.5}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            color: "#fff",
            fontWeight: 700,
            fontSize: 16,
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          {label}
        </div>
        <div style={gateLabel("left")}>{no}</div>
        <div style={gateLabel("right")}>{yes}</div>
      </HTMLContainer>
    );
  }
  override indicator(shape: DecisionGateShape) {
    const { w, h } = shape.props;
    return (
      <polygon
        points={`${w / 2},0 ${w},${h / 2} ${w / 2},${h} 0,${h / 2}`}
      />
    );
  }
}

/* ---------- Milestone ---------- */

export type MilestoneShape = TLBaseShape<
  "milestone",
  { w: number; h: number; label: string; date: string }
>;

export class MilestoneShapeUtil extends BaseBoxShapeUtil<MilestoneShape> {
  static override type = CUSTOM_SHAPE_TYPES.milestone;
  static override props: RecordProps<MilestoneShape> = {
    ...baseProps,
    date: T.string,
  };
  override getDefaultProps(): MilestoneShape["props"] {
    return { w: 220, h: 100, label: "Milestone", date: "" };
  }
  override getGeometry(shape: MilestoneShape) {
    return baseGeometry(shape);
  }
  override onResize(shape: MilestoneShape, info: TLResizeInfo<MilestoneShape>) {
    return onResize(shape, info);
  }
  override component(shape: MilestoneShape) {
    return (
      <HTMLContainer style={blockShell(shape.props.w, shape.props.h, "#22d3ee")}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, height: "100%", padding: 16 }}>
          <div style={diamond("#22d3ee")} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{shape.props.label}</div>
            {shape.props.date && (
              <div style={{ marginTop: 4, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                {shape.props.date}
              </div>
            )}
          </div>
        </div>
      </HTMLContainer>
    );
  }
  override indicator(shape: MilestoneShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={16} />;
  }
}

/* ---------- Org Node ---------- */

export type OrgNodeShape = TLBaseShape<
  "orgNode",
  { w: number; h: number; label: string; name: string; role: string }
>;

export class OrgNodeShapeUtil extends BaseBoxShapeUtil<OrgNodeShape> {
  static override type = CUSTOM_SHAPE_TYPES.orgNode;
  static override props: RecordProps<OrgNodeShape> = {
    ...baseProps,
    name: T.string,
    role: T.string,
  };
  override getDefaultProps(): OrgNodeShape["props"] {
    return { w: 220, h: 110, label: "", name: "Full Name", role: "Role / Title" };
  }
  override getGeometry(shape: OrgNodeShape) {
    return baseGeometry(shape);
  }
  override onResize(shape: OrgNodeShape, info: TLResizeInfo<OrgNodeShape>) {
    return onResize(shape, info);
  }
  override component(shape: OrgNodeShape) {
    const initials = shape.props.name
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
    return (
      <HTMLContainer style={blockShell(shape.props.w, shape.props.h, "#a855f7")}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, height: "100%", padding: 14 }}>
          <div style={avatar("#a855f7")}>{initials || "?"}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {shape.props.name}
            </div>
            <div style={{ marginTop: 2, fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
              {shape.props.role}
            </div>
          </div>
        </div>
      </HTMLContainer>
    );
  }
  override indicator(shape: OrgNodeShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={16} />;
  }
}

/* ---------- Swimlane ---------- */

export type SwimlaneShape = TLBaseShape<
  "swimlane",
  { w: number; h: number; label: string; orientation: "horizontal" | "vertical" }
>;

export class SwimlaneShapeUtil extends BaseBoxShapeUtil<SwimlaneShape> {
  static override type = CUSTOM_SHAPE_TYPES.swimlane;
  static override props: RecordProps<SwimlaneShape> = {
    ...baseProps,
    orientation: T.literalEnum("horizontal", "vertical"),
  };
  override getDefaultProps(): SwimlaneShape["props"] {
    return { w: 560, h: 160, label: "Lane", orientation: "horizontal" };
  }
  override getGeometry(shape: SwimlaneShape) {
    return baseGeometry(shape);
  }
  override onResize(shape: SwimlaneShape, info: TLResizeInfo<SwimlaneShape>) {
    return onResize(shape, info);
  }
  override component(shape: SwimlaneShape) {
    const horizontal = shape.props.orientation === "horizontal";
    return (
      <HTMLContainer
        style={{
          width: shape.props.w,
          height: shape.props.h,
          borderRadius: 14,
          background: "rgba(139,92,246,0.06)",
          border: "1px dashed rgba(139,92,246,0.35)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            [horizontal ? "left" : "top"]: 0,
            [horizontal ? "top" : "left"]: 0,
            [horizontal ? "bottom" : "right"]: 0,
            width: horizontal ? 44 : "100%",
            height: horizontal ? "100%" : 44,
            background: "linear-gradient(135deg,#6c63ff,#ec4899)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: 1,
            textTransform: "uppercase",
            writingMode: horizontal ? "vertical-rl" : "horizontal-tb",
            transform: horizontal ? "rotate(180deg)" : undefined,
          }}
        >
          {shape.props.label}
        </div>
      </HTMLContainer>
    );
  }
  override indicator(shape: SwimlaneShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={14} />;
  }
}

/* ---------- Title Block ---------- */

export type TitleBlockShape = TLBaseShape<
  "titleBlock",
  { w: number; h: number; label: string; subtitle: string }
>;

export class TitleBlockShapeUtil extends BaseBoxShapeUtil<TitleBlockShape> {
  static override type = CUSTOM_SHAPE_TYPES.titleBlock;
  static override props: RecordProps<TitleBlockShape> = {
    ...baseProps,
    subtitle: T.string,
  };
  override getDefaultProps(): TitleBlockShape["props"] {
    return {
      w: 520,
      h: 200,
      label: "Document Title",
      subtitle: "A short description for your client",
    };
  }
  override getGeometry(shape: TitleBlockShape) {
    return baseGeometry(shape);
  }
  override onResize(shape: TitleBlockShape, info: TLResizeInfo<TitleBlockShape>) {
    return onResize(shape, info);
  }
  override component(shape: TitleBlockShape) {
    return (
      <HTMLContainer
        style={{
          width: shape.props.w,
          height: shape.props.h,
          borderRadius: 20,
          overflow: "hidden",
          background:
            "linear-gradient(135deg,#6c63ff 0%,#a855f7 50%,#ec4899 100%)",
          boxShadow: "0 12px 40px rgba(108,99,255,0.35)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 32,
          color: "#fff",
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.1 }}>
          {shape.props.label}
        </div>
        <div style={{ marginTop: 10, fontSize: 15, opacity: 0.88 }}>
          {shape.props.subtitle}
        </div>
      </HTMLContainer>
    );
  }
  override indicator(shape: TitleBlockShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={20} />;
  }
}

/* ---------- Callout ---------- */

export type CalloutShape = TLBaseShape<
  "callout",
  { w: number; h: number; label: string; tone: "info" | "warning" | "success" }
>;

export class CalloutShapeUtil extends BaseBoxShapeUtil<CalloutShape> {
  static override type = CUSTOM_SHAPE_TYPES.callout;
  static override props: RecordProps<CalloutShape> = {
    ...baseProps,
    tone: T.literalEnum("info", "warning", "success"),
  };
  override getDefaultProps(): CalloutShape["props"] {
    return { w: 300, h: 96, label: "Important note for the reader.", tone: "info" };
  }
  override getGeometry(shape: CalloutShape) {
    return baseGeometry(shape);
  }
  override onResize(shape: CalloutShape, info: TLResizeInfo<CalloutShape>) {
    return onResize(shape, info);
  }
  override component(shape: CalloutShape) {
    const toneColour =
      shape.props.tone === "warning"
        ? "#f59e0b"
        : shape.props.tone === "success"
        ? "#22d3ee"
        : "#8b5cf6";
    return (
      <HTMLContainer style={blockShell(shape.props.w, shape.props.h, toneColour)}>
        <div style={{ display: "flex", gap: 12, height: "100%", padding: 14 }}>
          <div
            style={{
              width: 4,
              borderRadius: 2,
              background: toneColour,
              alignSelf: "stretch",
            }}
          />
          <div style={{ flex: 1, fontSize: 14, lineHeight: 1.4, color: "rgba(255,255,255,0.92)" }}>
            {shape.props.label}
          </div>
        </div>
      </HTMLContainer>
    );
  }
  override indicator(shape: CalloutShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={12} />;
  }
}

/* ---------- Shared styles ---------- */

function blockShell(
  w: number,
  h: number,
  accent: string,
): React.CSSProperties {
  return {
    width: w,
    height: h,
    borderRadius: 16,
    background: "rgba(20,20,32,0.7)",
    border: `1px solid ${withAlpha(accent, 0.4)}`,
    boxShadow: `0 4px 20px ${withAlpha(accent, 0.18)}`,
    color: "#fff",
    overflow: "hidden",
  };
}

function numberBubble(accent: string): React.CSSProperties {
  return {
    width: 36,
    height: 36,
    borderRadius: 999,
    background: `linear-gradient(135deg, ${accent}, #ec4899)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    color: "#fff",
    flexShrink: 0,
  };
}

function diamond(accent: string): React.CSSProperties {
  return {
    width: 18,
    height: 18,
    background: accent,
    transform: "rotate(45deg)",
    borderRadius: 3,
    flexShrink: 0,
  };
}

function avatar(accent: string): React.CSSProperties {
  return {
    width: 44,
    height: 44,
    borderRadius: 999,
    background: `linear-gradient(135deg, ${accent}, #ec4899)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    color: "#fff",
    flexShrink: 0,
    fontSize: 14,
    letterSpacing: 0.5,
  };
}

function gateLabel(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    top: "50%",
    [side]: -4,
    transform: "translateY(-50%)",
    fontSize: 11,
    fontWeight: 700,
    color: "rgba(255,255,255,0.8)",
    background: "rgba(0,0,0,0.4)",
    padding: "2px 8px",
    borderRadius: 999,
    pointerEvents: "none",
  };
}

function withAlpha(hex: string, alpha: number): string {
  const bigint = parseInt(hex.replace("#", ""), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ---------- Checklist ---------- */

export type ChecklistShape = TLBaseShape<
  "checklist",
  {
    w: number;
    h: number;
    label: string;
    items: string;
    checked: string;
  }
>;

/*
 * Items and checked states are serialized as strings (newline-delimited items,
 * "1"/"0" flags) so the shape props remain primitive and round-trip cleanly.
 */
export type ParsedChecklistItem = { item: string; checked: boolean };

// If `checked` is shorter than the number of items (e.g., after a raw-text
// edit creates new items but doesn't pad the flag string), the missing flags
// default to `false` (unchecked). The "?? "0"" makes that explicit so callers
// don't trip on `undefined === "1"` evaluating to `false` silently.
export function parseChecklistItems(items: string, checked: string): ParsedChecklistItem[] {
  if (!items) return [];
  const itemList = items.split("\n");
  const flagList = checked.split("");
  return itemList.map((item, i) => ({
    item,
    checked: (flagList[i] ?? "0") === "1",
  }));
}

export function serializeChecklistItems(rows: ParsedChecklistItem[]): { items: string; checked: string } {
  return {
    items: rows.map((r) => r.item).join("\n"),
    checked: rows.map((r) => (r.checked ? "1" : "0")).join(""),
  };
}

export class ChecklistShapeUtil extends BaseBoxShapeUtil<ChecklistShape> {
  static override type = CUSTOM_SHAPE_TYPES.checklist;
  static override props: RecordProps<ChecklistShape> = {
    ...baseProps,
    items: T.string,
    checked: T.string,
  };
  override getDefaultProps(): ChecklistShape["props"] {
    const defaults = ["Kick-off meeting", "Share requirements", "Sign off"];
    return {
      w: 320,
      h: 180,
      label: "Onboarding checklist",
      items: defaults.join("\n"),
      checked: defaults.map(() => "0").join(""),
    };
  }
  override getGeometry(shape: ChecklistShape) {
    return baseGeometry(shape);
  }
  override onResize(shape: ChecklistShape, info: TLResizeInfo<ChecklistShape>) {
    return onResize(shape, info);
  }
  override component(shape: ChecklistShape) {
    const itemRows = parseChecklistItems(shape.props.items, shape.props.checked);
    const toggle = (idx: number) => {
      const next = itemRows.map((r, i) => (i === idx ? { ...r, checked: !r.checked } : r));
      this.editor.updateShape<ChecklistShape>({
        id: shape.id,
        type: shape.type,
        props: {
          ...shape.props,
          ...serializeChecklistItems(next),
        },
      });
    };
    return (
      <HTMLContainer
        style={{
          width: shape.props.w,
          height: shape.props.h,
          borderRadius: 16,
          background: "rgba(20,20,32,0.7)",
          border: "1px solid rgba(34,211,238,0.35)",
          boxShadow: "0 4px 20px rgba(34,211,238,0.1)",
          color: "#fff",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "14px 18px 8px", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
          {shape.props.label}
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "0 18px 14px" }}>
          {itemRows.map((row, i) => (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}
            >
              <button
                onPointerDown={(e) => {
                  e.stopPropagation();
                  toggle(i);
                }}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 5,
                  border: row.checked
                    ? "1px solid #22d3ee"
                    : "1px solid rgba(255,255,255,0.3)",
                  background: row.checked
                    ? "linear-gradient(135deg,#22d3ee,#6c63ff)"
                    : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#0b0b16",
                  fontWeight: 900,
                  fontSize: 12,
                  flexShrink: 0,
                }}
                aria-pressed={row.checked ? "true" : "false"}
              >
                {row.checked ? "✓" : ""}
              </button>
              <span
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: row.checked ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.9)",
                  textDecoration: row.checked ? "line-through" : "none",
                }}
              >
                {row.item || <em style={{ opacity: 0.4 }}>Empty item</em>}
              </span>
            </div>
          ))}
        </div>
      </HTMLContainer>
    );
  }
  override indicator(shape: ChecklistShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={16} />;
  }
}

/* ---------- Table ---------- */

export type TableShape = TLBaseShape<
  "table",
  {
    w: number;
    h: number;
    label: string;
    // Rows separated by '\n', cells within a row separated by '\t'.
    // First row is the header.
    cells: string;
  }
>;

export function parseTable(cells: string): string[][] {
  if (!cells) return [];
  return cells.split("\n").map((row) => row.split("\t"));
}

export function serializeTable(rows: string[][]): string {
  return rows.map((row) => row.join("\t")).join("\n");
}

export class TableShapeUtil extends BaseBoxShapeUtil<TableShape> {
  static override type = CUSTOM_SHAPE_TYPES.table;
  static override props: RecordProps<TableShape> = {
    ...baseProps,
    cells: T.string,
  };
  override getDefaultProps(): TableShape["props"] {
    const defaults = [
      ["Metric", "Q1", "Q2", "Q3"],
      ["Revenue", "$120k", "$145k", "$168k"],
      ["New clients", "8", "12", "15"],
      ["NPS", "62", "67", "71"],
    ];
    return {
      w: 480,
      h: 200,
      label: "",
      cells: defaults.map((r) => r.join("\t")).join("\n"),
    };
  }
  override getGeometry(shape: TableShape) {
    return baseGeometry(shape);
  }
  override onResize(shape: TableShape, info: TLResizeInfo<TableShape>) {
    return onResize(shape, info);
  }
  override component(shape: TableShape) {
    const rows = parseTable(shape.props.cells);
    const header = rows[0] ?? [];
    const body = rows.slice(1);
    const cols = Math.max(header.length, ...body.map((r) => r.length));
    return (
      <HTMLContainer
        style={{
          width: shape.props.w,
          height: shape.props.h,
          borderRadius: 14,
          background: "rgba(20,20,32,0.7)",
          border: "1px solid rgba(139,92,246,0.35)",
          overflow: "hidden",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <table
          style={{
            width: "100%",
            height: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
            tableLayout: "fixed",
          }}
        >
          <thead>
            <tr
              style={{
                background:
                  "linear-gradient(135deg, rgba(108,99,255,0.6), rgba(236,72,153,0.45))",
              }}
            >
              {Array.from({ length: cols }, (_, i) => (
                <th
                  key={i}
                  style={{
                    padding: "10px 12px",
                    textAlign: "left",
                    fontWeight: 700,
                    color: "#fff",
                    borderRight:
                      i < cols - 1 ? "1px solid rgba(255,255,255,0.15)" : "none",
                  }}
                >
                  {header[i] ?? ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, r) => (
              <tr
                key={r}
                style={{
                  background:
                    r % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                }}
              >
                {Array.from({ length: cols }, (_, c) => (
                  <td
                    key={c}
                    style={{
                      padding: "8px 12px",
                      borderTop: "1px solid rgba(255,255,255,0.08)",
                      borderRight:
                        c < cols - 1
                          ? "1px solid rgba(255,255,255,0.08)"
                          : "none",
                      color: "rgba(255,255,255,0.88)",
                    }}
                  >
                    {row[c] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </HTMLContainer>
    );
  }
  override indicator(shape: TableShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={14} />;
  }
}

/* ---------- Quote ---------- */

export type QuoteShape = TLBaseShape<
  "quote",
  { w: number; h: number; label: string; author: string; role: string }
>;

export class QuoteShapeUtil extends BaseBoxShapeUtil<QuoteShape> {
  static override type = CUSTOM_SHAPE_TYPES.quote;
  static override props: RecordProps<QuoteShape> = {
    ...baseProps,
    author: T.string,
    role: T.string,
  };
  override getDefaultProps(): QuoteShape["props"] {
    return {
      w: 420,
      h: 180,
      label:
        "This changed the way our whole team works. Onboarding that used to take a week now takes two hours.",
      author: "Taylor Kim",
      role: "Head of Operations",
    };
  }
  override getGeometry(shape: QuoteShape) {
    return baseGeometry(shape);
  }
  override onResize(shape: QuoteShape, info: TLResizeInfo<QuoteShape>) {
    return onResize(shape, info);
  }
  override component(shape: QuoteShape) {
    return (
      <HTMLContainer
        style={{
          width: shape.props.w,
          height: shape.props.h,
          borderRadius: 16,
          background: "rgba(20,20,32,0.7)",
          border: "1px solid rgba(236,72,153,0.35)",
          overflow: "hidden",
          display: "flex",
          color: "#fff",
        }}
      >
        <div
          style={{
            width: 6,
            alignSelf: "stretch",
            background: "linear-gradient(180deg,#a855f7,#ec4899)",
          }}
        />
        <div
          style={{
            flex: 1,
            padding: "18px 22px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 17,
              lineHeight: 1.45,
              fontStyle: "italic",
              fontWeight: 500,
              color: "rgba(255,255,255,0.95)",
            }}
          >
            &ldquo;{shape.props.label}&rdquo;
          </div>
          <div
            style={{ marginTop: 14, fontSize: 13, color: "rgba(255,255,255,0.7)" }}
          >
            — {shape.props.author}
            {shape.props.role && (
              <span style={{ color: "rgba(255,255,255,0.5)" }}>
                , {shape.props.role}
              </span>
            )}
          </div>
        </div>
      </HTMLContainer>
    );
  }
  override indicator(shape: QuoteShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={16} />;
  }
}

/* ---------- KPI Stat ---------- */

export type KpiStatShape = TLBaseShape<
  "kpiStat",
  {
    w: number;
    h: number;
    label: string;
    value: string;
    delta: string;
    trend: "up" | "down" | "flat";
  }
>;

export class KpiStatShapeUtil extends BaseBoxShapeUtil<KpiStatShape> {
  static override type = CUSTOM_SHAPE_TYPES.kpiStat;
  static override props: RecordProps<KpiStatShape> = {
    ...baseProps,
    value: T.string,
    delta: T.string,
    trend: T.literalEnum("up", "down", "flat"),
  };
  override getDefaultProps(): KpiStatShape["props"] {
    return {
      w: 240,
      h: 140,
      label: "Monthly active users",
      value: "12,480",
      delta: "+ 18%",
      trend: "up",
    };
  }
  override getGeometry(shape: KpiStatShape) {
    return baseGeometry(shape);
  }
  override onResize(shape: KpiStatShape, info: TLResizeInfo<KpiStatShape>) {
    return onResize(shape, info);
  }
  override component(shape: KpiStatShape) {
    const trendColour =
      shape.props.trend === "up"
        ? "#22d3ee"
        : shape.props.trend === "down"
        ? "#ec4899"
        : "rgba(255,255,255,0.55)";
    const trendGlyph =
      shape.props.trend === "up"
        ? "▲"
        : shape.props.trend === "down"
        ? "▼"
        : "—";
    return (
      <HTMLContainer
        style={{
          width: shape.props.w,
          height: shape.props.h,
          borderRadius: 16,
          background: "rgba(20,20,32,0.7)",
          border: "1px solid rgba(34,211,238,0.25)",
          padding: 18,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          color: "#fff",
          overflow: "hidden",
          boxShadow: "0 4px 18px rgba(34,211,238,0.1)",
        }}
      >
        <div
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: 0.6,
            color: "rgba(255,255,255,0.55)",
            fontWeight: 700,
          }}
        >
          {shape.props.label}
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: -0.5,
            background:
              "linear-gradient(135deg,#ffffff,rgba(255,255,255,0.78))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {shape.props.value}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 700,
            color: trendColour,
          }}
        >
          <span>{trendGlyph}</span>
          <span>{shape.props.delta}</span>
        </div>
      </HTMLContainer>
    );
  }
  override indicator(shape: KpiStatShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={16} />;
  }
}

/* ---------- Salesforce SObject ---------- */

export type SObjectShape = TLBaseShape<
  "sobject",
  {
    w: number;
    h: number;
    label: string;
    apiName: string;
    sobjectType: "standard" | "custom" | "external" | "platform";
    // Field lines, pipe-delimited:
    //   name | type | flags | refTo
    // flags = optional comma list of: req (required), unq (unique), ext (external-id), pk (primary key)
    // refTo = referenced object for lookup/masterDetail, e.g. "Account"
    fields: string;
  }
>;

export type ParsedSFField = {
  name: string;
  type: SFFieldType;
  required: boolean;
  unique: boolean;
  externalId: boolean;
  primaryKey: boolean;
  pii: boolean;
  encrypted: boolean;
  indexed: boolean;
  refTo: string;
};

// Tldraw re-invokes shape `component()` on every prop change, so a shape that
// is being dragged reparses its raw text props per pointer move even though
// the text itself didn't change. A simple string-keyed cache makes the lookup
// constant-time across drags and re-renders. Entries are safe because tldraw
// records are immutable; the same raw string always parses to the same value.
function memoByString<T>(fn: (raw: string) => T, max = 512): (raw: string) => T {
  const cache = new Map<string, T>();
  return (raw: string) => {
    const hit = cache.get(raw);
    if (hit !== undefined) return hit;
    const v = fn(raw);
    if (cache.size >= max) cache.clear();
    cache.set(raw, v);
    return v;
  };
}

export const parseSFFields = memoByString((raw: string): ParsedSFField[] =>
  raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [nameRaw = "", typeRaw = "text", flagsRaw = "", refToRaw = ""] =
        line.split("|").map((p) => p.trim());
      const type = (SF_FIELD_TYPES as readonly string[]).includes(typeRaw)
        ? (typeRaw as SFFieldType)
        : "text";
      const flags = flagsRaw
        .split(",")
        .map((f) => f.trim().toLowerCase())
        .filter(Boolean);
      return {
        name: nameRaw,
        type,
        required: flags.includes("req") || flags.includes("required"),
        unique: flags.includes("unq") || flags.includes("unique"),
        externalId: flags.includes("ext") || flags.includes("external-id"),
        primaryKey: flags.includes("pk") || flags.includes("primary"),
        pii: flags.includes("pii"),
        encrypted: flags.includes("enc") || flags.includes("encrypted"),
        indexed: flags.includes("idx") || flags.includes("indexed"),
        refTo: refToRaw,
      };
    }));

const SF_FLAG_ORDER: Array<keyof Pick<ParsedSFField, "required" | "unique" | "externalId" | "primaryKey" | "pii" | "encrypted" | "indexed">> = [
  "required",
  "unique",
  "externalId",
  "primaryKey",
  "pii",
  "encrypted",
  "indexed",
];

const SF_FLAG_TOKEN: Record<typeof SF_FLAG_ORDER[number], string> = {
  required: "req",
  unique: "unq",
  externalId: "ext",
  primaryKey: "pk",
  pii: "pii",
  encrypted: "enc",
  indexed: "idx",
};

export function serializeSFFields(rows: ParsedSFField[]): string {
  return rows
    .map((f) => {
      const flags = SF_FLAG_ORDER.filter((k) => f[k]).map((k) => SF_FLAG_TOKEN[k]).join(",");
      return [f.name, f.type, flags, f.refTo].join(" | ");
    })
    .join("\n");
}

function sobjectAccent(type: SObjectShape["props"]["sobjectType"]): string {
  switch (type) {
    case "custom":
      return "#ec4899";
    case "external":
      return "#f59e0b";
    case "platform":
      return "#22d3ee";
    case "standard":
    default:
      return "#8b5cf6";
  }
}

export class SObjectShapeUtil extends BaseBoxShapeUtil<SObjectShape> {
  static override type = CUSTOM_SHAPE_TYPES.sobject;
  static override props: RecordProps<SObjectShape> = {
    ...baseProps,
    apiName: T.string,
    sobjectType: T.literalEnum("standard", "custom", "external", "platform"),
    fields: T.string,
  };
  override getDefaultProps(): SObjectShape["props"] {
    const defaultFields = [
      "Id | id | pk",
      "Name | text | req",
      "OwnerId | lookup | | User",
      "CreatedDate | datetime",
      "LastModifiedDate | datetime",
    ].join("\n");
    return {
      w: 320,
      h: 280,
      label: "Account",
      apiName: "Account",
      sobjectType: "standard",
      fields: defaultFields,
    };
  }
  override getGeometry(shape: SObjectShape) {
    return baseGeometry(shape);
  }
  override onResize(shape: SObjectShape, info: TLResizeInfo<SObjectShape>) {
    return onResize(shape, info);
  }
  override component(shape: SObjectShape) {
    const accent = sobjectAccent(shape.props.sobjectType);
    const fields = parseSFFields(shape.props.fields);
    const initial = (shape.props.label || "?").charAt(0).toUpperCase();
    const typeLabel =
      shape.props.sobjectType === "custom"
        ? "Custom"
        : shape.props.sobjectType === "external"
        ? "External"
        : shape.props.sobjectType === "platform"
        ? "Platform"
        : "Standard";
    return (
      <HTMLContainer
        style={{
          width: shape.props.w,
          height: shape.props.h,
          borderRadius: 14,
          background: "rgba(20,20,32,0.8)",
          border: `1px solid ${withAlpha(accent, 0.45)}`,
          overflow: "hidden",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          boxShadow: `0 4px 22px ${withAlpha(accent, 0.18)}`,
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: `linear-gradient(135deg, ${withAlpha(accent, 0.55)}, ${withAlpha(accent, 0.22)})`,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: `linear-gradient(135deg, ${accent}, #ec4899)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 14,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.15 }}>
              {shape.props.label || "Unnamed"}
            </div>
            <div
              style={{
                marginTop: 1,
                fontSize: 11,
                color: "rgba(255,255,255,0.65)",
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, monospace",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {shape.props.apiName || "API name"}
            </div>
          </div>
          <span
            style={{
              fontSize: 10,
              padding: "2px 7px",
              borderRadius: 999,
              background: "rgba(0,0,0,0.3)",
              color: "rgba(255,255,255,0.78)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.4,
              flexShrink: 0,
            }}
          >
            {typeLabel}
          </span>
        </div>
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "6px 10px 10px",
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, monospace",
          }}
        >
          {fields.length === 0 && (
            <div style={{ padding: 10, color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
              No fields
            </div>
          )}
          {fields.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 6px",
                borderBottom:
                  i === fields.length - 1
                    ? "none"
                    : "1px solid rgba(255,255,255,0.05)",
                fontSize: 12,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: SF_FIELD_FAMILIES[f.type],
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  flex: 1,
                  color: f.primaryKey ? "#fff" : "rgba(255,255,255,0.92)",
                  fontWeight: f.primaryKey ? 700 : 500,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {f.name || <em style={{ opacity: 0.4 }}>unnamed</em>}
              </span>
              <span
                style={{
                  fontSize: 10,
                  padding: "1px 6px",
                  borderRadius: 4,
                  background: withAlpha(SF_FIELD_FAMILIES[f.type], 0.18),
                  color: SF_FIELD_FAMILIES[f.type],
                  fontWeight: 700,
                  textTransform: "lowercase",
                  letterSpacing: 0.3,
                  whiteSpace: "nowrap",
                }}
              >
                {f.type}
                {f.refTo ? ` → ${f.refTo}` : ""}
              </span>
              {(f.required ||
                f.unique ||
                f.externalId ||
                f.pii ||
                f.encrypted ||
                f.indexed) && (
                <span style={{ display: "flex", gap: 3 }}>
                  {f.required && <FlagBadge>req</FlagBadge>}
                  {f.unique && <FlagBadge>unq</FlagBadge>}
                  {f.externalId && <FlagBadge>ext</FlagBadge>}
                  {f.pii && <FlagBadge tone="pink">pii</FlagBadge>}
                  {f.encrypted && <FlagBadge tone="cyan">enc</FlagBadge>}
                  {f.indexed && <FlagBadge tone="amber">idx</FlagBadge>}
                </span>
              )}
            </div>
          ))}
        </div>
      </HTMLContainer>
    );
  }
  override indicator(shape: SObjectShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={14} />;
  }
}

function FlagBadge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "default" | "pink" | "cyan" | "amber";
}) {
  const palette: Record<string, { bg: string; fg: string }> = {
    default: { bg: "rgba(255,255,255,0.08)", fg: "rgba(255,255,255,0.7)" },
    pink: { bg: "rgba(236,72,153,0.18)", fg: "#fbcfe8" },
    cyan: { bg: "rgba(34,211,238,0.18)", fg: "#a5f3fc" },
    amber: { bg: "rgba(245,158,11,0.18)", fg: "#fde68a" },
  };
  const p = palette[tone ?? "default"];
  return (
    <span
      style={{
        fontSize: 9,
        padding: "1px 5px",
        borderRadius: 4,
        background: p.bg,
        color: p.fg,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 0.4,
      }}
    >
      {children}
    </span>
  );
}

/* ---------- Apex Class ---------- */

export type ApexClassShape = TLBaseShape<
  "apexClass",
  {
    w: number;
    h: number;
    label: string;
    apiName: string;
    classKind: "class" | "trigger" | "interface" | "enum" | "test";
    visibility: "public" | "global" | "private";
    sharing: "with" | "without" | "inherited" | "none";
    // Each line: name(args): Return | modifier(s)
    // modifiers comma-separated: public, global, private, static, override, virtual, abstract
    members: string;
  }
>;

export type ParsedApexMember = {
  signature: string;
  modifiers: string[];
};

export const parseApexMembers = memoByString(
  (raw: string): ParsedApexMember[] =>
    raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [sigRaw = "", modsRaw = ""] = line.split("|").map((p) => p.trim());
        return {
          signature: sigRaw,
          modifiers: modsRaw
            .split(",")
            .map((m) => m.trim().toLowerCase())
            .filter(Boolean),
        };
      }),
);

export function serializeApexMembers(rows: ParsedApexMember[]): string {
  return rows
    .map((m) => [m.signature, m.modifiers.join(", ")].join(" | "))
    .join("\n");
}

export class ApexClassShapeUtil extends BaseBoxShapeUtil<ApexClassShape> {
  static override type = CUSTOM_SHAPE_TYPES.apexClass;
  static override props: RecordProps<ApexClassShape> = {
    ...baseProps,
    apiName: T.string,
    classKind: T.literalEnum("class", "trigger", "interface", "enum", "test"),
    visibility: T.literalEnum("public", "global", "private"),
    sharing: T.literalEnum("with", "without", "inherited", "none"),
    members: T.string,
  };
  override getDefaultProps(): ApexClassShape["props"] {
    const defaults = [
      "createAccount(Account a): Id | public, static",
      "upsertContacts(List<Contact> cs): void | public",
      "sendWelcome(Id contactId): Boolean | private",
    ].join("\n");
    return {
      w: 320,
      h: 220,
      label: "AccountService",
      apiName: "AccountService",
      classKind: "class",
      visibility: "public",
      sharing: "with",
      members: defaults,
    };
  }
  override getGeometry(shape: ApexClassShape) {
    return baseGeometry(shape);
  }
  override onResize(shape: ApexClassShape, info: TLResizeInfo<ApexClassShape>) {
    return onResize(shape, info);
  }
  override component(shape: ApexClassShape) {
    const members = parseApexMembers(shape.props.members);
    const accent =
      shape.props.classKind === "trigger"
        ? "#f59e0b"
        : shape.props.classKind === "interface"
        ? "#22d3ee"
        : shape.props.classKind === "enum"
        ? "#a78bfa"
        : shape.props.classKind === "test"
        ? "#34d399"
        : "#8b5cf6";
    const sharingBadge =
      shape.props.sharing === "none" ? "" : `${shape.props.sharing} sharing`;
    return (
      <HTMLContainer
        style={{
          width: shape.props.w,
          height: shape.props.h,
          borderRadius: 14,
          background: "rgba(20,20,32,0.8)",
          border: `1px solid ${withAlpha(accent, 0.45)}`,
          overflow: "hidden",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          boxShadow: `0 4px 22px ${withAlpha(accent, 0.18)}`,
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            background: `linear-gradient(135deg, ${withAlpha(accent, 0.55)}, ${withAlpha(accent, 0.22)})`,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              color: "rgba(255,255,255,0.75)",
              fontWeight: 700,
            }}
          >
            <span>{shape.props.classKind}</span>
            <span style={{ color: "rgba(255,255,255,0.35)" }}>·</span>
            <span>{shape.props.visibility}</span>
            {sharingBadge && (
              <>
                <span style={{ color: "rgba(255,255,255,0.35)" }}>·</span>
                <span>{sharingBadge}</span>
              </>
            )}
          </div>
          <div
            style={{
              marginTop: 2,
              fontSize: 16,
              fontWeight: 800,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}
          >
            {shape.props.label || "Unnamed"}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "6px 10px 10px",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 11.5,
          }}
        >
          {members.length === 0 && (
            <div style={{ padding: 10, color: "rgba(255,255,255,0.4)" }}>
              No members
            </div>
          )}
          {members.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 4px",
                borderBottom:
                  i === members.length - 1
                    ? "none"
                    : "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <span
                style={{
                  color: "rgba(255,255,255,0.9)",
                  flex: 1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {m.signature}
              </span>
              <span style={{ display: "flex", gap: 3 }}>
                {m.modifiers.map((mod) => (
                  <span
                    key={mod}
                    style={{
                      fontSize: 9,
                      padding: "1px 5px",
                      borderRadius: 4,
                      background: withAlpha(accent, 0.2),
                      color: accent,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 0.3,
                    }}
                  >
                    {mod}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      </HTMLContainer>
    );
  }
  override indicator(shape: ApexClassShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={14} />;
  }
}

/* ---------- Flow Element ---------- */

export type FlowElementShape = TLBaseShape<
  "flowElement",
  {
    w: number;
    h: number;
    label: string;
    elementType: FlowElementType;
    details: string;
  }
>;

export class FlowElementShapeUtil extends BaseBoxShapeUtil<FlowElementShape> {
  static override type = CUSTOM_SHAPE_TYPES.flowElement;
  static override props: RecordProps<FlowElementShape> = {
    ...baseProps,
    elementType: T.literalEnum(...(FLOW_ELEMENT_TYPES as unknown as [FlowElementType])),
    details: T.string,
  };
  override getDefaultProps(): FlowElementShape["props"] {
    return {
      w: 220,
      h: 100,
      label: "Qualify lead",
      elementType: "decision",
      details: "If lead score > 75, route to sales.",
    };
  }
  override getGeometry(shape: FlowElementShape) {
    return baseGeometry(shape);
  }
  override onResize(shape: FlowElementShape, info: TLResizeInfo<FlowElementShape>) {
    return onResize(shape, info);
  }
  override component(shape: FlowElementShape) {
    const accent = FLOW_ELEMENT_COLOURS[shape.props.elementType];
    const typeLabel = FLOW_ELEMENT_LABEL[shape.props.elementType];
    const glyph = flowGlyph(shape.props.elementType);
    return (
      <HTMLContainer
        style={{
          width: shape.props.w,
          height: shape.props.h,
          borderRadius: 14,
          background: `linear-gradient(180deg, ${withAlpha(accent, 0.25)} 0%, rgba(20,20,32,0.85) 80%)`,
          border: `1px solid ${withAlpha(accent, 0.5)}`,
          overflow: "hidden",
          color: "#fff",
          display: "flex",
          padding: 12,
          gap: 10,
          boxShadow: `0 4px 22px ${withAlpha(accent, 0.18)}`,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: `linear-gradient(135deg, ${accent}, ${withAlpha(accent, 0.65)})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 15,
            color: "#0b0b16",
            flexShrink: 0,
          }}
        >
          {glyph}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              color: accent,
              fontWeight: 800,
            }}
          >
            {typeLabel}
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              marginTop: 2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {shape.props.label || "Unnamed"}
          </div>
          {shape.props.details && (
            <div
              style={{
                marginTop: 4,
                fontSize: 11.5,
                color: "rgba(255,255,255,0.65)",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {shape.props.details}
            </div>
          )}
        </div>
      </HTMLContainer>
    );
  }
  override indicator(shape: FlowElementShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={14} />;
  }
}

function flowGlyph(type: FlowElementType): string {
  switch (type) {
    case "start": return "▶";
    case "end": return "■";
    case "screen": return "⌘";
    case "decision": return "◆";
    case "assignment": return "=";
    case "createRecord": return "+";
    case "updateRecord": return "✎";
    case "deleteRecord": return "×";
    case "getRecords": return "⎙";
    case "action": return "⚡";
    case "loop": return "↻";
    case "subflow": return "↘";
    default: return "·";
  }
}

/* ---------- Permission Matrix ---------- */

export type PermissionMatrixShape = TLBaseShape<
  "permissionMatrix",
  {
    w: number;
    h: number;
    label: string;
    profile: string;
    // Each line: Object | C | R | U | D | X (Modify All, optional)
    // values: 1/0 (or yes/no) per column
    rows: string;
  }
>;

export type ParsedPermRow = {
  object: string;
  create: boolean;
  read: boolean;
  update: boolean;
  del: boolean;
  modifyAll: boolean;
};

function truthy(v: string): boolean {
  const s = v.trim().toLowerCase();
  return s === "1" || s === "y" || s === "yes" || s === "✓" || s === "true";
}

export const parsePermRows = memoByString(
  (raw: string): ParsedPermRow[] =>
    raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const cells = line.split("|").map((c) => c.trim());
        const [obj = "", c = "0", r = "0", u = "0", d = "0", x = "0"] = cells;
        return {
          object: obj,
          create: truthy(c),
          read: truthy(r),
          update: truthy(u),
          del: truthy(d),
          modifyAll: truthy(x),
        };
      }),
);

export function serializePermRows(rows: ParsedPermRow[]): string {
  const bit = (b: boolean) => (b ? "1" : "0");
  return rows
    .map((r) =>
      [r.object, bit(r.create), bit(r.read), bit(r.update), bit(r.del), bit(r.modifyAll)].join(" | "),
    )
    .join("\n");
}

export class PermissionMatrixShapeUtil extends BaseBoxShapeUtil<PermissionMatrixShape> {
  static override type = CUSTOM_SHAPE_TYPES.permissionMatrix;
  static override props: RecordProps<PermissionMatrixShape> = {
    ...baseProps,
    profile: T.string,
    rows: T.string,
  };
  override getDefaultProps(): PermissionMatrixShape["props"] {
    return {
      w: 360,
      h: 220,
      label: "Object permissions",
      profile: "Sales User",
      rows: [
        "Account | 1 | 1 | 1 | 0 | 0",
        "Contact | 1 | 1 | 1 | 1 | 0",
        "Opportunity | 1 | 1 | 1 | 0 | 0",
        "Lead | 1 | 1 | 1 | 0 | 0",
      ].join("\n"),
    };
  }
  override getGeometry(shape: PermissionMatrixShape) {
    return baseGeometry(shape);
  }
  override onResize(shape: PermissionMatrixShape, info: TLResizeInfo<PermissionMatrixShape>) {
    return onResize(shape, info);
  }
  override component(shape: PermissionMatrixShape) {
    const rows = parsePermRows(shape.props.rows);
    return (
      <HTMLContainer
        style={{
          width: shape.props.w,
          height: shape.props.h,
          borderRadius: 14,
          background: "rgba(20,20,32,0.8)",
          border: "1px solid rgba(34,211,238,0.35)",
          overflow: "hidden",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            background:
              "linear-gradient(135deg, rgba(34,211,238,0.35), rgba(108,99,255,0.25))",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              color: "rgba(255,255,255,0.6)",
              fontWeight: 700,
            }}
          >
            {shape.props.label || "Permissions"}
          </div>
          <div style={{ marginTop: 2, fontSize: 14, fontWeight: 800 }}>
            {shape.props.profile || "—"}
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 12,
              tableLayout: "fixed",
            }}
          >
            <thead>
              <tr
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                  color: "rgba(255,255,255,0.55)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <th style={{ textAlign: "left", padding: "6px 10px", fontWeight: 700 }}>
                  Object
                </th>
                {(["C", "R", "U", "D", "X"] as const).map((c) => (
                  <th key={c} style={{ padding: "6px 4px", fontWeight: 700, width: 32 }}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={i}
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <td
                    style={{
                      padding: "6px 10px",
                      color: "rgba(255,255,255,0.9)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {r.object}
                  </td>
                  {[r.create, r.read, r.update, r.del, r.modifyAll].map((on, j) => (
                    <td key={j} style={{ padding: "4px", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          width: 18,
                          height: 18,
                          borderRadius: 5,
                          background: on ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.04)",
                          border: on
                            ? "1px solid rgba(52,211,153,0.55)"
                            : "1px solid rgba(255,255,255,0.08)",
                          alignItems: "center",
                          justifyContent: "center",
                          color: on ? "#34d399" : "rgba(255,255,255,0.25)",
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        {on ? "✓" : "·"}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </HTMLContainer>
    );
  }
  override indicator(shape: PermissionMatrixShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={14} />;
  }
}

/* ---------- Connected App ---------- */

export type ConnectedAppShape = TLBaseShape<
  "connectedApp",
  {
    w: number;
    h: number;
    label: string;
    description: string;
    authType: "oauth2" | "jwt" | "saml" | "apiKey" | "basic";
    endpoint: string;
    scopes: string;
  }
>;

export class ConnectedAppShapeUtil extends BaseBoxShapeUtil<ConnectedAppShape> {
  static override type = CUSTOM_SHAPE_TYPES.connectedApp;
  static override props: RecordProps<ConnectedAppShape> = {
    ...baseProps,
    description: T.string,
    authType: T.literalEnum("oauth2", "jwt", "saml", "apiKey", "basic"),
    endpoint: T.string,
    scopes: T.string,
  };
  override getDefaultProps(): ConnectedAppShape["props"] {
    return {
      w: 320,
      h: 200,
      label: "Xero Sync",
      description: "Two-way sync between Salesforce and Xero accounting.",
      authType: "oauth2",
      endpoint: "https://api.xero.com",
      scopes: "accounting.transactions,accounting.contacts",
    };
  }
  override getGeometry(shape: ConnectedAppShape) {
    return baseGeometry(shape);
  }
  override onResize(shape: ConnectedAppShape, info: TLResizeInfo<ConnectedAppShape>) {
    return onResize(shape, info);
  }
  override component(shape: ConnectedAppShape) {
    const accent = "#22d3ee";
    const authLabel: Record<ConnectedAppShape["props"]["authType"], string> = {
      oauth2: "OAuth 2.0",
      jwt: "JWT Bearer",
      saml: "SAML",
      apiKey: "API Key",
      basic: "Basic Auth",
    };
    const scopeList = shape.props.scopes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return (
      <HTMLContainer
        style={{
          width: shape.props.w,
          height: shape.props.h,
          borderRadius: 14,
          background: "rgba(20,20,32,0.8)",
          border: `1px solid ${withAlpha(accent, 0.45)}`,
          overflow: "hidden",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          boxShadow: `0 4px 22px ${withAlpha(accent, 0.18)}`,
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            background: `linear-gradient(135deg, ${withAlpha(accent, 0.45)}, ${withAlpha(accent, 0.15)})`,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${accent}, #8b5cf6)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 16,
              color: "#0b0b16",
              flexShrink: 0,
            }}
          >
            ⇄
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.1 }}>
              {shape.props.label || "Connected app"}
            </div>
            <div
              style={{
                marginTop: 2,
                fontSize: 11,
                color: "rgba(255,255,255,0.65)",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {shape.props.endpoint || "no endpoint"}
            </div>
          </div>
          <span
            style={{
              fontSize: 10,
              padding: "3px 8px",
              borderRadius: 999,
              background: withAlpha(accent, 0.2),
              color: accent,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {authLabel[shape.props.authType]}
          </span>
        </div>
        <div style={{ padding: "10px 14px", fontSize: 12.5, color: "rgba(255,255,255,0.8)" }}>
          {shape.props.description}
        </div>
        {scopeList.length > 0 && (
          <div
            style={{
              padding: "0 14px 12px",
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
            }}
          >
            {scopeList.map((s) => (
              <span
                key={s}
                style={{
                  fontSize: 10,
                  padding: "2px 7px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.75)",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                }}
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </HTMLContainer>
    );
  }
  override indicator(shape: ConnectedAppShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={14} />;
  }
}

/* ---------- Relationship Label ---------- */

export type RelationshipLabelShape = TLBaseShape<
  "relationshipLabel",
  {
    w: number;
    h: number;
    label: string;
    cardinality: "1:1" | "1:N" | "N:1" | "N:N";
    kind: "lookup" | "masterDetail" | "hierarchy" | "junction";
  }
>;

export class RelationshipLabelShapeUtil extends BaseBoxShapeUtil<RelationshipLabelShape> {
  static override type = CUSTOM_SHAPE_TYPES.relationshipLabel;
  static override props: RecordProps<RelationshipLabelShape> = {
    ...baseProps,
    cardinality: T.literalEnum("1:1", "1:N", "N:1", "N:N"),
    kind: T.literalEnum("lookup", "masterDetail", "hierarchy", "junction"),
  };
  override getDefaultProps(): RelationshipLabelShape["props"] {
    return {
      w: 160,
      h: 52,
      label: "Account → Contact",
      cardinality: "1:N",
      kind: "lookup",
    };
  }
  override getGeometry(shape: RelationshipLabelShape) {
    return baseGeometry(shape);
  }
  override onResize(shape: RelationshipLabelShape, info: TLResizeInfo<RelationshipLabelShape>) {
    return onResize(shape, info);
  }
  override component(shape: RelationshipLabelShape) {
    const kindColour =
      shape.props.kind === "masterDetail"
        ? "#ec4899"
        : shape.props.kind === "hierarchy"
        ? "#f59e0b"
        : shape.props.kind === "junction"
        ? "#22d3ee"
        : "#8b5cf6";
    const kindLabel =
      shape.props.kind === "masterDetail"
        ? "Master-Detail"
        : shape.props.kind === "hierarchy"
        ? "Hierarchy"
        : shape.props.kind === "junction"
        ? "Junction"
        : "Lookup";
    return (
      <HTMLContainer
        style={{
          width: shape.props.w,
          height: shape.props.h,
          borderRadius: 999,
          background: "rgba(15,15,26,0.9)",
          border: `1px solid ${withAlpha(kindColour, 0.55)}`,
          overflow: "hidden",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 12px",
          boxShadow: `0 4px 18px ${withAlpha(kindColour, 0.25)}`,
        }}
      >
        <span
          style={{
            fontSize: 11,
            padding: "2px 8px",
            borderRadius: 999,
            background: kindColour,
            color: "#0b0b16",
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {shape.props.cardinality}
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {shape.props.label || "Relationship"}
          </div>
          <div
            style={{
              fontSize: 9.5,
              color: withAlpha(kindColour, 0.9),
              textTransform: "uppercase",
              letterSpacing: 0.4,
              fontWeight: 700,
            }}
          >
            {kindLabel}
          </div>
        </div>
      </HTMLContainer>
    );
  }
  override indicator(shape: RelationshipLabelShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={999} />;
  }
}

/* ---------- SOQL Query ---------- */

export type SOQLQueryShape = TLBaseShape<
  "soqlQuery",
  {
    w: number;
    h: number;
    label: string;
    // Original query text for the user-visible pretty-printed preview.
    rawQuery: string;
    // Extracted metadata, stored as separate fields so the shape round-trips
    // through the save file even when the parser is unavailable.
    fromObject: string;
    fields: string; // comma-separated
    conditions: string; // WHERE clause text
    orderBy: string;
    limit: string;
  }
>;

const SOQL_KEYWORDS = [
  "SELECT",
  "FROM",
  "WHERE",
  "AND",
  "OR",
  "NOT",
  "LIKE",
  "IN",
  "NULL",
  "NOT NULL",
  "ORDER BY",
  "GROUP BY",
  "HAVING",
  "LIMIT",
  "OFFSET",
  "ASC",
  "DESC",
  "NULLS FIRST",
  "NULLS LAST",
  "TRUE",
  "FALSE",
  "WITH",
  "FOR VIEW",
  "FOR REFERENCE",
  "FOR UPDATE",
];

const SOQL_KEYWORD_RE = new RegExp(
  `\\b(${SOQL_KEYWORDS.map((k) => k.replace(/\s+/g, "\\s+")).join("|")})\\b`,
  "gi",
);

function highlightSoql(query: string): React.ReactNode {
  // Simple syntax highlighter: split on tokens we know about and wrap them
  // in spans. The non-matching parts stay as plain text.
  if (!query) return null;
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  for (const m of query.matchAll(SOQL_KEYWORD_RE)) {
    const start = m.index ?? 0;
    if (start > lastIdx) parts.push(query.slice(lastIdx, start));
    parts.push(
      <span key={`${start}-${m[0]}`} style={{ color: "#a78bfa", fontWeight: 700 }}>
        {m[0]}
      </span>,
    );
    lastIdx = start + m[0].length;
  }
  if (lastIdx < query.length) parts.push(query.slice(lastIdx));
  return parts;
}

export class SOQLQueryShapeUtil extends BaseBoxShapeUtil<SOQLQueryShape> {
  static override type = CUSTOM_SHAPE_TYPES.soqlQuery;
  static override props: RecordProps<SOQLQueryShape> = {
    ...baseProps,
    rawQuery: T.string,
    fromObject: T.string,
    fields: T.string,
    conditions: T.string,
    orderBy: T.string,
    limit: T.string,
  };
  override getDefaultProps(): SOQLQueryShape["props"] {
    const q =
      "SELECT Id, Name, Email, AccountId\nFROM Contact\nWHERE Email != null\nORDER BY LastName\nLIMIT 100";
    return {
      w: 380,
      h: 220,
      label: "Query",
      rawQuery: q,
      fromObject: "Contact",
      fields: "Id, Name, Email, AccountId",
      conditions: "Email != null",
      orderBy: "LastName",
      limit: "100",
    };
  }
  override getGeometry(shape: SOQLQueryShape) {
    return baseGeometry(shape);
  }
  override onResize(shape: SOQLQueryShape, info: TLResizeInfo<SOQLQueryShape>) {
    return onResize(shape, info);
  }
  override component(shape: SOQLQueryShape) {
    const fieldList = shape.props.fields
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);
    return (
      <HTMLContainer
        style={{
          width: shape.props.w,
          height: shape.props.h,
          borderRadius: 14,
          background: "rgba(15,15,26,0.92)",
          border: "1px solid rgba(167,139,250,0.4)",
          overflow: "hidden",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 4px 22px rgba(167,139,250,0.2)",
        }}
      >
        <div
          style={{
            padding: "8px 12px",
            background:
              "linear-gradient(135deg, rgba(167,139,250,0.45), rgba(108,99,255,0.3))",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 0.8,
              color: "rgba(255,255,255,0.85)",
              textTransform: "uppercase",
            }}
          >
            SOQL
          </span>
          <span style={{ color: "rgba(255,255,255,0.4)" }}>·</span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}
          >
            {shape.props.fromObject || "—"}
          </span>
          {shape.props.limit && (
            <span
              style={{
                marginLeft: "auto",
                fontSize: 10,
                padding: "2px 7px",
                borderRadius: 999,
                background: "rgba(0,0,0,0.3)",
                color: "rgba(255,255,255,0.75)",
                fontWeight: 700,
                letterSpacing: 0.4,
              }}
            >
              LIMIT {shape.props.limit}
            </span>
          )}
        </div>
        <pre
          style={{
            flex: 1,
            margin: 0,
            padding: "10px 12px",
            fontSize: 12,
            lineHeight: 1.45,
            whiteSpace: "pre-wrap",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            color: "rgba(255,255,255,0.9)",
            overflow: "auto",
          }}
        >
          {highlightSoql(shape.props.rawQuery)}
        </pre>
        {fieldList.length > 0 && (
          <div
            style={{
              padding: "6px 12px 10px",
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {fieldList.map((f) => (
              <span
                key={f}
                style={{
                  fontSize: 10,
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.78)",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                }}
              >
                {f}
              </span>
            ))}
          </div>
        )}
      </HTMLContainer>
    );
  }
  override indicator(shape: SOQLQueryShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={14} />;
  }
}

/* ---------- Validation Rule ---------- */

export type ValidationRuleShape = TLBaseShape<
  "validationRule",
  {
    w: number;
    h: number;
    label: string;
    apiName: string;
    active: boolean;
    errorMessage: string;
    formula: string;
    errorDisplayField: string;
  }
>;

export class ValidationRuleShapeUtil extends BaseBoxShapeUtil<ValidationRuleShape> {
  static override type = CUSTOM_SHAPE_TYPES.validationRule;
  static override props: RecordProps<ValidationRuleShape> = {
    ...baseProps,
    apiName: T.string,
    active: T.boolean,
    errorMessage: T.string,
    formula: T.string,
    errorDisplayField: T.string,
  };
  override getDefaultProps(): ValidationRuleShape["props"] {
    return {
      w: 360,
      h: 220,
      label: "Name is required",
      apiName: "Name_Is_Required",
      active: true,
      errorMessage: "Please enter a Name.",
      formula: "ISBLANK( Name )",
      errorDisplayField: "Name",
    };
  }
  override getGeometry(shape: ValidationRuleShape) {
    return baseGeometry(shape);
  }
  override onResize(shape: ValidationRuleShape, info: TLResizeInfo<ValidationRuleShape>) {
    return onResize(shape, info);
  }
  override component(shape: ValidationRuleShape) {
    const accent = shape.props.active ? "#f59e0b" : "rgba(255,255,255,0.35)";
    return (
      <HTMLContainer
        style={{
          width: shape.props.w,
          height: shape.props.h,
          borderRadius: 14,
          background: "rgba(20,20,32,0.85)",
          border: `1px solid ${withAlpha(accent, 0.45)}`,
          overflow: "hidden",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          boxShadow: `0 4px 22px ${withAlpha(accent, 0.18)}`,
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            background: `linear-gradient(135deg, ${withAlpha(accent, 0.45)}, ${withAlpha(accent, 0.18)})`,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${accent}, #ec4899)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0b0b16",
              fontWeight: 800,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            !
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.15 }}>
              {shape.props.label || "Validation rule"}
            </div>
            <div
              style={{
                marginTop: 2,
                fontSize: 11,
                color: "rgba(255,255,255,0.65)",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {shape.props.apiName}
            </div>
          </div>
          <span
            style={{
              fontSize: 10,
              padding: "2px 7px",
              borderRadius: 999,
              background: shape.props.active
                ? "rgba(52,211,153,0.2)"
                : "rgba(255,255,255,0.06)",
              color: shape.props.active ? "#34d399" : "rgba(255,255,255,0.55)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              flexShrink: 0,
            }}
          >
            {shape.props.active ? "Active" : "Inactive"}
          </span>
        </div>
        <div style={{ padding: 12, flex: 1, display: "flex", flexDirection: "column", gap: 8, overflow: "hidden" }}>
          <div>
            <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: 0.6, color: "rgba(255,255,255,0.45)", fontWeight: 700, marginBottom: 3 }}>
              Formula
            </div>
            <pre
              style={{
                margin: 0,
                padding: "6px 8px",
                fontSize: 11.5,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                color: "rgba(255,255,255,0.92)",
                background: "rgba(0,0,0,0.35)",
                borderRadius: 6,
                whiteSpace: "pre-wrap",
                overflow: "auto",
                maxHeight: 80,
              }}
            >
              {shape.props.formula || "—"}
            </pre>
          </div>
          {shape.props.errorMessage && (
            <div
              style={{
                fontSize: 11.5,
                lineHeight: 1.4,
                color: "#fde68a",
                background: "rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.3)",
                borderRadius: 6,
                padding: "6px 8px",
              }}
            >
              {shape.props.errorMessage}
              {shape.props.errorDisplayField && (
                <div style={{ marginTop: 2, fontSize: 10, color: "rgba(245,158,11,0.7)" }}>
                  → shows on {shape.props.errorDisplayField}
                </div>
              )}
            </div>
          )}
        </div>
      </HTMLContainer>
    );
  }
  override indicator(shape: ValidationRuleShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={14} />;
  }
}

/* ---------- Approval Process ---------- */

export type ApprovalProcessShape = TLBaseShape<
  "approvalProcess",
  {
    w: number;
    h: number;
    label: string;
    apiName: string;
    active: boolean;
    objectName: string;
    entryCriteria: string;
    // Each line = a step, '|' delimited:
    // Name | Approver | Criteria
    steps: string;
  }
>;

export type ParsedApprovalStep = {
  name: string;
  approver: string;
  criteria: string;
};

export const parseApprovalSteps = memoByString(
  (raw: string): ParsedApprovalStep[] =>
    raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        // Take the first two pipe-separated tokens as name/approver, then
        // rejoin the remainder as criteria so embedded pipes (`|`) survive
        // round-trip. Single-pipe and zero-pipe inputs work the same as before.
        const parts = line.split("|").map((p) => p.trim());
        const [name = "", approver = "", ...rest] = parts;
        const criteria = rest.join(" | ");
        return { name, approver, criteria };
      }),
);

export function serializeApprovalSteps(rows: ParsedApprovalStep[]): string {
  return rows
    .map((s) => [s.name, s.approver, s.criteria].join(" | "))
    .join("\n");
}

export class ApprovalProcessShapeUtil extends BaseBoxShapeUtil<ApprovalProcessShape> {
  static override type = CUSTOM_SHAPE_TYPES.approvalProcess;
  static override props: RecordProps<ApprovalProcessShape> = {
    ...baseProps,
    apiName: T.string,
    active: T.boolean,
    objectName: T.string,
    entryCriteria: T.string,
    steps: T.string,
  };
  override getDefaultProps(): ApprovalProcessShape["props"] {
    return {
      w: 360,
      h: 280,
      label: "Discount approval",
      apiName: "Discount_Approval",
      active: true,
      objectName: "Opportunity",
      entryCriteria: "Discount__c > 0.10",
      steps: [
        "Manager review | Sales Manager | Discount__c <= 0.20",
        "Director review | Sales Director | Discount__c > 0.20",
        "VP review | VP Sales | Discount__c > 0.30",
      ].join("\n"),
    };
  }
  override getGeometry(shape: ApprovalProcessShape) {
    return baseGeometry(shape);
  }
  override onResize(shape: ApprovalProcessShape, info: TLResizeInfo<ApprovalProcessShape>) {
    return onResize(shape, info);
  }
  override component(shape: ApprovalProcessShape) {
    const accent = "#a78bfa";
    const steps = parseApprovalSteps(shape.props.steps);
    return (
      <HTMLContainer
        style={{
          width: shape.props.w,
          height: shape.props.h,
          borderRadius: 14,
          background: "rgba(20,20,32,0.85)",
          border: `1px solid ${withAlpha(accent, 0.45)}`,
          overflow: "hidden",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          boxShadow: `0 4px 22px ${withAlpha(accent, 0.18)}`,
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            background: `linear-gradient(135deg, ${withAlpha(accent, 0.45)}, ${withAlpha(accent, 0.18)})`,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 0.6, color: "rgba(255,255,255,0.65)", fontWeight: 700 }}>
              Approval · {shape.props.objectName || "—"}
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, marginTop: 2 }}>
              {shape.props.label || "Approval process"}
            </div>
          </div>
          <span
            style={{
              fontSize: 10,
              padding: "2px 7px",
              borderRadius: 999,
              background: shape.props.active
                ? "rgba(52,211,153,0.2)"
                : "rgba(255,255,255,0.06)",
              color: shape.props.active ? "#34d399" : "rgba(255,255,255,0.55)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              flexShrink: 0,
            }}
          >
            {shape.props.active ? "Active" : "Inactive"}
          </span>
        </div>
        <div style={{ padding: 12, flex: 1, overflow: "auto" }}>
          {shape.props.entryCriteria && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: 0.6, color: "rgba(255,255,255,0.45)", fontWeight: 700, marginBottom: 3 }}>
                Enters when
              </div>
              <code
                style={{
                  fontSize: 11,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  background: "rgba(0,0,0,0.3)",
                  padding: "4px 7px",
                  borderRadius: 5,
                  display: "inline-block",
                  color: "rgba(255,255,255,0.85)",
                }}
              >
                {shape.props.entryCriteria}
              </code>
            </div>
          )}
          {steps.map((s, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "6px 0",
                borderBottom:
                  i === steps.length - 1
                    ? "none"
                    : "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  background: `linear-gradient(135deg, ${accent}, #ec4899)`,
                  color: "#0b0b16",
                  fontSize: 11,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>
                  {s.name}
                </div>
                {s.approver && (
                  <div style={{ fontSize: 11, color: withAlpha(accent, 0.95) }}>
                    → {s.approver}
                  </div>
                )}
                {s.criteria && (
                  <div
                    style={{
                      fontSize: 10.5,
                      color: "rgba(255,255,255,0.55)",
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                      marginTop: 2,
                    }}
                  >
                    {s.criteria}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </HTMLContainer>
    );
  }
  override indicator(shape: ApprovalProcessShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={14} />;
  }
}

export const customShapeUtils = [
  ProcessStepShapeUtil,
  DecisionGateShapeUtil,
  MilestoneShapeUtil,
  OrgNodeShapeUtil,
  SwimlaneShapeUtil,
  TitleBlockShapeUtil,
  CalloutShapeUtil,
  ChecklistShapeUtil,
  TableShapeUtil,
  QuoteShapeUtil,
  KpiStatShapeUtil,
  SObjectShapeUtil,
  ApexClassShapeUtil,
  FlowElementShapeUtil,
  PermissionMatrixShapeUtil,
  ConnectedAppShapeUtil,
  RelationshipLabelShapeUtil,
  SOQLQueryShapeUtil,
  ValidationRuleShapeUtil,
  ApprovalProcessShapeUtil,
];
