"use client";

import { useState } from "react";
import { Dialog } from "./Dialog";
import {
  parseProfileXml,
  toPermRowsText,
  type ImportedProfile,
} from "@/lib/sfImporter";

type Props = {
  open: boolean;
  onClose: () => void;
  onInsert: (profile: ImportedProfile) => void;
};

const EXAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<Profile xmlns="http://soap.sforce.com/2006/04/metadata">
  <fullName>Sales User</fullName>
  <objectPermissions>
    <allowCreate>true</allowCreate>
    <allowDelete>false</allowDelete>
    <allowEdit>true</allowEdit>
    <allowRead>true</allowRead>
    <modifyAllRecords>false</modifyAllRecords>
    <object>Account</object>
    <viewAllRecords>false</viewAllRecords>
  </objectPermissions>
  <objectPermissions>
    <allowCreate>true</allowCreate>
    <allowDelete>true</allowDelete>
    <allowEdit>true</allowEdit>
    <allowRead>true</allowRead>
    <modifyAllRecords>false</modifyAllRecords>
    <object>Contact</object>
    <viewAllRecords>false</viewAllRecords>
  </objectPermissions>
  <objectPermissions>
    <allowCreate>true</allowCreate>
    <allowDelete>false</allowDelete>
    <allowEdit>true</allowEdit>
    <allowRead>true</allowRead>
    <modifyAllRecords>false</modifyAllRecords>
    <object>Opportunity</object>
    <viewAllRecords>false</viewAllRecords>
  </objectPermissions>
</Profile>`;

export function ImportProfileDialog({ open, onClose, onInsert }: Props) {
  const [raw, setRaw] = useState("");
  const [profileName, setProfileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ImportedProfile | null>(null);

  const reparse = (text: string) => {
    if (!text.trim()) {
      setParsed(null);
      setError(null);
      return;
    }
    try {
      const prof = parseProfileXml(text);
      setParsed(prof);
      setProfileName((prev) => prev || prof.label);
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
    const effective: ImportedProfile = {
      ...parsed,
      label: (profileName || parsed.label).trim() || parsed.label,
    };
    onInsert(effective);
    setRaw("");
    setProfileName("");
    setParsed(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Import Profile / Permission Set"
      subtitle="Paste a .profile XML file — we'll build a Permission Matrix from every <objectPermissions> entry."
      widthClass="max-w-4xl"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
            XML
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
            placeholder="Paste .profile XML here…"
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
                  Paste XML on the left to see the rows that will go into the
                  Permission Matrix.
                </div>
              ) : (
                <>
                  <label className="mb-3 flex flex-col gap-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
                      Profile label
                    </span>
                    <input
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder={parsed.label}
                      className="rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-brand-400"
                    />
                  </label>
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider text-white/55">
                        <th className="pb-1 text-left font-semibold">Object</th>
                        <th className="pb-1 font-semibold">C</th>
                        <th className="pb-1 font-semibold">R</th>
                        <th className="pb-1 font-semibold">U</th>
                        <th className="pb-1 font-semibold">D</th>
                        <th className="pb-1 font-semibold">X</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.rows.map((r, i) => (
                        <tr
                          key={i}
                          className="border-t border-white/5 font-mono"
                        >
                          <td className="py-1 pr-2">{r.object}</td>
                          {[r.create, r.read, r.update, r.del, r.modifyAll].map(
                            (on, j) => (
                              <td key={j} className="py-1 text-center">
                                <span
                                  className={
                                    on
                                      ? "text-emerald-300"
                                      : "text-white/25"
                                  }
                                >
                                  {on ? "✓" : "·"}
                                </span>
                              </td>
                            ),
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3 rounded-md border border-white/10 bg-black/30 p-2 font-mono text-[10.5px] leading-snug text-white/70">
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/45">
                      Shape rows
                    </div>
                    <pre className="whitespace-pre-wrap">
                      {toPermRowsText(parsed)}
                    </pre>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-[11px] text-white/45">
            {parsed
              ? `${parsed.rows.length} object permission row${
                  parsed.rows.length === 1 ? "" : "s"
                }`
              : "Waiting for valid XML."}
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
