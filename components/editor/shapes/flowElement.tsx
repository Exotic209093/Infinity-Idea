"use client";

import {
  BaseBoxShapeUtil,
  HTMLContainer,
  T,
  type RecordProps,
  type TLBaseShape,
  type TLResizeInfo,
} from "tldraw";
import {
  CUSTOM_SHAPE_TYPES,
  FLOW_ELEMENT_TYPES,
  FLOW_ELEMENT_COLOURS,
  FLOW_ELEMENT_LABEL,
  type FlowElementType,
} from "@/types/shapes";
import { baseProps, baseGeometry, onResize } from "./_common";
import { withAlpha, flowGlyph } from "./_styles";

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
