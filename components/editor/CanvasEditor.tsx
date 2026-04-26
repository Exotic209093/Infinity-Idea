"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createShapeId,
  GeoShapeGeoStyle,
  getSnapshot,
  type Editor,
  type TLComponents,
  type TLShape,
  type TLShapeId,
} from "tldraw";
import "tldraw/tldraw.css";

import {
  Sparkles,
  FilePlus2,
  Save as SaveIcon,
  Download,
  FileText,
  FileImage,
  FileType,
  Files,
  Play,
  Keyboard as KeyboardIcon,
  LayoutTemplate,
  Plus,
  StickyNote,
  Database,
  Code2,
  Workflow as WorkflowIcon,
  ShieldCheck,
  Plug,
  Link2,
  FileCode2,
  ShieldAlert,
  CheckCheck,
  ListChecks,
  TrendingUp,
  Workflow,
  GitBranch,
  Flag,
  Users,
  Columns3,
  Crown,
  MessageSquare,
  Quote as QuoteIcon,
  Table as TableIcon,
} from "lucide-react";
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
import { ImportSObjectDialog } from "@/components/ui/ImportSObjectDialog";
import { ImportApexDialog } from "@/components/ui/ImportApexDialog";
import { ImportProfileDialog } from "@/components/ui/ImportProfileDialog";
import { ImportFlowDialog } from "@/components/ui/ImportFlowDialog";
import { ImportSoqlDialog } from "@/components/ui/ImportSoqlDialog";
import {
  CommandPalette,
  type CommandItem,
} from "@/components/ui/CommandPalette";
import { WelcomeDialog } from "@/components/ui/WelcomeDialog";
import { TourOverlay, type TourStep } from "@/components/ui/TourOverlay";
import {
  type ImportedApex,
  type ImportedFlow,
  type ImportedProfile,
  type ImportedRelationship,
  type ImportedSOQL,
  type ImportedSObject,
} from "@/lib/sfImporter";
import {
  insertSObjectImport,
  insertApexImport,
  insertProfileImport,
  insertFlowImport,
  insertSoqlImport,
} from "@/lib/insertImported";
import { CUSTOM_SHAPE_TYPES } from "@/types/shapes";
import {
  buildBlockFromSelection,
  insertSavedBlock,
  loadSavedBlocks,
  saveBlocks,
  type SavedBlock,
} from "@/lib/savedBlocks";
import { loadRecentBlocks, pushRecentBlock } from "@/lib/recents";
import { downloadSaveFile } from "@/lib/io/saveJson";
import { loadSaveFileFromFile } from "@/lib/io/loadJson";
import { exportPng, exportSvg } from "@/lib/io/exportImage";
import { exportPdf, exportPdfAllPages } from "@/lib/io/exportPdf";
import { TEMPLATES, BLANK_TEMPLATE, type Template } from "@/lib/templates";

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
  const [sfImportOpen, setSfImportOpen] = useState(false);
  const [apexImportOpen, setApexImportOpen] = useState(false);
  const [profileImportOpen, setProfileImportOpen] = useState(false);
  const [flowImportOpen, setFlowImportOpen] = useState(false);
  const [soqlImportOpen, setSoqlImportOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [toolboxCollapsed, setToolboxCollapsed] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [inspectorPinned, setInspectorPinned] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem("infinite-idea:inspector-pinned") === "1";
    } catch {
      return false;
    }
  });

  const togglePinInspector = useCallback(() => {
    setInspectorPinned((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(
          "infinite-idea:inspector-pinned",
          next ? "1" : "0",
        );
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);
  const [presentOpen, setPresentOpen] = useState(false);
  const [presentSnapshot, setPresentSnapshot] = useState<unknown>(null);
  const [savedBlocksVersion, setSavedBlocksVersion] = useState(0);
  const [recents, setRecents] = useState<string[]>(() => loadRecentBlocks());
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

  // We listen at scope:"all" because tldraw mixes camera/instance state with
  // shape state, but every setState below bails out when the value is
  // reference-equal to the previous one — so panel re-renders only happen
  // when the watched values actually change, not on every camera frame.
  useEffect(() => {
    if (!editor) return;
    const sync = () => {
      const ids = editor.getSelectedShapeIds();
      const nextSelected =
        ids.length === 1 ? (editor.getShape(ids[0] as TLShapeId) ?? null) : null;
      setSelected((prev) => (prev === nextSelected ? prev : nextSelected));

      const nextShapeCount = editor.getCurrentPageShapeIds().size;
      setShapeCount((prev) => (prev === nextShapeCount ? prev : nextShapeCount));

      const nextPageCount = editor.getPages().length;
      setPageCount((prev) => (prev === nextPageCount ? prev : nextPageCount));
    };
    sync();
    const dispose = editor.store.listen(sync, { scope: "all" });
    return () => dispose();
  }, [editor]);

  const handleMount = useCallback((ed: Editor) => {
    setEditor(ed);
    ed.user.updateUserPreferences({ colorScheme: "dark" });
  }, []);

  // First-visit welcome. localStorage-gated so returning users don't get
  // pestered. Honour ?welcome=1 in the URL to force-show for testing.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const force = new URLSearchParams(window.location.search).get("welcome");
    if (force === "1") {
      setWelcomeOpen(true);
      return;
    }
    if (force === "0") return;
    try {
      const seen = window.localStorage.getItem("infinite-idea:welcomed");
      if (!seen) setWelcomeOpen(true);
    } catch {
      /* private mode etc. — silently skip */
    }
  }, []);

  const dismissWelcome = useCallback(() => {
    setWelcomeOpen(false);
    try {
      window.localStorage.setItem("infinite-idea:welcomed", "1");
    } catch {
      /* ignore */
    }
  }, []);

  const tourSteps = useMemo<TourStep[]>(
    () => [
      {
        selector: '[data-tour="toolbox"]',
        title: "Pick or search blocks",
        body: "Drop a Title, Process Step, Salesforce Object — anything from the toolbox. Use the search field to filter across every tab at once.",
        placement: "right",
      },
      {
        selector: '[data-tour="search"]',
        title: "Cmd+K opens everything",
        body: "Insert any block, apply a template, run an export, jump to a page — all from one fuzzy-searchable list.",
        placement: "bottom",
      },
      {
        selector: '[data-tour="templates"]',
        title: "Templates kick-start docs",
        body: "Six ready-made canvases including a full Salesforce Architecture diagram. Pick one and tweak.",
        placement: "bottom",
      },
      {
        selector: '[data-tour="present"]',
        title: "Present mode for clients",
        body: "Each page becomes a slide. Speaker notes appear automatically when set, arrow keys navigate, F enters fullscreen.",
        placement: "bottom",
      },
    ],
    [],
  );

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
  // typing in an input/textarea so we don't steal their keystrokes — except
  // Cmd/Ctrl+K which works everywhere.
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
      const mod = e.ctrlKey || e.metaKey;

      // Cmd/Ctrl+K — command palette. Works everywhere.
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }

      if (isTyping(e.target)) return;

      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onSave();
      } else if (mod && e.key.toLowerCase() === "o") {
        e.preventDefault();
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
      const id = createShapeId();
      editor.markHistoryStoppingPoint(`insert-${shapeType}`);
      editor.createShape({ id, type: shapeType, x, y });
      editor.setCurrentTool("select");
      editor.select(id);
      setRecents(pushRecentBlock(shapeType));
    },
    [editor],
  );

  const onUploadImage = useCallback(
    async (file: File) => {
      if (!editor) return;
      // Images get inlined as base64 into the tldraw store, which means every
      // save file carries them. Cap upload size so a stray 30 MB photo can't
      // balloon the .infidoc.json silently.
      const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
      if (file.size > MAX_IMAGE_BYTES) {
        pushToast(
          `That image is ${(file.size / 1024 / 1024).toFixed(1)} MB; please use a file under ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`,
          "error",
        );
        return;
      }
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

  const onImportSObject = useCallback(
    (objects: ImportedSObject[], rels: ImportedRelationship[]) => {
      if (!editor || objects.length === 0) return;
      const msg = insertSObjectImport(editor, objects, rels);
      pushToast(msg, "success");
    },
    [editor, pushToast],
  );

  const onImportApex = useCallback(
    (apex: ImportedApex) => {
      if (!editor) return;
      const msg = insertApexImport(editor, apex);
      pushToast(msg, "success");
    },
    [editor, pushToast],
  );

  const onImportProfile = useCallback(
    (profile: ImportedProfile) => {
      if (!editor) return;
      const msg = insertProfileImport(editor, profile);
      pushToast(msg, "success");
    },
    [editor, pushToast],
  );

  const onImportFlow = useCallback(
    (flow: ImportedFlow) => {
      if (!editor) return;
      const msg = insertFlowImport(editor, flow);
      pushToast(msg, "success");
    },
    [editor, pushToast],
  );

  const onImportSoql = useCallback(
    (q: ImportedSOQL) => {
      if (!editor) return;
      const msg = insertSoqlImport(editor, q);
      pushToast(msg, "success");
    },
    [editor, pushToast],
  );

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

  // Single command palette feed. Dependencies are the handlers, which are
  // already memoised, so this list is cheap to rebuild.
  const commandItems = useMemo<CommandItem[]>(() => {
    const blocks: Array<{ type: string; label: string; icon: React.ReactNode; hint?: string }> = [
      { type: CUSTOM_SHAPE_TYPES.titleBlock, label: "Title block", icon: <Crown size={14} /> },
      { type: CUSTOM_SHAPE_TYPES.processStep, label: "Process step", icon: <Workflow size={14} /> },
      { type: CUSTOM_SHAPE_TYPES.decisionGate, label: "Decision gate", icon: <GitBranch size={14} /> },
      { type: CUSTOM_SHAPE_TYPES.milestone, label: "Milestone", icon: <Flag size={14} /> },
      { type: CUSTOM_SHAPE_TYPES.orgNode, label: "Org node", icon: <Users size={14} /> },
      { type: CUSTOM_SHAPE_TYPES.swimlane, label: "Swimlane", icon: <Columns3 size={14} /> },
      { type: CUSTOM_SHAPE_TYPES.callout, label: "Callout", icon: <MessageSquare size={14} /> },
      { type: CUSTOM_SHAPE_TYPES.checklist, label: "Checklist", icon: <ListChecks size={14} /> },
      { type: CUSTOM_SHAPE_TYPES.kpiStat, label: "KPI stat", icon: <TrendingUp size={14} /> },
      { type: CUSTOM_SHAPE_TYPES.table, label: "Table", icon: <TableIcon size={14} /> },
      { type: CUSTOM_SHAPE_TYPES.quote, label: "Quote", icon: <QuoteIcon size={14} /> },
      { type: CUSTOM_SHAPE_TYPES.sobject, label: "Salesforce object", hint: "SObject", icon: <Database size={14} /> },
      { type: CUSTOM_SHAPE_TYPES.apexClass, label: "Apex class", icon: <Code2 size={14} /> },
      { type: CUSTOM_SHAPE_TYPES.flowElement, label: "Flow element", icon: <WorkflowIcon size={14} /> },
      { type: CUSTOM_SHAPE_TYPES.permissionMatrix, label: "Permission matrix", icon: <ShieldCheck size={14} /> },
      { type: CUSTOM_SHAPE_TYPES.connectedApp, label: "Connected app", icon: <Plug size={14} /> },
      { type: CUSTOM_SHAPE_TYPES.relationshipLabel, label: "Relationship chip", icon: <Link2 size={14} /> },
      { type: CUSTOM_SHAPE_TYPES.soqlQuery, label: "SOQL query", icon: <FileCode2 size={14} /> },
      { type: CUSTOM_SHAPE_TYPES.validationRule, label: "Validation rule", icon: <ShieldAlert size={14} /> },
      { type: CUSTOM_SHAPE_TYPES.approvalProcess, label: "Approval process", icon: <CheckCheck size={14} /> },
    ];

    const items: CommandItem[] = [
      // File
      {
        id: "file-new",
        category: "File",
        label: "New document",
        icon: <FilePlus2 size={14} />,
        keys: "Ctrl N",
        perform: onNew,
      },
      {
        id: "file-open",
        category: "File",
        label: "Open save file…",
        icon: <Download size={14} />,
        keys: "Ctrl O",
        perform: () => {
          const input = document.querySelector<HTMLInputElement>(
            'input[type="file"][accept*="json"]',
          );
          input?.click();
        },
      },
      {
        id: "file-save",
        category: "File",
        label: "Save",
        icon: <SaveIcon size={14} />,
        keys: "Ctrl S",
        perform: onSave,
      },

      // Export
      {
        id: "export-pdf",
        category: "Export",
        label: pageCount > 1 ? "Export this page as PDF" : "Export PDF",
        icon: <FileText size={14} />,
        perform: onExportPdf,
      },
      ...(pageCount > 1
        ? [
            {
              id: "export-pdf-all",
              category: "Export",
              label: "Export all pages as PDF",
              icon: <Files size={14} />,
              hint: `${pageCount} pages`,
              perform: onExportPdfAll,
            } as CommandItem,
          ]
        : []),
      {
        id: "export-png",
        category: "Export",
        label: "Export PNG",
        icon: <FileImage size={14} />,
        perform: onExportPng,
      },
      {
        id: "export-svg",
        category: "Export",
        label: "Export SVG",
        icon: <FileType size={14} />,
        perform: onExportSvg,
      },

      // View / Actions
      {
        id: "view-templates",
        category: "View",
        label: "Browse templates",
        icon: <LayoutTemplate size={14} />,
        keys: "T",
        perform: () => openTemplatesForCurrentPage(),
      },
      {
        id: "view-present",
        category: "View",
        label: "Enter presentation mode",
        icon: <Play size={14} />,
        perform: () => onPresent(),
      },
      {
        id: "view-shortcuts",
        category: "View",
        label: "Keyboard shortcuts",
        icon: <KeyboardIcon size={14} />,
        keys: "?",
        perform: () => setShortcutsOpen(true),
      },

      // Pages
      {
        id: "pages-add",
        category: "Pages",
        label: "Add new page",
        icon: <Plus size={14} />,
        perform: () => {
          if (!editor) return;
          editor.markHistoryStoppingPoint("add-page");
          editor.createPage({ name: `Page ${editor.getPages().length + 1}` });
          const newPages = editor.getPages();
          const created = newPages[newPages.length - 1];
          if (created) {
            editor.setCurrentPage(created.id);
            editor.zoomToFit({ animation: { duration: 300 } });
          }
        },
      },
      {
        id: "pages-template",
        category: "Pages",
        label: "Add page from template…",
        icon: <Sparkles size={14} />,
        perform: () => openTemplatesForNewPage(),
      },
      {
        id: "pages-notes",
        category: "Pages",
        label: "Edit speaker notes",
        icon: <StickyNote size={14} />,
        perform: () => setNotesOpen(true),
      },

      // Insert blocks
      ...blocks.map<CommandItem>((b) => ({
        id: `insert-${b.type}`,
        category: "Insert",
        label: `Insert ${b.label.toLowerCase()}`,
        hint: b.hint,
        icon: b.icon,
        perform: () => onInsertCustom(b.type),
      })),

      // Apply templates
      ...[BLANK_TEMPLATE, ...TEMPLATES].map<CommandItem>((t) => ({
        id: `template-${t.id}`,
        category: "Templates",
        label: `Apply: ${t.name}`,
        hint: t.description,
        icon: <Sparkles size={14} />,
        perform: () => onPickTemplate(t),
      })),

      // SF importers
      {
        id: "sf-import-sobject",
        category: "Salesforce import",
        label: "Import SObject from metadata…",
        hint: "DESCRIBE JSON · .object XML",
        icon: <Database size={14} />,
        perform: () => setSfImportOpen(true),
      },
      {
        id: "sf-import-apex",
        category: "Salesforce import",
        label: "Import Apex class…",
        hint: ".cls source",
        icon: <Code2 size={14} />,
        perform: () => setApexImportOpen(true),
      },
      {
        id: "sf-import-profile",
        category: "Salesforce import",
        label: "Import Profile / Permission Set…",
        hint: ".profile / .permissionset XML",
        icon: <ShieldCheck size={14} />,
        perform: () => setProfileImportOpen(true),
      },
      {
        id: "sf-import-flow",
        category: "Salesforce import",
        label: "Import Flow…",
        hint: ".flow XML",
        icon: <WorkflowIcon size={14} />,
        perform: () => setFlowImportOpen(true),
      },
      {
        id: "sf-import-soql",
        category: "Salesforce import",
        label: "Build a SOQL block…",
        hint: "Paste any query",
        icon: <FileCode2 size={14} />,
        perform: () => setSoqlImportOpen(true),
      },
    ];

    return items;
  }, [
    editor,
    pageCount,
    onNew,
    onSave,
    onExportPdf,
    onExportPdfAll,
    onExportPng,
    onExportSvg,
    onPresent,
    onInsertCustom,
    onPickTemplate,
    openTemplatesForCurrentPage,
    openTemplatesForNewPage,
  ]);

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

  // Stable open/close callbacks. The panels are wrapped in React.memo so we
  // need stable references — inline `() => setXxx(true)` would defeat the memo
  // and re-render every panel whenever any unrelated state changes.
  const openShortcuts = useCallback(() => setShortcutsOpen(true), []);
  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const openSfImport = useCallback(() => setSfImportOpen(true), []);
  const openApexImport = useCallback(() => setApexImportOpen(true), []);
  const openProfileImport = useCallback(() => setProfileImportOpen(true), []);
  const openFlowImport = useCallback(() => setFlowImportOpen(true), []);
  const openSoqlImport = useCallback(() => setSoqlImportOpen(true), []);
  const toggleToolboxCollapsed = useCallback(
    () => setToolboxCollapsed((v) => !v),
    [],
  );
  const openNotes = useCallback(() => setNotesOpen(true), []);
  const openTemplatesEmpty = useCallback(() => setTemplatesOpen(true), []);

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
        <EmptyCanvas onBrowseTemplates={openTemplatesEmpty} />
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
        onOpenShortcuts={openShortcuts}
        onPresent={onPresent}
        onOpenPalette={openPalette}
      />

      <ToolboxPanel
        onSelectTool={onSelectTool}
        onInsertCustom={onInsertCustom}
        onUploadImage={onUploadImage}
        onInsertSavedBlock={onInsertSavedBlock}
        savedBlocksVersion={savedBlocksVersion}
        onImportSObject={openSfImport}
        onImportApex={openApexImport}
        onImportProfile={openProfileImport}
        onImportFlow={openFlowImport}
        onImportSoql={openSoqlImport}
        collapsed={toolboxCollapsed}
        onToggleCollapse={toggleToolboxCollapsed}
        recents={recents}
      />

      {(selected || inspectorPinned) && (
        <InspectorPanel
          editor={editor}
          selectedShape={selected}
          onSaveAsBlock={onSaveAsBlock}
          pinned={inspectorPinned}
          onTogglePin={togglePinInspector}
        />
      )}

      <PagesBar
        editor={editor}
        onAddPageFromTemplate={openTemplatesForNewPage}
        onEditNotes={openNotes}
      />

      {/* Lazy-mount each dialog: when closed it doesn't even live in the React
          tree, so it can't participate in re-renders triggered by canvas
          interaction. Cuts background work for every closed dialog. */}
      {templatesOpen && (
        <TemplatesDialog
          open={templatesOpen}
          onClose={() => setTemplatesOpen(false)}
          onPick={onPickTemplate}
          mode={templateTarget}
        />
      )}

      {shortcutsOpen && (
        <ShortcutsDialog
          open={shortcutsOpen}
          onClose={() => setShortcutsOpen(false)}
        />
      )}

      {presentOpen && (
        <PresentMode
          open={presentOpen}
          onClose={() => setPresentOpen(false)}
          snapshot={presentSnapshot}
        />
      )}

      {notesOpen && (
        <SpeakerNotesDialog
          open={notesOpen}
          onClose={() => setNotesOpen(false)}
          editor={editor}
        />
      )}

      {sfImportOpen && (
        <ImportSObjectDialog
          open={sfImportOpen}
          onClose={() => setSfImportOpen(false)}
          onInsert={onImportSObject}
        />
      )}

      {apexImportOpen && (
        <ImportApexDialog
          open={apexImportOpen}
          onClose={() => setApexImportOpen(false)}
          onInsert={onImportApex}
        />
      )}

      {profileImportOpen && (
        <ImportProfileDialog
          open={profileImportOpen}
          onClose={() => setProfileImportOpen(false)}
          onInsert={onImportProfile}
        />
      )}

      {flowImportOpen && (
        <ImportFlowDialog
          open={flowImportOpen}
          onClose={() => setFlowImportOpen(false)}
          onInsert={onImportFlow}
        />
      )}

      {soqlImportOpen && (
        <ImportSoqlDialog
          open={soqlImportOpen}
          onClose={() => setSoqlImportOpen(false)}
          onInsert={onImportSoql}
        />
      )}

      {paletteOpen && (
        <CommandPalette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          items={commandItems}
        />
      )}

      {welcomeOpen && (
        <WelcomeDialog
          open={welcomeOpen}
          onClose={dismissWelcome}
          onBrowseTemplates={openTemplatesForCurrentPage}
          onStartTour={() => setTourOpen(true)}
        />
      )}

      {tourOpen && (
        <TourOverlay
          open={tourOpen}
          steps={tourSteps}
          onClose={() => setTourOpen(false)}
        />
      )}

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
