"use client";

import { useEffect, useState } from "react";
import type { Editor } from "tldraw";
import { Dialog } from "./Dialog";

type Props = {
  open: boolean;
  onClose: () => void;
  editor: Editor | null;
};

/*
 * Speaker notes are stored on page.meta.notes — JsonObject, so it round-trips
 * with the save file automatically. A single dialog edits the notes for the
 * page that's currently active.
 */
export function SpeakerNotesDialog({ open, onClose, editor }: Props) {
  const [value, setValue] = useState("");
  const [pageName, setPageName] = useState("");

  useEffect(() => {
    if (!open || !editor) return;
    const page = editor.getCurrentPage();
    const notes = (page.meta as { notes?: string } | undefined)?.notes ?? "";
    setValue(notes);
    setPageName(page.name);
  }, [open, editor]);

  const onSave = () => {
    if (!editor) return;
    const page = editor.getCurrentPage();
    editor.markHistoryStoppingPoint("edit-notes");
    editor.updatePage({
      id: page.id,
      meta: { ...(page.meta ?? {}), notes: value },
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Speaker notes"
      subtitle={pageName ? `For "${pageName}"` : "Notes shown in presentation mode"}
      widthClass="max-w-2xl"
    >
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="What will you say when you land on this page?"
        rows={8}
        className="scroll-thin w-full resize-y rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-brand-400"
      />
      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          onClick={onClose}
          className="btn-ghost rounded-lg px-3 py-1.5 text-sm"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          className="btn-primary rounded-lg px-4 py-1.5 text-sm font-semibold"
        >
          Save notes
        </button>
      </div>
    </Dialog>
  );
}
