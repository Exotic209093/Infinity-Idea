export const CUSTOM_SHAPE_TYPES = {
  processStep: "processStep",
  decisionGate: "decisionGate",
  milestone: "milestone",
  orgNode: "orgNode",
  swimlane: "swimlane",
  titleBlock: "titleBlock",
  callout: "callout",
  checklist: "checklist",
} as const;

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
