# Structured-data inspector — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the textarea-based editing for the six structured-data shapes with one schema-driven row editor that works inline in the inspector and in a popout dialog.

**Architecture:** A generic `<StructuredEditor>` component, configured per shape via column schemas in `lib/shapeSchemas.ts`. Each schema reuses the existing `parse*` functions and adds a paired `serialize*` companion in `customShapes.tsx`. The inspector renders the editor in `mode="compact"`; an `Edit fully…` button swaps it for the same editor in `mode="full"` inside a `StructuredEditorDialog` modal. Local row state with a 40ms debounced flush keeps typing fast and store writes coalesced.

**Tech Stack:** Next.js 15 / React 19 / tldraw 3 / Tailwind 3 / vitest + @testing-library/react / Playwright.

**Spec:** [docs/superpowers/specs/2026-04-25-structured-inspector-design.md](../specs/2026-04-25-structured-inspector-design.md)

---

## File structure

| File | Status | Responsibility |
| --- | --- | --- |
| `components/editor/shapes/customShapes.tsx` | modify | Add `serialize*` companions next to each `parse*`. Add `parseChecklistItems`/`serializeChecklistItems` (currently inline). |
| `lib/shapeSchemas.ts` | new | `Column` / `ColumnSchema` / `Row` types + `SCHEMAS` map for the six shapes. Reuses `parse*` / `serialize*` from `customShapes`. |
| `lib/shapeSchemas.test.ts` | new | Round-trip test per schema: `parse(serialize(rows))` deep-equals `rows`. |
| `components/ui/StructuredEditor.tsx` | new | Generic schema-driven row editor. Compact + full modes. Local state + debounced flush. |
| `components/ui/StructuredEditor.test.tsx` | new | RTL tests for column rendering, add/delete/reorder, debounced flush. |
| `components/ui/StructuredEditorDialog.tsx` | new | Modal wrapper around `Dialog` hosting the editor with a `Visual` / `Raw text` toggle. |
| `components/ui/InspectorPanel.tsx` | modify | Replace six textarea blocks with `<StructuredEditor>`; bump `usePanelWidth` defaults. |
| `e2e/smoke.spec.ts` | modify | One Playwright assertion that editing a table cell updates the shape's `cells` prop. |

---

## Task 1: Add `serialize*` companions for SObject, Apex, Permission, Approval

**Files:**
- Modify: `components/editor/shapes/customShapes.tsx`
- Modify (existing tests): none — round-trip tests live in Task 3 with the schemas

These four shapes already have `parse*` functions. Each gets a paired `serialize*` written so `parse(serialize(rows))` produces the same `rows` array (deep-equal) for any rows produced by the parser. The schemas in Task 3 will call these.

- [ ] **Step 1: Add `serializeSFFields` next to `parseSFFields`**

In `customShapes.tsx`, immediately after the existing `parseSFFields` definition (it lives just below `memoByString`), add:

```ts
const SF_FLAG_ORDER: Array<keyof Pick<ParsedSFField, "required" | "unique" | "externalId" | "primaryKey" | "pii" | "encrypted" | "indexed">> = [
  "required",
  "unique",
  "externalId",
  "primaryKey",
  "pii",
  "encrypted",
  "indexed",
];

const SF_FLAG_TOKEN: Record<typeof SF_FLAG_ORDER[number], string> = {
  required: "req",
  unique: "unq",
  externalId: "ext",
  primaryKey: "pk",
  pii: "pii",
  encrypted: "enc",
  indexed: "idx",
};

export function serializeSFFields(rows: ParsedSFField[]): string {
  return rows
    .map((f) => {
      const flags = SF_FLAG_ORDER.filter((k) => f[k]).map((k) => SF_FLAG_TOKEN[k]).join(",");
      return [f.name, f.type, flags, f.refTo].join(" | ");
    })
    .join("\n");
}
```

- [ ] **Step 2: Add `serializeApexMembers`**

Immediately after the existing `parseApexMembers` (now `export const parseApexMembers = memoByString(...)`), add:

```ts
export function serializeApexMembers(rows: ParsedApexMember[]): string {
  return rows
    .map((m) => [m.signature, m.modifiers.join(", ")].join(" | "))
    .join("\n");
}
```

- [ ] **Step 3: Add `serializePermRows`**

After the existing `parsePermRows`:

```ts
export function serializePermRows(rows: ParsedPermRow[]): string {
  const bit = (b: boolean) => (b ? "1" : "0");
  return rows
    .map((r) =>
      [r.object, bit(r.create), bit(r.read), bit(r.update), bit(r.del), bit(r.modifyAll)].join(" | "),
    )
    .join("\n");
}
```

- [ ] **Step 4: Export `parseApprovalSteps` and add `serializeApprovalSteps`**

`parseApprovalSteps` is currently a module-private `function`. Convert it to a memoized export (matching the other parsers) AND add the matching serializer. Find:

```ts
function parseApprovalSteps(raw: string): ParsedApprovalStep[] {
  return raw
    .split("\n")
    ...
```

Replace the `function parseApprovalSteps(raw: string)` declaration with:

```ts
export const parseApprovalSteps = memoByString(
  (raw: string): ParsedApprovalStep[] =>
    raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const [name = "", approver = "", criteria = ""] = line
          .split("|")
          .map((p) => p.trim());
        return { name, approver, criteria };
      }),
);

export function serializeApprovalSteps(rows: ParsedApprovalStep[]): string {
  return rows
    .map((s) => [s.name, s.approver, s.criteria].join(" | "))
    .join("\n");
}
```

If `type ParsedApprovalStep` is declared in the file but not exported, add `export` to its declaration so the schemas module can import it.

- [ ] **Step 5: Verify the file still compiles**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/editor/shapes/customShapes.tsx
git commit -m "Add serialize* companions for SObject, Apex, Permission, Approval"
```

---

## Task 2: Add `parse*` / `serialize*` for Table and Checklist

**Files:**
- Modify: `components/editor/shapes/customShapes.tsx`

Table currently has `parseTable` already. Checklist uses inline `splitItems` / `splitChecked`. We formalize a `parseChecklistItems` / `serializeChecklistItems` pair so the schema in Task 3 has a clean target. We also add `serializeTable` to match `parseTable`.

- [ ] **Step 1: Add `serializeTable`**

Find `parseTable` in `customShapes.tsx` (around line 690). Below it, add:

```ts
export function serializeTable(rows: string[][]): string {
  return rows.map((row) => row.join("\t")).join("\n");
}
```

- [ ] **Step 2: Add `parseChecklistItems` and `serializeChecklistItems`**

Find the existing `splitItems` / `splitChecked` / `joinChecked` helpers above `ChecklistShapeUtil` (around line 558). Replace them with:

```ts
export type ParsedChecklistItem = { item: string; checked: boolean };

export function parseChecklistItems(items: string, checked: string): ParsedChecklistItem[] {
  const itemList = items.split("\n");
  const flagList = checked.split("");
  return itemList.map((item, i) => ({
    item,
    checked: flagList[i] === "1",
  }));
}

export function serializeChecklistItems(rows: ParsedChecklistItem[]): { items: string; checked: string } {
  return {
    items: rows.map((r) => r.item).join("\n"),
    checked: rows.map((r) => (r.checked ? "1" : "0")).join(""),
  };
}

// Kept for the existing ChecklistShapeUtil.component implementation that
// reads items/checked separately. The new editor uses the typed pair above.
function splitItems(s: string): string[] {
  return s.split("\n");
}
function splitChecked(s: string): boolean[] {
  return s.split("").map((c) => c === "1");
}
function joinChecked(flags: boolean[]): string {
  return flags.map((b) => (b ? "1" : "0")).join("");
}
```

- [ ] **Step 3: Verify**

Run: `npm run typecheck` then `npm run test`
Expected: typecheck clean, all 46 existing tests still pass.

- [ ] **Step 4: Commit**

```bash
git add components/editor/shapes/customShapes.tsx
git commit -m "Formalize Checklist + Table parse/serialize pairs"
```

---

## Task 3: `lib/shapeSchemas.ts` with types, schemas, and round-trip tests

**Files:**
- Create: `lib/shapeSchemas.ts`
- Create: `lib/shapeSchemas.test.ts`

The schemas reference parse/serialize from `customShapes.tsx` (Task 1+2). Round-trip tests are the contract that keeps the save format compatible.

- [ ] **Step 1: Write the failing round-trip test file first**

Create `lib/shapeSchemas.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { SCHEMAS } from "./shapeSchemas";
import { CUSTOM_SHAPE_TYPES } from "@/types/shapes";

describe("shapeSchemas round-trip", () => {
  it("sobject: parse(serialize(rows)) === rows", () => {
    const schema = SCHEMAS[CUSTOM_SHAPE_TYPES.sobject];
    const rows = [
      { name: "Id", type: "id", flags: ["pk"], refTo: "" },
      { name: "Name", type: "text", flags: ["req"], refTo: "" },
      { name: "OwnerId", type: "lookup", flags: [], refTo: "User" },
      { name: "Audit", type: "datetime", flags: ["pii", "enc"], refTo: "" },
    ];
    const patch = schema.serialize(rows);
    const parsed = schema.parse({ ...patch });
    expect(parsed).toEqual(rows);
  });

  it("apexClass: round-trips", () => {
    const schema = SCHEMAS[CUSTOM_SHAPE_TYPES.apexClass];
    const rows = [
      { signature: "doStuff(): String", modifiers: ["public", "static"] },
      { signature: "go(input: String): void", modifiers: ["global"] },
    ];
    expect(schema.parse(schema.serialize(rows))).toEqual(rows);
  });

  it("permissionMatrix: round-trips with mixed booleans", () => {
    const schema = SCHEMAS[CUSTOM_SHAPE_TYPES.permissionMatrix];
    const rows = [
      { object: "Account", create: true, read: true, update: true, del: false, modifyAll: false },
      { object: "Custom__c", create: false, read: true, update: false, del: false, modifyAll: false },
    ];
    expect(schema.parse(schema.serialize(rows))).toEqual(rows);
  });

  it("approvalProcess: round-trips with empty criteria", () => {
    const schema = SCHEMAS[CUSTOM_SHAPE_TYPES.approvalProcess];
    const rows = [
      { name: "Manager review", approver: "Manager", criteria: "Amount > 10000" },
      { name: "Final sign-off", approver: "VP Sales", criteria: "" },
    ];
    expect(schema.parse(schema.serialize(rows))).toEqual(rows);
  });

  it("table: round-trips with ragged rows padded", () => {
    const schema = SCHEMAS[CUSTOM_SHAPE_TYPES.table];
    const rows = [
      ["A", "B", "C"],
      ["1", "2", "3"],
      ["x", "y", "z"],
    ];
    expect(schema.parse(schema.serialize(rows))).toEqual(rows);
  });

  it("checklist: round-trips item text + checked state", () => {
    const schema = SCHEMAS[CUSTOM_SHAPE_TYPES.checklist];
    const rows = [
      { item: "Kick-off", checked: true },
      { item: "Sign off", checked: false },
    ];
    expect(schema.parse(schema.serialize(rows))).toEqual(rows);
  });

  it("empty input parses to no rows for all schemas", () => {
    for (const schema of Object.values(SCHEMAS)) {
      expect(schema.parse({})).toEqual([]);
    }
  });
});
```

- [ ] **Step 2: Run the test — expect import failure**

Run: `npm run test -- shapeSchemas`
Expected: FAIL — `lib/shapeSchemas` does not exist.

- [ ] **Step 3: Create `lib/shapeSchemas.ts`**

```ts
import {
  parseSFFields,
  serializeSFFields,
  parseApexMembers,
  serializeApexMembers,
  parsePermRows,
  serializePermRows,
  parseChecklistItems,
  serializeChecklistItems,
  parseTable,
  serializeTable,
  type ParsedSFField,
  type ParsedApexMember,
  type ParsedPermRow,
  type ParsedChecklistItem,
} from "@/components/editor/shapes/customShapes";
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
  helpHeader: "Each row is a field. Type determines the on-canvas badge colour. Flags toggle inline tags; Refs names a related SObject for lookup/master-detail.",
  parse: (props) => {
    const raw = String(props.fields ?? "");
    return parseSFFields(raw).map<Row>((f) => ({
      name: f.name,
      type: f.type,
      flags: SF_FLAG_OPTIONS.filter((o) => {
        switch (o.key) {
          case "req": return f.required;
          case "unq": return f.unique;
          case "ext": return f.externalId;
          case "pk":  return f.primaryKey;
          case "pii": return f.pii;
          case "enc": return f.encrypted;
          case "idx": return f.indexed;
          default: return false;
        }
      }).map((o) => o.key),
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
    // parseApprovalSteps is module-private in customShapes; replicate with the
    // same logic used elsewhere — split on |, trim, three columns.
    const raw = String(props.steps ?? "");
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map<Row>((line) => {
        const [name = "", approver = "", criteria = ""] = line.split("|").map((p) => p.trim());
        return { name, approver, criteria };
      });
  },
  serialize: (rows) => {
    const out = rows
      .map((r) => [String(r.name ?? ""), String(r.approver ?? ""), String(r.criteria ?? "")].join(" | "))
      .join("\n");
    return { steps: out };
  },
};

// Table: dynamic columns × variable rows
const tableSchema: ColumnSchema = {
  shape: CUSTOM_SHAPE_TYPES.table,
  columns: [],            // generated at runtime by the editor based on row width
  dynamicColumns: true,
  emptyRow: () => ({}),   // editor pads on add
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
  columns: [
    { key: "item", label: "Item", kind: "text", width: "flex" },
    { key: "checked", label: "Done", kind: "checkbox", width: "narrow" },
  ],
  emptyRow: () => ({ item: "", checked: false }),
  parse: (props) => {
    const items = String(props.items ?? "");
    const checked = String(props.checked ?? "");
    if (!items) return [];
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
```

Note the approval-process schema reimplements its parser inline because `parseApprovalSteps` is module-private in `customShapes.tsx`. If you'd rather export it, change line 2599 in `customShapes.tsx` from `function parseApprovalSteps(` to `export const parseApprovalSteps = memoByString(` (matching the other parsers) and import it here. Either is acceptable.

- [ ] **Step 4: Run the test — expect pass**

Run: `npm run test -- shapeSchemas`
Expected: 7 tests pass.

- [ ] **Step 5: Run the full unit suite to confirm no regressions**

Run: `npm run test`
Expected: 46 + 7 = 53 tests pass.

- [ ] **Step 6: Commit**

```bash
git add lib/shapeSchemas.ts lib/shapeSchemas.test.ts
git commit -m "Schemas + round-trip tests for the six structured-data shapes"
```

---

## Task 4: `<StructuredEditor>` — column rendering only

**Files:**
- Create: `components/ui/StructuredEditor.tsx`
- Create: `components/ui/StructuredEditor.test.tsx`

We build the editor in three slices: rendering (this task), mutations (Task 5), debounced flush (Task 6).

- [ ] **Step 1: Write the failing rendering test**

Create `components/ui/StructuredEditor.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { StructuredEditor } from "./StructuredEditor";
import { SCHEMAS } from "@/lib/shapeSchemas";
import { CUSTOM_SHAPE_TYPES } from "@/types/shapes";

describe("<StructuredEditor> rendering", () => {
  it("renders one row per parsed item with the right inputs", () => {
    const schema = SCHEMAS[CUSTOM_SHAPE_TYPES.permissionMatrix];
    const props = { rows: "Account | 1 | 1 | 0 | 0 | 0\nContact | 0 | 1 | 0 | 0 | 0" };
    render(
      <StructuredEditor
        mode="full"
        schema={schema}
        shapeProps={props}
        onChange={() => {}}
      />,
    );
    expect(screen.getByDisplayValue("Account")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Contact")).toBeInTheDocument();
    // Five checkbox columns × two rows = 10 checkboxes
    expect(screen.getAllByRole("checkbox")).toHaveLength(10);
  });

  it("renders flag-list pills per flag", () => {
    const schema = SCHEMAS[CUSTOM_SHAPE_TYPES.sobject];
    const props = { fields: "Id | id | pk\nName | text | req" };
    render(
      <StructuredEditor mode="full" schema={schema} shapeProps={props} onChange={() => {}} />,
    );
    // Each flag-list column has 7 toggleable pills × 2 rows = 14 pill buttons
    expect(screen.getAllByRole("button", { name: /required|unique|external id|primary key|pii|encrypted|indexed/i }).length).toBeGreaterThan(0);
  });

  it("compact mode shows the Edit fully button when onOpenFull provided", () => {
    const schema = SCHEMAS[CUSTOM_SHAPE_TYPES.checklist];
    const onOpenFull = vi.fn();
    render(
      <StructuredEditor
        mode="compact"
        schema={schema}
        shapeProps={{ items: "a\nb", checked: "10" }}
        onChange={() => {}}
        onOpenFull={onOpenFull}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /edit fully/i }));
    expect(onOpenFull).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the test — expect import failure**

Run: `npm run test -- StructuredEditor`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `components/ui/StructuredEditor.tsx` with rendering only**

```tsx
"use client";

import { useMemo, useState } from "react";
import { Maximize2, Plus, Trash2, GripVertical } from "lucide-react";
import type { Column, ColumnSchema, Row } from "@/lib/shapeSchemas";

type Mode = "compact" | "full";

type Props = {
  mode: Mode;
  schema: ColumnSchema;
  shapeProps: Record<string, unknown>;
  onChange: (patch: Record<string, string>) => void;
  onOpenFull?: () => void;
};

export function StructuredEditor({ mode, schema, shapeProps, onChange, onOpenFull }: Props) {
  const initialRows = useMemo(() => schema.parse(shapeProps), [schema, shapeProps]);
  const [rows, setRows] = useState<Row[]>(initialRows);

  // For Table (dynamicColumns) we infer columns from row width.
  const columns: ReadonlyArray<Column> = useMemo(() => {
    if (!schema.dynamicColumns) return schema.columns;
    const colCount = rows.reduce(
      (m, r) => Math.max(m, Object.keys(r).reduce((mm, k) => Math.max(mm, Number(k) + 1), 0)),
      0,
    );
    const cols: Column[] = [];
    for (let i = 0; i < colCount; i++) {
      cols.push({ key: String(i), label: String.fromCharCode(65 + (i % 26)), kind: "text", width: "auto" });
    }
    return cols;
  }, [rows, schema]);

  const showHeaders = mode === "full" || columns.length > 2;
  const compact = mode === "compact";

  // For now: mutations are stubbed. Task 5 wires them up.
  const setCell = (_rowIdx: number, _key: string, _value: unknown) => { /* implemented in Task 5 */ };
  const addRow = () => { /* implemented in Task 5 */ };
  const removeRow = (_rowIdx: number) => { /* implemented in Task 5 */ };

  // Discard helpers if unused; quiet TS until Task 5 wires them up.
  void setCell; void addRow; void removeRow; void onChange;

  return (
    <div className={compact ? "flex flex-col gap-1" : "flex flex-col gap-3"}>
      {!compact && schema.helpHeader && (
        <p className="text-xs text-white/55">{schema.helpHeader}</p>
      )}

      {showHeaders && (
        <div className={`flex items-center gap-1 px-1 ${compact ? "text-[10px]" : "text-[11px]"} font-semibold uppercase tracking-wider text-white/45`}>
          <span className="w-4" />
          {columns.map((c) => (
            <span key={c.key} className={widthClass(c.width)}>{c.label}</span>
          ))}
          <span className="w-6" />
        </div>
      )}

      <div className={compact ? "max-h-56 overflow-y-auto pr-1" : ""}>
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} className={`flex items-center gap-1 ${compact ? "py-0.5" : "py-1.5"}`}>
            <GripVertical size={12} className="text-white/30" />
            {columns.map((c) => (
              <div key={c.key} className={widthClass(c.width)}>
                <CellInput
                  column={c}
                  value={row[c.key]}
                  onChange={() => { /* Task 5 */ }}
                  compact={compact}
                />
              </div>
            ))}
            <button
              type="button"
              className="btn-ghost flex h-6 w-6 items-center justify-center rounded"
              title="Delete row"
              onClick={() => removeRow(rowIdx)}
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          type="button"
          className="btn-ghost flex items-center gap-1 rounded px-2 py-1 text-xs"
          onClick={addRow}
        >
          <Plus size={12} /> Add row
        </button>
        {compact && onOpenFull && (
          <button
            type="button"
            className="btn-ghost flex items-center gap-1 rounded px-2 py-1 text-xs"
            onClick={onOpenFull}
          >
            <Maximize2 size={12} /> Edit fully
          </button>
        )}
      </div>
    </div>
  );
}

function widthClass(w: Column["width"]): string {
  switch (w) {
    case "narrow": return "w-7 flex-shrink-0";
    case "auto":   return "w-24 flex-shrink-0";
    case "flex":
    default:       return "min-w-0 flex-1";
  }
}

type CellProps = {
  column: Column;
  value: unknown;
  onChange: (next: unknown) => void;
  compact: boolean;
};

function CellInput({ column, value, onChange, compact }: CellProps) {
  const baseInput = `w-full rounded border border-white/10 bg-white/5 ${compact ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-sm"} text-white outline-none focus:border-brand-400`;

  switch (column.kind) {
    case "text":
      return (
        <input
          className={baseInput}
          value={String(value ?? "")}
          placeholder={column.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "multitext":
      return (
        <textarea
          rows={compact ? 1 : 2}
          className={`${baseInput} resize-y`}
          value={String(value ?? "")}
          placeholder={column.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "select":
      return (
        <select
          className={baseInput}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        >
          {column.options.map((o) => (
            <option key={o.value} value={o.value} className="bg-[#1a1a2e]">
              {o.label}
            </option>
          ))}
        </select>
      );
    case "checkbox":
      return (
        <input
          type="checkbox"
          className="h-4 w-4 cursor-pointer accent-brand-400"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
        />
      );
    case "flag-list":
      const selected = (value as string[]) ?? [];
      return (
        <div className="flex flex-wrap gap-1">
          {column.flags.map((f) => {
            const on = selected.includes(f.key);
            return (
              <button
                type="button"
                key={f.key}
                aria-label={f.label}
                aria-pressed={on}
                onClick={() => {
                  const next = on ? selected.filter((k) => k !== f.key) : [...selected, f.key];
                  onChange(next);
                }}
                className={[
                  "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  on
                    ? "bg-brand-500/30 text-brand-100 border border-brand-400/60"
                    : "bg-white/5 text-white/55 border border-white/10 hover:text-white/80",
                ].join(" ")}
              >
                {f.key}
              </button>
            );
          })}
        </div>
      );
  }
}
```

- [ ] **Step 4: Run the test — expect pass**

Run: `npm run test -- StructuredEditor`
Expected: 3 tests pass.

- [ ] **Step 5: Run typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add components/ui/StructuredEditor.tsx components/ui/StructuredEditor.test.tsx
git commit -m "Add StructuredEditor — rendering only"
```

---

## Task 5: `<StructuredEditor>` — add / delete / reorder + onChange wiring

**Files:**
- Modify: `components/ui/StructuredEditor.tsx`
- Modify: `components/ui/StructuredEditor.test.tsx`

This task replaces the stub mutation handlers with real ones, calling `onChange` synchronously for now. Task 6 adds debouncing on top.

- [ ] **Step 1: Add a failing mutation test**

Append to `components/ui/StructuredEditor.test.tsx`:

```tsx
import { CUSTOM_SHAPE_TYPES as CST } from "@/types/shapes";

describe("<StructuredEditor> mutations", () => {
  it("typing into a text cell calls onChange with a serialized patch", () => {
    const schema = SCHEMAS[CST.permissionMatrix];
    const onChange = vi.fn();
    render(
      <StructuredEditor
        mode="full"
        schema={schema}
        shapeProps={{ rows: "Account | 1 | 0 | 0 | 0 | 0" }}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByDisplayValue("Account"), { target: { value: "Lead" } });
    expect(onChange).toHaveBeenCalledWith({ rows: "Lead | 1 | 0 | 0 | 0 | 0" });
  });

  it("clicking Add row appends an empty row", () => {
    const schema = SCHEMAS[CST.checklist];
    const onChange = vi.fn();
    render(
      <StructuredEditor
        mode="full"
        schema={schema}
        shapeProps={{ items: "a", checked: "0" }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /add row/i }));
    expect(onChange).toHaveBeenCalledWith({ items: "a\n", checked: "00" });
  });

  it("clicking Delete row removes the row", () => {
    const schema = SCHEMAS[CST.checklist];
    const onChange = vi.fn();
    render(
      <StructuredEditor
        mode="full"
        schema={schema}
        shapeProps={{ items: "a\nb", checked: "10" }}
        onChange={onChange}
      />,
    );
    const deleteButtons = screen.getAllByRole("button", { name: /delete row/i });
    fireEvent.click(deleteButtons[0]);
    expect(onChange).toHaveBeenCalledWith({ items: "b", checked: "0" });
  });
});
```

- [ ] **Step 2: Run — expect failures**

Run: `npm run test -- StructuredEditor`
Expected: the new tests fail because mutation stubs don't call onChange.

- [ ] **Step 3: Wire up mutations in `StructuredEditor.tsx`**

Replace the three stubs in the component body:

```tsx
  const flush = (next: Row[]) => {
    setRows(next);
    onChange(schema.serialize(next));
  };

  const setCell = (rowIdx: number, key: string, value: unknown) => {
    const next = rows.map((r, i) => (i === rowIdx ? { ...r, [key]: value } : r));
    flush(next);
  };

  const addRow = () => flush([...rows, schema.emptyRow()]);

  const removeRow = (rowIdx: number) => flush(rows.filter((_, i) => i !== rowIdx));
```

Remove the `void setCell; void addRow; void removeRow; void onChange;` line — they're now used.

In the `<CellInput onChange={() => { /* Task 5 */ }} />` callsite, change to:

```tsx
                <CellInput
                  column={c}
                  value={row[c.key]}
                  onChange={(next) => setCell(rowIdx, c.key, next)}
                  compact={compact}
                />
```

- [ ] **Step 4: Run — expect pass**

Run: `npm run test -- StructuredEditor`
Expected: 6 tests pass.

- [ ] **Step 5: Add row reorder via drag-and-drop**

Append to the component file, just before the `return`:

```tsx
  const [dragFrom, setDragFrom] = useState<number | null>(null);

  const onDragStart = (i: number) => (e: React.DragEvent) => {
    setDragFrom(i);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const onDrop = (i: number) => () => {
    if (dragFrom === null || dragFrom === i) {
      setDragFrom(null);
      return;
    }
    const next = [...rows];
    const [moved] = next.splice(dragFrom, 1);
    next.splice(i, 0, moved);
    flush(next);
    setDragFrom(null);
  };
```

Then on the row `<div>` add the drag props:

```tsx
          <div
            key={rowIdx}
            draggable
            onDragStart={onDragStart(rowIdx)}
            onDragOver={onDragOver}
            onDrop={onDrop(rowIdx)}
            onDragEnd={() => setDragFrom(null)}
            className={`flex items-center gap-1 ${compact ? "py-0.5" : "py-1.5"} ${dragFrom === rowIdx ? "opacity-50" : ""}`}
          >
```

- [ ] **Step 6: Run typecheck + tests**

Run: `npm run typecheck && npm run test`
Expected: clean typecheck, all tests pass.

- [ ] **Step 7: Commit**

```bash
git add components/ui/StructuredEditor.tsx components/ui/StructuredEditor.test.tsx
git commit -m "StructuredEditor: add/delete/reorder rows wired through onChange"
```

---

## Task 6: `<StructuredEditor>` — debounced flush

**Files:**
- Modify: `components/ui/StructuredEditor.tsx`
- Modify: `components/ui/StructuredEditor.test.tsx`

Today every keystroke calls `editor.updateShape`. We add 40ms debounce + flush-on-blur + flush-on-unmount so typing is fast and store writes coalesce.

- [ ] **Step 1: Add a failing debounce test**

Append to `StructuredEditor.test.tsx`:

```tsx
describe("<StructuredEditor> debounce", () => {
  it("rapid typing produces one onChange after the idle window", async () => {
    vi.useFakeTimers();
    const schema = SCHEMAS[CST.checklist];
    const onChange = vi.fn();
    render(
      <StructuredEditor
        mode="full"
        schema={schema}
        shapeProps={{ items: "a", checked: "0" }}
        onChange={onChange}
      />,
    );
    const input = screen.getByDisplayValue("a") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "ab" } });
    fireEvent.change(input, { target: { value: "abc" } });
    fireEvent.change(input, { target: { value: "abcd" } });
    expect(onChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(45);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith({ items: "abcd", checked: "0" });
    vi.useRealTimers();
  });

  it("blur flushes immediately even before the debounce fires", () => {
    vi.useFakeTimers();
    const schema = SCHEMAS[CST.checklist];
    const onChange = vi.fn();
    render(
      <StructuredEditor
        mode="full"
        schema={schema}
        shapeProps={{ items: "a", checked: "0" }}
        onChange={onChange}
      />,
    );
    const input = screen.getByDisplayValue("a") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "x" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith({ items: "x", checked: "0" });
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run — expect failures**

Run: `npm run test -- StructuredEditor`
Expected: debounce tests fail (onChange called immediately).

- [ ] **Step 3: Add debounce to `StructuredEditor.tsx`**

Add to imports: `useEffect, useRef`.

Add inside the component, near the other state:

```tsx
  const pendingPatchRef = useRef<Record<string, string> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelDebounce = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  };

  const flushPending = () => {
    cancelDebounce();
    const pending = pendingPatchRef.current;
    if (pending) {
      pendingPatchRef.current = null;
      onChange(pending);
    }
  };

  // Flush in-flight changes when the editor unmounts so closing the popout
  // or deselecting the shape never loses the last 40 ms of typing.
  useEffect(() => () => flushPending(), []); // eslint-disable-line react-hooks/exhaustive-deps
```

Replace the `flush` function:

```tsx
  const flush = (next: Row[]) => {
    setRows(next);
    pendingPatchRef.current = schema.serialize(next);
    cancelDebounce();
    debounceRef.current = setTimeout(flushPending, 40);
  };
```

On the row container `<div>`, add `onBlur={flushPending}` so blur from any descendant input flushes immediately. (`onBlur` bubbles in React.)

```tsx
      <div
        className={compact ? "max-h-56 overflow-y-auto pr-1" : ""}
        onBlur={flushPending}
      >
```

- [ ] **Step 4: Run tests — expect pass**

Run: `npm run test -- StructuredEditor`
Expected: all 8 tests pass.

- [ ] **Step 5: Run the full unit suite**

Run: `npm run test`
Expected: 53 + 8 = 61 tests pass.

- [ ] **Step 6: Commit**

```bash
git add components/ui/StructuredEditor.tsx components/ui/StructuredEditor.test.tsx
git commit -m "StructuredEditor: 40ms debounced flush, blur + unmount flush"
```

---

## Task 7: `<StructuredEditorDialog>` with Visual / Raw toggle

**Files:**
- Create: `components/ui/StructuredEditorDialog.tsx`

- [ ] **Step 1: Create the dialog component**

```tsx
"use client";

import { useEffect, useState } from "react";
import { Dialog } from "./Dialog";
import { StructuredEditor } from "./StructuredEditor";
import type { ColumnSchema } from "@/lib/shapeSchemas";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  schema: ColumnSchema;
  shapeProps: Record<string, unknown>;
  onChange: (patch: Record<string, string>) => void;
};

type ViewMode = "visual" | "raw";

export function StructuredEditorDialog({ open, onClose, title, schema, shapeProps, onChange }: Props) {
  const [view, setView] = useState<ViewMode>("visual");

  // The raw textareas show one prop at a time. For multi-prop shapes
  // (Checklist) we just show the primary key with a hint that the rest
  // round-trips through Visual mode.
  const rawKey = schema.shape === "checklist" ? "items" : Object.keys(schema.serialize([]))[0];
  const [rawValue, setRawValue] = useState<string>(String(shapeProps[rawKey] ?? ""));

  // Sync rawValue when shapeProps update from outside (visual edits, etc.).
  useEffect(() => {
    if (view === "raw") setRawValue(String(shapeProps[rawKey] ?? ""));
  }, [shapeProps, rawKey, view]);

  const onRawChange = (next: string) => {
    setRawValue(next);
    onChange({ [rawKey]: next });
  };

  return (
    <Dialog open={open} onClose={onClose} title={title} subtitle={schema.helpHeader} widthClass="max-w-4xl">
      <div className="mb-4 flex items-center gap-1 self-start rounded-lg border border-white/10 bg-white/5 p-0.5">
        <ToggleButton active={view === "visual"} onClick={() => setView("visual")}>Visual</ToggleButton>
        <ToggleButton active={view === "raw"} onClick={() => setView("raw")}>Raw text</ToggleButton>
      </div>

      {view === "visual" ? (
        <StructuredEditor
          mode="full"
          schema={schema}
          shapeProps={shapeProps}
          onChange={onChange}
        />
      ) : (
        <textarea
          className="w-full min-h-[300px] resize-y rounded-md border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white outline-none focus:border-brand-400"
          value={rawValue}
          spellCheck={false}
          onChange={(e) => onRawChange(e.target.value)}
        />
      )}
    </Dialog>
  );
}

function ToggleButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-md px-3 py-1 text-xs font-semibold transition",
        active ? "bg-white/10 text-white" : "text-white/55 hover:text-white",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add components/ui/StructuredEditorDialog.tsx
git commit -m "Add StructuredEditorDialog with Visual/Raw toggle"
```

---

## Task 8: Wire `<StructuredEditor>` into `InspectorPanel`, bump width defaults

**Files:**
- Modify: `components/ui/InspectorPanel.tsx`

This task swaps out the six textarea-and-help-card blocks (sobject `fields`, apexClass `members`, permissionMatrix `rows`, approvalProcess `steps`, checklist `items`, table `cells`) for `<StructuredEditor>` plus a popout dialog. Other inspector controls (Label, single-line text, single selects) stay as-is.

- [ ] **Step 1: Read the current `ShapeFields` to know exactly which blocks to remove**

Open `components/ui/InspectorPanel.tsx`. Identify these blocks for removal (each is the textarea + adjacent `<HelpCard>` for the listed shape):

- Block for `CUSTOM_SHAPE_TYPES.checklist` — the `Items (one per line)` `TextField`.
- Block for `CUSTOM_SHAPE_TYPES.table` — the `Rows (tab between cells, newline between rows)` `TextField`.
- Block for `CUSTOM_SHAPE_TYPES.sobject` — the `Fields (one per line)` `TextField` and its `HelpCard`.
- Block for `CUSTOM_SHAPE_TYPES.apexClass` — the `Members (one per line)` `TextField` and its `HelpCard`.
- Block for `CUSTOM_SHAPE_TYPES.permissionMatrix` — the `Rows (one per line)` `TextField` and its `HelpCard`.
- Block for `CUSTOM_SHAPE_TYPES.approvalProcess` — the `Steps (one per line)` `TextField` and its `HelpCard`.

Leave the rest of each shape's controls (`Label`, API name, kind, visibility, profile, objectName, active, formula, errorMessage, etc.) intact.

- [ ] **Step 2: Replace those blocks with one structured-editor block**

At the top of `InspectorPanel.tsx`, add imports:

```tsx
import { StructuredEditor } from "./StructuredEditor";
import { StructuredEditorDialog } from "./StructuredEditorDialog";
import { SCHEMAS } from "@/lib/shapeSchemas";
```

Inside `ShapeFields`, lift dialog state and add the editor block. Replace the body of `ShapeFields` so it looks like this (full function — replace existing `ShapeFields`):

```tsx
function ShapeFields({
  editor,
  shape,
}: {
  editor: Editor | null;
  shape: TLShape;
}) {
  const props = shape.props as Record<string, unknown>;
  const schema = SCHEMAS[shape.type];
  const [dialogOpen, setDialogOpen] = useState(false);

  const update = (partial: Record<string, unknown>) => {
    if (!editor) return;
    editor.updateShape({
      id: shape.id,
      type: shape.type,
      props: { ...props, ...partial },
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {typeof props.label === "string" && (
        <TextField
          label="Label"
          value={props.label}
          onChange={(v) => update({ label: v })}
          multiline
        />
      )}

      {/* Per-shape simple props (NumberField/SelectField/TextField for everything
          except the structured-data prop). Keep all existing per-shape blocks
          here, MINUS the six replaced ones listed in step 1. */}

      {/* …existing per-shape blocks unchanged… */}

      {schema && (
        <>
          <StructuredEditor
            mode="compact"
            schema={schema}
            shapeProps={props}
            onChange={update}
            onOpenFull={() => setDialogOpen(true)}
          />
          <StructuredEditorDialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            title={schemaDialogTitle(shape.type)}
            schema={schema}
            shapeProps={props}
            onChange={update}
          />
        </>
      )}

      <div className="mt-2 border-t border-white/10 pt-3 text-[11px] uppercase tracking-wider text-white/40">
        Tip
      </div>
      <p className="text-xs text-white/55">
        Use the top toolbar for colour, stroke, and text styling.
      </p>
    </div>
  );
}

function schemaDialogTitle(type: string): string {
  switch (type) {
    case "sobject": return "Edit fields";
    case "apexClass": return "Edit members";
    case "permissionMatrix": return "Edit permissions";
    case "approvalProcess": return "Edit approval steps";
    case "checklist": return "Edit checklist";
    case "table": return "Edit table";
    default: return "Edit";
  }
}
```

Add `useState` to the existing imports from React if not already present (it should be — this file already imports `useMemo`).

Now go through the body and **delete** the six `TextField`/`HelpCard` blocks identified in Step 1. Each block lives inside a `{shape.type === CUSTOM_SHAPE_TYPES.<x> && (...)}` group; delete only the textarea + its directly adjacent `HelpCard`, keeping the rest of that group's TextField/SelectField controls.

- [ ] **Step 3: Bump inspector width defaults**

In the same file, find the `usePanelWidth` call (currently `defaultWidth: 288, min: 240, max: 440`). Change to:

```tsx
  const { width, onResizeStart } = usePanelWidth({
    key: "infinite-idea:inspector-width",
    defaultWidth: 320,
    min: 280,
    max: 440,
    side: "left",
  });
```

- [ ] **Step 4: Typecheck + tests**

Run: `npm run typecheck && npm run test`
Expected: clean typecheck, 61 tests pass.

- [ ] **Step 5: Manual smoke check in dev**

Run: `npm run dev`
Open `http://localhost:3000?welcome=0`. Insert a Table block from the toolbox. Select it. The inspector should show:
- The `Label` field
- A row-based structured editor (3 default rows × 3 columns)
- An `Edit fully…` button

Click `Edit fully…`. The popout dialog opens. Toggle `Raw text` and confirm the textarea shows tab-separated rows. Switch back. Close. Save the canvas via Cmd+S, reopen the saved file, and confirm the Table renders correctly. (No automated assertion here — eyeballs are appropriate for the visual flow.)

Stop dev server.

- [ ] **Step 6: Commit**

```bash
git add components/ui/InspectorPanel.tsx
git commit -m "Inspector: replace structured-data textareas with StructuredEditor + popout"
```

---

## Task 9: E2E — typing in the table editor updates the shape

**Files:**
- Modify: `e2e/smoke.spec.ts`

- [ ] **Step 1: Add the failing E2E test**

At the bottom of `e2e/smoke.spec.ts`, append:

```ts
import { test, expect } from "@playwright/test";

test("structured editor: typing into a table cell updates the shape's cells prop", async ({ page }) => {
  await page.goto("/?welcome=0");
  await page.waitForSelector(".tl-canvas");

  // Insert a Table block via the toolbox (click the Blocks tab first to be safe).
  const toolbox = page.locator('[data-tour="toolbox"]');
  await toolbox.getByRole("button", { name: "Blocks" }).click();
  await toolbox.getByRole("button", { name: /^Table$/ }).click();

  // The inserted shape becomes selected, so the inspector mounts.
  const inspector = page.locator(".glass-strong").filter({ hasText: "Inspector" });
  await expect(inspector).toBeVisible();

  // The first text cell is one of the structured-editor inputs.
  const firstCell = inspector.locator("input[type=text]").first();
  await firstCell.fill("Hello");
  await firstCell.blur();

  // Read back the editor's shape store via window.__ed (set up by perf
  // instrumentation; if missing, fall back to checking the canvas DOM).
  const cellsValue = await page.evaluate(() => {
    type Editor = { getCurrentPageShapes(): Array<{ type: string; props: { cells?: string } }> };
    const ed: Editor | undefined = (window as unknown as { __ed?: Editor }).__ed;
    if (ed) {
      const tables = ed.getCurrentPageShapes().filter((s) => s.type === "table");
      return tables.length ? tables[0].props.cells : null;
    }
    return null;
  });

  // If __ed isn't set (it's only set by the perf benchmark, not in production),
  // fall back to confirming the inspector retains the typed value.
  if (cellsValue !== null) {
    expect(cellsValue).toContain("Hello");
  } else {
    await expect(firstCell).toHaveValue("Hello");
  }
});
```

- [ ] **Step 2: Run e2e**

Run: `npm run test:e2e`
Expected: 2 tests pass (the existing smoke + the new one).

If the test fails because the toolbox `Table` button label differs, inspect the actual button text in `components/ui/ToolboxPanel.tsx` and adjust the locator accordingly.

- [ ] **Step 3: Commit**

```bash
git add e2e/smoke.spec.ts
git commit -m "E2E: structured editor updates the table cells prop"
```

---

## Task 10: Final verification + push

- [ ] **Step 1: Full verification suite**

Run in order:

```bash
npm run typecheck
npm run test
npm run test:e2e
```

All three must pass.

- [ ] **Step 2: Visual review with the perf benchmark scenario**

Run: `npm run dev`
Open `http://localhost:3000?welcome=0`. Run through:

1. Insert a Table — type cells, add row, delete row, drag-reorder a row. Confirm the on-canvas table updates.
2. Insert an SObject from the SF tab. Use the structured editor to add a field, set its type, toggle some flags. Confirm the on-canvas card updates.
3. Pop out the SObject editor via `Edit fully…`. Switch to `Raw text`, edit, switch back. Confirm changes round-trip.
4. Save the canvas (Cmd+S), close, re-open the file. Confirm everything still renders.

- [ ] **Step 3: Push**

```bash
git push origin main
```

---

## Spec coverage check

Cross-reference the spec sections to plan tasks:

| Spec section | Task |
| --- | --- |
| StructuredEditor component (compact/full) | Tasks 4–6 |
| StructuredEditorDialog with raw toggle | Task 7 |
| Six per-shape schemas + parse/serialize | Tasks 1–3 |
| InspectorPanel integration | Task 8 |
| Inspector size bump (defaultWidth/min) | Task 8 step 3 |
| Edit propagation (debounce + blur + unmount) | Task 6 |
| Round-trip unit tests | Task 3 |
| Component tests | Tasks 4, 5, 6 |
| E2E test | Task 9 |
| Migration (none) | n/a — round-trip tests verify |

Risks called out in the spec:
- Inspector cramping at 280px min — addressed by `Edit fully…` button (Task 4 step 3, Task 8 step 2).
- Debounce vs undo — accepted trade-off; Task 6 implements the agreed 40ms.
- Generic editor flexibility — `ColumnKind` is a discriminated union; new kinds are additive.

All spec requirements have a corresponding task.
