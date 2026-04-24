import { getSnapshot, type Editor } from "tldraw";
import { SAVE_FILE_EXTENSION, SAVE_FILE_VERSION, type SaveFile } from "@/types/shapes";

export function buildSaveFile(editor: Editor): SaveFile {
  const snapshot = getSnapshot(editor.store);
  return {
    version: SAVE_FILE_VERSION,
    createdAt: new Date().toISOString(),
    appName: "infinite-idea",
    snapshot,
  };
}

export function downloadSaveFile(editor: Editor, baseName?: string): void {
  const payload = buildSaveFile(editor);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const name = `${baseName ?? defaultName()}${SAVE_FILE_EXTENSION}`;
  triggerDownload(blob, name);
}

function defaultName(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `infidoc-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
    now.getDate(),
  )}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
