"use client";

import { useState } from "react";
import { Dialog } from "./Dialog";
import {
  parseMetadata,
  toFieldsText,
  type ImportFormat,
  type ImportedSObject,
} from "@/lib/sfImporter";

type Props = {
  open: boolean;
  onClose: () => void;
  onInsert: (obj: ImportedSObject) => void;
};

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

export function ImportSObjectDialog({ open, onClose, onInsert }: Props) {
  const [raw, setRaw] = useState("");
  const [format, setFormat] = useState<ImportFormat>("auto");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportedSObject | null>(null);

  const reparse = (text: string, fmt: ImportFormat) => {
    if (!text.trim()) {
      setPreview(null);
      setError(null);
      return;
    }
    try {
      const parsed = parseMetadata(text, fmt);
      setPreview(parsed);
      setError(null);
    } catch (err) {
      setPreview(null);
      setError(err instanceof Error ? err.message : "Could not parse that.");
    }
  };

  const onRawChange = (v: string) => {
    setRaw(v);
    reparse(v, format);
  };
  const onFormatChange = (v: ImportFormat) => {
    setFormat(v);
    reparse(raw, v);
  };

  const onApply = () => {
    if (!preview) return;
    onInsert(preview);
    // Reset and close for the next use.
    setRaw("");
    setPreview(null);
    setError(null);
    onClose();
  };

  const loadExample = (fmt: "describe" | "xml") => {
    const text = fmt === "describe" ? EXAMPLE_JSON : EXAMPLE_XML;
    setFormat(fmt);
    setRaw(text);
    reparse(text, fmt);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Import Salesforce metadata"
      subtitle="Paste a DESCRIBE JSON response or a .object XML file and drop the generated SObject block onto the canvas."
      widthClass="max-w-4xl"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
            Format
          </span>
          <FormatButton
            active={format === "auto"}
            onClick={() => onFormatChange("auto")}
          >
            Auto-detect
          </FormatButton>
          <FormatButton
            active={format === "describe"}
            onClick={() => onFormatChange("describe")}
          >
            DESCRIBE JSON
          </FormatButton>
          <FormatButton
            active={format === "xml"}
            onClick={() => onFormatChange("xml")}
          >
            .object XML
          </FormatButton>
          <span className="flex-1" />
          <button
            onClick={() => loadExample("describe")}
            className="text-[11px] text-white/50 underline-offset-2 hover:underline"
          >
            Load JSON example
          </button>
          <button
            onClick={() => loadExample("xml")}
            className="text-[11px] text-white/50 underline-offset-2 hover:underline"
          >
            Load XML example
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <textarea
            value={raw}
            onChange={(e) => onRawChange(e.target.value)}
            placeholder={`Paste DESCRIBE JSON (sf sobject describe -s Account --json)\n\nor an .object XML file here.`}
            rows={16}
            className="scroll-thin min-h-[320px] resize-y rounded-lg border border-white/10 bg-black/30 p-3 font-mono text-[12px] text-white outline-none focus:border-brand-400"
            spellCheck={false}
          />

          <div className="glass-strong flex min-h-[320px] flex-col overflow-hidden rounded-lg">
            <div className="border-b border-white/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-white/55">
              Preview
            </div>
            <div className="scroll-thin flex-1 overflow-auto p-3">
              {error ? (
                <div className="rounded-md border border-pink-400/25 bg-pink-400/10 px-3 py-2 text-[12px] leading-relaxed text-pink-200">
                  {error}
                </div>
              ) : !preview ? (
                <div className="text-[12px] text-white/50">
                  Paste metadata on the left to see a preview of the SObject
                  that will be inserted.
                </div>
              ) : (
                <SObjectPreview obj={preview} />
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-[11px] text-white/45">
            {preview
              ? `${preview.fields.length} fields detected — ${preview.sobjectType} object`
              : "Waiting for valid metadata."}
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
              disabled={!preview}
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
