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
  apexClass: "apexClass",
  flowElement: "flowElement",
  permissionMatrix: "permissionMatrix",
  connectedApp: "connectedApp",
  relationshipLabel: "relationshipLabel",
} as const;

/* ─────────────────────── Flow element metadata ─────────────────────── */

export const FLOW_ELEMENT_TYPES = [
  "start",
  "end",
  "screen",
  "decision",
  "assignment",
  "createRecord",
  "updateRecord",
  "deleteRecord",
  "getRecords",
  "action",
  "loop",
  "subflow",
] as const;

export type FlowElementType = (typeof FLOW_ELEMENT_TYPES)[number];

export const FLOW_ELEMENT_COLOURS: Record<FlowElementType, string> = {
  start: "#22d3ee",
  end: "#ec4899",
  screen: "#8b5cf6",
  decision: "#f59e0b",
  assignment: "#a78bfa",
  createRecord: "#34d399",
  updateRecord: "#60a5fa",
  deleteRecord: "#f87171",
  getRecords: "#22d3ee",
  action: "#c4b5fd",
  loop: "#f59e0b",
  subflow: "#8b5cf6",
};

export const FLOW_ELEMENT_LABEL: Record<FlowElementType, string> = {
  start: "Start",
  end: "End",
  screen: "Screen",
  decision: "Decision",
  assignment: "Assignment",
  createRecord: "Create Record",
  updateRecord: "Update Record",
  deleteRecord: "Delete Record",
  getRecords: "Get Records",
  action: "Action",
  loop: "Loop",
  subflow: "Subflow",
};

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
