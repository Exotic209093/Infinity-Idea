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
import { withAlpha } from "./_styles";

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
