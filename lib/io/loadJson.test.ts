import { describe, expect, it } from "vitest";
import { InvalidSaveFileError, parseSaveFile } from "./loadJson";
import { SAVE_FILE_VERSION } from "@/types/shapes";

describe("parseSaveFile", () => {
  it("accepts a well-formed save file", () => {
    const raw = JSON.stringify({
      version: SAVE_FILE_VERSION,
      createdAt: new Date().toISOString(),
      appName: "infinite-idea",
      snapshot: { store: {}, schema: {} },
    });
    const parsed = parseSaveFile(raw);
    expect(parsed.appName).toBe("infinite-idea");
    expect(parsed.version).toBe(SAVE_FILE_VERSION);
  });

  it("rejects malformed JSON", () => {
    expect(() => parseSaveFile("{not json")).toThrow(InvalidSaveFileError);
  });

  it("rejects a JSON object missing required fields", () => {
    expect(() => parseSaveFile(JSON.stringify({ hello: "world" }))).toThrow(
      InvalidSaveFileError,
    );
  });

  it("rejects a file from another app", () => {
    const raw = JSON.stringify({
      version: 1,
      createdAt: new Date().toISOString(),
      appName: "not-us",
      snapshot: {},
    });
    expect(() => parseSaveFile(raw)).toThrow(InvalidSaveFileError);
  });

  it("rejects a future-version file", () => {
    const raw = JSON.stringify({
      version: SAVE_FILE_VERSION + 1,
      createdAt: new Date().toISOString(),
      appName: "infinite-idea",
      snapshot: {},
    });
    expect(() => parseSaveFile(raw)).toThrow(/newer version/i);
  });
});
