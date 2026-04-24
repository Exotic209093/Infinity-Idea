export const CUSTOM_SHAPE_TYPES = {
  processStep: "processStep",
  decisionGate: "decisionGate",
  milestone: "milestone",
  orgNode: "orgNode",
  swimlane: "swimlane",
  titleBlock: "titleBlock",
  callout: "callout",
  checklist: "checklist",
  table: "table",
  quote: "quote",
  kpiStat: "kpiStat",
  sobject: "sobject",
} as const;

// Salesforce field types the SObject block renders.
export const SF_FIELD_TYPES = [
  "id",
  "text",
  "textarea",
  "richtext",
  "email",
  "phone",
  "url",
  "number",
  "currency",
  "percent",
  "date",
  "datetime",
  "time",
  "picklist",
  "multipicklist",
  "checkbox",
  "lookup",
  "masterDetail",
  "formula",
  "autoNumber",
  "rollup",
  "geolocation",
] as const;

export type SFFieldType = (typeof SF_FIELD_TYPES)[number];

// Colour accent per field-type family, so the picklist badges are glanceable.
export const SF_FIELD_FAMILIES: Record<SFFieldType, string> = {
  id: "#94a3b8",
  text: "#60a5fa",
  textarea: "#60a5fa",
  richtext: "#60a5fa",
  email: "#60a5fa",
  phone: "#60a5fa",
  url: "#60a5fa",
  number: "#a78bfa",
  currency: "#a78bfa",
  percent: "#a78bfa",
  date: "#22d3ee",
  datetime: "#22d3ee",
  time: "#22d3ee",
  picklist: "#f59e0b",
  multipicklist: "#f59e0b",
  checkbox: "#34d399",
  lookup: "#ec4899",
  masterDetail: "#ec4899",
  formula: "#c4b5fd",
  autoNumber: "#c4b5fd",
  rollup: "#c4b5fd",
  geolocation: "#22d3ee",
};

export type CustomShapeType =
  (typeof CUSTOM_SHAPE_TYPES)[keyof typeof CUSTOM_SHAPE_TYPES];

export const SAVE_FILE_VERSION = 1;
export const SAVE_FILE_EXTENSION = ".infidoc.json";

export type SaveFile = {
  version: number;
  createdAt: string;
  appName: "infinite-idea";
  snapshot: unknown;
};
