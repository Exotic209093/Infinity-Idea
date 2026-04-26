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

  it("table: round-trips with rectangular rows", () => {
    const schema = SCHEMAS[CUSTOM_SHAPE_TYPES.table];
    const rows = [
      { "0": "A", "1": "B", "2": "C" },
      { "0": "1", "1": "2", "2": "3" },
      { "0": "x", "1": "y", "2": "z" },
    ];
    expect(schema.parse(schema.serialize(rows))).toEqual(rows);
  });

  it("table: pads ragged rows on parse so all rows are rectangular", () => {
    const schema = SCHEMAS[CUSTOM_SHAPE_TYPES.table];
    // Row 0 has 3 cells, row 1 has 1, row 2 has 2 — width should be 3.
    const parsed = schema.parse({ cells: "A\tB\tC\nD\nE\tF" });
    expect(parsed).toEqual([
      { "0": "A", "1": "B", "2": "C" },
      { "0": "D", "1": "", "2": "" },
      { "0": "E", "1": "F", "2": "" },
    ]);
    // After serializing the padded rows we get a rectangular grid string.
    const round = schema.parse(schema.serialize(parsed));
    expect(round).toEqual(parsed);
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
