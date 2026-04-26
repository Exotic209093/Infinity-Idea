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
