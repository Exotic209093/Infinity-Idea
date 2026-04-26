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
import { blockShell, avatar } from "./_styles";

export type OrgNodeShape = TLBaseShape<
  "orgNode",
  { w: number; h: number; label: string; name: string; role: string }
>;

export class OrgNodeShapeUtil extends BaseBoxShapeUtil<OrgNodeShape> {
  static override type = CUSTOM_SHAPE_TYPES.orgNode;
  static override props: RecordProps<OrgNodeShape> = {
    ...baseProps,
    name: T.string,
    role: T.string,
  };
  override getDefaultProps(): OrgNodeShape["props"] {
    return { w: 220, h: 110, label: "", name: "Full Name", role: "Role / Title" };
  }
  override getGeometry(shape: OrgNodeShape) {
    return baseGeometry(shape);
  }
  override onResize(shape: OrgNodeShape, info: TLResizeInfo<OrgNodeShape>) {
    return onResize(shape, info);
  }
  override component(shape: OrgNodeShape) {
    const initials = shape.props.name
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
    return (
      <HTMLContainer style={blockShell(shape.props.w, shape.props.h, "#a855f7")}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, height: "100%", padding: 14 }}>
          <div style={avatar("#a855f7")}>{initials || "?"}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {shape.props.name}
            </div>
            <div style={{ marginTop: 2, fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
              {shape.props.role}
            </div>
          </div>
        </div>
      </HTMLContainer>
    );
  }
  override indicator(shape: OrgNodeShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={16} />;
  }
}
