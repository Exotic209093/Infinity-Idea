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

export type RelationshipLabelShape = TLBaseShape<
  "relationshipLabel",
  {
    w: number;
    h: number;
    label: string;
    cardinality: "1:1" | "1:N" | "N:1" | "N:N";
    kind: "lookup" | "masterDetail" | "hierarchy" | "junction";
  }
>;

export class RelationshipLabelShapeUtil extends BaseBoxShapeUtil<RelationshipLabelShape> {
  static override type = CUSTOM_SHAPE_TYPES.relationshipLabel;
  static override props: RecordProps<RelationshipLabelShape> = {
    ...baseProps,
    cardinality: T.literalEnum("1:1", "1:N", "N:1", "N:N"),
    kind: T.literalEnum("lookup", "masterDetail", "hierarchy", "junction"),
  };
  override getDefaultProps(): RelationshipLabelShape["props"] {
    return {
      w: 160,
      h: 52,
      label: "Account → Contact",
      cardinality: "1:N",
      kind: "lookup",
    };
  }
  override getGeometry(shape: RelationshipLabelShape) {
    return baseGeometry(shape);
  }
  override onResize(shape: RelationshipLabelShape, info: TLResizeInfo<RelationshipLabelShape>) {
    return onResize(shape, info);
  }
  override component(shape: RelationshipLabelShape) {
    const kindColour =
      shape.props.kind === "masterDetail"
        ? "#ec4899"
        : shape.props.kind === "hierarchy"
        ? "#f59e0b"
        : shape.props.kind === "junction"
        ? "#22d3ee"
        : "#8b5cf6";
    const kindLabel =
      shape.props.kind === "masterDetail"
        ? "Master-Detail"
        : shape.props.kind === "hierarchy"
        ? "Hierarchy"
        : shape.props.kind === "junction"
        ? "Junction"
        : "Lookup";
    return (
      <HTMLContainer
        style={{
          width: shape.props.w,
          height: shape.props.h,
          borderRadius: 999,
          background: "rgba(15,15,26,0.9)",
          border: `1px solid ${withAlpha(kindColour, 0.55)}`,
          overflow: "hidden",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 12px",
          boxShadow: `0 4px 18px ${withAlpha(kindColour, 0.25)}`,
        }}
      >
        <span
          style={{
            fontSize: 11,
            padding: "2px 8px",
            borderRadius: 999,
            background: kindColour,
            color: "#0b0b16",
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {shape.props.cardinality}
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {shape.props.label || "Relationship"}
          </div>
          <div
            style={{
              fontSize: 9.5,
              color: withAlpha(kindColour, 0.9),
              textTransform: "uppercase",
              letterSpacing: 0.4,
              fontWeight: 700,
            }}
          >
            {kindLabel}
          </div>
        </div>
      </HTMLContainer>
    );
  }
  override indicator(shape: RelationshipLabelShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={999} />;
  }
}
