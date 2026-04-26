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
import { parseTable } from "./_parsers";

export type TableShape = TLBaseShape<
  "table",
  {
    w: number;
    h: number;
    label: string;
    // Rows separated by '\n', cells within a row separated by '\t'.
    // First row is the header.
    cells: string;
  }
>;

export class TableShapeUtil extends BaseBoxShapeUtil<TableShape> {
  static override type = CUSTOM_SHAPE_TYPES.table;
  static override props: RecordProps<TableShape> = {
    ...baseProps,
    cells: T.string,
  };
  override getDefaultProps(): TableShape["props"] {
    const defaults = [
      ["Metric", "Q1", "Q2", "Q3"],
      ["Revenue", "$120k", "$145k", "$168k"],
      ["New clients", "8", "12", "15"],
      ["NPS", "62", "67", "71"],
    ];
    return {
      w: 480,
      h: 200,
      label: "",
      cells: defaults.map((r) => r.join("\t")).join("\n"),
    };
  }
  override getGeometry(shape: TableShape) {
    return baseGeometry(shape);
  }
  override onResize(shape: TableShape, info: TLResizeInfo<TableShape>) {
    return onResize(shape, info);
  }
  override component(shape: TableShape) {
    const rows = parseTable(shape.props.cells);
    const header = rows[0] ?? [];
    const body = rows.slice(1);
    const cols = Math.max(header.length, ...body.map((r) => r.length));
    return (
      <HTMLContainer
        style={{
          width: shape.props.w,
          height: shape.props.h,
          borderRadius: 14,
          background: "rgba(20,20,32,0.7)",
          border: "1px solid rgba(139,92,246,0.35)",
          overflow: "hidden",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <table
          style={{
            width: "100%",
            height: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
            tableLayout: "fixed",
          }}
        >
          <thead>
            <tr
              style={{
                background:
                  "linear-gradient(135deg, rgba(108,99,255,0.6), rgba(236,72,153,0.45))",
              }}
            >
              {Array.from({ length: cols }, (_, i) => (
                <th
                  key={i}
                  style={{
                    padding: "10px 12px",
                    textAlign: "left",
                    fontWeight: 700,
                    color: "#fff",
                    borderRight:
                      i < cols - 1 ? "1px solid rgba(255,255,255,0.15)" : "none",
                  }}
                >
                  {header[i] ?? ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, r) => (
              <tr
                key={r}
                style={{
                  background:
                    r % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                }}
              >
                {Array.from({ length: cols }, (_, c) => (
                  <td
                    key={c}
                    style={{
                      padding: "8px 12px",
                      borderTop: "1px solid rgba(255,255,255,0.08)",
                      borderRight:
                        c < cols - 1
                          ? "1px solid rgba(255,255,255,0.08)"
                          : "none",
                      color: "rgba(255,255,255,0.88)",
                    }}
                  >
                    {row[c] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </HTMLContainer>
    );
  }
  override indicator(shape: TableShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={14} />;
  }
}
