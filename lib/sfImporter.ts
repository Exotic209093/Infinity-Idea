import type { FlowElementType, SFFieldType } from "@/types/shapes";

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
  pii: boolean;
  encrypted: boolean;
  indexed: boolean;
  refTo: string;
};

export type ImportedValidationRule = {
  apiName: string;
  label: string;
  active: boolean;
  formula: string;
  errorMessage: string;
  errorDisplayField: string;
};

export type ImportedSObject = {
  label: string;
  apiName: string;
  sobjectType: "standard" | "custom" | "external" | "platform";
  fields: ImportedField[];
  validationRules?: ImportedValidationRule[];
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
      pii: false,
      encrypted: (f.type ?? "").toLowerCase() === "encryptedstring",
      indexed: false,
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
      pii: false,
      encrypted:
        get("encrypted").toLowerCase() === "true" || rawType === "encryptedtext",
      indexed: false,
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

  // Pull validation rules from <validationRules> entries inside the same
  // CustomObject XML so importing a file gives you the rules alongside the
  // SObject diagram.
  const ruleNodes = Array.from(root.getElementsByTagName("validationRules"));
  const validationRules: ImportedValidationRule[] = ruleNodes.map((node) => {
    const get = (tag: string) =>
      node.getElementsByTagName(tag)[0]?.textContent?.trim() ?? "";
    const apiName = get("fullName");
    const labelTxt = apiName.replace(/_/g, " ");
    return {
      apiName,
      label: labelTxt,
      active: get("active").toLowerCase() === "true",
      formula: get("errorConditionFormula"),
      errorMessage: get("errorMessage"),
      errorDisplayField: get("errorDisplayField"),
    };
  });

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
        pii: false,
        encrypted: false,
        indexed: false,
        refTo: "",
      },
      ...fields,
    ],
    validationRules: validationRules.length > 0 ? validationRules : undefined,
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

/* ─────────────────────────── Batch import ─────────────────────────── */

type DescribeBatchEnvelope = {
  sobjects?: DescribeSObjectJson[];
  result?: { sobjects?: DescribeSObjectJson[] };
  records?: DescribeSObjectJson[];
};

/**
 * Parse metadata that may contain multiple SObjects. Accepts:
 *   - a plain JSON array of describe objects
 *   - `{ sobjects: [...] }` (CLI composite output)
 *   - `{ result: { sobjects: [...] } }`
 *   - a single describe JSON (returned as a 1-element array)
 *   - a single .object XML (returned as a 1-element array)
 */
export function parseMetadataBatch(raw: string): ImportedSObject[] {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("Paste some metadata first.");

  if (trimmed.startsWith("[")) {
    let arr: unknown;
    try {
      arr = JSON.parse(trimmed);
    } catch {
      throw new Error("That looks like a JSON array but isn't valid JSON.");
    }
    if (!Array.isArray(arr)) throw new Error("Expected a JSON array.");
    return arr.map((o) => parseDescribeJson(JSON.stringify(o)));
  }

  if (trimmed.startsWith("{")) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new Error("That doesn't look like valid JSON.");
    }
    const env = parsed as DescribeBatchEnvelope;
    const list =
      env.sobjects ?? env.result?.sobjects ?? env.records ?? undefined;
    if (Array.isArray(list) && list.length > 0) {
      return list.map((o) => parseDescribeJson(JSON.stringify(o)));
    }
    // Fall back to single-object describe
    return [parseDescribeJson(trimmed)];
  }

  if (trimmed.startsWith("<?xml") || trimmed.startsWith("<")) {
    return [parseObjectXml(trimmed)];
  }

  throw new Error("Could not recognise this as JSON or XML metadata.");
}

/**
 * Given a batch of imported objects, return the relationship chips that
 * should be drawn for every lookup / master-detail field that references
 * another object in the same batch.
 */
export type ImportedRelationship = {
  fromApi: string;
  fromField: string;
  toApi: string;
  kind: "lookup" | "masterDetail";
  cardinality: "1:N";
};

export function relationshipsAmong(
  objects: ImportedSObject[],
): ImportedRelationship[] {
  const apiNames = new Set(objects.map((o) => o.apiName));
  const rels: ImportedRelationship[] = [];
  for (const obj of objects) {
    for (const f of obj.fields) {
      if (
        (f.type === "lookup" || f.type === "masterDetail") &&
        f.refTo &&
        apiNames.has(f.refTo)
      ) {
        rels.push({
          fromApi: obj.apiName,
          fromField: f.name,
          toApi: f.refTo,
          kind: f.type,
          cardinality: "1:N",
        });
      }
    }
  }
  return rels;
}

/* ─────────────────────────── Apex source parser ─────────────────────────── */

export type ImportedApexMember = {
  signature: string;
  modifiers: string[];
};

export type ImportedApex = {
  label: string;
  apiName: string;
  classKind: "class" | "trigger" | "interface" | "enum" | "test";
  visibility: "public" | "global" | "private";
  sharing: "with" | "without" | "inherited" | "none";
  members: ImportedApexMember[];
};

const APEX_KIND_KEYWORDS = ["class", "interface", "enum", "trigger"] as const;

function stripApexCommentsAndStrings(src: string): string {
  // Remove block comments, line comments, and the contents of string literals
  // so we can scan for signatures without the regex getting confused.
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/'(\\.|[^'\\])*'/g, "''");
}

/**
 * Parse an Apex .cls / .trigger source string into metadata the ApexClass
 * shape can render. Regex-based — good enough for documentation snapshots,
 * not a full Apex parser.
 */
export function parseApexSource(raw: string): ImportedApex {
  const src = stripApexCommentsAndStrings(raw);
  if (!src.trim()) throw new Error("Paste some Apex source first.");

  // Class header: skip any annotations, then visibility, sharing keyword
  // (as a unit "with sharing" / "without sharing" / "inherited sharing"),
  // optional virtual/abstract, then kind and name.
  const headerRe =
    /(?:@\w[\w.]*(?:\([^)]*\))?\s+)*(?:(global|public|private)\s+)?(?:(with|without|inherited)\s+sharing\s+)?(?:(virtual|abstract)\s+)?(class|interface|enum|trigger)\s+([A-Za-z_]\w*)/i;
  const m = src.match(headerRe);
  if (!m) {
    throw new Error(
      "Could not find a class/trigger/interface/enum declaration.",
    );
  }

  const visibilityRaw = (m[1] ?? "public").toLowerCase();
  const sharingKeyword = (m[2] ?? "").toLowerCase();
  const kindRaw = m[4].toLowerCase() as (typeof APEX_KIND_KEYWORDS)[number];
  const name = m[5];

  const visibility: ImportedApex["visibility"] =
    visibilityRaw === "global"
      ? "global"
      : visibilityRaw === "private"
      ? "private"
      : "public";
  const sharing: ImportedApex["sharing"] =
    sharingKeyword === "with"
      ? "with"
      : sharingKeyword === "without"
      ? "without"
      : sharingKeyword === "inherited"
      ? "inherited"
      : "none";

  // Detect test classes by the presence of @isTest or @IsTest annotations
  // within the first 200 characters of the original source.
  const head = raw.slice(0, Math.min(400, raw.length));
  const isTest = /@\s*is\s*test/i.test(head);
  const classKind: ImportedApex["classKind"] = isTest && kindRaw === "class" ? "test" : kindRaw;

  // Grab the method signatures at nesting depth 1 inside the class body.
  const members = extractApexMembers(src);

  return {
    label: name,
    apiName: name,
    classKind,
    visibility,
    sharing,
    members,
  };
}

function extractApexMembers(src: string): ImportedApexMember[] {
  // Skip past the class header brace.
  const openIdx = src.indexOf("{");
  if (openIdx === -1) return [];
  const body = src.slice(openIdx + 1);

  const members: ImportedApexMember[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === "{") {
      if (depth === 0) {
        // Everything from start..i is the member signature (ended with `{`)
        const sigRaw = body.slice(start, i).trim();
        if (sigRaw) {
          const mem = parseApexMemberSignature(sigRaw);
          if (mem) members.push(mem);
        }
      }
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        start = i + 1;
      }
    } else if (ch === ";" && depth === 0) {
      // Interface / abstract method declaration (no body)
      const sigRaw = body.slice(start, i).trim();
      if (sigRaw) {
        const mem = parseApexMemberSignature(sigRaw);
        if (mem) members.push(mem);
      }
      start = i + 1;
    }
  }
  return members;
}

const MAX_SIGNATURE_LENGTH = 2000;

const METHOD_RE =
  /(?:@[\w.]+(?:\([^)]*\))?\s*)*((?:\b(?:global|public|private|protected|static|virtual|abstract|override|final|webservice|testmethod)\s+)+)?([A-Za-z_][\w<>,\s.[\]]*?)?\s+([A-Za-z_][\w]*)\s*\(([^)]*)\)\s*$/;

function parseApexMemberSignature(raw: string): ImportedApexMember | null {
  // Normalise whitespace to a single line so the regex can anchor on $.
  const flat = raw.replace(/\s+/g, " ").trim();
  // Cap input length to prevent regex backtracking on pathological signatures.
  if (flat.length > MAX_SIGNATURE_LENGTH) return null;
  const m = flat.match(METHOD_RE);
  if (!m) return null;
  const modifiersRaw = (m[1] ?? "").trim();
  const returnType = (m[2] ?? "").trim();
  const methodName = m[3];
  const argsRaw = (m[4] ?? "").trim();

  // A field declaration would have a semicolon; we only keep method-like.
  // Constructors have no return type — that's fine, return "" below.
  const modifiers = modifiersRaw
    .split(/\s+/)
    .map((w) => w.toLowerCase())
    .filter(Boolean);

  const signature = returnType
    ? `${methodName}(${argsRaw}): ${returnType}`
    : `${methodName}(${argsRaw})`;
  return { signature, modifiers };
}

/**
 * Serialise to the pipe format the ApexClass block expects in its `members`
 * prop: `name(args): Return | modifier1, modifier2`
 */
export function toMembersText(apex: ImportedApex): string {
  return apex.members
    .map((m) => {
      const mods = m.modifiers.join(", ");
      return mods ? `${m.signature} | ${mods}` : m.signature;
    })
    .join("\n");
}

/* ─────────────────────────── Profile XML parser ─────────────────────────── */

export type ImportedPermRow = {
  object: string;
  create: boolean;
  read: boolean;
  update: boolean;
  del: boolean;
  modifyAll: boolean;
};

export type ImportedProfile = {
  label: string;
  rows: ImportedPermRow[];
};

export function parseProfileXml(raw: string): ImportedProfile {
  const parser = new DOMParser();
  const doc = parser.parseFromString(raw, "application/xml");
  if (doc.querySelector("parsererror")) {
    throw new Error("That doesn't look like valid XML.");
  }
  const root = doc.documentElement;
  const label =
    root.getElementsByTagName("fullName")[0]?.textContent?.trim() ||
    root.getElementsByTagName("label")[0]?.textContent?.trim() ||
    "Profile";
  const nodes = Array.from(root.getElementsByTagName("objectPermissions"));
  if (nodes.length === 0) {
    throw new Error("No <objectPermissions> entries found in the XML.");
  }
  const rows = nodes.map<ImportedPermRow>((node) => {
    const get = (tag: string) =>
      node.getElementsByTagName(tag)[0]?.textContent?.trim().toLowerCase() ?? "";
    return {
      object: node.getElementsByTagName("object")[0]?.textContent?.trim() ?? "",
      create: get("allowCreate") === "true",
      read: get("allowRead") === "true",
      update: get("allowEdit") === "true",
      del: get("allowDelete") === "true",
      modifyAll: get("modifyAllRecords") === "true",
    };
  });
  return { label, rows };
}

export function toPermRowsText(profile: ImportedProfile): string {
  return profile.rows
    .map(
      (r) =>
        `${r.object} | ${r.create ? 1 : 0} | ${r.read ? 1 : 0} | ${
          r.update ? 1 : 0
        } | ${r.del ? 1 : 0} | ${r.modifyAll ? 1 : 0}`,
    )
    .join("\n");
}

/* ─────────────────────────── Flow XML parser ─────────────────────────── */

export type ImportedFlowElement = {
  name: string; // internal Flow name (used to resolve connectors)
  label: string; // user-facing label
  type: FlowElementType;
  details: string;
  connectors: string[]; // names of downstream elements this one connects to
};

export type ImportedFlow = {
  label: string;
  apiName: string;
  elements: ImportedFlowElement[];
};

// Maps Flow metadata tag names to our FlowElement types.
const FLOW_TAG_MAP: Record<string, FlowElementType> = {
  screens: "screen",
  decisions: "decision",
  assignments: "assignment",
  recordCreates: "createRecord",
  recordUpdates: "updateRecord",
  recordDeletes: "deleteRecord",
  recordLookups: "getRecords",
  actionCalls: "action",
  apexPluginCalls: "action",
  loops: "loop",
  subflows: "subflow",
};

function textOf(el: Element | null, tag: string): string {
  return el?.getElementsByTagName(tag)[0]?.textContent?.trim() ?? "";
}

function collectConnectors(el: Element): string[] {
  // Flow elements may have <connector>, <defaultConnector>, <faultConnector>,
  // <noMoreValuesConnector>, <nextValueConnector>. Every <targetReference>
  // inside any descendant is a downstream element.
  const targets: string[] = [];
  const refs = el.getElementsByTagName("targetReference");
  for (let i = 0; i < refs.length; i++) {
    const v = refs[i].textContent?.trim();
    if (v) targets.push(v);
  }
  return Array.from(new Set(targets));
}

export function parseFlowXml(raw: string): ImportedFlow {
  const parser = new DOMParser();
  const doc = parser.parseFromString(raw, "application/xml");
  if (doc.querySelector("parsererror")) {
    throw new Error("That doesn't look like valid XML.");
  }
  const root = doc.documentElement;
  if (!/flow/i.test(root.tagName)) {
    throw new Error("Root element should be <Flow>.");
  }
  const label =
    textOf(root, "label") || textOf(root, "fullName") || "Flow";
  const apiName =
    textOf(root, "fullName") || label.replace(/[^A-Za-z0-9]+/g, "");

  const elements: ImportedFlowElement[] = [];

  // The <start> element is special — represented as a direct child.
  const startEl = root.getElementsByTagName("start")[0];
  if (startEl) {
    const triggerType = textOf(startEl, "triggerType") || "";
    const objectName = textOf(startEl, "object") || "";
    const detailsParts: string[] = [];
    if (triggerType) detailsParts.push(`Trigger: ${triggerType}`);
    if (objectName) detailsParts.push(`Object: ${objectName}`);
    elements.push({
      name: "__start",
      label: objectName ? `On ${objectName}` : "Start",
      type: "start",
      details: detailsParts.join(" · "),
      connectors: collectConnectors(startEl),
    });
  }

  // Walk every mapped tag.
  for (const [tag, elType] of Object.entries(FLOW_TAG_MAP)) {
    const nodes = Array.from(root.getElementsByTagName(tag));
    // Filter to only direct children of root — nested ones inside other
    // elements (e.g. rules inside decisions) shouldn't count.
    for (const node of nodes) {
      if (node.parentElement !== root) continue;
      const name = textOf(node, "name") || textOf(node, "fullName");
      const lab = textOf(node, "label") || name || tag;
      // Description: prefer <description>, otherwise assemble from hints.
      const description = textOf(node, "description");
      const details =
        description ||
        (elType === "createRecord" || elType === "updateRecord" ||
        elType === "deleteRecord" || elType === "getRecords"
          ? `Object: ${textOf(node, "object") || "—"}`
          : elType === "action"
          ? `Action: ${textOf(node, "actionName") || textOf(node, "actionType") || "—"}`
          : elType === "subflow"
          ? `Flow: ${textOf(node, "flowName") || "—"}`
          : "");
      elements.push({
        name,
        label: lab,
        type: elType,
        details,
        connectors: collectConnectors(node),
      });
    }
  }

  if (elements.length === 0) {
    throw new Error("No Flow elements found in the XML.");
  }

  return { label, apiName, elements };
}

/* ─────────────────────────── SOQL parser ─────────────────────────── */

export type ImportedSOQL = {
  rawQuery: string;
  fromObject: string;
  fields: string[]; // selected field expressions (relationship-safe)
  relatedObjects: string[]; // relationship objects referenced via dot paths
  conditions: string; // raw WHERE text
  orderBy: string;
  limit: string;
  offset: string;
};

function stripSoqlSubqueries(src: string): {
  stripped: string;
  subqueries: string[];
} {
  // Replace parenthesised subqueries with a placeholder so they don't
  // confuse the top-level regex. Keep them so we can list the related
  // relationships.
  const subs: string[] = [];
  let out = "";
  let depth = 0;
  let buf = "";
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === "(") {
      if (depth === 0) buf = "";
      depth++;
      if (depth > 0) buf += ch;
      else out += ch;
    } else if (ch === ")") {
      depth--;
      buf += ch;
      if (depth === 0) {
        subs.push(buf);
        out += "(subquery)";
        buf = "";
      }
    } else if (depth > 0) {
      buf += ch;
    } else {
      out += ch;
    }
  }
  return { stripped: out, subqueries: subs };
}

export function parseSoql(raw: string): ImportedSOQL {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("Paste a SOQL query first.");
  if (!/\bselect\b/i.test(trimmed) || !/\bfrom\b/i.test(trimmed)) {
    throw new Error("Query must include SELECT and FROM clauses.");
  }

  // Flatten the query to a single line for anchoring, then split on clause
  // keywords. Use the original (unflattened) for pretty display / re-save.
  const { stripped } = stripSoqlSubqueries(trimmed.replace(/\s+/g, " "));
  const upper = stripped.toUpperCase();

  const selectIdx = upper.indexOf("SELECT");
  const fromIdx = upper.indexOf(" FROM ");
  if (selectIdx < 0 || fromIdx < 0) {
    throw new Error("Could not find SELECT … FROM in the query.");
  }
  const fieldsRaw = stripped.slice(selectIdx + 6, fromIdx).trim();

  // The object name and any trailing clauses live after FROM.
  const rest = stripped.slice(fromIdx + 6).trim();

  const clauseIdxUpper = (needle: string) => {
    const re = new RegExp(`\\b${needle}\\b`, "i");
    const m = rest.match(re);
    return m && typeof m.index === "number" ? m.index : -1;
  };

  const whereIdx = clauseIdxUpper("WHERE");
  const withIdx = clauseIdxUpper("WITH");
  const groupIdx = clauseIdxUpper("GROUP BY");
  const orderIdx = clauseIdxUpper("ORDER BY");
  const limitIdx = clauseIdxUpper("LIMIT");
  const offsetIdx = clauseIdxUpper("OFFSET");

  const candidates = [whereIdx, withIdx, groupIdx, orderIdx, limitIdx, offsetIdx]
    .filter((i) => i >= 0)
    .sort((a, b) => a - b);
  const fromEnd = candidates.length > 0 ? candidates[0] : rest.length;
  const fromObject = rest.slice(0, fromEnd).trim().split(/\s+/)[0] ?? "";

  const sliceClause = (startIdx: number, nextIdx: number) => {
    if (startIdx < 0) return "";
    const end = nextIdx >= 0 ? nextIdx : rest.length;
    return rest.slice(startIdx, end).trim();
  };

  const nextAfter = (idx: number) => {
    const larger = candidates.filter((c) => c > idx);
    return larger.length > 0 ? larger[0] : rest.length;
  };

  const whereClause = whereIdx >= 0 ? sliceClause(whereIdx + 5, nextAfter(whereIdx)) : "";
  const orderClause = orderIdx >= 0 ? sliceClause(orderIdx + 8, nextAfter(orderIdx)) : "";
  const limitClause = limitIdx >= 0 ? sliceClause(limitIdx + 5, nextAfter(limitIdx)) : "";
  const offsetClause = offsetIdx >= 0 ? sliceClause(offsetIdx + 6, nextAfter(offsetIdx)) : "";

  const fields = fieldsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const relatedObjects = Array.from(
    new Set(
      fields
        .map((f) => {
          const segs = f.split(".");
          return segs.length > 1 ? segs.slice(0, -1).join(".") : "";
        })
        .filter(Boolean),
    ),
  );

  return {
    rawQuery: trimmed,
    fromObject,
    fields,
    relatedObjects,
    conditions: whereClause,
    orderBy: orderClause,
    limit: limitClause,
    offset: offsetClause,
  };
}

/* ─────────────────────────── Shape-friendly output ─────────────────────────── */

function fieldFlags(f: ImportedField): string {
  const flags: string[] = [];
  if (f.primaryKey) flags.push("pk");
  if (f.required) flags.push("req");
  if (f.unique) flags.push("unq");
  if (f.externalId) flags.push("ext");
  if (f.pii) flags.push("pii");
  if (f.encrypted) flags.push("enc");
  if (f.indexed) flags.push("idx");
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
