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
