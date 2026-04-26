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
import { highlightSoql } from "./_soqlHighlight";

export type SOQLQueryShape = TLBaseShape<
  "soqlQuery",
  {
    w: number;
    h: number;
    label: string;
    // Original query text for the user-visible pretty-printed preview.
    rawQuery: string;
    // Extracted metadata, stored as separate fields so the shape round-trips
    // through the save file even when the parser is unavailable.
    fromObject: string;
    fields: string; // comma-separated
    conditions: string; // WHERE clause text
    orderBy: string;
    limit: string;
  }
>;

export class SOQLQueryShapeUtil extends BaseBoxShapeUtil<SOQLQueryShape> {
  static override type = CUSTOM_SHAPE_TYPES.soqlQuery;
  static override props: RecordProps<SOQLQueryShape> = {
    ...baseProps,
    rawQuery: T.string,
    fromObject: T.string,
    fields: T.string,
    conditions: T.string,
    orderBy: T.string,
    limit: T.string,
  };
  override getDefaultProps(): SOQLQueryShape["props"] {
    const q =
      "SELECT Id, Name, Email, AccountId\nFROM Contact\nWHERE Email != null\nORDER BY LastName\nLIMIT 100";
    return {
      w: 380,
      h: 220,
      label: "Query",
      rawQuery: q,
      fromObject: "Contact",
      fields: "Id, Name, Email, AccountId",
      conditions: "Email != null",
      orderBy: "LastName",
      limit: "100",
    };
  }
  override getGeometry(shape: SOQLQueryShape) {
    return baseGeometry(shape);
  }
  override onResize(shape: SOQLQueryShape, info: TLResizeInfo<SOQLQueryShape>) {
    return onResize(shape, info);
  }
  override component(shape: SOQLQueryShape) {
    const fieldList = shape.props.fields
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);
    return (
      <HTMLContainer
        style={{
          width: shape.props.w,
          height: shape.props.h,
          borderRadius: 14,
          background: "rgba(15,15,26,0.92)",
          border: "1px solid rgba(167,139,250,0.4)",
          overflow: "hidden",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 4px 22px rgba(167,139,250,0.2)",
        }}
      >
        <div
          style={{
            padding: "8px 12px",
            background:
              "linear-gradient(135deg, rgba(167,139,250,0.45), rgba(108,99,255,0.3))",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 0.8,
              color: "rgba(255,255,255,0.85)",
              textTransform: "uppercase",
            }}
          >
            SOQL
          </span>
          <span style={{ color: "rgba(255,255,255,0.4)" }}>·</span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}
          >
            {shape.props.fromObject || "—"}
          </span>
          {shape.props.limit && (
            <span
              style={{
                marginLeft: "auto",
                fontSize: 10,
                padding: "2px 7px",
                borderRadius: 999,
                background: "rgba(0,0,0,0.3)",
                color: "rgba(255,255,255,0.75)",
                fontWeight: 700,
                letterSpacing: 0.4,
              }}
            >
              LIMIT {shape.props.limit}
            </span>
          )}
        </div>
        <pre
          style={{
            flex: 1,
            margin: 0,
            padding: "10px 12px",
            fontSize: 12,
            lineHeight: 1.45,
            whiteSpace: "pre-wrap",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            color: "rgba(255,255,255,0.9)",
            overflow: "auto",
          }}
        >
          {highlightSoql(shape.props.rawQuery)}
        </pre>
        {fieldList.length > 0 && (
          <div
            style={{
              padding: "6px 12px 10px",
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {fieldList.map((f) => (
              <span
                key={f}
                style={{
                  fontSize: 10,
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.78)",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                }}
              >
                {f}
              </span>
            ))}
          </div>
        )}
      </HTMLContainer>
    );
  }
  override indicator(shape: SOQLQueryShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={14} />;
  }
}
