import { createShapeId, type Editor, type TLShapeId, type TLShape } from "tldraw";

/*
 * Saved blocks: user-defined reusable shape bundles stored in localStorage.
 * A saved block is a name + an array of shape records (stripped of page/parent
 * info) captured relative to the selection's top-left corner, so that dropping
 * it onto the canvas reconstructs the original layout.
 */

export type SavedBlock = {
  id: string;
  name: string;
  createdAt: string;
  shapes: Array<TLShape & { parentId?: string; index?: string }>;
};

const STORAGE_KEY = "infinite-idea:saved-blocks:v1";

export function loadSavedBlocks(): SavedBlock[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveBlocks(blocks: SavedBlock[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));
  } catch {
    /* storage quota / disabled — surface via caller */
  }
}

/**
 * Build a SavedBlock from the editor's current selection. Returns null if
 * nothing is selected.
 */
export function buildBlockFromSelection(
  editor: Editor,
  name: string,
): SavedBlock | null {
  const selected = editor.getSelectedShapes();
  if (selected.length === 0) return null;

  // Anchor to top-left of the selection bounds so the stored shapes are
  // relative to (0, 0).
  const bounds = editor.getSelectionPageBounds();
  const originX = bounds?.x ?? 0;
  const originY = bounds?.y ?? 0;

  const shapes = selected.map((s) => {
    // Shallow copy; drop parentId (we'll reparent to the current page on paste)
    const { parentId: _parent, index: _index, ...rest } = s as TLShape & {
      parentId?: string;
      index?: string;
    };
    return {
      ...rest,
      x: s.x - originX,
      y: s.y - originY,
    } as SavedBlock["shapes"][number];
  });

  return {
    id: `sb_${Math.random().toString(36).slice(2, 10)}`,
    name,
    createdAt: new Date().toISOString(),
    shapes,
  };
}

/** Drop a saved block onto the current page at the viewport center. */
export function insertSavedBlock(editor: Editor, block: SavedBlock): void {
  if (block.shapes.length === 0) return;
  const center = editor.getViewportPageBounds().center;
  const newIds: TLShapeId[] = [];
  editor.markHistoryStoppingPoint(`insert-block-${block.id}`);
  // Fresh IDs so repeat drops don't collide with earlier ones.
  const mapped = block.shapes.map((s) => {
    const newId = createShapeId();
    newIds.push(newId);
    return {
      ...s,
      id: newId,
      x: s.x + center.x - 120,
      y: s.y + center.y - 80,
    };
  });
  editor.createShapes(mapped);
  editor.setCurrentTool("select");
  editor.select(...newIds);
}
