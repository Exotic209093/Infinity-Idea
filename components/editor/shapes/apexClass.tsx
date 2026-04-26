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
import { parseApexMembers } from "./_parsers";

export type ApexClassShape = TLBaseShape<
  "apexClass",
  {
    w: number;
    h: number;
    label: string;
    apiName: string;
    classKind: "class" | "trigger" | "interface" | "enum" | "test";
    visibility: "public" | "global" | "private";
    sharing: "with" | "without" | "inherited" | "none";
    // Each line: name(args): Return | modifier(s)
    // modifiers comma-separated: public, global, private, static, override, virtual, abstract
    members: string;
  }
>;

export class ApexClassShapeUtil extends BaseBoxShapeUtil<ApexClassShape> {
  static override type = CUSTOM_SHAPE_TYPES.apexClass;
  static override props: RecordProps<ApexClassShape> = {
    ...baseProps,
    apiName: T.string,
    classKind: T.literalEnum("class", "trigger", "interface", "enum", "test"),
    visibility: T.literalEnum("public", "global", "private"),
    sharing: T.literalEnum("with", "without", "inherited", "none"),
    members: T.string,
  };
  override getDefaultProps(): ApexClassShape["props"] {
    const defaults = [
      "createAccount(Account a): Id | public, static",
      "upsertContacts(List<Contact> cs): void | public",
      "sendWelcome(Id contactId): Boolean | private",
    ].join("\n");
    return {
      w: 320,
      h: 220,
      label: "AccountService",
      apiName: "AccountService",
      classKind: "class",
      visibility: "public",
      sharing: "with",
      members: defaults,
    };
  }
  override getGeometry(shape: ApexClassShape) {
    return baseGeometry(shape);
  }
  override onResize(shape: ApexClassShape, info: TLResizeInfo<ApexClassShape>) {
    return onResize(shape, info);
  }
  override component(shape: ApexClassShape) {
    const members = parseApexMembers(shape.props.members);
    const accent =
      shape.props.classKind === "trigger"
        ? "#f59e0b"
        : shape.props.classKind === "interface"
        ? "#22d3ee"
        : shape.props.classKind === "enum"
        ? "#a78bfa"
        : shape.props.classKind === "test"
        ? "#34d399"
        : "#8b5cf6";
    const sharingBadge =
      shape.props.sharing === "none" ? "" : `${shape.props.sharing} sharing`;
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
            background: `linear-gradient(135deg, ${withAlpha(accent, 0.55)}, ${withAlpha(accent, 0.22)})`,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              color: "rgba(255,255,255,0.75)",
              fontWeight: 700,
            }}
          >
            <span>{shape.props.classKind}</span>
            <span style={{ color: "rgba(255,255,255,0.35)" }}>·</span>
            <span>{shape.props.visibility}</span>
            {sharingBadge && (
              <>
                <span style={{ color: "rgba(255,255,255,0.35)" }}>·</span>
                <span>{sharingBadge}</span>
              </>
            )}
          </div>
          <div
            style={{
              marginTop: 2,
              fontSize: 16,
              fontWeight: 800,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}
          >
            {shape.props.label || "Unnamed"}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "6px 10px 10px",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 11.5,
          }}
        >
          {members.length === 0 && (
            <div style={{ padding: 10, color: "rgba(255,255,255,0.4)" }}>
              No members
            </div>
          )}
          {members.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 4px",
                borderBottom:
                  i === members.length - 1
                    ? "none"
                    : "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <span
                style={{
                  color: "rgba(255,255,255,0.9)",
                  flex: 1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {m.signature}
              </span>
              <span style={{ display: "flex", gap: 3 }}>
                {m.modifiers.map((mod) => (
                  <span
                    key={mod}
                    style={{
                      fontSize: 9,
                      padding: "1px 5px",
                      borderRadius: 4,
                      background: withAlpha(accent, 0.2),
                      color: accent,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 0.3,
                    }}
                  >
                    {mod}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      </HTMLContainer>
    );
  }
  override indicator(shape: ApexClassShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={14} />;
  }
}
