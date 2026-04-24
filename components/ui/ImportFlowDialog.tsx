"use client";

import { useState } from "react";
import { Dialog } from "./Dialog";
import { parseFlowXml, type ImportedFlow } from "@/lib/sfImporter";
import { FLOW_ELEMENT_COLOURS, FLOW_ELEMENT_LABEL } from "@/types/shapes";

type Props = {
  open: boolean;
  onClose: () => void;
  onInsert: (flow: ImportedFlow) => void;
};

const EXAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<Flow xmlns="http://soap.sforce.com/2006/04/metadata">
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
    <actionType>emailAlert</actionType>
  </actionCalls>
</Flow>`;

export function ImportFlowDialog({ open, onClose, onInsert }: Props) {
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ImportedFlow | null>(null);

  const reparse = (text: string) => {
    if (!text.trim()) {
      setParsed(null);
      setError(null);
      return;
    }
    try {
      setParsed(parseFlowXml(text));
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

  const connectorCount =
    parsed?.elements.reduce((n, e) => n + e.connectors.length, 0) ?? 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Import Salesforce Flow"
      subtitle="Paste a .flow XML file — each Flow element becomes a card on the canvas, with arrows drawn between connected elements."
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
            placeholder="Paste .flow XML here…"
            rows={16}
            className="scroll-thin min-h-[360px] resize-y rounded-lg border border-white/10 bg-black/30 p-3 font-mono text-[12px] text-white outline-none focus:border-brand-400"
            spellCheck={false}
          />

          <div className="glass-strong flex min-h-[360px] flex-col overflow-hidden rounded-lg">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
                Preview
              </span>
              {parsed && (
                <span className="text-[11px] text-white/55">
                  {parsed.elements.length} element
                  {parsed.elements.length === 1 ? "" : "s"} · {connectorCount}{" "}
                  connector{connectorCount === 1 ? "" : "s"}
                </span>
              )}
            </div>
            <div className="scroll-thin flex-1 overflow-auto p-3">
              {error ? (
                <div className="rounded-md border border-pink-400/25 bg-pink-400/10 px-3 py-2 text-[12px] leading-relaxed text-pink-200">
                  {error}
                </div>
              ) : !parsed ? (
                <div className="text-[12px] text-white/50">
                  Paste Flow XML on the left to see each element.
                </div>
              ) : (
                <div>
                  <div className="mb-3 flex items-baseline gap-2">
                    <span className="text-sm font-bold">{parsed.label}</span>
                    <span className="font-mono text-[11px] text-white/45">
                      {parsed.apiName}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {parsed.elements.map((e, i) => (
                      <div
                        key={`${e.name}-${i}`}
                        className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px]"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider"
                            style={{
                              background: `${FLOW_ELEMENT_COLOURS[e.type]}33`,
                              color: FLOW_ELEMENT_COLOURS[e.type],
                            }}
                          >
                            {FLOW_ELEMENT_LABEL[e.type]}
                          </span>
                          <span className="font-semibold text-white/90">
                            {e.label}
                          </span>
                          {e.name && e.name !== "__start" && (
                            <span className="ml-auto font-mono text-[10.5px] text-white/45">
                              {e.name}
                            </span>
                          )}
                        </div>
                        {e.details && (
                          <div className="mt-1 text-[11.5px] text-white/60">
                            {e.details}
                          </div>
                        )}
                        {e.connectors.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {e.connectors.map((c) => (
                              <span
                                key={c}
                                className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9.5px] text-white/75"
                              >
                                → {c}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-[11px] text-white/45">
            {parsed
              ? `${parsed.elements.length} Flow element${
                  parsed.elements.length === 1 ? "" : "s"
                } will be inserted`
              : "Waiting for valid Flow XML."}
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
