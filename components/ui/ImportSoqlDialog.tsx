"use client";

import { useState } from "react";
import { Dialog } from "./Dialog";
import { parseSoql, type ImportedSOQL } from "@/lib/sfImporter";

type Props = {
  open: boolean;
  onClose: () => void;
  onInsert: (query: ImportedSOQL) => void;
};

const EXAMPLE = `SELECT Id, Name, Email, AccountId, Account.Name
FROM Contact
WHERE Email != null
ORDER BY LastName
LIMIT 100`;

export function ImportSoqlDialog({ open, onClose, onInsert }: Props) {
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ImportedSOQL | null>(null);

  const reparse = (text: string) => {
    if (!text.trim()) {
      setParsed(null);
      setError(null);
      return;
    }
    try {
      setParsed(parseSoql(text));
      setError(null);
    } catch (err) {
      setParsed(null);
      setError(err instanceof Error ? err.message : "Could not parse that.");
    }
  };

  const onRawChange = (v: string) => {
    setRaw(v);
    reparse(v);
  };

  const loadExample = () => {
    setRaw(EXAMPLE);
    reparse(EXAMPLE);
  };

  const onApply = () => {
    if (!parsed) return;
    onInsert(parsed);
    setRaw("");
    setParsed(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Build a SOQL block"
      subtitle="Paste any SOQL query — we'll drop a syntax-highlighted query block with the referenced object and fields extracted."
      widthClass="max-w-4xl"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
            SOQL
          </span>
          <span className="flex-1" />
          <button
            onClick={loadExample}
            className="text-[11px] text-white/50 underline-offset-2 hover:underline"
          >
            Load example
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <textarea
            value={raw}
            onChange={(e) => onRawChange(e.target.value)}
            placeholder="SELECT Id, Name FROM Account WHERE …"
            rows={12}
            className="scroll-thin min-h-[260px] resize-y rounded-lg border border-white/10 bg-black/30 p-3 font-mono text-[12px] text-white outline-none focus:border-brand-400"
            spellCheck={false}
          />

          <div className="glass-strong flex min-h-[260px] flex-col overflow-hidden rounded-lg">
            <div className="border-b border-white/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-white/55">
              Preview
            </div>
            <div className="scroll-thin flex-1 overflow-auto p-3">
              {error ? (
                <div className="rounded-md border border-pink-400/25 bg-pink-400/10 px-3 py-2 text-[12px] leading-relaxed text-pink-200">
                  {error}
                </div>
              ) : !parsed ? (
                <div className="text-[12px] text-white/50">
                  Paste SOQL on the left to see the referenced object and
                  fields.
                </div>
              ) : (
                <SOQLPreview q={parsed} />
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-[11px] text-white/45">
            {parsed
              ? `${parsed.fromObject || "?"} · ${parsed.fields.length} field${
                  parsed.fields.length === 1 ? "" : "s"
                }${
                  parsed.relatedObjects.length
                    ? ` · ${parsed.relatedObjects.length} relationship hop${
                        parsed.relatedObjects.length === 1 ? "" : "s"
                      }`
                    : ""
                }`
              : "Waiting for a valid SOQL query."}
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
              disabled={!parsed}
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

function SOQLPreview({ q }: { q: ImportedSOQL }) {
  return (
    <div className="flex flex-col gap-3 text-[12px]">
      <div className="flex items-baseline gap-2">
        <span className="rounded bg-violet-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-200">
          SOQL
        </span>
        <span className="font-mono text-sm font-bold">{q.fromObject || "—"}</span>
        {q.limit && (
          <span className="ml-auto rounded bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/70">
            LIMIT {q.limit}
          </span>
        )}
      </div>

      <section>
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/45">
          Fields
        </div>
        <div className="flex flex-wrap gap-1">
          {q.fields.map((f) => (
            <span
              key={f}
              className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10.5px] text-white/80"
            >
              {f}
            </span>
          ))}
        </div>
      </section>

      {q.relatedObjects.length > 0 && (
        <section>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/45">
            Relationship hops
          </div>
          <div className="flex flex-wrap gap-1">
            {q.relatedObjects.map((r) => (
              <span
                key={r}
                className="rounded bg-pink-400/15 px-1.5 py-0.5 font-mono text-[10.5px] text-pink-200"
              >
                → {r}
              </span>
            ))}
          </div>
        </section>
      )}

      {q.conditions && (
        <section>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/45">
            Where
          </div>
          <pre className="whitespace-pre-wrap rounded-md border border-white/10 bg-black/30 p-2 font-mono text-[10.5px] text-amber-200/90">
            {q.conditions}
          </pre>
        </section>
      )}

      {q.orderBy && (
        <section>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/45">
            Order by
          </div>
          <code className="font-mono text-[10.5px] text-white/80">{q.orderBy}</code>
        </section>
      )}
    </div>
  );
}
