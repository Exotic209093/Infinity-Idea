"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, CornerDownLeft } from "lucide-react";

export type CommandItem = {
  id: string;
  label: string;
  hint?: string;
  category: string;
  icon?: React.ReactNode;
  keys?: string;
  perform: () => void;
};

type Props = {
  open: boolean;
  onClose: () => void;
  items: CommandItem[];
};

/*
 * Fuzzy-ish ranked filter:
 *   - Exact prefix matches rank highest
 *   - Substring matches next
 *   - Subsequence (initials) matches last
 * Items that don't match the query at all are dropped.
 */
function rank(item: CommandItem, query: string): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const haystack = `${item.label} ${item.hint ?? ""} ${item.category}`.toLowerCase();
  if (haystack.startsWith(q)) return 100;
  if (item.label.toLowerCase().startsWith(q)) return 95;
  if (item.label.toLowerCase().includes(q)) return 80;
  if (haystack.includes(q)) return 60;
  // Sub-sequence match (every char of q appears in order somewhere)
  let i = 0;
  for (const c of haystack) {
    if (c === q[i]) i++;
    if (i === q.length) return 40;
  }
  return 0;
}

export function CommandPalette({ open, onClose, items }: Props) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const ranked = useMemo(() => {
    return items
      .map((it) => ({ it, score: rank(it, query) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.it);
  }, [items, query]);

  // Group by category, but keep flat ordering for keyboard nav.
  const byCategory = useMemo(() => {
    const groups = new Map<string, CommandItem[]>();
    for (const it of ranked) {
      const arr = groups.get(it.category) ?? [];
      arr.push(it);
      groups.set(it.category, arr);
    }
    return Array.from(groups.entries());
  }, [ranked]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, Math.max(0, ranked.length - 1)));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = ranked[activeIdx];
        if (item) {
          item.perform();
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, ranked, activeIdx, onClose]);

  // Reset highlight to first when filter changes
  useEffect(() => setActiveIdx(0), [query]);

  // Keep the active row scrolled into view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-cmd-idx="${activeIdx}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  if (!open) return null;

  let runningIdx = -1;

  return (
    <div
      className="animate-fade-in fixed inset-0 flex items-start justify-center p-4 pt-[10vh]"
      style={{
        background: "rgba(8,8,16,0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 1100,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div className="glass-strong animate-pop-in flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl shadow-glass">
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <Search size={16} className="text-white/55" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search blocks, templates, actions…"
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
            spellCheck={false}
          />
          <span
            className="rounded-md border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/65"
            style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.06) inset" }}
          >
            Esc
          </span>
        </div>
        <div
          ref={listRef}
          className="scroll-thin max-h-[55vh] flex-1 overflow-y-auto p-2"
        >
          {ranked.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-white/45">
              No matches for &ldquo;{query}&rdquo;
            </div>
          )}
          {byCategory.map(([cat, list]) => (
            <div key={cat} className="mb-3 last:mb-0">
              <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                {cat}
              </div>
              <div className="flex flex-col">
                {list.map((it) => {
                  runningIdx++;
                  const isActive = runningIdx === activeIdx;
                  const idx = runningIdx;
                  return (
                    <button
                      key={it.id}
                      data-cmd-idx={idx}
                      onMouseEnter={() => setActiveIdx(idx)}
                      onClick={() => {
                        it.perform();
                        onClose();
                      }}
                      className={[
                        "flex items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm transition",
                        isActive
                          ? "bg-white/12 text-white"
                          : "text-white/85 hover:bg-white/5",
                      ].join(" ")}
                    >
                      {it.icon && (
                        <span
                          className={
                            isActive ? "text-white" : "text-white/65"
                          }
                        >
                          {it.icon}
                        </span>
                      )}
                      <span className="flex-1 truncate">
                        <span className="font-medium">{it.label}</span>
                        {it.hint && (
                          <span className="ml-2 text-xs text-white/45">
                            {it.hint}
                          </span>
                        )}
                      </span>
                      {it.keys && (
                        <span
                          className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/65"
                          style={{
                            boxShadow:
                              "0 1px 0 rgba(255,255,255,0.06) inset",
                          }}
                        >
                          {it.keys}
                        </span>
                      )}
                      {isActive && (
                        <CornerDownLeft
                          size={12}
                          className="text-white/45"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
