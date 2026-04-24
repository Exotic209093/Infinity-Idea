"use client";

import { useState } from "react";
import { Dialog } from "./Dialog";
import {
  parseMetadataBatch,
  relationshipsAmong,
  toFieldsText,
  type ImportedRelationship,
  type ImportedSObject,
} from "@/lib/sfImporter";

type Props = {
  open: boolean;
  onClose: () => void;
  onInsert: (objects: ImportedSObject[], rels: ImportedRelationship[]) => void;
};

type Format = "auto" | "describe" | "xml";

const EXAMPLE_JSON = `{
  "name": "Account",
  "label": "Account",
  "custom": false,
  "fields": [
    { "name": "Id", "type": "id", "nillable": false, "unique": true },
    { "name": "Name", "type": "string", "nillable": false },
    { "name": "Industry", "type": "picklist" },
    { "name": "OwnerId", "type": "reference", "referenceTo": ["User"] }
  ]
}`;

const EXAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
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

const EXAMPLE_BATCH = `{
  "sobjects": [
    {
      "name": "Account",
      "fields": [
        { "name": "Id", "type": "id", "nillable": false, "unique": true },
        { "name": "Name", "type": "string", "nillable": false }
      ]
    },
    {
      "name": "Contact",
      "fields": [
        { "name": "Id", "type": "id", "nillable": false, "unique": true },
        { "name": "LastName", "type": "string", "nillable": false },
        { "name": "AccountId", "type": "reference", "referenceTo": ["Account"] }
      ]
    },
    {
      "name": "Opportunity",
      "fields": [
        { "name": "Id", "type": "id", "nillable": false, "unique": true },
        { "name": "Name", "type": "string", "nillable": false },
        { "name": "AccountId", "type": "reference", "referenceTo": ["Account"] },
        { "name": "Amount", "type": "currency" }
      ]
    }
  ]
}`;

export function ImportSObjectDialog({ open, onClose, onInsert }: Props) {
  const [raw, setRaw] = useState("");
  const [format, setFormat] = useState<Format>("auto");
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ImportedSObject[]>([]);
  const [selectedPreview, setSelectedPreview] = useState(0);

  const rels = relationshipsAmong(parsed);

  const reparse = (text: string) => {
    if (!text.trim()) {
      setParsed([]);
      setError(null);
      return;
    }
    try {
      const objs = parseMetadataBatch(text);
      setParsed(objs);
      setSelectedPreview(0);
      setError(null);
    } catch (err) {
      setParsed([]);
      setError(err instanceof Error ? err.message : "Could not parse that.");
    }
  };

  const onRawChange = (v: string) => {
    setRaw(v);
    reparse(v);
  };

  const onApply = () => {
    if (parsed.length === 0) return;
    onInsert(parsed, rels);
    setRaw("");
    setParsed([]);
    setError(null);
    onClose();
  };

  const loadExample = (kind: "describe" | "xml" | "batch") => {
    const text =
      kind === "describe"
        ? EXAMPLE_JSON
        : kind === "xml"
        ? EXAMPLE_XML
        : EXAMPLE_BATCH;
    setFormat(kind === "xml" ? "xml" : "describe");
    setRaw(text);
    reparse(text);
  };

  const current = parsed[selectedPreview];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Import Salesforce metadata"
      subtitle="Paste one or more DESCRIBE JSON objects, a batch envelope, or a .object XML file. Lookup and master-detail references between imported objects become relationship chips automatically."
      widthClass="max-w-4xl"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
            Format
          </span>
          <FormatButton active={format === "auto"} onClick={() => setFormat("auto")}>
            Auto-detect
          </FormatButton>
          <FormatButton active={format === "describe"} onClick={() => setFormat("describe")}>
            DESCRIBE JSON
          </FormatButton>
          <FormatButton active={format === "xml"} onClick={() => setFormat("xml")}>
            .object XML
          </FormatButton>
          <span className="flex-1" />
          <button
            onClick={() => loadExample("describe")}
            className="text-[11px] text-white/50 underline-offset-2 hover:underline"
          >
            Single JSON
          </button>
          <button
            onClick={() => loadExample("batch")}
            className="text-[11px] text-white/50 underline-offset-2 hover:underline"
          >
            Batch JSON
          </button>
          <button
            onClick={() => loadExample("xml")}
            className="text-[11px] text-white/50 underline-offset-2 hover:underline"
          >
            XML
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <textarea
            value={raw}
            onChange={(e) => onRawChange(e.target.value)}
            placeholder={`Paste DESCRIBE JSON, a { "sobjects": [...] } envelope, an array of objects, or an .object XML file here.`}
            rows={16}
            className="scroll-thin min-h-[360px] resize-y rounded-lg border border-white/10 bg-black/30 p-3 font-mono text-[12px] text-white outline-none focus:border-brand-400"
            spellCheck={false}
          />

          <div className="glass-strong flex min-h-[360px] flex-col overflow-hidden rounded-lg">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
                Preview
              </span>
              {parsed.length > 0 && (
                <span className="text-[11px] text-white/55">
                  {parsed.length} object{parsed.length === 1 ? "" : "s"} ·{" "}
                  {rels.length} relationship{rels.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
            <div className="scroll-thin flex-1 overflow-auto p-3">
              {error ? (
                <div className="rounded-md border border-pink-400/25 bg-pink-400/10 px-3 py-2 text-[12px] leading-relaxed text-pink-200">
                  {error}
                </div>
              ) : parsed.length === 0 ? (
                <div className="text-[12px] text-white/50">
                  Paste metadata on the left to see a preview of what will be
                  inserted.
                </div>
              ) : (
                <>
                  {parsed.length > 1 && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {parsed.map((o, i) => (
                        <button
                          key={`${o.apiName}-${i}`}
                          onClick={() => setSelectedPreview(i)}
                          className={[
                            "rounded-md border px-2 py-1 text-[11px] font-semibold transition",
                            i === selectedPreview
                              ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-100"
                              : "border-white/10 bg-white/5 text-white/70 hover:border-white/25",
                          ].join(" ")}
                        >
                          {o.apiName}
                        </button>
                      ))}
                    </div>
                  )}
                  {current && <SObjectPreview obj={current} />}
                  {rels.length > 0 && (
                    <div className="mt-4">
                      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/55">
                        Relationships
                      </div>
                      <div className="flex flex-col gap-1">
                        {rels.map((r, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5 text-[11.5px]"
                          >
                            <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-white/70">
                              {r.kind === "masterDetail" ? "MD" : "LKP"}
                            </span>
                            <span className="font-mono text-white/85">
                              {r.fromApi}.{r.fromField}
                            </span>
                            <span className="text-white/40">→</span>
                            <span className="font-mono text-white/85">{r.toApi}</span>
                            <span className="ml-auto text-[10px] text-white/45">
                              {r.cardinality}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-[11px] text-white/45">
            {parsed.length === 0
              ? "Waiting for valid metadata."
              : parsed.length === 1
              ? `1 SObject ready — ${parsed[0].fields.length} fields`
              : `${parsed.length} SObjects ready — ${rels.length} relationship chips will be drawn`}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="btn-ghost rounded-lg px-3 py-1.5 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={onApply}
              disabled={parsed.length === 0}
              className="btn-primary rounded-lg px-4 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              Insert onto canvas
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

function FormatButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-md px-2.5 py-1 text-[11px] font-semibold transition",
        active
          ? "bg-white/15 text-white shadow-inner shadow-white/5"
          : "text-white/55 hover:bg-white/5 hover:text-white",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function SObjectPreview({ obj }: { obj: ImportedSObject }) {
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-bold">{obj.label}</span>
        <span className="font-mono text-[11px] text-white/45">{obj.apiName}</span>
        <span
          className="ml-auto rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/70"
          title={`${obj.sobjectType} object`}
        >
          {obj.sobjectType}
        </span>
      </div>
      <div className="mt-3 flex flex-col divide-y divide-white/5 rounded-md border border-white/10">
        {obj.fields.map((f, i) => (
          <div key={i} className="flex items-center gap-2 px-2 py-1.5 text-[12px]">
            <span className="flex-1 truncate font-mono">{f.name}</span>
            <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/70">
              {f.type}
              {f.refTo ? ` → ${f.refTo}` : ""}
            </span>
            {(f.required || f.unique || f.externalId || f.primaryKey) && (
              <span className="flex gap-1">
                {f.primaryKey && <Badge>pk</Badge>}
                {f.required && <Badge>req</Badge>}
                {f.unique && <Badge>unq</Badge>}
                {f.externalId && <Badge>ext</Badge>}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-md border border-white/10 bg-black/30 p-2 font-mono text-[10.5px] leading-snug text-white/70">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/45">
          Shape fields
        </div>
        <pre className="whitespace-pre-wrap">{toFieldsText(obj)}</pre>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white/70">
      {children}
    </span>
  );
}
