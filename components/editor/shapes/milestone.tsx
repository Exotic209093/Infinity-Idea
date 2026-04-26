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
import { blockShell, diamond } from "./_styles";

export type MilestoneShape = TLBaseShape<
  "milestone",
  { w: number; h: number; label: string; date: string }
>;

export class MilestoneShapeUtil extends BaseBoxShapeUtil<MilestoneShape> {
  static override type = CUSTOM_SHAPE_TYPES.milestone;
  static override props: RecordProps<MilestoneShape> = {
    ...baseProps,
    date: T.string,
  };
  override getDefaultProps(): MilestoneShape["props"] {
    return { w: 220, h: 100, label: "Milestone", date: "" };
  }
  override getGeometry(shape: MilestoneShape) {
    return baseGeometry(shape);
  }
  override onResize(shape: MilestoneShape, info: TLResizeInfo<MilestoneShape>) {
    return onResize(shape, info);
  }
  override component(shape: MilestoneShape) {
    return (
      <HTMLContainer style={blockShell(shape.props.w, shape.props.h, "#22d3ee")}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, height: "100%", padding: 16 }}>
          <div style={diamond("#22d3ee")} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{shape.props.label}</div>
            {shape.props.date && (
              <div style={{ marginTop: 4, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                {shape.props.date}
              </div>
            )}
          </div>
        </div>
      </HTMLContainer>
    );
  }
  override indicator(shape: MilestoneShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={16} />;
  }
}
