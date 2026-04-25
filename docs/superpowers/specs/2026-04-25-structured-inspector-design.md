# Structured-data inspector

**Date:** 2026-04-25
**Status:** Design — pending review

## Problem

Six custom shapes in the editor today expose their structured data as a single `<textarea>` whose contents are pipe / tab / newline-delimited strings:

| Shape            | Field               | Format                                    |
| ---------------- | ------------------- | ----------------------------------------- |
| Table            | `cells`             | tab between cells, newline between rows   |
| PermissionMatrix | `rows`              | `Object \| C \| R \| U \| D \| X`         |
| SObject          | `fields`            | `Name \| type \| flags \| refTo`          |
| ApprovalProcess  | `steps`             | `Step name \| Approver \| Criteria`       |
| ApexClass        | `members`           | `signature \| modifiers`                  |
| Checklist        | `items` + `checked` | `\n`-delimited items, `1`/`0` flags       |

Editing this in a 320px-wide textarea is bad: long rows wrap, alignment vanishes, the format is invisible until you fat-finger and break it, and there is no per-row reorder, no per-row delete, no inline help. The inspector also feels physically too small for batch edits.

## Goal

Replace the textarea-based editing for these six shapes with a schema-driven structured editor that:

1. Works **inline** in the inspector for quick tweaks.
2. Works **focused** in a popout dialog for batch edits.
3. Is **one** component, configured per shape via a column schema.
4. Round-trips with the existing save-file format — no migration, no version bump.

## Non-goals

- Redesigning shapes that don't use textareas for structured data.
- Changing the on-canvas appearance of shapes.
- Adding new shape types or new structured-data props.
- Reworking the inspector's other controls (Label, single-line text, single selects, NumberField, etc.).

## Architecture

```text
InspectorPanel.ShapeFields
   └── <StructuredEditor mode="compact" schema={…} shapeProps={…} onChange={…} />
       │  (renders rows + an "Edit fully…" button)
       │
       └── on click → <StructuredEditorDialog schema={…} shapeProps={…} onChange={…} />
                       └── <StructuredEditor mode="full" … />
                           (same component, modal-sized, with header help + raw toggle)
```

Per-shape schemas live in `lib/shapeSchemas.ts` and are imported by both the inspector
and the dialog. The editor itself is generic and shape-agnostic.

## Components

### `components/ui/StructuredEditor.tsx` (new)

Generic, schema-driven row editor. Takes:

```ts
type Props = {
  mode: "compact" | "full";
  schema: ColumnSchema;
  shapeProps: Record<string, unknown>;       // full shape props
  onChange: (patch: Record<string, string>) => void;  // partial props patch
  onOpenFull?: () => void;                   // shown only in compact mode
};
```

The editor parses rows from `shapeProps` via `schema.parse`, mutates them locally,
then emits a partial-props patch via `schema.serialize`. The caller spreads the
patch into `editor.updateShape`. This handles Checklist's two-key case (items +
checked) the same way as the single-key shapes — no special-casing needed.

Behaviour:

- Holds local state `rows: Row[]` parsed from `shapeProps` via `schema.parse(shapeProps)`.
- Renders one `<EditorRow>` per row plus a `+ Add row` button. Table also renders `+ Add column`.
- Each row has a drag handle (left), the column inputs, and a delete button (right).
- Reorder uses HTML5 drag-and-drop (same pattern as PagesBar).
- On any row mutation: serialize via `schema.serialize(rows)` → call `onChange(patch)` after a 40ms debounce.
- Flushes the pending change immediately on input blur and on unmount.
- In `mode="compact"`: column headers hidden when ≤2 columns; tighter padding; max-height with internal scroll; renders the `Edit fully…` button at the bottom.
- In `mode="full"`: column headers always shown; generous padding; no `Edit fully` button; renders the schema's `helpHeader` content above the rows.

### `components/ui/StructuredEditorDialog.tsx` (new)

Thin wrapper around the existing `Dialog` component. Props mirror `StructuredEditor` plus `open` / `onClose` / `title`. Hosts:

- A `Visual` / `Raw text` segmented control in the dialog header.
- The editor in Visual mode, a single tall textarea in Raw mode.
- Switching modes parses or serializes once on toggle. Raw mode edits flow back through the same `onChange`.

`max-w-4xl`, capped at `calc(100vh - 32px)`, scrollable body.

### `lib/shapeSchemas.ts` (new)

```ts
export type ColumnKind =
  | { kind: "text" }
  | { kind: "multitext" }
  | { kind: "select"; options: { label: string; value: string }[] }
  | { kind: "checkbox" }
  | { kind: "flag-list"; flags: { key: string; label: string }[] };

export type Column = ColumnKind & {
  key: string;
  label: string;
  width?: "narrow" | "auto" | "flex";
  placeholder?: string;
};

export type ColumnSchema = {
  shape: string;                      // matches CUSTOM_SHAPE_TYPES
  columns: Column[];                  // empty for Table — see below
  dynamicColumns?: boolean;           // true for Table
  helpHeader?: React.ReactNode;       // shown in popout
  parse: (value: string, propsLike?: Record<string, unknown>) => Row[];
  serialize: (rows: Row[]) => string | { [propKey: string]: string };
  // For Checklist the prop is split across `items` + `checked`; serialize
  // returns an object so the editor can write both keys at once.
};

export const SCHEMAS: Record<string, ColumnSchema>;
```

Six schemas, each reusing the existing `parse*` functions for the parse half:

Each shape's columns:

- **`checklist`** — `text` (item) + `checkbox` (checked). Writes both `items` and `checked` via the partial-props patch.
- **`table`** — `dynamicColumns: true`, all `text`. Parses by tab/newline; row width = max row length, padded with empty strings.
- **`sobject`** — `text` (name), `select` (the 24 `SF_FIELD_TYPES`), `flag-list` (`req`, `unq`, `ext`, `pk`, `pii`, `enc`, `idx`), `text` (refTo).
- **`apexClass`** — `text` (signature), `flag-list` (`public`, `global`, `private`, `static`, `virtual`, `override`, `abstract`).
- **`permissionMatrix`** — `text` (object), five `checkbox` (C, R, U, D, X).
- **`approvalProcess`** — `text` (name), `text` (approver), `multitext` (criteria).

Each shape gets a matching `serializeXxx` exported from `customShapes.tsx`, written so `serialize(parse(s))` is a string-equal identity for any well-formed input. `parseXxx` already exists for SObject / Apex / Perm / Approval; only `serializeXxx` companions are added.

## Inspector integration

`InspectorPanel.ShapeFields` adds a single switch on `shape.type`:

```tsx
const schema = SCHEMAS[shape.type];
if (schema) {
  return (
    <StructuredEditor
      mode="compact"
      schema={schema}
      value={ /* shape's raw prop */ }
      onChange={(next) => editor.updateShape({ id: shape.id, type: shape.type, props: { …next } })}
      onOpenFull={() => setDialogOpen(true)}
    />
  );
}
```

The existing 6 textarea blocks plus their adjacent `<HelpCard>` content are removed. The `<HelpCard>` wording moves into the schema's `helpHeader` so it lives in the popout, not in the cramped inspector.

The current `Label` / API-name / kind / visibility / sharing / object-name / etc. fields stay as-is — they remain regular `TextField` / `SelectField` controls rendered above the structured editor.

The popout dialog state lives in `InspectorPanel`, gated by `{open && <StructuredEditorDialog … />}` to keep the dialog out of the React tree when closed.

### Inspector size

To give the inline editor breathing room, bump `usePanelWidth` defaults for the inspector:

- `defaultWidth`: 288 → 320
- `min`: 240 → 280
- `max`: unchanged at 440

(One-line change at the call site.)

## Edit propagation

Live typing must not flood the tldraw store. The editor uses local row state and a small debounce so:

- Per-keystroke: local state updates → render is fast, no store writes.
- 40ms idle after the last edit → serialize, call `onChange`.
- Input `onBlur` → flush immediately so undo/redo boundaries are clean.
- Component unmount → flush any pending change so closing the popout / deselecting the shape never loses an in-flight edit.

Tldraw's history records each flushed update as a normal mutation. We do not call `markHistoryStoppingPoint` between flushes; consecutive 40ms-debounced updates collapse into one history step the way typing in a tldraw text shape already does.

## Error handling

- `schema.parse` is total: malformed input produces a best-effort row list (existing `parse*` functions already do this — they ignore unparseable lines, default unknown types to `text`, etc.).
- The `Raw text` toggle uses the same parser, so users cannot get into a state where the visual view disagrees with the raw view: switching from Raw → Visual reparses; the visual edit overwrites the raw text on the next flush.
- If a serialize ever throws (it shouldn't — serializers are pure string joins), the editor keeps the local row state and skips the flush. No silent corruption.

## Testing

**Unit tests (vitest):**

- `lib/shapeSchemas.test.ts` — for each of the six schemas, assert `serialize(parse(sample)) === sample` over a representative sample plus edge cases (empty string, single row, trailing whitespace, all flags off, all flags on).
- Round-trip is the contract that protects save-file compatibility.

**Component tests (vitest + RTL):**

- `StructuredEditor` rendering: each column kind renders the right input and emits the right serialized output.
- Add row, delete row, reorder rows produce expected serialized output.
- Debounce: rapid typing produces exactly one onChange call after the idle window; blur flushes immediately.

**E2E (Playwright):**

- Existing `e2e/smoke.spec.ts` continues to pass.
- Add one spec: insert a Table block via the toolbox, type cells via the structured editor, verify the canvas shape's `cells` prop reflects the input.

## Migration

None. The on-disk save format is unchanged because `serialize ∘ parse` is the identity (and is unit-tested as such). Existing `.infidoc.json` files load and save identically.

## Out of scope

The following are tempting adjacent improvements that are deliberately deferred:

- Pasting CSV / TSV directly into the structured editor (would be nice for Table; doable later as a Raw-mode → Visual-mode transition).
- Per-cell validation (e.g. SObject `refTo` must reference an existing SObject on the canvas).
- Keyboard shortcuts for row-level actions inside the editor (`Cmd+Backspace` to delete row, `Tab` to next column, etc.). The current change already adds keyboard accessibility via the native inputs; richer shortcuts are a follow-up.
- Fixing the structurally-related-but-distinct issue that tldraw arrows do not auto-route around custom shape children (unrelated to this redesign).

## Risks

- **Inspector horizontal cramping at min width.** A six-column PermissionMatrix row at 280px is tight. Mitigated by: (a) the five checkbox columns are minimal width (≈18px each), (b) `Edit fully…` is one click away, (c) the inspector is resizable up to 440px.
- **Debounced flushes vs. fast undo.** A user typing then immediately pressing Cmd+Z expects to undo the typed text. With 40ms debounce + onBlur flush, Cmd+Z while focused is handled by tldraw normally (text in the store is the last flushed value). The risk is the very last 40ms of typing being absent from the undo history. Acceptable trade-off.
- **Generic editor's flexibility ceiling.** If a future shape has columns the schema doesn't model (e.g. a date-picker column), we add a new `ColumnKind` variant — strictly additive. Nothing the existing six shapes need is missing today.
