"use client";

import React from "react";
import type { FlowElementType } from "@/types/shapes";

export function blockShell(
  w: number,
  h: number,
  accent: string,
): React.CSSProperties {
  return {
    width: w,
    height: h,
    borderRadius: 16,
    background: "rgba(20,20,32,0.7)",
    border: `1px solid ${withAlpha(accent, 0.4)}`,
    boxShadow: `0 4px 20px ${withAlpha(accent, 0.18)}`,
    color: "#fff",
    overflow: "hidden",
  };
}

export function numberBubble(accent: string): React.CSSProperties {
  return {
    width: 36,
    height: 36,
    borderRadius: 999,
    background: `linear-gradient(135deg, ${accent}, #ec4899)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    color: "#fff",
    flexShrink: 0,
  };
}

export function diamond(accent: string): React.CSSProperties {
  return {
    width: 18,
    height: 18,
    background: accent,
    transform: "rotate(45deg)",
    borderRadius: 3,
    flexShrink: 0,
  };
}

export function avatar(accent: string): React.CSSProperties {
  return {
    width: 44,
    height: 44,
    borderRadius: 999,
    background: `linear-gradient(135deg, ${accent}, #ec4899)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    color: "#fff",
    flexShrink: 0,
    fontSize: 14,
    letterSpacing: 0.5,
  };
}

export function gateLabel(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    top: "50%",
    [side]: -4,
    transform: "translateY(-50%)",
    fontSize: 11,
    fontWeight: 700,
    color: "rgba(255,255,255,0.8)",
    background: "rgba(0,0,0,0.4)",
    padding: "2px 8px",
    borderRadius: 999,
    pointerEvents: "none",
  };
}

export function withAlpha(hex: string, alpha: number): string {
  const bigint = parseInt(hex.replace("#", ""), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function sobjectAccent(type: "standard" | "custom" | "external" | "platform"): string {
  switch (type) {
    case "custom":
      return "#ec4899";
    case "external":
      return "#f59e0b";
    case "platform":
      return "#22d3ee";
    case "standard":
    default:
      return "#8b5cf6";
  }
}

export function flowGlyph(type: FlowElementType): string {
  switch (type) {
    case "start": return "▶";
    case "end": return "■";
    case "screen": return "⌘";
    case "decision": return "◆";
    case "assignment": return "=";
    case "createRecord": return "+";
    case "updateRecord": return "✎";
    case "deleteRecord": return "×";
    case "getRecords": return "⎙";
    case "action": return "⚡";
    case "loop": return "↻";
    case "subflow": return "↘";
    default: return "·";
  }
}

export function truthy(v: string): boolean {
  const s = v.trim().toLowerCase();
  return s === "1" || s === "y" || s === "yes" || s === "✓" || s === "true";
}

export function FlagBadge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "default" | "pink" | "cyan" | "amber";
}) {
  const palette: Record<string, { bg: string; fg: string }> = {
    default: { bg: "rgba(255,255,255,0.08)", fg: "rgba(255,255,255,0.7)" },
    pink: { bg: "rgba(236,72,153,0.18)", fg: "#fbcfe8" },
    cyan: { bg: "rgba(34,211,238,0.18)", fg: "#a5f3fc" },
    amber: { bg: "rgba(245,158,11,0.18)", fg: "#fde68a" },
  };
  const p = palette[tone ?? "default"];
  return (
    <span
      style={{
        fontSize: 9,
        padding: "1px 5px",
        borderRadius: 4,
        background: p.bg,
        color: p.fg,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 0.4,
      }}
    >
      {children}
    </span>
  );
}
