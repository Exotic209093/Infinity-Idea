import { createShapeId, type Editor, type TLShapeId } from "tldraw";
import { CUSTOM_SHAPE_TYPES } from "@/types/shapes";
import {
  toFieldsText,
  toMembersText,
  toPermRowsText,
  type ImportedApex,
  type ImportedFlow,
  type ImportedProfile,
  type ImportedRelationship,
  type ImportedSOQL,
  type ImportedSObject,
} from "@/lib/sfImporter";

/**
 * Drop one or more SObjects on the canvas as a grid, place validation rules
 * underneath each, and draw relationship-chip arrows between referenced pairs.
 * Returns the toast message describing what was inserted.
 *
 * Assumes objects.length > 0 — callers should guard before invoking.
 */
export function insertSObjectImport(
  editor: Editor,
  objects: ImportedSObject[],
  rels: ImportedRelationship[],
): string {
  const viewport = editor.getViewportPageBounds();
  const cols = Math.min(3, objects.length);
  const cellW = 340;
  const cellH = 320;
  const gap = 40;
  const originX =
    viewport.center.x -
    (cols * cellW + (cols - 1) * gap) / 2;
  const originY = viewport.y + 80;

  const apiToId = new Map<string, TLShapeId>();
  const created: TLShapeId[] = [];

  editor.markHistoryStoppingPoint(
    objects.length === 1 ? "import-sobject" : "import-sobjects",
  );

  // Place each SObject in the grid.
  const objBoundsCache = new Map<string, { x: number; y: number; w: number; h: number }>();
  objects.forEach((obj, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = originX + col * (cellW + gap);
    const y = originY + row * (cellH + gap);
    const id = createShapeId();
    apiToId.set(obj.apiName, id);
    created.push(id);
    objBoundsCache.set(obj.apiName, { x, y, w: 320, h: 300 });
    editor.createShape({
      id,
      type: CUSTOM_SHAPE_TYPES.sobject,
      x,
      y,
      props: {
        w: 320,
        h: 300,
        label: obj.label,
        apiName: obj.apiName,
        sobjectType: obj.sobjectType,
        fields: toFieldsText(obj),
      },
    });
  });

  // Drop any validation rules under the relevant SObject.
  let totalRules = 0;
  objects.forEach((obj) => {
    if (!obj.validationRules || obj.validationRules.length === 0) return;
    const objBounds = objBoundsCache.get(obj.apiName);
    if (!objBounds) return;
    obj.validationRules.forEach((rule, j) => {
      const ruleId = createShapeId();
      totalRules++;
      editor.createShape({
        id: ruleId,
        type: CUSTOM_SHAPE_TYPES.validationRule,
        x: objBounds.x,
        y: objBounds.y + objBounds.h + 24 + j * 240,
        props: {
          w: 320,
          h: 220,
          label: rule.label,
          apiName: rule.apiName,
          active: rule.active,
          formula: rule.formula,
          errorMessage: rule.errorMessage,
          errorDisplayField: rule.errorDisplayField,
        },
      });
      created.push(ruleId);
    });
  });

  // Drop a relationship chip centred between each referenced pair.
  rels.forEach((r) => {
    const fromId = apiToId.get(r.fromApi);
    const toId = apiToId.get(r.toApi);
    if (!fromId || !toId) return;
    const fromBounds = editor.getShapePageBounds(fromId);
    const toBounds = editor.getShapePageBounds(toId);
    if (!fromBounds || !toBounds) return;
    const cx = (fromBounds.center.x + toBounds.center.x) / 2 - 90;
    const cy = (fromBounds.center.y + toBounds.center.y) / 2 - 26;
    const chipId = createShapeId();
    editor.createShape({
      id: chipId,
      type: CUSTOM_SHAPE_TYPES.relationshipLabel,
      x: cx,
      y: cy,
      props: {
        w: 180,
        h: 52,
        label: `${r.fromApi} → ${r.toApi}`,
        cardinality: r.cardinality,
        kind: r.kind,
      },
    });
    created.push(chipId);
  });

  editor.setCurrentTool("select");
  if (created.length > 0) editor.select(...created);
  editor.zoomToFit({ animation: { duration: 400 } });

  const ruleSummary = totalRules > 0 ? ` · ${totalRules} rule${totalRules === 1 ? "" : "s"}` : "";
  return objects.length === 1
    ? `Imported ${objects[0].apiName}${ruleSummary}`
    : `Imported ${objects.length} objects · ${rels.length} relationships${ruleSummary}`;
}

/**
 * Drop a single ApexClass shape at viewport centre.
 * Returns the toast message.
 */
export function insertApexImport(editor: Editor, apex: ImportedApex): string {
  const viewport = editor.getViewportPageBounds();
  const id = createShapeId();
  editor.markHistoryStoppingPoint("import-apex");
  editor.createShape({
    id,
    type: CUSTOM_SHAPE_TYPES.apexClass,
    x: viewport.center.x - 160,
    y: viewport.center.y - 110,
    props: {
      w: 320,
      h: 220,
      label: apex.label,
      apiName: apex.apiName,
      classKind: apex.classKind,
      visibility: apex.visibility,
      sharing: apex.sharing,
      members: toMembersText(apex),
    },
  });
  editor.setCurrentTool("select");
  editor.select(id);
  return `Imported ${apex.apiName}`;
}

/**
 * Drop a single PermissionMatrix shape at viewport centre.
 * Returns the toast message.
 */
export function insertProfileImport(
  editor: Editor,
  profile: ImportedProfile,
): string {
  const viewport = editor.getViewportPageBounds();
  const id = createShapeId();
  editor.markHistoryStoppingPoint("import-profile");
  editor.createShape({
    id,
    type: CUSTOM_SHAPE_TYPES.permissionMatrix,
    x: viewport.center.x - 180,
    y: viewport.center.y - 110,
    props: {
      w: 360,
      h: 220,
      label: "Object permissions",
      profile: profile.label,
      rows: toPermRowsText(profile),
    },
  });
  editor.setCurrentTool("select");
  editor.select(id);
  return `Imported permissions for ${profile.label}`;
}

/**
 * Lay Flow elements out in a grid with a title block and connector arrows.
 * Returns the toast message.
 */
export function insertFlowImport(editor: Editor, flow: ImportedFlow): string {
  const viewport = editor.getViewportPageBounds();
  const cols = Math.min(4, flow.elements.length);
  const cellW = 240;
  const cellH = 120;
  const gap = 40;
  const originX =
    viewport.center.x -
    (cols * cellW + (cols - 1) * gap) / 2;
  const originY = viewport.y + 80;

  const nameToId = new Map<string, TLShapeId>();

  editor.markHistoryStoppingPoint("import-flow");

  // Title block with the flow name
  const titleId = createShapeId();
  editor.createShape({
    id: titleId,
    type: CUSTOM_SHAPE_TYPES.titleBlock,
    x: originX,
    y: viewport.y + 20,
    props: {
      w: cols * cellW + (cols - 1) * gap,
      h: 60,
      label: flow.label,
      subtitle: flow.apiName,
    },
  });

  // Flow element cards
  flow.elements.forEach((el, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = originX + col * (cellW + gap);
    const y = originY + 40 + row * (cellH + gap);
    const id = createShapeId();
    nameToId.set(el.name, id);
    editor.createShape({
      id,
      type: CUSTOM_SHAPE_TYPES.flowElement,
      x,
      y,
      props: {
        w: cellW,
        h: cellH,
        label: el.label,
        elementType: el.type,
        details: el.details,
      },
    });
  });

  // Connectors — simple tldraw arrows between element centres.
  for (const el of flow.elements) {
    const fromId = nameToId.get(el.name);
    if (!fromId) continue;
    for (const targetName of el.connectors) {
      const toId = nameToId.get(targetName);
      if (!toId) continue;
      const fromBounds = editor.getShapePageBounds(fromId);
      const toBounds = editor.getShapePageBounds(toId);
      if (!fromBounds || !toBounds) continue;
      const arrowId = createShapeId();
      editor.createShape({
        id: arrowId,
        type: "arrow",
        x: 0,
        y: 0,
        props: {
          start: { x: fromBounds.center.x, y: fromBounds.center.y },
          end: { x: toBounds.center.x, y: toBounds.center.y },
          color: "grey",
          size: "s",
        },
      });
    }
  }

  editor.setCurrentTool("select");
  editor.zoomToFit({ animation: { duration: 400 } });
  const connectors = flow.elements.reduce(
    (n, e) => n + e.connectors.length,
    0,
  );
  return `Imported ${flow.label} · ${flow.elements.length} elements · ${connectors} connectors`;
}

/**
 * Drop a single SOQLQuery shape at viewport centre.
 * Returns the toast message.
 */
export function insertSoqlImport(editor: Editor, q: ImportedSOQL): string {
  const viewport = editor.getViewportPageBounds();
  const id = createShapeId();
  editor.markHistoryStoppingPoint("import-soql");
  editor.createShape({
    id,
    type: CUSTOM_SHAPE_TYPES.soqlQuery,
    x: viewport.center.x - 200,
    y: viewport.center.y - 120,
    props: {
      w: 400,
      h: 240,
      label: "Query",
      rawQuery: q.rawQuery,
      fromObject: q.fromObject,
      fields: q.fields.join(", "),
      conditions: q.conditions,
      orderBy: q.orderBy,
      limit: q.limit,
    },
  });
  editor.setCurrentTool("select");
  editor.select(id);
  return `Inserted SOQL block${q.fromObject ? ` for ${q.fromObject}` : ""}`;
}
