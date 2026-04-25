/*
 * Recent block tracking — keeps a short list of the block types the user has
 * inserted most recently in localStorage so the Toolbox can surface them at
 * the top.
 */

const STORAGE_KEY = "infinite-idea:recent-blocks:v1";
const MAX = 6;

export function loadRecentBlocks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export function pushRecentBlock(type: string): string[] {
  if (typeof window === "undefined") return [];
  const existing = loadRecentBlocks().filter((t) => t !== type);
  const next = [type, ...existing].slice(0, MAX);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage disabled / quota — ignore */
  }
  return next;
}
