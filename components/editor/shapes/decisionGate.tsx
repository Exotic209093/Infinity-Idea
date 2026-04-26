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
import { gateLabel } from "./_styles";

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
