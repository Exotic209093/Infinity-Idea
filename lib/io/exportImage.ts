import { exportToBlob, type Editor } from "tldraw";
import { triggerDownload } from "./saveJson";

function shapeIds(editor: Editor) {
  const all = Array.from(editor.getCurrentPageShapeIds());
  return all.length > 0 ? all : [];
}

export async function exportPng(editor: Editor): Promise<void> {
  const ids = shapeIds(editor);
  if (ids.length === 0) {
    throw new Error("The canvas is empty — add something before exporting.");
  }
  const blob = await exportToBlob({
    editor,
    ids,
    format: "png",
    opts: { background: false, scale: 2, padding: 32 },
  });
  triggerDownload(blob, "infidoc.png");
}

export async function exportSvg(editor: Editor): Promise<void> {
  const ids = shapeIds(editor);
  if (ids.length === 0) {
    throw new Error("The canvas is empty — add something before exporting.");
  }
  const blob = await exportToBlob({
    editor,
    ids,
    format: "svg",
    opts: { background: false, padding: 32 },
  });
  triggerDownload(blob, "infidoc.svg");
}

export async function getSvgText(editor: Editor): Promise<string> {
  const ids = shapeIds(editor);
  if (ids.length === 0) {
    throw new Error("The canvas is empty — add something before exporting.");
  }
  const blob = await exportToBlob({
    editor,
    ids,
    format: "svg",
    opts: { background: true, padding: 32 },
  });
  return blob.text();
}
