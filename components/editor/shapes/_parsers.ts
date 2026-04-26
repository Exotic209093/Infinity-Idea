import { SF_FIELD_TYPES, type SFFieldType } from "@/types/shapes";
import { truthy } from "./_styles";

export function memoByString<T>(fn: (raw: string) => T, max = 512): (raw: string) => T {
  const cache = new Map<string, T>();
  return (raw: string) => {
    const hit = cache.get(raw);
    if (hit !== undefined) return hit;
    const v = fn(raw);
    if (cache.size >= max) cache.clear();
    cache.set(raw, v);
    return v;
  };
}

/* ---------- Checklist ---------- */

export type ParsedChecklistItem = { item: string; checked: boolean };

export function parseChecklistItems(items: string, checked: string): ParsedChecklistItem[] {
  if (!items) return [];
  const itemList = items.split("\n");
  const flagList = checked.split("");
  return itemList.map((item, i) => ({
    item,
    checked: (flagList[i] ?? "0") === "1",
  }));
}

export function serializeChecklistItems(rows: ParsedChecklistItem[]): { items: string; checked: string } {
  return {
    items: rows.map((r) => r.item).join("\n"),
    checked: rows.map((r) => (r.checked ? "1" : "0")).join(""),
  };
}

/* ---------- Table ---------- */

export function parseTable(cells: string): string[][] {
  if (!cells) return [];
  return cells.split("\n").map((row) => row.split("\t"));
}

export function serializeTable(rows: string[][]): string {
  return rows.map((row) => row.join("\t")).join("\n");
}

/* ---------- SObject fields ---------- */

export type ParsedSFField = {
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

export const SF_FLAG_ORDER: Array<keyof Pick<ParsedSFField, "required" | "unique" | "externalId" | "primaryKey" | "pii" | "encrypted" | "indexed">> = [
  "required",
  "unique",
  "externalId",
  "primaryKey",
  "pii",
  "encrypted",
  "indexed",
];

export const SF_FLAG_TOKEN: Record<typeof SF_FLAG_ORDER[number], string> = {
  required: "req",
  unique: "unq",
  externalId: "ext",
  primaryKey: "pk",
  pii: "pii",
  encrypted: "enc",
  indexed: "idx",
};

export const parseSFFields = memoByString((raw: string): ParsedSFField[] =>
  raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [nameRaw = "", typeRaw = "text", flagsRaw = "", refToRaw = ""] =
        line.split("|").map((p) => p.trim());
      const type = (SF_FIELD_TYPES as readonly string[]).includes(typeRaw)
        ? (typeRaw as SFFieldType)
        : "text";
      const flags = flagsRaw
        .split(",")
        .map((f) => f.trim().toLowerCase())
        .filter(Boolean);
      return {
        name: nameRaw,
        type,
        required: flags.includes("req") || flags.includes("required"),
        unique: flags.includes("unq") || flags.includes("unique"),
        externalId: flags.includes("ext") || flags.includes("external-id"),
        primaryKey: flags.includes("pk") || flags.includes("primary"),
        pii: flags.includes("pii"),
        encrypted: flags.includes("enc") || flags.includes("encrypted"),
        indexed: flags.includes("idx") || flags.includes("indexed"),
        refTo: refToRaw,
      };
    }));

export function serializeSFFields(rows: ParsedSFField[]): string {
  return rows
    .map((f) => {
      const flags = SF_FLAG_ORDER.filter((k) => f[k]).map((k) => SF_FLAG_TOKEN[k]).join(",");
      return [f.name, f.type, flags, f.refTo].join(" | ");
    })
    .join("\n");
}

/* ---------- Apex members ---------- */

export type ParsedApexMember = {
  signature: string;
  modifiers: string[];
};

export const parseApexMembers = memoByString(
  (raw: string): ParsedApexMember[] =>
    raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [sigRaw = "", modsRaw = ""] = line.split("|").map((p) => p.trim());
        return {
          signature: sigRaw,
          modifiers: modsRaw
            .split(",")
            .map((m) => m.trim().toLowerCase())
            .filter(Boolean),
        };
      }),
);

export function serializeApexMembers(rows: ParsedApexMember[]): string {
  return rows
    .map((m) => [m.signature, m.modifiers.join(", ")].join(" | "))
    .join("\n");
}

/* ---------- Permission rows ---------- */

export type ParsedPermRow = {
  object: string;
  create: boolean;
  read: boolean;
  update: boolean;
  del: boolean;
  modifyAll: boolean;
};

export const parsePermRows = memoByString(
  (raw: string): ParsedPermRow[] =>
    raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const cells = line.split("|").map((c) => c.trim());
        const [obj = "", c = "0", r = "0", u = "0", d = "0", x = "0"] = cells;
        return {
          object: obj,
          create: truthy(c),
          read: truthy(r),
          update: truthy(u),
          del: truthy(d),
          modifyAll: truthy(x),
        };
      }),
);

export function serializePermRows(rows: ParsedPermRow[]): string {
  const bit = (b: boolean) => (b ? "1" : "0");
  return rows
    .map((r) =>
      [r.object, bit(r.create), bit(r.read), bit(r.update), bit(r.del), bit(r.modifyAll)].join(" | "),
    )
    .join("\n");
}

/* ---------- Approval steps ---------- */

export type ParsedApprovalStep = {
  name: string;
  approver: string;
  criteria: string;
};

export const parseApprovalSteps = memoByString(
  (raw: string): ParsedApprovalStep[] =>
    raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split("|").map((p) => p.trim());
        const [name = "", approver = "", ...rest] = parts;
        const criteria = rest.join(" | ");
        return { name, approver, criteria };
      }),
);

export function serializeApprovalSteps(rows: ParsedApprovalStep[]): string {
  return rows
    .map((s) => [s.name, s.approver, s.criteria].join(" | "))
    .join("\n");
}
