import {
  parseSFFields,
  serializeSFFields,
  parseApexMembers,
  serializeApexMembers,
  parsePermRows,
  serializePermRows,
  parseApprovalSteps,
  serializeApprovalSteps,
  parseChecklistItems,
  serializeChecklistItems,
  parseTable,
  serializeTable,
  type ParsedSFField,
  type ParsedApexMember,
  type ParsedPermRow,
  type ParsedApprovalStep,
  type ParsedChecklistItem,
} from "@/components/editor/shapes/_parsers";
import {
  CUSTOM_SHAPE_TYPES,
  SF_FIELD_TYPES,
} from "@/types/shapes";

// Shape-agnostic editor row. Concrete row shapes live alongside their parser
// in customShapes; the editor sees them as opaque records keyed by column key.
export type Row = Record<string, unknown>;

export type ColumnKind =
  | { kind: "text" }
  | { kind: "multitext" }
  | { kind: "select"; options: ReadonlyArray<{ label: string; value: string }> }
  | { kind: "checkbox" }
  | { kind: "flag-list"; flags: ReadonlyArray<{ key: string; label: string }> };

export type Column = ColumnKind & {
  key: string;
  label: string;
  width?: "narrow" | "auto" | "flex";
  placeholder?: string;
};

export type ColumnSchema = {
  shape: string;
  columns: ReadonlyArray<Column>;
  dynamicColumns?: boolean;
  emptyRow: () => Row;
  helpHeader?: string;
  // The primary prop key to show in Raw text mode of the popout dialog.
  // Defaults to the first key returned by serialize() — set this explicitly
  // when serialize returns multiple keys (e.g. Checklist writes both
  // `items` and `checked`; Raw mode should show `items`).
  rawKey?: string;
  parse: (props: Record<string, unknown>) => Row[];
  serialize: (rows: Row[]) => Record<string, string>;
};

const SF_TYPE_OPTIONS = SF_FIELD_TYPES.map((t) => ({ label: t, value: t }));

const SF_FLAG_OPTIONS = [
  { key: "req", label: "Required" },
  { key: "unq", label: "Unique" },
  { key: "ext", label: "External ID" },
  { key: "pk", label: "Primary key" },
  { key: "pii", label: "PII" },
  { key: "enc", label: "Encrypted" },
  { key: "idx", label: "Indexed" },
] as const;

// Reverse map: flag token (as stored in serialized text) → boolean property
// on ParsedSFField. Adding a new flag means adding it here AND to
// SF_FLAG_OPTIONS, so both ends of the round-trip stay in sync.
const SF_FLAG_FIELD: Record<string, keyof Pick<ParsedSFField, "required" | "unique" | "externalId" | "primaryKey" | "pii" | "encrypted" | "indexed">> = {
  req: "required",
  unq: "unique",
  ext: "externalId",
  pk: "primaryKey",
  pii: "pii",
  enc: "encrypted",
  idx: "indexed",
};

const APEX_MOD_OPTIONS = [
  { key: "public", label: "public" },
  { key: "global", label: "global" },
  { key: "private", label: "private" },
  { key: "static", label: "static" },
  { key: "virtual", label: "virtual" },
  { key: "override", label: "override" },
  { key: "abstract", label: "abstract" },
] as const;

// SObject fields: name | type | flags | refTo
const sobjectSchema: ColumnSchema = {
  shape: CUSTOM_SHAPE_TYPES.sobject,
  columns: [
    { key: "name", label: "Name", kind: "text", width: "flex", placeholder: "FieldName__c" },
    { key: "type", label: "Type", kind: "select", options: SF_TYPE_OPTIONS, width: "auto" },
    { key: "flags", label: "Flags", kind: "flag-list", flags: SF_FLAG_OPTIONS, width: "auto" },
    { key: "refTo", label: "Refs", kind: "text", width: "auto", placeholder: "Account" },
  ],
  emptyRow: () => ({ name: "", type: "text", flags: [], refTo: "" }),
  helpHeader:
    "Each row is a field. Type determines the on-canvas badge colour. Flags toggle inline tags; Refs names a related SObject for lookup/master-detail.",
  parse: (props) => {
    const raw = String(props.fields ?? "");
    return parseSFFields(raw).map<Row>((f) => ({
      name: f.name,
      type: f.type,
      flags: SF_FLAG_OPTIONS.filter((o) => f[SF_FLAG_FIELD[o.key]]).map((o) => o.key),
      refTo: f.refTo,
    }));
  },
  serialize: (rows) => {
    const fields: ParsedSFField[] = rows.map((r) => {
      const flags = (r.flags as string[]) ?? [];
      return {
        name: String(r.name ?? ""),
        type: r.type as ParsedSFField["type"],
        required: flags.includes("req"),
        unique: flags.includes("unq"),
        externalId: flags.includes("ext"),
        primaryKey: flags.includes("pk"),
        pii: flags.includes("pii"),
        encrypted: flags.includes("enc"),
        indexed: flags.includes("idx"),
        refTo: String(r.refTo ?? ""),
      };
    });
    return { fields: serializeSFFields(fields) };
  },
};

// ApexClass members: signature | modifiers
const apexSchema: ColumnSchema = {
  shape: CUSTOM_SHAPE_TYPES.apexClass,
  columns: [
    { key: "signature", label: "Signature", kind: "text", width: "flex", placeholder: "doStuff(): String" },
    { key: "modifiers", label: "Modifiers", kind: "flag-list", flags: APEX_MOD_OPTIONS, width: "auto" },
  ],
  emptyRow: () => ({ signature: "", modifiers: [] }),
  helpHeader: "Each row is a class member. Signature renders verbatim; modifiers tag each member visually.",
  parse: (props) => {
    const raw = String(props.members ?? "");
    return parseApexMembers(raw).map<Row>((m) => ({
      signature: m.signature,
      modifiers: [...m.modifiers],
    }));
  },
  serialize: (rows) => {
    const members: ParsedApexMember[] = rows.map((r) => ({
      signature: String(r.signature ?? ""),
      modifiers: (r.modifiers as string[]) ?? [],
    }));
    return { members: serializeApexMembers(members) };
  },
};

// PermissionMatrix rows: Object | C | R | U | D | X
const permissionSchema: ColumnSchema = {
  shape: CUSTOM_SHAPE_TYPES.permissionMatrix,
  columns: [
    { key: "object", label: "Object", kind: "text", width: "flex", placeholder: "Account" },
    { key: "create", label: "C", kind: "checkbox", width: "narrow" },
    { key: "read", label: "R", kind: "checkbox", width: "narrow" },
    { key: "update", label: "U", kind: "checkbox", width: "narrow" },
    { key: "del", label: "D", kind: "checkbox", width: "narrow" },
    { key: "modifyAll", label: "X", kind: "checkbox", width: "narrow" },
  ],
  emptyRow: () => ({ object: "", create: false, read: false, update: false, del: false, modifyAll: false }),
  helpHeader: "C = Create · R = Read · U = Update · D = Delete · X = Modify All",
  parse: (props) => {
    const raw = String(props.rows ?? "");
    return parsePermRows(raw).map<Row>((r) => ({
      object: r.object,
      create: r.create,
      read: r.read,
      update: r.update,
      del: r.del,
      modifyAll: r.modifyAll,
    }));
  },
  serialize: (rows) => {
    const perm: ParsedPermRow[] = rows.map((r) => ({
      object: String(r.object ?? ""),
      create: !!r.create,
      read: !!r.read,
      update: !!r.update,
      del: !!r.del,
      modifyAll: !!r.modifyAll,
    }));
    return { rows: serializePermRows(perm) };
  },
};

// ApprovalProcess steps: name | approver | criteria
const approvalSchema: ColumnSchema = {
  shape: CUSTOM_SHAPE_TYPES.approvalProcess,
  columns: [
    { key: "name", label: "Step name", kind: "text", width: "flex" },
    { key: "approver", label: "Approver", kind: "text", width: "auto" },
    { key: "criteria", label: "Criteria", kind: "multitext", width: "flex" },
  ],
  emptyRow: () => ({ name: "", approver: "", criteria: "" }),
  parse: (props) => {
    const raw = String(props.steps ?? "");
    return parseApprovalSteps(raw).map<Row>((s) => ({
      name: s.name,
      approver: s.approver,
      criteria: s.criteria,
    }));
  },
  serialize: (rows) => {
    const steps: ParsedApprovalStep[] = rows.map((r) => ({
      name: String(r.name ?? ""),
      approver: String(r.approver ?? ""),
      criteria: String(r.criteria ?? ""),
    }));
    return { steps: serializeApprovalSteps(steps) };
  },
};

// Table: dynamic columns × variable rows. Editor infers columns from row width.
const tableSchema: ColumnSchema = {
  shape: CUSTOM_SHAPE_TYPES.table,
  columns: [],
  dynamicColumns: true,
  emptyRow: () => ({}),
  parse: (props) => {
    const raw = String(props.cells ?? "");
    const grid = parseTable(raw);
    if (grid.length === 0) return [];
    const cols = Math.max(...grid.map((r) => r.length));
    return grid.map<Row>((row) => {
      const out: Row = {};
      for (let i = 0; i < cols; i++) out[String(i)] = row[i] ?? "";
      return out;
    });
  },
  serialize: (rows) => {
    if (rows.length === 0) return { cells: "" };
    const cols = Math.max(
      ...rows.map((r) => Object.keys(r).reduce((m, k) => Math.max(m, Number(k) + 1), 0)),
    );
    const grid = rows.map((r) => {
      const out: string[] = [];
      for (let i = 0; i < cols; i++) out.push(String(r[String(i)] ?? ""));
      return out;
    });
    return { cells: serializeTable(grid) };
  },
};

// Checklist: items + checked
const checklistSchema: ColumnSchema = {
  shape: CUSTOM_SHAPE_TYPES.checklist,
  rawKey: "items",
  columns: [
    { key: "item", label: "Item", kind: "text", width: "flex" },
    { key: "checked", label: "Done", kind: "checkbox", width: "narrow" },
  ],
  emptyRow: () => ({ item: "", checked: false }),
  parse: (props) => {
    const items = String(props.items ?? "");
    const checked = String(props.checked ?? "");
    return parseChecklistItems(items, checked).map<Row>((r) => ({
      item: r.item,
      checked: r.checked,
    }));
  },
  serialize: (rows) => {
    const pairs: ParsedChecklistItem[] = rows.map((r) => ({
      item: String(r.item ?? ""),
      checked: !!r.checked,
    }));
    return serializeChecklistItems(pairs);
  },
};

export const SCHEMAS: Record<string, ColumnSchema> = {
  [sobjectSchema.shape]: sobjectSchema,
  [apexSchema.shape]: apexSchema,
  [permissionSchema.shape]: permissionSchema,
  [approvalSchema.shape]: approvalSchema,
  [tableSchema.shape]: tableSchema,
  [checklistSchema.shape]: checklistSchema,
};
