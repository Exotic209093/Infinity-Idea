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
import { blockShell, numberBubble } from "./_styles";

export type ProcessStepShape = TLBaseShape<
  "processStep",
  { w: number; h: number; label: string; stepNumber: number; accent: string }
>;

export class ProcessStepShapeUtil extends BaseBoxShapeUtil<ProcessStepShape> {
  static override type = CUSTOM_SHAPE_TYPES.processStep;
  static override props: RecordProps<ProcessStepShape> = {
    ...baseProps,
    stepNumber: T.number,
    accent: T.string,
  };
  override getDefaultProps(): ProcessStepShape["props"] {
    return {
      w: 240,
      h: 110,
      label: "Describe this step",
      stepNumber: 1,
      accent: "#8b5cf6",
    };
  }
  override getGeometry(shape: ProcessStepShape) {
    return baseGeometry(shape);
  }
  override onResize(shape: ProcessStepShape, info: TLResizeInfo<ProcessStepShape>) {
    return onResize(shape, info);
  }
  override component(shape: ProcessStepShape) {
    return (
      <HTMLContainer style={blockShell(shape.props.w, shape.props.h, shape.props.accent)}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, height: "100%", padding: 16 }}>
          <div style={numberBubble(shape.props.accent)}>{shape.props.stepNumber}</div>
          <div style={{ flex: 1, fontSize: 16, lineHeight: 1.3, fontWeight: 600 }}>
            {shape.props.label}
          </div>
        </div>
      </HTMLContainer>
    );
  }
  override indicator(shape: ProcessStepShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={16} />;
  }
}
