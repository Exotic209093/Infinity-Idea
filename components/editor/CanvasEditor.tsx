"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GeoShapeGeoStyle,
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
import { downloadSaveFile } from "@/lib/io/saveJson";
import { loadSaveFileFromFile } from "@/lib/io/loadJson";
import { exportPng, exportSvg } from "@/lib/io/exportImage";
import { exportPdf } from "@/lib/io/exportPdf";

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

  const onUndo = useCallback(() => editor?.undo(), [editor]);
  const onRedo = useCallback(() => editor?.redo(), [editor]);

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

  const shapeUtils = useMemo(() => customShapeUtils, []);

  const tldrawComponents = useMemo<TLComponents>(
    () => ({
      // We provide our own File/Export/Undo/Redo + logo in the top bar.
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
          options={{ maxPages: 1 }}
          components={tldrawComponents}
        />
      </div>

      <TopBar
        onNew={onNew}
        onOpen={onOpen}
        onSave={onSave}
        onExportPng={onExportPng}
        onExportSvg={onExportSvg}
        onExportPdf={onExportPdf}
        onUndo={onUndo}
        onRedo={onRedo}
      />

      <ToolboxPanel
        onSelectTool={onSelectTool}
        onInsertCustom={onInsertCustom}
        onUploadImage={onUploadImage}
      />

      <InspectorPanel editor={editor} selectedShape={selected} />

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
