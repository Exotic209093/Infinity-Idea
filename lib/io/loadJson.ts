import { loadSnapshot, type Editor } from "tldraw";
import { SAVE_FILE_VERSION, type SaveFile } from "@/types/shapes";

export class InvalidSaveFileError extends Error {
  constructor(message = "This doesn't look like a valid Infinite Idea file") {
    super(message);
    this.name = "InvalidSaveFileError";
  }
}

export function parseSaveFile(raw: string): SaveFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new InvalidSaveFileError("File is not valid JSON");
  }
  if (!isSaveFile(parsed)) {
    throw new InvalidSaveFileError();
  }
  if (parsed.version > SAVE_FILE_VERSION) {
    throw new InvalidSaveFileError(
      `This file was saved by a newer version (v${parsed.version}). Please update.`,
    );
  }
  return parsed;
}

function isSaveFile(v: unknown): v is SaveFile {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.version === "number" &&
    typeof o.createdAt === "string" &&
    o.appName === "infinite-idea" &&
    typeof o.snapshot === "object" &&
    o.snapshot !== null
  );
}

export async function loadSaveFileFromFile(
  editor: Editor,
  file: File,
): Promise<void> {
  const text = await file.text();
  const save = parseSaveFile(text);
  loadSnapshot(editor.store, save.snapshot as Parameters<typeof loadSnapshot>[1]);
}
