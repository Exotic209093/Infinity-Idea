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
import { parsePermRows } from "./_parsers";

export type PermissionMatrixShape = TLBaseShape<
  "permissionMatrix",
  {
    w: number;
    h: number;
    label: string;
    profile: string;
    // Each line: Object | C | R | U | D | X (Modify All, optional)
    // values: 1/0 (or yes/no) per column
    rows: string;
  }
>;

export class PermissionMatrixShapeUtil extends BaseBoxShapeUtil<PermissionMatrixShape> {
  static override type = CUSTOM_SHAPE_TYPES.permissionMatrix;
  static override props: RecordProps<PermissionMatrixShape> = {
    ...baseProps,
    profile: T.string,
    rows: T.string,
  };
  override getDefaultProps(): PermissionMatrixShape["props"] {
    return {
      w: 360,
      h: 220,
      label: "Object permissions",
      profile: "Sales User",
      rows: [
        "Account | 1 | 1 | 1 | 0 | 0",
        "Contact | 1 | 1 | 1 | 1 | 0",
        "Opportunity | 1 | 1 | 1 | 0 | 0",
        "Lead | 1 | 1 | 1 | 0 | 0",
      ].join("\n"),
    };
  }
  override getGeometry(shape: PermissionMatrixShape) {
    return baseGeometry(shape);
  }
  override onResize(shape: PermissionMatrixShape, info: TLResizeInfo<PermissionMatrixShape>) {
    return onResize(shape, info);
  }
  override component(shape: PermissionMatrixShape) {
    const rows = parsePermRows(shape.props.rows);
    return (
      <HTMLContainer
        style={{
          width: shape.props.w,
          height: shape.props.h,
          borderRadius: 14,
          background: "rgba(20,20,32,0.8)",
          border: "1px solid rgba(34,211,238,0.35)",
          overflow: "hidden",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            background:
              "linear-gradient(135deg, rgba(34,211,238,0.35), rgba(108,99,255,0.25))",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              color: "rgba(255,255,255,0.6)",
              fontWeight: 700,
            }}
          >
            {shape.props.label || "Permissions"}
          </div>
          <div style={{ marginTop: 2, fontSize: 14, fontWeight: 800 }}>
            {shape.props.profile || "—"}
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 12,
              tableLayout: "fixed",
            }}
          >
            <thead>
              <tr
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                  color: "rgba(255,255,255,0.55)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <th style={{ textAlign: "left", padding: "6px 10px", fontWeight: 700 }}>
                  Object
                </th>
                {(["C", "R", "U", "D", "X"] as const).map((c) => (
                  <th key={c} style={{ padding: "6px 4px", fontWeight: 700, width: 32 }}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={i}
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <td
                    style={{
                      padding: "6px 10px",
                      color: "rgba(255,255,255,0.9)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {r.object}
                  </td>
                  {[r.create, r.read, r.update, r.del, r.modifyAll].map((on, j) => (
                    <td key={j} style={{ padding: "4px", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          width: 18,
                          height: 18,
                          borderRadius: 5,
                          background: on ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.04)",
                          border: on
                            ? "1px solid rgba(52,211,153,0.55)"
                            : "1px solid rgba(255,255,255,0.08)",
                          alignItems: "center",
                          justifyContent: "center",
                          color: on ? "#34d399" : "rgba(255,255,255,0.25)",
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        {on ? "✓" : "·"}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </HTMLContainer>
    );
  }
  override indicator(shape: PermissionMatrixShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={14} />;
  }
}
