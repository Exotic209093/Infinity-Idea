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
