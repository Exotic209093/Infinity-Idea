import { describe, expect, it } from "vitest";
import {
  parseDescribeJson,
  parseObjectXml,
  parseMetadata,
  parseMetadataBatch,
  relationshipsAmong,
  toFieldsText,
} from "./sfImporter";

describe("parseDescribeJson", () => {
  it("parses a simple Account describe", () => {
    const raw = JSON.stringify({
      name: "Account",
      label: "Account",
      custom: false,
      fields: [
        { name: "Id", type: "id", nillable: false, unique: true },
        { name: "Name", type: "string", nillable: false },
        { name: "Industry", type: "picklist" },
        { name: "OwnerId", type: "reference", referenceTo: ["User"] },
      ],
    });
    const obj = parseDescribeJson(raw);
    expect(obj.apiName).toBe("Account");
    expect(obj.sobjectType).toBe("standard");
    expect(obj.fields).toHaveLength(4);
    const owner = obj.fields.find((f) => f.name === "OwnerId")!;
    expect(owner.type).toBe("lookup");
    expect(owner.refTo).toBe("User");
    const name = obj.fields.find((f) => f.name === "Name")!;
    expect(name.required).toBe(true);
    const id = obj.fields.find((f) => f.name === "Id")!;
    expect(id.primaryKey).toBe(true);
  });

  it("detects custom objects by API name suffix", () => {
    const raw = JSON.stringify({
      name: "Booking__c",
      fields: [{ name: "Name", type: "string" }],
    });
    const obj = parseDescribeJson(raw);
    expect(obj.sobjectType).toBe("custom");
  });

  it("marks master-detail references via cascadeDelete", () => {
    const raw = JSON.stringify({
      name: "InvoiceLine__c",
      fields: [
        {
          name: "Invoice__c",
          type: "reference",
          referenceTo: ["Invoice__c"],
          cascadeDelete: true,
        },
      ],
    });
    const obj = parseDescribeJson(raw);
    expect(obj.fields[0].type).toBe("masterDetail");
  });

  it("surfaces a readable error for invalid JSON", () => {
    expect(() => parseDescribeJson("{not valid")).toThrow(/valid JSON/i);
  });

  it("requires a fields array", () => {
    expect(() =>
      parseDescribeJson(JSON.stringify({ name: "X" })),
    ).toThrow(/fields/i);
  });

  it("unwraps a result envelope", () => {
    const raw = JSON.stringify({
      result: {
        name: "Contact",
        fields: [{ name: "LastName", type: "string", nillable: false }],
      },
    });
    const obj = parseDescribeJson(raw);
    expect(obj.apiName).toBe("Contact");
    expect(obj.fields[0].name).toBe("LastName");
  });
});

describe("parseObjectXml", () => {
  it("parses a minimal CustomObject", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
  <label>Booking</label>
  <fields>
    <fullName>Name</fullName>
    <type>Text</type>
    <required>true</required>
  </fields>
  <fields>
    <fullName>Account__c</fullName>
    <type>Lookup</type>
    <referenceTo>Account</referenceTo>
  </fields>
</CustomObject>`;
    const obj = parseObjectXml(xml);
    expect(obj.label).toBe("Booking");
    expect(obj.apiName).toBe("Booking__c");
    expect(obj.sobjectType).toBe("custom");
    // Should have prepended an Id row + the two XML fields
    expect(obj.fields).toHaveLength(3);
    const account = obj.fields.find((f) => f.name === "Account__c")!;
    expect(account.type).toBe("lookup");
    expect(account.refTo).toBe("Account");
  });

  it("throws on invalid XML", () => {
    expect(() => parseObjectXml("<not><closed")).toThrow(/XML/i);
  });
});

describe("parseMetadata auto-detect", () => {
  it("picks JSON when input starts with {", () => {
    const raw = JSON.stringify({
      name: "Account",
      fields: [{ name: "Id", type: "id" }],
    });
    expect(() => parseMetadata(raw)).not.toThrow();
  });

  it("picks XML when input starts with <?xml", () => {
    const raw = `<?xml version="1.0"?><CustomObject><label>X</label><fields><fullName>N</fullName><type>Text</type></fields></CustomObject>`;
    expect(() => parseMetadata(raw)).not.toThrow();
  });
});

describe("parseMetadataBatch", () => {
  it("parses a JSON array of describes", () => {
    const raw = JSON.stringify([
      { name: "Account", fields: [{ name: "Id", type: "id" }] },
      { name: "Contact", fields: [{ name: "LastName", type: "string" }] },
    ]);
    const objs = parseMetadataBatch(raw);
    expect(objs).toHaveLength(2);
    expect(objs.map((o) => o.apiName)).toEqual(["Account", "Contact"]);
  });

  it("parses a { sobjects: [...] } envelope", () => {
    const raw = JSON.stringify({
      sobjects: [
        { name: "Account", fields: [{ name: "Id", type: "id" }] },
        { name: "Contact", fields: [{ name: "Id", type: "id" }] },
      ],
    });
    const objs = parseMetadataBatch(raw);
    expect(objs).toHaveLength(2);
  });

  it("parses a single-object describe as a 1-element batch", () => {
    const raw = JSON.stringify({
      name: "Account",
      fields: [{ name: "Id", type: "id" }],
    });
    const objs = parseMetadataBatch(raw);
    expect(objs).toHaveLength(1);
    expect(objs[0].apiName).toBe("Account");
  });

  it("parses an .object XML as a 1-element batch", () => {
    const raw = `<?xml version="1.0"?><CustomObject><label>X</label><fields><fullName>Name</fullName><type>Text</type></fields></CustomObject>`;
    const objs = parseMetadataBatch(raw);
    expect(objs).toHaveLength(1);
  });

  it("errors on empty input", () => {
    expect(() => parseMetadataBatch("   ")).toThrow(/paste/i);
  });
});

describe("relationshipsAmong", () => {
  it("links lookup fields to known targets only", () => {
    const objs = parseMetadataBatch(
      JSON.stringify({
        sobjects: [
          {
            name: "Account",
            fields: [{ name: "Id", type: "id" }],
          },
          {
            name: "Contact",
            fields: [
              { name: "Id", type: "id" },
              {
                name: "AccountId",
                type: "reference",
                referenceTo: ["Account"],
              },
              {
                name: "OwnerId",
                type: "reference",
                referenceTo: ["User"], // User not in batch — skip
              },
            ],
          },
        ],
      }),
    );
    const rels = relationshipsAmong(objs);
    expect(rels).toHaveLength(1);
    expect(rels[0]).toMatchObject({
      fromApi: "Contact",
      fromField: "AccountId",
      toApi: "Account",
      kind: "lookup",
    });
  });

  it("preserves master-detail kind", () => {
    const objs = parseMetadataBatch(
      JSON.stringify({
        sobjects: [
          { name: "Invoice__c", fields: [{ name: "Id", type: "id" }] },
          {
            name: "InvoiceLine__c",
            fields: [
              { name: "Id", type: "id" },
              {
                name: "Invoice__c",
                type: "reference",
                referenceTo: ["Invoice__c"],
                cascadeDelete: true,
              },
            ],
          },
        ],
      }),
    );
    const rels = relationshipsAmong(objs);
    expect(rels).toHaveLength(1);
    expect(rels[0].kind).toBe("masterDetail");
  });
});

describe("toFieldsText", () => {
  it("serialises to the shape's pipe format", () => {
    const text = toFieldsText({
      label: "Account",
      apiName: "Account",
      sobjectType: "standard",
      fields: [
        {
          name: "Id",
          type: "id",
          required: false,
          unique: true,
          externalId: false,
          primaryKey: true,
          refTo: "",
        },
        {
          name: "OwnerId",
          type: "lookup",
          required: false,
          unique: false,
          externalId: false,
          primaryKey: false,
          refTo: "User",
        },
      ],
    });
    expect(text).toBe(["Id | id | pk,unq", "OwnerId | lookup |  | User"].join("\n"));
  });
});
