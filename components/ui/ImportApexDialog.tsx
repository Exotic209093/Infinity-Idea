"use client";

import { useState } from "react";
import { Dialog } from "./Dialog";
import {
  parseApexSource,
  toMembersText,
  type ImportedApex,
} from "@/lib/sfImporter";

type Props = {
  open: boolean;
  onClose: () => void;
  onInsert: (apex: ImportedApex) => void;
};

const EXAMPLE = `public with sharing class AccountService {
    /**
     * Creates a new Account from the incoming payload.
     */
    public static Id createAccount(Account a) {
        insert a;
        return a.Id;
    }

    public void linkContact(Id accountId, Id contactId) {
        Contact c = [SELECT Id FROM Contact WHERE Id = :contactId];
        c.AccountId = accountId;
        update c;
    }

    private Boolean sendWelcome(Id contactId) {
        // send email
        return true;
    }
}`;

export function ImportApexDialog({ open, onClose, onInsert }: Props) {
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ImportedApex | null>(null);

  const reparse = (text: string) => {
    if (!text.trim()) {
      setParsed(null);
      setError(null);
      return;
    }
    try {
      setParsed(parseApexSource(text));
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
      title="Import Apex class"
      subtitle="Paste a .cls / .trigger source and drop the generated Apex block onto the canvas."
      widthClass="max-w-4xl"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
            Source
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
            placeholder="Paste Apex source here…"
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
              ) : !parsed ? (
                <div className="text-[12px] text-white/50">
                  Paste Apex on the left to see what will be inserted.
                </div>
              ) : (
                <ApexPreview apex={parsed} />
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-[11px] text-white/45">
            {parsed
              ? `${parsed.classKind} · ${parsed.visibility}${
                  parsed.sharing === "none" ? "" : ` · ${parsed.sharing} sharing`
                } · ${parsed.members.length} member${
                  parsed.members.length === 1 ? "" : "s"
                }`
              : "Waiting for valid Apex."}
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

function ApexPreview({ apex }: { apex: ImportedApex }) {
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-sm font-bold">{apex.apiName}</span>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/70">
          {apex.classKind}
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/70">
          {apex.visibility}
        </span>
        {apex.sharing !== "none" && (
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/70">
            {apex.sharing} sharing
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-col divide-y divide-white/5 rounded-md border border-white/10">
        {apex.members.length === 0 && (
          <div className="p-3 text-[12px] text-white/45">No members found.</div>
        )}
        {apex.members.map((m, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-2 py-1.5 font-mono text-[12px]"
          >
            <span className="flex-1 truncate">{m.signature}</span>
            {m.modifiers.length > 0 && (
              <span className="flex gap-1">
                {m.modifiers.map((mod) => (
                  <span
                    key={mod}
                    className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-white/70"
                  >
                    {mod}
                  </span>
                ))}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-md border border-white/10 bg-black/30 p-2 font-mono text-[10.5px] leading-snug text-white/70">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/45">
          Shape members
        </div>
        <pre className="whitespace-pre-wrap">{toMembersText(apex)}</pre>
      </div>
    </div>
  );
}
