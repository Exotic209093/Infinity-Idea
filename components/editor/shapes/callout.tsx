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
import { blockShell } from "./_styles";

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
