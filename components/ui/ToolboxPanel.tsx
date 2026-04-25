"use client";

import { useEffect, useState } from "react";
import {
  loadSavedBlocks,
  saveBlocks,
  type SavedBlock,
} from "@/lib/savedBlocks";
import {
  Square,
  Circle,
  Triangle,
  Type,
  ArrowRight,
  PenLine,
  Minus,
  Image as ImageIcon,
  Workflow,
  GitBranch,
  Flag,
  Users,
  Columns3,
  Crown,
  MessageSquare,
  ListChecks,
  Table as TableIcon,
  Quote as QuoteIcon,
  TrendingUp,
  Bookmark,
  X as XIcon,
  Database,
  Code2,
  Workflow as WorkflowIcon,
  ShieldCheck,
  Plug,
  Link2,
  Cloud,
  FileDown,
  FileCode2,
  ShieldAlert,
  CheckCheck,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Clock,
} from "lucide-react";
import { CUSTOM_SHAPE_TYPES } from "@/types/shapes";

type Tab = "shapes" | "diagrams" | "blocks" | "salesforce" | "saved";

type Props = {
  onSelectTool: (toolId: string) => void;
  onInsertCustom: (shapeType: string) => void;
  onUploadImage: (file: File) => void;
  onInsertSavedBlock: (block: SavedBlock) => void;
  savedBlocksVersion: number; // bump to force a reload from storage
  onImportSObject: () => void;
  onImportApex: () => void;
  onImportProfile: () => void;
  onImportFlow: () => void;
  onImportSoql: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  recents: string[];
};

const shapeItems: Array<{ id: string; label: string; icon: React.ReactNode }> = [
  { id: "geo-rectangle", label: "Rectangle", icon: <Square size={16} /> },
  { id: "geo-ellipse", label: "Ellipse", icon: <Circle size={16} /> },
  { id: "geo-triangle", label: "Triangle", icon: <Triangle size={16} /> },
  { id: "text", label: "Text", icon: <Type size={16} /> },
  { id: "arrow", label: "Arrow", icon: <ArrowRight size={16} /> },
  { id: "line", label: "Line", icon: <Minus size={16} /> },
  { id: "draw", label: "Draw", icon: <PenLine size={16} /> },
];

const diagramItems: Array<{ id: string; label: string; icon: React.ReactNode }> = [
  { id: "geo-diamond", label: "Diamond", icon: <Square size={16} style={{ transform: "rotate(45deg)" }} /> },
  { id: "geo-cloud", label: "Cloud", icon: <Circle size={16} /> },
  { id: "geo-arrow-right", label: "Arrow block", icon: <ArrowRight size={16} /> },
  { id: "geo-hexagon", label: "Hexagon", icon: <Circle size={16} /> },
];

const blockItems: Array<{
  type: string;
  label: string;
  hint: string;
  icon: React.ReactNode;
}> = [
  { type: CUSTOM_SHAPE_TYPES.titleBlock, label: "Title Block", hint: "Cover with gradient", icon: <Crown size={16} /> },
  { type: CUSTOM_SHAPE_TYPES.processStep, label: "Process Step", hint: "Numbered step", icon: <Workflow size={16} /> },
  { type: CUSTOM_SHAPE_TYPES.decisionGate, label: "Decision Gate", hint: "Yes / No branch", icon: <GitBranch size={16} /> },
  { type: CUSTOM_SHAPE_TYPES.milestone, label: "Milestone", hint: "Key moment", icon: <Flag size={16} /> },
  { type: CUSTOM_SHAPE_TYPES.orgNode, label: "Org Node", hint: "Person card", icon: <Users size={16} /> },
  { type: CUSTOM_SHAPE_TYPES.swimlane, label: "Swimlane", hint: "Grouping lane", icon: <Columns3 size={16} /> },
  { type: CUSTOM_SHAPE_TYPES.callout, label: "Callout", hint: "Important note", icon: <MessageSquare size={16} /> },
  { type: CUSTOM_SHAPE_TYPES.checklist, label: "Checklist", hint: "Checkable list", icon: <ListChecks size={16} /> },
  { type: CUSTOM_SHAPE_TYPES.kpiStat, label: "KPI Stat", hint: "Metric with trend", icon: <TrendingUp size={16} /> },
  { type: CUSTOM_SHAPE_TYPES.table, label: "Table", hint: "Editable grid", icon: <TableIcon size={16} /> },
  { type: CUSTOM_SHAPE_TYPES.quote, label: "Quote", hint: "Pull quote + attribution", icon: <QuoteIcon size={16} /> },
];

const salesforceItems: Array<{
  type: string;
  label: string;
  hint: string;
  icon: React.ReactNode;
}> = [
  { type: CUSTOM_SHAPE_TYPES.sobject, label: "SObject", hint: "Object + fields", icon: <Database size={16} /> },
  { type: CUSTOM_SHAPE_TYPES.apexClass, label: "Apex Class", hint: "Class, trigger, interface", icon: <Code2 size={16} /> },
  { type: CUSTOM_SHAPE_TYPES.flowElement, label: "Flow Element", hint: "Start, decision, action…", icon: <WorkflowIcon size={16} /> },
  { type: CUSTOM_SHAPE_TYPES.permissionMatrix, label: "Permissions", hint: "CRUD matrix per profile", icon: <ShieldCheck size={16} /> },
  { type: CUSTOM_SHAPE_TYPES.connectedApp, label: "Connected App", hint: "Integration / OAuth app", icon: <Plug size={16} /> },
  { type: CUSTOM_SHAPE_TYPES.relationshipLabel, label: "Relationship", hint: "Cardinality arrow chip", icon: <Link2 size={16} /> },
  { type: CUSTOM_SHAPE_TYPES.soqlQuery, label: "SOQL Query", hint: "Highlighted query block", icon: <FileCode2 size={16} /> },
  { type: CUSTOM_SHAPE_TYPES.validationRule, label: "Validation Rule", hint: "Formula + error message", icon: <ShieldAlert size={16} /> },
  { type: CUSTOM_SHAPE_TYPES.approvalProcess, label: "Approval Process", hint: "Multi-step approval", icon: <CheckCheck size={16} /> },
];

export function ToolboxPanel({
  onSelectTool,
  onInsertCustom,
  onUploadImage,
  onInsertSavedBlock,
  savedBlocksVersion,
  onImportSObject,
  onImportApex,
  onImportProfile,
  onImportFlow,
  onImportSoql,
  collapsed,
  onToggleCollapse,
  recents,
}: Props) {
  const [tab, setTab] = useState<Tab>("blocks");
  const [savedBlocks, setSavedBlocks] = useState<SavedBlock[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSavedBlocks(loadSavedBlocks());
  }, [savedBlocksVersion]);

  const deleteSavedBlock = (id: string) => {
    const next = savedBlocks.filter((b) => b.id !== id);
    setSavedBlocks(next);
    saveBlocks(next);
  };

  const searchQuery = search.trim().toLowerCase();
  const isSearching = searchQuery.length > 0;

  type FlatItem = {
    key: string;
    label: string;
    hint: string;
    icon: React.ReactNode;
    onClick: () => void;
  };
  const flatResults: FlatItem[] = isSearching
    ? [
        ...blockItems.map((b) => ({
          key: `block-${b.type}`,
          label: b.label,
          hint: b.hint,
          icon: b.icon,
          onClick: () => onInsertCustom(b.type),
        })),
        ...salesforceItems.map((b) => ({
          key: `sf-${b.type}`,
          label: b.label,
          hint: b.hint,
          icon: b.icon,
          onClick: () => onInsertCustom(b.type),
        })),
        ...shapeItems.map((s) => ({
          key: `shape-${s.id}`,
          label: s.label,
          hint: "Tool",
          icon: s.icon,
          onClick: () => onSelectTool(s.id),
        })),
        ...diagramItems.map((s) => ({
          key: `diagram-${s.id}`,
          label: s.label,
          hint: "Diagram tool",
          icon: s.icon,
          onClick: () => onSelectTool(s.id),
        })),
        ...savedBlocks.map((b) => ({
          key: `saved-${b.id}`,
          label: b.name,
          hint: `${b.shapes.length} saved shape${b.shapes.length === 1 ? "" : "s"}`,
          icon: <Bookmark size={16} />,
          onClick: () => onInsertSavedBlock(b),
        })),
      ].filter(
        (it) =>
          it.label.toLowerCase().includes(searchQuery) ||
          it.hint.toLowerCase().includes(searchQuery),
      )
    : [];

  if (collapsed) {
    return (
      <div className="glass-strong pointer-events-auto absolute left-3 top-20 z-10 hidden flex-col items-center gap-2 rounded-2xl p-1 shadow-glass md:flex">
        <button
          onClick={onToggleCollapse}
          className="btn-ghost flex h-9 w-9 items-center justify-center rounded-lg"
          title="Show toolbox"
        >
          <PanelLeftOpen size={16} />
        </button>
      </div>
    );
  }

  return (
    <div data-tour="toolbox" className="glass-strong animate-slide-in-left pointer-events-auto absolute left-3 top-20 z-10 hidden w-64 flex-col overflow-hidden rounded-2xl shadow-glass md:flex"
         style={{ maxHeight: "calc(100vh - 110px)", animationDelay: "120ms" }}>
      <div className="flex items-center gap-1.5 border-b border-white/10 p-1.5">
        <div className="flex flex-1 items-center gap-2 rounded-lg bg-white/5 px-2 py-1.5">
          <Search size={12} className="text-white/45" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search blocks, tools…"
            className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/40"
            spellCheck={false}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-white/40 hover:text-white"
              title="Clear search"
            >
              <XIcon size={12} />
            </button>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="btn-ghost flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md"
          title="Hide toolbox"
        >
          <PanelLeftClose size={14} />
        </button>
      </div>

      {!isSearching && recents.length > 0 && (
        <div className="border-b border-white/10 p-2">
          <div className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-white/45">
            <Clock size={11} /> Recent
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {recents.map((type) => {
              const meta =
                blockItems.find((b) => b.type === type) ??
                salesforceItems.find((b) => b.type === type);
              if (!meta) return null;
              return (
                <button
                  key={type}
                  onClick={() => onInsertCustom(type)}
                  className="toolbox-block flex flex-col items-center gap-1.5 rounded-lg border border-white/5 bg-white/5 p-2 text-center hover:border-white/20 hover:bg-white/10"
                  title={meta.label}
                >
                  <span className="text-white/85">{meta.icon}</span>
                  <span className="line-clamp-1 text-[10px] font-semibold text-white/85">
                    {meta.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!isSearching && (
        <div className="scroll-thin flex overflow-x-auto border-b border-white/10 p-1">
          <TabButton active={tab === "shapes"} onClick={() => setTab("shapes")}>
            Shapes
          </TabButton>
          <TabButton active={tab === "diagrams"} onClick={() => setTab("diagrams")}>
            Diagrams
          </TabButton>
          <TabButton active={tab === "blocks"} onClick={() => setTab("blocks")}>
            Blocks
          </TabButton>
          <TabButton
            active={tab === "salesforce"}
            onClick={() => setTab("salesforce")}
          >
            <span className="flex items-center justify-center gap-1">
              <Cloud size={10} /> SF
            </span>
          </TabButton>
          <TabButton active={tab === "saved"} onClick={() => setTab("saved")}>
            Saved
          </TabButton>
        </div>
      )}

      <div className="scroll-thin flex-1 overflow-y-auto p-2">
        {isSearching && (
          <div className="flex flex-col gap-1.5">
            {flatResults.length === 0 ? (
              <div className="px-1 py-6 text-center text-xs text-white/45">
                No matches for &ldquo;{search}&rdquo;
              </div>
            ) : (
              flatResults.map((it) => (
                <button
                  key={it.key}
                  onClick={() => {
                    it.onClick();
                  }}
                  className="toolbox-block group flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 p-2.5 text-left hover:border-white/20 hover:bg-white/10"
                >
                  <div
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(108,99,255,0.4), rgba(236,72,153,0.4))",
                    }}
                  >
                    {it.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{it.label}</div>
                    <div className="truncate text-[11px] text-white/55">
                      {it.hint}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {!isSearching && tab === "shapes" && (
          <div className="grid grid-cols-2 gap-2">
            {shapeItems.map((s) => (
              <ToolCard key={s.id} onClick={() => onSelectTool(s.id)}>
                <div className="text-white/80">{s.icon}</div>
                <div className="text-xs text-white/80">{s.label}</div>
              </ToolCard>
            ))}
          </div>
        )}

        {!isSearching && tab === "diagrams" && (
          <div className="grid grid-cols-2 gap-2">
            {diagramItems.map((s) => (
              <ToolCard key={s.id} onClick={() => onSelectTool(s.id)}>
                <div className="text-white/80">{s.icon}</div>
                <div className="text-xs text-white/80">{s.label}</div>
              </ToolCard>
            ))}
          </div>
        )}

        {!isSearching && tab === "saved" && (
          <div className="flex flex-col gap-1.5">
            {savedBlocks.length === 0 ? (
              <div className="px-1 py-4 text-center text-xs text-white/50">
                <Bookmark size={20} className="mx-auto mb-2 text-white/35" />
                Select shapes on the canvas, then click
                <br />
                <span className="font-semibold text-white/70">
                  &ldquo;Save as block&rdquo;
                </span>{" "}
                in the inspector.
              </div>
            ) : (
              savedBlocks.map((b) => (
                <div
                  key={b.id}
                  className="toolbox-block group relative flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 p-3 text-left hover:border-white/20 hover:bg-white/10"
                >
                  <button
                    onClick={() => onInsertSavedBlock(b)}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    <div
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(34,211,238,0.4), rgba(108,99,255,0.4))",
                      }}
                    >
                      <Bookmark size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">
                        {b.name}
                      </div>
                      <div className="text-xs text-white/50">
                        {b.shapes.length} shape{b.shapes.length === 1 ? "" : "s"}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => deleteSavedBlock(b.id)}
                    className="btn-ghost flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md opacity-0 transition group-hover:opacity-100"
                    title="Delete saved block"
                  >
                    <XIcon size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {!isSearching && tab === "salesforce" && (
          <div className="flex flex-col gap-1.5">
            <div className="mb-1 flex items-center gap-2 rounded-md border border-cyan-400/20 bg-cyan-400/5 px-3 py-2 text-[11px] text-cyan-200/85">
              <Cloud size={14} className="flex-shrink-0" />
              <span>
                Salesforce-native blocks. Inspector has a format guide for
                each.
              </span>
            </div>
            <div className="mb-1 flex flex-col gap-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-cyan-200/70">
                Import metadata
              </div>
              <ImportButton
                onClick={onImportSObject}
                title="Paste DESCRIBE JSON or .object XML"
                label="SObjects"
                hint="DESCRIBE JSON · .object XML · batch"
              />
              <ImportButton
                onClick={onImportApex}
                title="Paste Apex .cls source"
                label="Apex class"
                hint="Extract name, visibility, methods"
              />
              <ImportButton
                onClick={onImportProfile}
                title="Paste .profile XML"
                label="Profile"
                hint="Becomes a Permission Matrix"
              />
              <ImportButton
                onClick={onImportFlow}
                title="Paste .flow XML"
                label="Flow"
                hint="Becomes connected Flow Elements"
              />
              <ImportButton
                onClick={onImportSoql}
                title="Paste a SOQL query"
                label="SOQL"
                hint="Visualised query block"
              />
            </div>
            {salesforceItems.map((b) => (
              <button
                key={b.type}
                onClick={() => onInsertCustom(b.type)}
                className="toolbox-block group flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 p-3 text-left hover:border-white/20 hover:bg-white/10"
              >
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(34,211,238,0.4), rgba(108,99,255,0.4))",
                  }}
                >
                  {b.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{b.label}</div>
                  <div className="truncate text-xs text-white/50">{b.hint}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {!isSearching && tab === "blocks" && (
          <div className="flex flex-col gap-1.5">
            {blockItems.map((b) => (
              <button
                key={b.type}
                onClick={() => onInsertCustom(b.type)}
                className="toolbox-block group flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 p-3 text-left hover:border-white/20 hover:bg-white/10"
              >
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(108,99,255,0.4), rgba(236,72,153,0.4))",
                  }}
                >
                  {b.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{b.label}</div>
                  <div className="truncate text-xs text-white/50">{b.hint}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-white/10 p-2">
        <label className="btn-ghost flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm">
          <ImageIcon size={14} />
          Upload image
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUploadImage(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>
    </div>
  );
}

function ImportButton({
  onClick,
  title,
  label,
  hint,
}: {
  onClick: () => void;
  title: string;
  label: string;
  hint: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center gap-3 rounded-lg border border-cyan-400/25 bg-cyan-400/5 p-2.5 text-left transition hover:border-cyan-400/50 hover:bg-cyan-400/10"
    >
      <div
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md"
        style={{
          background:
            "linear-gradient(135deg, rgba(34,211,238,0.55), rgba(108,99,255,0.55))",
        }}
      >
        <FileDown size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{label}</div>
        <div className="truncate text-[10.5px] text-white/55">{hint}</div>
      </div>
    </button>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition",
        active
          ? "bg-white/10 text-white shadow-inner shadow-white/5"
          : "text-white/55 hover:text-white",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function ToolCard({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-lg border border-white/5 bg-white/5 p-3 transition hover:border-white/20 hover:bg-white/10"
    >
      {children}
    </button>
  );
}
