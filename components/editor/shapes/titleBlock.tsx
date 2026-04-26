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
