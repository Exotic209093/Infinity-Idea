import type { SFFieldType } from "@/types/shapes";

/*
 * Parsers that turn Salesforce metadata (DESCRIBE JSON or an .object XML
 * file) into the canonical ImportedSObject structure used by the SObject
 * block.
 *
 * Everything runs in the browser — no Salesforce auth, no network. Users
 * paste the metadata they already have.
 */

export type ImportedField = {
  name: string;
  type: SFFieldType;
  required: boolean;
  unique: boolean;
  externalId: boolean;
  primaryKey: boolean;
  refTo: string;
};

export type ImportedSObject = {
  label: string;
  apiName: string;
  sobjectType: "standard" | "custom" | "external" | "platform";
  fields: ImportedField[];
};

/* ─────────────────────────── DESCRIBE JSON ─────────────────────────── */

// Maps the `type` values the Salesforce Describe API returns onto the
// block's known field families.
const DESCRIBE_TYPE_MAP: Record<string, SFFieldType> = {
  id: "id",
  string: "text",
  encryptedstring: "text",
  textarea: "textarea",
  email: "email",
  phone: "phone",
  url: "url",
  int: "number",
  long: "number",
  integer: "number",
  double: "number",
  currency: "currency",
  percent: "percent",
  date: "date",
  datetime: "datetime",
  time: "time",
  picklist: "picklist",
  multipicklist: "multipicklist",
  boolean: "checkbox",
  reference: "lookup",
  masterdetail: "masterDetail",
  formula: "formula",
  autonumber: "autoNumber",
  summary: "rollup",
  location: "geolocation",
};

type DescribeFieldJson = {
  name?: string;
  type?: string;
  calculatedFormula?: string | null;
  calculated?: boolean;
  autoNumber?: boolean;
  nillable?: boolean;
  unique?: boolean;
  externalId?: boolean;
  referenceTo?: string[];
  relationshipName?: string;
  relationshipOrder?: number | null;
  cascadeDelete?: boolean;
  writeRequiresMasterRead?: boolean;
};

type DescribeSObjectJson = {
  name?: string;
  label?: string;
  custom?: boolean;
  fields?: DescribeFieldJson[];
  // Some CLI outputs wrap the actual payload. Accept result/sobject/etc.
  result?: DescribeSObjectJson;
  sobject?: DescribeSObjectJson;
};

function inferTypeFromDescribeField(f: DescribeFieldJson): SFFieldType {
  const rawType = (f.type ?? "").toLowerCase();
  // Formula and auto-number override the underlying type.
  if (f.calculated || f.calculatedFormula) return "formula";
  if (f.autoNumber) return "autoNumber";
  if (rawType === "reference") {
    // Master-detail is flagged via cascadeDelete on the describe output.
    if (f.cascadeDelete || f.writeRequiresMasterRead) return "masterDetail";
    return "lookup";
  }
  return DESCRIBE_TYPE_MAP[rawType] ?? "text";
}

export function parseDescribeJson(raw: string): ImportedSObject {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("That doesn't look like valid JSON.");
  }
  const root =
    (parsed as DescribeSObjectJson).result ??
    (parsed as DescribeSObjectJson).sobject ??
    (parsed as DescribeSObjectJson);

  if (!root || typeof root !== "object") {
    throw new Error("No SObject metadata found in the JSON.");
  }
  const name = root.name ?? "Object";
  const label = root.label ?? name;
  const isCustom = !!root.custom || /__c$/i.test(name);
  const fields: DescribeFieldJson[] = Array.isArray(root.fields)
    ? root.fields
    : [];

  if (fields.length === 0) {
    throw new Error("The JSON didn't contain a 'fields' array.");
  }

  return {
    label,
    apiName: name,
    sobjectType: isCustom ? "custom" : "standard",
    fields: fields.map((f) => ({
      name: f.name ?? "",
      type: inferTypeFromDescribeField(f),
      required: f.nillable === false && f.name !== "Id" ? true : false,
      unique: !!f.unique,
      externalId: !!f.externalId,
      primaryKey: (f.name ?? "").toLowerCase() === "id",
      refTo:
        f.referenceTo && f.referenceTo.length > 0 ? f.referenceTo[0] : "",
    })),
  };
}

/* ─────────────────────────── .object XML ─────────────────────────── */

const XML_TYPE_MAP: Record<string, SFFieldType> = {
  text: "text",
  longtextarea: "textarea",
  html: "richtext",
  textarea: "textarea",
  email: "email",
  phone: "phone",
  url: "url",
  number: "number",
  currency: "currency",
  percent: "percent",
  date: "date",
  datetime: "datetime",
  time: "time",
  picklist: "picklist",
  multiselectpicklist: "multipicklist",
  checkbox: "checkbox",
  lookup: "lookup",
  masterdetail: "masterDetail",
  formula: "formula",
  autonumber: "autoNumber",
  summary: "rollup",
  rolluporgsummary: "rollup",
  location: "geolocation",
  encryptedtext: "text",
};

export function parseObjectXml(raw: string): ImportedSObject {
  const parser = new DOMParser();
  const doc = parser.parseFromString(raw, "application/xml");
  if (doc.querySelector("parsererror")) {
    throw new Error("That doesn't look like valid XML.");
  }

  const root = doc.documentElement;
  const label = root.getElementsByTagName("label")[0]?.textContent?.trim() ?? "";
  // Object API name isn't embedded — comes from the filename. Ask user to
  // supply it via the label fallback. Default to "CustomObject__c".
  let apiName = label ? label.replace(/[^A-Za-z0-9]+/g, "") : "CustomObject__c";
  // Look for pluralLabel -> api name hint, or just keep label-derived.
  const fieldsNodes = Array.from(root.getElementsByTagName("fields"));
  if (fieldsNodes.length === 0) {
    throw new Error("No <fields> entries were found in the XML.");
  }
  const fields: ImportedField[] = fieldsNodes.map((node) => {
    const get = (tag: string) =>
      node.getElementsByTagName(tag)[0]?.textContent?.trim() ?? "";
    const fullName = get("fullName");
    const rawType = get("type").toLowerCase();
    const type = XML_TYPE_MAP[rawType] ?? "text";
    const referenceTo = get("referenceTo");
    return {
      name: fullName,
      type,
      required: get("required").toLowerCase() === "true",
      unique: get("unique").toLowerCase() === "true",
      externalId: get("externalId").toLowerCase() === "true",
      primaryKey: false,
      refTo: referenceTo,
    };
  });

  // If any field name ends in __c we can reasonably assume apiName is custom.
  const hasCustomField = fields.some((f) => /__c$/i.test(f.name));
  const sobjectType: ImportedSObject["sobjectType"] = hasCustomField
    ? "custom"
    : "standard";
  // Give it the __c suffix if it looks custom but the name doesn't say so.
  if (sobjectType === "custom" && !/__c$/i.test(apiName)) apiName += "__c";

  return {
    label: label || apiName,
    apiName,
    sobjectType,
    fields: [
      // Prepend an Id row so the imported block looks like an SF object.
      {
        name: "Id",
        type: "id",
        required: false,
        unique: true,
        externalId: false,
        primaryKey: true,
        refTo: "",
      },
      ...fields,
    ],
  };
}

/* ─────────────────────────── Dispatcher ─────────────────────────── */

export type ImportFormat = "auto" | "describe" | "xml";

export function parseMetadata(
  raw: string,
  format: ImportFormat = "auto",
): ImportedSObject {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("Paste some metadata first.");

  const looksJson = trimmed.startsWith("{") || trimmed.startsWith("[");
  const looksXml =
    trimmed.startsWith("<?xml") ||
    (trimmed.startsWith("<") && trimmed.includes("fields"));

  const effective: ImportFormat =
    format !== "auto"
      ? format
      : looksJson
      ? "describe"
      : looksXml
      ? "xml"
      : "describe";

  if (effective === "describe") return parseDescribeJson(trimmed);
  return parseObjectXml(trimmed);
}

/* ─────────────────────────── Shape-friendly output ─────────────────────────── */

function fieldFlags(f: ImportedField): string {
  const flags: string[] = [];
  if (f.primaryKey) flags.push("pk");
  if (f.required) flags.push("req");
  if (f.unique) flags.push("unq");
  if (f.externalId) flags.push("ext");
  return flags.join(",");
}

/**
 * Turn an imported SObject into the pipe-delimited string the SObject
 * shape expects in its `fields` prop.
 */
export function toFieldsText(obj: ImportedSObject): string {
  return obj.fields
    .map((f) => {
      const parts = [f.name, f.type, fieldFlags(f), f.refTo];
      // Drop trailing empty columns for a cleaner textarea
      while (parts.length > 1 && parts[parts.length - 1] === "") parts.pop();
      return parts.join(" | ");
    })
    .join("\n");
}
