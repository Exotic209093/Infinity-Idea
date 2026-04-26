import { loadSnapshot, type Editor, type TLShapeId } from "tldraw";
import { SAVE_FILE_VERSION } from "@/types/shapes";

export type SaveFile = {
  version: number;
  createdAt: string;
  appName: "infinite-idea";
  snapshot: { store: Record<string, unknown>; schema: Record<string, unknown> };
};

export class InvalidSaveFileError extends Error {
  constructor(message = "This doesn't look like a valid Infinite Idea file") {
    super(message);
    this.name = "InvalidSaveFileError";
  }
}

const MAX_BYTES = 25 * 1024 * 1024;
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function hasForbiddenKey(value: unknown, depth = 0): boolean {
  // Bound depth so a deeply nested file can't pin the main thread; tldraw
  // store records are flat enough that 64 levels is far past what's expected.
  if (depth > 64) return true;
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) {
    return value.some((v) => hasForbiddenKey(v, depth + 1));
  }
  for (const key of Object.keys(value)) {
    if (FORBIDDEN_KEYS.has(key)) return true;
    if (hasForbiddenKey((value as Record<string, unknown>)[key], depth + 1)) {
      return true;
    }
  }
  return false;
}

function isSaveFile(v: unknown): v is SaveFile {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (
    typeof o.version !== "number" ||
    typeof o.createdAt !== "string" ||
    o.appName !== "infinite-idea" ||
    typeof o.snapshot !== "object" ||
    o.snapshot === null
  ) {
    return false;
  }
  const snap = o.snapshot as Record<string, unknown>;
  return (
    typeof snap.store === "object" &&
    snap.store !== null &&
    typeof snap.schema === "object" &&
    snap.schema !== null
  );
}

export function parseSaveFile(raw: string): SaveFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new InvalidSaveFileError("File is not valid JSON");
  }
  if (hasForbiddenKey(parsed)) {
    throw new InvalidSaveFileError(
      "This save file contains unsupported keys and won't be loaded.",
    );
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

export async function loadSaveFileFromFile(
  editor: Editor,
  file: File,
): Promise<void> {
  if (file.size > MAX_BYTES) {
    throw new Error(
      `That save file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The largest we'll load is ${MAX_BYTES / 1024 / 1024} MB.`,
    );
  }
  const text = await file.text();
  const save = parseSaveFile(text);
  // Replace semantics: clear the current page before loading. tldraw's
  // loadSnapshot otherwise merges, which silently mixes documents.
  const existing = Array.from(editor.getCurrentPageShapeIds()) as TLShapeId[];
  if (existing.length > 0) editor.deleteShapes(existing);
  loadSnapshot(editor.store, save.snapshot as Parameters<typeof loadSnapshot>[1]);
}
