"use client";

import React from "react";

export const SOQL_KEYWORDS = [
  "SELECT",
  "FROM",
  "WHERE",
  "AND",
  "OR",
  "NOT",
  "LIKE",
  "IN",
  "NULL",
  "NOT NULL",
  "ORDER BY",
  "GROUP BY",
  "HAVING",
  "LIMIT",
  "OFFSET",
  "ASC",
  "DESC",
  "NULLS FIRST",
  "NULLS LAST",
  "TRUE",
  "FALSE",
  "WITH",
  "FOR VIEW",
  "FOR REFERENCE",
  "FOR UPDATE",
];

export const SOQL_KEYWORD_RE = new RegExp(
  `\\b(${SOQL_KEYWORDS.map((k) => k.replace(/\s+/g, "\\s+")).join("|")})\\b`,
  "gi",
);

export function highlightSoql(query: string): React.ReactNode {
  // Simple syntax highlighter: split on tokens we know about and wrap them
  // in spans. The non-matching parts stay as plain text.
  if (!query) return null;
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  for (const m of query.matchAll(SOQL_KEYWORD_RE)) {
    const start = m.index ?? 0;
    if (start > lastIdx) parts.push(query.slice(lastIdx, start));
    parts.push(
      <span key={`${start}-${m[0]}`} style={{ color: "#a78bfa", fontWeight: 700 }}>
        {m[0]}
      </span>,
    );
    lastIdx = start + m[0].length;
  }
  if (lastIdx < query.length) parts.push(query.slice(lastIdx));
  return parts;
}
