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

export type ConnectedAppShape = TLBaseShape<
  "connectedApp",
  {
    w: number;
    h: number;
    label: string;
    description: string;
    authType: "oauth2" | "jwt" | "saml" | "apiKey" | "basic";
    endpoint: string;
    scopes: string;
  }
>;

export class ConnectedAppShapeUtil extends BaseBoxShapeUtil<ConnectedAppShape> {
  static override type = CUSTOM_SHAPE_TYPES.connectedApp;
  static override props: RecordProps<ConnectedAppShape> = {
    ...baseProps,
    description: T.string,
    authType: T.literalEnum("oauth2", "jwt", "saml", "apiKey", "basic"),
    endpoint: T.string,
    scopes: T.string,
  };
  override getDefaultProps(): ConnectedAppShape["props"] {
    return {
      w: 320,
      h: 200,
      label: "Xero Sync",
      description: "Two-way sync between Salesforce and Xero accounting.",
      authType: "oauth2",
      endpoint: "https://api.xero.com",
      scopes: "accounting.transactions,accounting.contacts",
    };
  }
  override getGeometry(shape: ConnectedAppShape) {
    return baseGeometry(shape);
  }
  override onResize(shape: ConnectedAppShape, info: TLResizeInfo<ConnectedAppShape>) {
    return onResize(shape, info);
  }
  override component(shape: ConnectedAppShape) {
    const accent = "#22d3ee";
    const authLabel: Record<ConnectedAppShape["props"]["authType"], string> = {
      oauth2: "OAuth 2.0",
      jwt: "JWT Bearer",
      saml: "SAML",
      apiKey: "API Key",
      basic: "Basic Auth",
    };
    const scopeList = shape.props.scopes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
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
            background: `linear-gradient(135deg, ${withAlpha(accent, 0.45)}, ${withAlpha(accent, 0.15)})`,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${accent}, #8b5cf6)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 16,
              color: "#0b0b16",
              flexShrink: 0,
            }}
          >
            ⇄
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.1 }}>
              {shape.props.label || "Connected app"}
            </div>
            <div
              style={{
                marginTop: 2,
                fontSize: 11,
                color: "rgba(255,255,255,0.65)",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {shape.props.endpoint || "no endpoint"}
            </div>
          </div>
          <span
            style={{
              fontSize: 10,
              padding: "3px 8px",
              borderRadius: 999,
              background: withAlpha(accent, 0.2),
              color: accent,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {authLabel[shape.props.authType]}
          </span>
        </div>
        <div style={{ padding: "10px 14px", fontSize: 12.5, color: "rgba(255,255,255,0.8)" }}>
          {shape.props.description}
        </div>
        {scopeList.length > 0 && (
          <div
            style={{
              padding: "0 14px 12px",
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
            }}
          >
            {scopeList.map((s) => (
              <span
                key={s}
                style={{
                  fontSize: 10,
                  padding: "2px 7px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.75)",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                }}
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </HTMLContainer>
    );
  }
  override indicator(shape: ConnectedAppShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={14} />;
  }
}
