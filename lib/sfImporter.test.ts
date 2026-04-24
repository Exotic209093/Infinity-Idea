import { describe, expect, it } from "vitest";
import {
  parseApexSource,
  parseDescribeJson,
  parseFlowXml,
  parseObjectXml,
  parseMetadata,
  parseMetadataBatch,
  parseProfileXml,
  relationshipsAmong,
  toFieldsText,
  toMembersText,
  toPermRowsText,
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

describe("parseApexSource", () => {
  it("parses a with-sharing public class with methods", () => {
    const src = `public with sharing class AccountService {
      public static Id createAccount(Account a) {
        insert a;
        return a.Id;
      }
      public void linkContact(Id accountId, Id contactId) {
      }
      private Boolean sendWelcome(Id cId) {
        return true;
      }
    }`;
    const apex = parseApexSource(src);
    expect(apex.apiName).toBe("AccountService");
    expect(apex.classKind).toBe("class");
    expect(apex.visibility).toBe("public");
    expect(apex.sharing).toBe("with");
    expect(apex.members).toHaveLength(3);
    expect(apex.members[0].signature).toBe("createAccount(Account a): Id");
    expect(apex.members[0].modifiers).toContain("public");
    expect(apex.members[0].modifiers).toContain("static");
  });

  it("handles without sharing and global visibility", () => {
    const src = `global without sharing class Api {
      global static String ping() { return 'ok'; }
    }`;
    const apex = parseApexSource(src);
    expect(apex.visibility).toBe("global");
    expect(apex.sharing).toBe("without");
  });

  it("detects @isTest as test kind", () => {
    const src = `@isTest
private class AccountServiceTest {
  static testMethod void t() { }
}`;
    const apex = parseApexSource(src);
    expect(apex.classKind).toBe("test");
  });

  it("handles interfaces without bodies", () => {
    const src = `public interface Notifier {
      void notify(String msg);
      Boolean isReady();
    }`;
    const apex = parseApexSource(src);
    expect(apex.classKind).toBe("interface");
    expect(apex.members).toHaveLength(2);
    expect(apex.members[0].signature).toBe("notify(String msg): void");
  });

  it("errors when no class declaration is found", () => {
    expect(() => parseApexSource("just some text")).toThrow(/declaration/i);
  });
});

describe("toMembersText", () => {
  it("serialises to the pipe member format", () => {
    const text = toMembersText({
      label: "X",
      apiName: "X",
      classKind: "class",
      visibility: "public",
      sharing: "with",
      members: [
        {
          signature: "foo(String a): Integer",
          modifiers: ["public", "static"],
        },
        {
          signature: "bar()",
          modifiers: [],
        },
      ],
    });
    expect(text).toBe(
      ["foo(String a): Integer | public, static", "bar()"].join("\n"),
    );
  });
});

describe("parseProfileXml", () => {
  it("extracts object permissions and label", () => {
    const xml = `<?xml version="1.0"?>
<Profile>
  <fullName>Sales User</fullName>
  <objectPermissions>
    <allowCreate>true</allowCreate>
    <allowRead>true</allowRead>
    <allowEdit>true</allowEdit>
    <allowDelete>false</allowDelete>
    <modifyAllRecords>false</modifyAllRecords>
    <object>Account</object>
  </objectPermissions>
  <objectPermissions>
    <allowCreate>false</allowCreate>
    <allowRead>true</allowRead>
    <allowEdit>false</allowEdit>
    <allowDelete>false</allowDelete>
    <modifyAllRecords>false</modifyAllRecords>
    <object>Lead</object>
  </objectPermissions>
</Profile>`;
    const p = parseProfileXml(xml);
    expect(p.label).toBe("Sales User");
    expect(p.rows).toHaveLength(2);
    const acc = p.rows.find((r) => r.object === "Account")!;
    expect(acc.create).toBe(true);
    expect(acc.del).toBe(false);
  });

  it("serialises rows to the matrix pipe format", () => {
    const text = toPermRowsText({
      label: "X",
      rows: [
        {
          object: "Account",
          create: true,
          read: true,
          update: true,
          del: false,
          modifyAll: false,
        },
      ],
    });
    expect(text).toBe("Account | 1 | 1 | 1 | 0 | 0");
  });

  it("throws when there are no objectPermissions", () => {
    expect(() =>
      parseProfileXml(`<?xml version="1.0"?><Profile></Profile>`),
    ).toThrow(/objectPermissions/);
  });
});

describe("parseFlowXml", () => {
  const EXAMPLE = `<?xml version="1.0"?>
<Flow>
  <label>Lead qualification</label>
  <fullName>Lead_Qualification</fullName>
  <start>
    <object>Lead</object>
    <triggerType>RecordAfterSave</triggerType>
    <connector>
      <targetReference>Decide_Score</targetReference>
    </connector>
  </start>
  <decisions>
    <name>Decide_Score</name>
    <label>Score > 75?</label>
    <connector>
      <targetReference>Create_Opp</targetReference>
    </connector>
  </decisions>
  <recordCreates>
    <name>Create_Opp</name>
    <label>Create Opportunity</label>
    <object>Opportunity</object>
    <connector>
      <targetReference>Send_Email</targetReference>
    </connector>
  </recordCreates>
  <actionCalls>
    <name>Send_Email</name>
    <label>Send welcome email</label>
    <actionName>emailAlert</actionName>
  </actionCalls>
</Flow>`;

  it("extracts label, fullName and every element type", () => {
    const flow = parseFlowXml(EXAMPLE);
    expect(flow.label).toBe("Lead qualification");
    expect(flow.apiName).toBe("Lead_Qualification");
    expect(flow.elements.map((e) => e.type)).toEqual([
      "start",
      "decision",
      "createRecord",
      "action",
    ]);
  });

  it("preserves connector target references", () => {
    const flow = parseFlowXml(EXAMPLE);
    const start = flow.elements.find((e) => e.type === "start")!;
    expect(start.connectors).toEqual(["Decide_Score"]);
    const decide = flow.elements.find((e) => e.type === "decision")!;
    expect(decide.connectors).toEqual(["Create_Opp"]);
    const sendEmail = flow.elements.find((e) => e.type === "action")!;
    expect(sendEmail.connectors).toEqual([]);
  });

  it("synthesises details for record ops when no description is given", () => {
    const flow = parseFlowXml(EXAMPLE);
    const create = flow.elements.find((e) => e.type === "createRecord")!;
    expect(create.details).toBe("Object: Opportunity");
  });

  it("rejects XML whose root isn't <Flow>", () => {
    expect(() =>
      parseFlowXml(`<?xml version="1.0"?><NotAFlow/>`),
    ).toThrow(/Flow/);
  });

  it("errors on empty flows", () => {
    expect(() =>
      parseFlowXml(`<?xml version="1.0"?><Flow></Flow>`),
    ).toThrow(/elements/);
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
