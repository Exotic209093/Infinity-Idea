import { exportToBlob, type Editor } from "tldraw";
import { PDFDocument } from "pdf-lib";
import { triggerDownload } from "./saveJson";

/*
 * PDF export: render the selection (or the full page) to a high-resolution
 * PNG, then embed it in a single-page PDF sized to match. Going via PNG keeps
 * gradients, shadows, and complex filters pixel-identical to on-screen.
 */
export async function exportPdf(editor: Editor): Promise<void> {
  const ids = Array.from(editor.getCurrentPageShapeIds());
  if (ids.length === 0) {
    throw new Error("The canvas is empty — add something before exporting.");
  }

  const pngBlob = await exportToBlob({
    editor,
    ids,
    format: "png",
    opts: { background: true, scale: 2, padding: 48 },
  });
  const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());

  const pdf = await PDFDocument.create();
  const png = await pdf.embedPng(pngBytes);

  // Scale to fit within A4 landscape bounds (595x842 at 72dpi, flipped).
  const maxW = 1100;
  const maxH = 780;
  const scale = Math.min(maxW / png.width, maxH / png.height, 1);
  const pageW = png.width * scale + 64;
  const pageH = png.height * scale + 64;

  const page = pdf.addPage([pageW, pageH]);
  page.drawImage(png, {
    x: (pageW - png.width * scale) / 2,
    y: (pageH - png.height * scale) / 2,
    width: png.width * scale,
    height: png.height * scale,
  });

  const pdfBytes = await pdf.save();
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], {
    type: "application/pdf",
  });
  triggerDownload(blob, "infidoc.pdf");
}
