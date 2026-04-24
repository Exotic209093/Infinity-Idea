import { exportToBlob, type Editor, type TLPageId, type TLShapeId } from "tldraw";
import { PDFDocument, type PDFImage, type PDFDocument as TPDFDocument } from "pdf-lib";
import { triggerDownload } from "./saveJson";

/*
 * PDF export: render each page to a high-resolution PNG, then embed it as
 * a PDF page sized to match. Going via PNG keeps gradients, shadows, and
 * complex filters pixel-identical to on-screen.
 *
 * The same routine handles both the single-page and multi-page cases so
 * there's no code duplication.
 */

const MAX_W = 1100;
const MAX_H = 780;

async function renderPageToPng(
  editor: Editor,
  ids: TLShapeId[],
): Promise<Blob> {
  return exportToBlob({
    editor,
    ids,
    format: "png",
    opts: { background: true, scale: 2, padding: 48 },
  });
}

async function addPngAsPage(
  pdf: TPDFDocument,
  pngBlob: Blob,
): Promise<void> {
  const bytes = new Uint8Array(await pngBlob.arrayBuffer());
  const img: PDFImage = await pdf.embedPng(bytes);
  const scale = Math.min(MAX_W / img.width, MAX_H / img.height, 1);
  const pageW = img.width * scale + 64;
  const pageH = img.height * scale + 64;
  const page = pdf.addPage([pageW, pageH]);
  page.drawImage(img, {
    x: (pageW - img.width * scale) / 2,
    y: (pageH - img.height * scale) / 2,
    width: img.width * scale,
    height: img.height * scale,
  });
}

export async function exportPdf(editor: Editor): Promise<void> {
  const ids = Array.from(editor.getCurrentPageShapeIds()) as TLShapeId[];
  if (ids.length === 0) {
    throw new Error("The canvas is empty — add something before exporting.");
  }
  const pdf = await PDFDocument.create();
  await addPngAsPage(pdf, await renderPageToPng(editor, ids));
  const bytes = await pdf.save();
  triggerDownload(
    new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }),
    "infidoc.pdf",
  );
}

export async function exportPdfAllPages(editor: Editor): Promise<void> {
  const pages = editor.getPages();
  const pagesWithContent = pages.filter(
    (p) => (editor.getPageShapeIds(p.id)?.size ?? 0) > 0,
  );
  if (pagesWithContent.length === 0) {
    throw new Error("No pages have any content yet.");
  }
  const pdf = await PDFDocument.create();
  const originalPage: TLPageId = editor.getCurrentPageId();
  try {
    for (const page of pagesWithContent) {
      editor.setCurrentPage(page.id);
      const ids = Array.from(editor.getCurrentPageShapeIds()) as TLShapeId[];
      if (ids.length === 0) continue;
      // Give tldraw a tick to settle the page switch so the snapshot we
      // render matches the page we're on.
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      await addPngAsPage(pdf, await renderPageToPng(editor, ids));
    }
  } finally {
    editor.setCurrentPage(originalPage);
  }
  const bytes = await pdf.save();
  triggerDownload(
    new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }),
    "infidoc.pdf",
  );
}
