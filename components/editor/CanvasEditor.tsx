"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GeoShapeGeoStyle,
  getSnapshot,
  type Editor,
  type TLComponents,
  type TLShape,
  type TLShapeId,
} from "tldraw";
import "tldraw/tldraw.css";

import { customShapeUtils } from "./shapes/customShapes";
import { TopBar } from "@/components/ui/TopBar";
import { ToolboxPanel } from "@/components/ui/ToolboxPanel";
import { InspectorPanel } from "@/components/ui/InspectorPanel";
import { ToastStack, type ToastMessage } from "@/components/ui/Toast";
import { EmptyCanvas } from "@/components/ui/EmptyCanvas";
import { TemplatesDialog } from "@/components/ui/TemplatesDialog";
import { ShortcutsDialog } from "@/components/ui/ShortcutsDialog";
import { PagesBar } from "@/components/ui/PagesBar";
import { PresentMode } from "@/components/ui/PresentMode";
import { SpeakerNotesDialog } from "@/components/ui/SpeakerNotesDialog";
import {
  buildBlockFromSelection,
  insertSavedBlock,
  loadSavedBlocks,
  saveBlocks,
  type SavedBlock,
} from "@/lib/savedBlocks";
import { downloadSaveFile } from "@/lib/io/saveJson";
import { loadSaveFileFromFile } from "@/lib/io/loadJson";
import { exportPng, exportSvg } from "@/lib/io/exportImage";
import { exportPdf, exportPdfAllPages } from "@/lib/io/exportPdf";
import type { Template } from "@/lib/templates";

const Tldraw = dynamic(() => import("tldraw").then((m) => m.Tldraw), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-white/50">
      Loading canvas…
    </div>
  ),
});

export function CanvasEditor() {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [selected, setSelected] = useState<TLShape | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [shapeCount, setShapeCount] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [templateTarget, setTemplateTarget] = useState<"current" | "new-page">(
    "current",
  );
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [presentOpen, setPresentOpen] = useState(false);
  const [presentSnapshot, setPresentSnapshot] = useState<unknown>(null);
  const [savedBlocksVersion, setSavedBlocksVersion] = useState(0);
  const nextToastId = useRef(1);

  const pushToast = useCallback((text: string, kind: ToastMessage["kind"] = "info") => {
    setToasts((ts) => [
      ...ts,
      { id: nextToastId.current++, text, kind },
    ]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (!editor) return;
    const sync = () => {
      const ids = editor.getSelectedShapeIds();
      if (ids.length === 1) {
        const s = editor.getShape(ids[0] as TLShapeId);
        setSelected(s ?? null);
      } else {
        setSelected(null);
      }
      setShapeCount(editor.getCurrentPageShapeIds().size);
      setPageCount(editor.getPages().length);
    };
    sync();
    const dispose = editor.store.listen(sync, { scope: "all" });
    return () => dispose();
  }, [editor]);

  const handleMount = useCallback((ed: Editor) => {
    setEditor(ed);
    ed.user.updateUserPreferences({ colorScheme: "dark" });
  }, []);

  /* ---------- menu handlers ---------- */

  const onNew = useCallback(() => {
    if (!editor) return;
    const shapes = Array.from(editor.getCurrentPageShapeIds());
    if (shapes.length > 0) {
      const ok = window.confirm(
        "Start a new document? Any unsaved work will be lost.",
      );
      if (!ok) return;
      editor.deleteShapes(shapes);
    }
    pushToast("New canvas", "success");
  }, [editor, pushToast]);

  const onOpen = useCallback(
    async (file: File) => {
      if (!editor) return;
      try {
        await loadSaveFileFromFile(editor, file);
        pushToast("Document loaded", "success");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Could not open file";
        pushToast(msg, "error");
      }
    },
    [editor, pushToast],
  );

  const onSave = useCallback(() => {
    if (!editor) return;
    try {
      downloadSaveFile(editor);
      pushToast("Saved", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Save failed", "error");
    }
  }, [editor, pushToast]);

  const onExportPng = useCallback(async () => {
    if (!editor) return;
    try {
      await exportPng(editor);
      pushToast("PNG exported", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Export failed", "error");
    }
  }, [editor, pushToast]);

  const onExportSvg = useCallback(async () => {
    if (!editor) return;
    try {
      await exportSvg(editor);
      pushToast("SVG exported", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Export failed", "error");
    }
  }, [editor, pushToast]);

  const onExportPdf = useCallback(async () => {
    if (!editor) return;
    try {
      await exportPdf(editor);
      pushToast("PDF exported", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Export failed", "error");
    }
  }, [editor, pushToast]);

  const onExportPdfAll = useCallback(async () => {
    if (!editor) return;
    try {
      await exportPdfAllPages(editor);
      pushToast("All pages exported", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Export failed", "error");
    }
  }, [editor, pushToast]);

  const onUndo = useCallback(() => editor?.undo(), [editor]);
  const onRedo = useCallback(() => editor?.redo(), [editor]);

  const onPresent = useCallback(() => {
    if (!editor) return;
    if (editor.getCurrentPageShapeIds().size === 0 && editor.getPages().length === 1) {
      pushToast("Add something to the canvas before presenting.", "error");
      return;
    }
    setPresentSnapshot(getSnapshot(editor.store));
    setPresentOpen(true);
  }, [editor, pushToast]);

  const onPickTemplate = useCallback(
    (template: Template) => {
      if (!editor) return;
      setTemplatesOpen(false);
      const asNewPage = templateTarget === "new-page";
      if (asNewPage) {
        editor.markHistoryStoppingPoint("add-page-from-template");
        const pageCount = editor.getPages().length;
        editor.createPage({ name: `Page ${pageCount + 1}` });
        const pages = editor.getPages();
        const newPage = pages[pages.length - 1];
        if (newPage) editor.setCurrentPage(newPage.id);
      }
      if (template.id === "blank") {
        pushToast(
          asNewPage ? "Blank page added" : "Blank canvas ready",
          "success",
        );
        setTemplateTarget("current");
        return;
      }
      template.apply(editor);
      const all = Array.from(editor.getCurrentPageShapeIds());
      if (all.length > 0) editor.zoomToFit({ animation: { duration: 400 } });
      pushToast(
        asNewPage
          ? `New page from ${template.name}`
          : `Applied template: ${template.name}`,
        "success",
      );
      setTemplateTarget("current");
    },
    [editor, pushToast, templateTarget],
  );

  const openTemplatesForCurrentPage = useCallback(() => {
    setTemplateTarget("current");
    setTemplatesOpen(true);
  }, []);

  const openTemplatesForNewPage = useCallback(() => {
    setTemplateTarget("new-page");
    setTemplatesOpen(true);
  }, []);

  // Global keyboard shortcuts. We intentionally do nothing while the user is
  // typing in an input/textarea so we don't steal their keystrokes.
  useEffect(() => {
    const isTyping = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        el.isContentEditable ||
        el.getAttribute?.("contenteditable") === "true"
      );
    };
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onSave();
      } else if (mod && e.key.toLowerCase() === "o") {
        e.preventDefault();
        // Programmatically click the hidden file input in the File menu.
        const input = document.querySelector<HTMLInputElement>(
          'input[type="file"][accept*="json"]',
        );
        input?.click();
      } else if (!mod && e.key === "?") {
        e.preventDefault();
        setShortcutsOpen(true);
      } else if (!mod && !e.shiftKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        openTemplatesForCurrentPage();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSave, openTemplatesForCurrentPage]);

  /* ---------- toolbox handlers ---------- */

  const onSelectTool = useCallback(
    (toolId: string) => {
      if (!editor) return;
      if (toolId.startsWith("geo-")) {
        const geo = toolId.replace("geo-", "");
        editor.setCurrentTool("geo");
        editor.setStyleForNextShapes(GeoShapeGeoStyle, geo as never);
      } else if (
        toolId === "text" ||
        toolId === "arrow" ||
        toolId === "line" ||
        toolId === "draw"
      ) {
        editor.setCurrentTool(toolId);
      }
    },
    [editor],
  );

  const onInsertCustom = useCallback(
    (shapeType: string) => {
      if (!editor) return;
      const viewport = editor.getViewportPageBounds();
      const existingBounds = editor
        .getCurrentPageShapes()
        .map((s) => editor.getShapePageBounds(s.id))
        .filter((b): b is NonNullable<typeof b> => b !== undefined);
      // Place new blocks in a vertical column just past the toolbox, avoiding
      // overlap with anything already in that column.
      const x = viewport.x + 320;
      let y = viewport.y + 60;
      for (let tries = 0; tries < 200; tries++) {
        const tentative = { minX: x, minY: y, maxX: x + 240, maxY: y + 160 };
        const overlaps = existingBounds.filter(
          (b) =>
            b.minX < tentative.maxX &&
            b.maxX > tentative.minX &&
            b.minY < tentative.maxY &&
            b.maxY > tentative.minY,
        );
        if (overlaps.length === 0) break;
        y = Math.max(...overlaps.map((b) => b.maxY)) + 24;
      }
      const id = `shape:${Math.random().toString(36).slice(2, 10)}` as TLShapeId;
      editor.markHistoryStoppingPoint(`insert-${shapeType}`);
      editor.createShape({ id, type: shapeType, x, y });
      editor.setCurrentTool("select");
      editor.select(id);
    },
    [editor],
  );

  const onUploadImage = useCallback(
    async (file: File) => {
      if (!editor) return;
      try {
        await editor.putExternalContent({
          type: "files",
          files: [file],
          point: editor.getViewportPageBounds().center,
          ignoreParent: false,
        });
        pushToast("Image added", "success");
      } catch {
        pushToast("Could not upload image", "error");
      }
    },
    [editor, pushToast],
  );

  const onSaveAsBlock = useCallback(() => {
    if (!editor) return;
    if (editor.getSelectedShapes().length === 0) {
      pushToast("Select something first", "error");
      return;
    }
    const name = window.prompt("Name this block", "Untitled block");
    if (!name) return;
    const block = buildBlockFromSelection(editor, name.trim() || "Untitled block");
    if (!block) {
      pushToast("Nothing to save", "error");
      return;
    }
    const existing = loadSavedBlocks();
    saveBlocks([block, ...existing]);
    setSavedBlocksVersion((v) => v + 1);
    pushToast(`Saved "${block.name}" to your blocks`, "success");
  }, [editor, pushToast]);

  const onInsertSavedBlock = useCallback(
    (block: SavedBlock) => {
      if (!editor) return;
      try {
        insertSavedBlock(editor, block);
        pushToast(`Inserted "${block.name}"`, "success");
      } catch {
        pushToast("Could not insert block — it may be invalid.", "error");
      }
    },
    [editor, pushToast],
  );

  const shapeUtils = useMemo(() => customShapeUtils, []);

  const tldrawComponents = useMemo<TLComponents>(
    () => ({
      // We provide our own File/Export/Undo/Redo + logo in the top bar and
      // our own PagesBar at the bottom.
      MenuPanel: null,
      PageMenu: null,
      ActionsMenu: null,
      HelpMenu: null,
      SharePanel: null,
      DebugMenu: null,
    }),
    [],
  );

  return (
    <div className="relative h-full w-full bg-canvas-wash">
      <div className="tldraw-wrapper absolute inset-0">
        <Tldraw
          shapeUtils={shapeUtils}
          onMount={handleMount}
          options={{ maxPages: 20 }}
          components={tldrawComponents}
        />
      </div>

      {editor && shapeCount === 0 && (
        <EmptyCanvas onBrowseTemplates={() => setTemplatesOpen(true)} />
      )}

      <TopBar
        onNew={onNew}
        onOpen={onOpen}
        onSave={onSave}
        onExportPng={onExportPng}
        onExportSvg={onExportSvg}
        onExportPdf={onExportPdf}
        onExportPdfAll={onExportPdfAll}
        pageCount={pageCount}
        onUndo={onUndo}
        onRedo={onRedo}
        onOpenTemplates={openTemplatesForCurrentPage}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        onPresent={onPresent}
      />

      <ToolboxPanel
        onSelectTool={onSelectTool}
        onInsertCustom={onInsertCustom}
        onUploadImage={onUploadImage}
        onInsertSavedBlock={onInsertSavedBlock}
        savedBlocksVersion={savedBlocksVersion}
      />

      <InspectorPanel
        editor={editor}
        selectedShape={selected}
        onSaveAsBlock={onSaveAsBlock}
      />

      <PagesBar
        editor={editor}
        onAddPageFromTemplate={openTemplatesForNewPage}
        onEditNotes={() => setNotesOpen(true)}
      />

      <TemplatesDialog
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onPick={onPickTemplate}
        mode={templateTarget}
      />

      <ShortcutsDialog
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

      <PresentMode
        open={presentOpen}
        onClose={() => setPresentOpen(false)}
        snapshot={presentSnapshot}
      />

      <SpeakerNotesDialog
        open={notesOpen}
        onClose={() => setNotesOpen(false)}
        editor={editor}
      />

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
