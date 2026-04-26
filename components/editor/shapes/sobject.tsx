"use client";

import {
  BaseBoxShapeUtil,
  HTMLContainer,
  T,
  type RecordProps,
  type TLBaseShape,
  type TLResizeInfo,
} from "tldraw";
import { CUSTOM_SHAPE_TYPES, SF_FIELD_FAMILIES } from "@/types/shapes";
import { baseProps, baseGeometry, onResize } from "./_common";
import { withAlpha, sobjectAccent, FlagBadge } from "./_styles";
import { parseSFFields } from "./_parsers";

export type SObjectShape = TLBaseShape<
  "sobject",
  {
    w: number;
    h: number;
    label: string;
    apiName: string;
    sobjectType: "standard" | "custom" | "external" | "platform";
    // Field lines, pipe-delimited:
    //   name | type | flags | refTo
    // flags = optional comma list of: req (required), unq (unique), ext (external-id), pk (primary key)
    // refTo = referenced object for lookup/masterDetail, e.g. "Account"
    fields: string;
  }
>;

export class SObjectShapeUtil extends BaseBoxShapeUtil<SObjectShape> {
  static override type = CUSTOM_SHAPE_TYPES.sobject;
  static override props: RecordProps<SObjectShape> = {
    ...baseProps,
    apiName: T.string,
    sobjectType: T.literalEnum("standard", "custom", "external", "platform"),
    fields: T.string,
  };
  override getDefaultProps(): SObjectShape["props"] {
    const defaultFields = [
      "Id | id | pk",
      "Name | text | req",
      "OwnerId | lookup | | User",
      "CreatedDate | datetime",
      "LastModifiedDate | datetime",
    ].join("\n");
    return {
      w: 320,
      h: 280,
      label: "Account",
      apiName: "Account",
      sobjectType: "standard",
      fields: defaultFields,
    };
  }
  override getGeometry(shape: SObjectShape) {
    return baseGeometry(shape);
  }
  override onResize(shape: SObjectShape, info: TLResizeInfo<SObjectShape>) {
    return onResize(shape, info);
  }
  override component(shape: SObjectShape) {
    const accent = sobjectAccent(shape.props.sobjectType);
    const fields = parseSFFields(shape.props.fields);
    const initial = (shape.props.label || "?").charAt(0).toUpperCase();
    const typeLabel =
      shape.props.sobjectType === "custom"
        ? "Custom"
        : shape.props.sobjectType === "external"
        ? "External"
        : shape.props.sobjectType === "platform"
        ? "Platform"
        : "Standard";
    return (
      <HTMLContainer
        style={{
          width: shape.props.w,
          height: shape.props.h,
          borderRadius: 14,
          background: "rgba(20,20,32,0.8)",
          border: `1px solid ${withAlpha(accent, 0.45)}`,
          overflow: "hidden",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          boxShadow: `0 4px 22px ${withAlpha(accent, 0.18)}`,
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: `linear-gradient(135deg, ${withAlpha(accent, 0.55)}, ${withAlpha(accent, 0.22)})`,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: `linear-gradient(135deg, ${accent}, #ec4899)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 14,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.15 }}>
              {shape.props.label || "Unnamed"}
            </div>
            <div
              style={{
                marginTop: 1,
                fontSize: 11,
                color: "rgba(255,255,255,0.65)",
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, monospace",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {shape.props.apiName || "API name"}
            </div>
          </div>
          <span
            style={{
              fontSize: 10,
              padding: "2px 7px",
              borderRadius: 999,
              background: "rgba(0,0,0,0.3)",
              color: "rgba(255,255,255,0.78)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.4,
              flexShrink: 0,
            }}
          >
            {typeLabel}
          </span>
        </div>
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "6px 10px 10px",
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, monospace",
          }}
        >
          {fields.length === 0 && (
            <div style={{ padding: 10, color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
              No fields
            </div>
          )}
          {fields.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 6px",
                borderBottom:
                  i === fields.length - 1
                    ? "none"
                    : "1px solid rgba(255,255,255,0.05)",
                fontSize: 12,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: SF_FIELD_FAMILIES[f.type],
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  flex: 1,
                  color: f.primaryKey ? "#fff" : "rgba(255,255,255,0.92)",
                  fontWeight: f.primaryKey ? 700 : 500,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {f.name || <em style={{ opacity: 0.4 }}>unnamed</em>}
              </span>
              <span
                style={{
                  fontSize: 10,
                  padding: "1px 6px",
                  borderRadius: 4,
                  background: withAlpha(SF_FIELD_FAMILIES[f.type], 0.18),
                  color: SF_FIELD_FAMILIES[f.type],
                  fontWeight: 700,
                  textTransform: "lowercase",
                  letterSpacing: 0.3,
                  whiteSpace: "nowrap",
                }}
              >
                {f.type}
                {f.refTo ? ` → ${f.refTo}` : ""}
              </span>
              {(f.required ||
                f.unique ||
                f.externalId ||
                f.pii ||
                f.encrypted ||
                f.indexed) && (
                <span style={{ display: "flex", gap: 3 }}>
                  {f.required && <FlagBadge>req</FlagBadge>}
                  {f.unique && <FlagBadge>unq</FlagBadge>}
                  {f.externalId && <FlagBadge>ext</FlagBadge>}
                  {f.pii && <FlagBadge tone="pink">pii</FlagBadge>}
                  {f.encrypted && <FlagBadge tone="cyan">enc</FlagBadge>}
                  {f.indexed && <FlagBadge tone="amber">idx</FlagBadge>}
                </span>
              )}
            </div>
          ))}
        </div>
      </HTMLContainer>
    );
  }
  override indicator(shape: SObjectShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={14} />;
  }
}
