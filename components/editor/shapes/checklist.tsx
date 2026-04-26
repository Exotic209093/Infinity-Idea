"use client";

import {
  BaseBoxShapeUtil,
  HTMLContainer,
  T,
  type RecordProps,
  type TLBaseShape,
  type TLResizeInfo,
} from "tldraw";
import { CUSTOM_SHAPE_TYPES } from "@/types/shapes";
import { baseProps, baseGeometry, onResize } from "./_common";
import { parseChecklistItems, serializeChecklistItems } from "./_parsers";

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
