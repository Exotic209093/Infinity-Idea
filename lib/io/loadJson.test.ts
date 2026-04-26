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
      snapshot: { store: {}, schema: {} },
    });
    expect(() => parseSaveFile(raw)).toThrow(InvalidSaveFileError);
  });

  it("rejects a future-version file", () => {
    const raw = JSON.stringify({
      version: SAVE_FILE_VERSION + 1,
      createdAt: new Date().toISOString(),
      appName: "infinite-idea",
      snapshot: { store: {}, schema: {} },
    });
    expect(() => parseSaveFile(raw)).toThrow(/newer version/i);
  });

  it("rejects a file containing a __proto__ key", () => {
    // JSON.stringify silently drops "__proto__" keys, so craft the payload as
    // a raw string to actually exercise the prototype-pollution guard.
    const text =
      '{"version":1,"createdAt":"2026-04-25T00:00:00Z","appName":"infinite-idea",' +
      '"snapshot":{"store":{"foo":{"__proto__":{"polluted":true}}},"schema":{}}}';
    expect(() => parseSaveFile(text)).toThrow(/unsupported keys/i);
  });

  it("rejects a snapshot missing the store/schema keys", () => {
    const text = JSON.stringify({
      version: 1,
      createdAt: "2026-04-25T00:00:00Z",
      appName: "infinite-idea",
      snapshot: {},
    });
    expect(() => parseSaveFile(text)).toThrow(/doesn't look like a valid/i);
  });
});
