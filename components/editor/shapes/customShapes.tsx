"use client";

// Public surface for the editor shapes. The 20 shape utils live in their own
// files; this barrel re-exports their types + utils and assembles the
// `customShapeUtils` array consumed by tldraw's `shapeUtils` prop.

export * from "./_parsers";
export * from "./processStep";
export * from "./decisionGate";
export * from "./milestone";
export * from "./orgNode";
export * from "./swimlane";
export * from "./titleBlock";
export * from "./callout";
export * from "./checklist";
export * from "./table";
export * from "./quote";
export * from "./kpiStat";
export * from "./sobject";
export * from "./apexClass";
export * from "./flowElement";
export * from "./permissionMatrix";
export * from "./connectedApp";
export * from "./relationshipLabel";
export * from "./soqlQuery";
export * from "./validationRule";
export * from "./approvalProcess";

import { ProcessStepShapeUtil } from "./processStep";
import { DecisionGateShapeUtil } from "./decisionGate";
import { MilestoneShapeUtil } from "./milestone";
import { OrgNodeShapeUtil } from "./orgNode";
import { SwimlaneShapeUtil } from "./swimlane";
import { TitleBlockShapeUtil } from "./titleBlock";
import { CalloutShapeUtil } from "./callout";
import { ChecklistShapeUtil } from "./checklist";
import { TableShapeUtil } from "./table";
import { QuoteShapeUtil } from "./quote";
import { KpiStatShapeUtil } from "./kpiStat";
import { SObjectShapeUtil } from "./sobject";
import { ApexClassShapeUtil } from "./apexClass";
import { FlowElementShapeUtil } from "./flowElement";
import { PermissionMatrixShapeUtil } from "./permissionMatrix";
import { ConnectedAppShapeUtil } from "./connectedApp";
import { RelationshipLabelShapeUtil } from "./relationshipLabel";
import { SOQLQueryShapeUtil } from "./soqlQuery";
import { ValidationRuleShapeUtil } from "./validationRule";
import { ApprovalProcessShapeUtil } from "./approvalProcess";

export const customShapeUtils = [
  ProcessStepShapeUtil,
  DecisionGateShapeUtil,
  MilestoneShapeUtil,
  OrgNodeShapeUtil,
  SwimlaneShapeUtil,
  TitleBlockShapeUtil,
  CalloutShapeUtil,
  ChecklistShapeUtil,
  TableShapeUtil,
  QuoteShapeUtil,
  KpiStatShapeUtil,
  SObjectShapeUtil,
  ApexClassShapeUtil,
  FlowElementShapeUtil,
  PermissionMatrixShapeUtil,
  ConnectedAppShapeUtil,
  RelationshipLabelShapeUtil,
  SOQLQueryShapeUtil,
  ValidationRuleShapeUtil,
  ApprovalProcessShapeUtil,
];
