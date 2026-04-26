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
import { parseApprovalSteps } from "./_parsers";

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
