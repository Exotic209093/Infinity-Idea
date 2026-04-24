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
import { CUSTOM_SHAPE_TYPES } from "@/types/shapes";

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
function splitItems(s: string): string[] {
  return s.split("\n");
}
function splitChecked(s: string): boolean[] {
  return s.split("").map((c) => c === "1");
}
function joinChecked(flags: boolean[]): string {
  return flags.map((b) => (b ? "1" : "0")).join("");
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
      checked: joinChecked(defaults.map(() => false)),
    };
  }
  override getGeometry(shape: ChecklistShape) {
    return baseGeometry(shape);
  }
  override onResize(shape: ChecklistShape, info: TLResizeInfo<ChecklistShape>) {
    return onResize(shape, info);
  }
  override component(shape: ChecklistShape) {
    const items = splitItems(shape.props.items);
    const flags = splitChecked(shape.props.checked);
    const toggle = (idx: number) => {
      const next = [...flags];
      next[idx] = !next[idx];
      this.editor.updateShape<ChecklistShape>({
        id: shape.id,
        type: shape.type,
        props: { checked: joinChecked(next) },
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
          {items.map((text, i) => (
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
                  border: flags[i]
                    ? "1px solid #22d3ee"
                    : "1px solid rgba(255,255,255,0.3)",
                  background: flags[i]
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
                aria-pressed={flags[i] ? "true" : "false"}
              >
                {flags[i] ? "✓" : ""}
              </button>
              <span
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: flags[i] ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.9)",
                  textDecoration: flags[i] ? "line-through" : "none",
                }}
              >
                {text || <em style={{ opacity: 0.4 }}>Empty item</em>}
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

function parseTable(cells: string): string[][] {
  return cells.split("\n").map((row) => row.split("\t"));
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
];
