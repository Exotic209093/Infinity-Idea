import { createShapeId, type Editor, type TLShapeId } from "tldraw";
import { CUSTOM_SHAPE_TYPES } from "@/types/shapes";

/*
 * A template is a named bundle of shapes the user can drop onto a blank
 * canvas to get started fast. Each template is just a function that calls
 * editor.createShapes — we keep it data-free so the tldraw APIs do the
 * positioning + ID allocation for us.
 */

export type Template = {
  id: string;
  name: string;
  description: string;
  accent: string;
  apply: (editor: Editor) => void;
};

function id(): TLShapeId {
  return createShapeId();
}

function applyAt(
  editor: Editor,
  builder: (offset: { x: number; y: number }) => void,
) {
  const { center } = editor.getViewportPageBounds();
  builder({ x: center.x - 600, y: center.y - 280 });
  editor.setCurrentTool("select");
  editor.selectNone();
}

export const TEMPLATES: Template[] = [
  {
    id: "process-flow",
    name: "Process Flow",
    description: "Title, four process steps, and a decision gate.",
    accent: "#8b5cf6",
    apply: (editor) =>
      applyAt(editor, ({ x, y }) => {
        const titleId = id();
        const step1 = id();
        const step2 = id();
        const step3 = id();
        const gate = id();
        const step4 = id();

        editor.markHistoryStoppingPoint("apply-template-process-flow");
        editor.createShapes([
          {
            id: titleId,
            type: CUSTOM_SHAPE_TYPES.titleBlock,
            x,
            y,
            props: {
              w: 1200,
              h: 180,
              label: "Client Process",
              subtitle: "Step-by-step walkthrough",
            },
          },
          {
            id: step1,
            type: CUSTOM_SHAPE_TYPES.processStep,
            x,
            y: y + 240,
            props: {
              w: 260,
              h: 120,
              label: "Kick-off meeting",
              stepNumber: 1,
              accent: "#8b5cf6",
            },
          },
          {
            id: step2,
            type: CUSTOM_SHAPE_TYPES.processStep,
            x: x + 320,
            y: y + 240,
            props: {
              w: 260,
              h: 120,
              label: "Discovery & requirements",
              stepNumber: 2,
              accent: "#8b5cf6",
            },
          },
          {
            id: step3,
            type: CUSTOM_SHAPE_TYPES.processStep,
            x: x + 640,
            y: y + 240,
            props: {
              w: 260,
              h: 120,
              label: "Design & review",
              stepNumber: 3,
              accent: "#8b5cf6",
            },
          },
          {
            id: gate,
            type: CUSTOM_SHAPE_TYPES.decisionGate,
            x: x + 960,
            y: y + 220,
            props: {
              w: 220,
              h: 160,
              label: "Approved?",
              yes: "Yes",
              no: "No",
            },
          },
          {
            id: step4,
            type: CUSTOM_SHAPE_TYPES.processStep,
            x: x + 960,
            y: y + 420,
            props: {
              w: 260,
              h: 120,
              label: "Go live",
              stepNumber: 4,
              accent: "#8b5cf6",
            },
          },
        ]);
      }),
  },
  {
    id: "project-roadmap",
    name: "Project Roadmap",
    description: "Title and four horizontal milestones.",
    accent: "#22d3ee",
    apply: (editor) =>
      applyAt(editor, ({ x, y }) => {
        editor.markHistoryStoppingPoint("apply-template-project-roadmap");
        editor.createShapes([
          {
            id: id(),
            type: CUSTOM_SHAPE_TYPES.titleBlock,
            x,
            y,
            props: {
              w: 1200,
              h: 180,
              label: "2026 Roadmap",
              subtitle: "Quarterly milestones",
            },
          },
          ...(["Q1", "Q2", "Q3", "Q4"] as const).map((q, i) => ({
            id: id(),
            type: CUSTOM_SHAPE_TYPES.milestone,
            x: x + i * 300,
            y: y + 240,
            props: {
              w: 260,
              h: 110,
              label: `Milestone ${i + 1}`,
              date: q + " 2026",
            },
          })),
        ]);
      }),
  },
  {
    id: "org-chart",
    name: "Org Chart",
    description: "Title and a team hierarchy of four nodes.",
    accent: "#ec4899",
    apply: (editor) =>
      applyAt(editor, ({ x, y }) => {
        editor.markHistoryStoppingPoint("apply-template-org-chart");
        editor.createShapes([
          {
            id: id(),
            type: CUSTOM_SHAPE_TYPES.titleBlock,
            x,
            y,
            props: {
              w: 1200,
              h: 180,
              label: "Team Structure",
              subtitle: "Reporting lines",
            },
          },
          {
            id: id(),
            type: CUSTOM_SHAPE_TYPES.orgNode,
            x: x + 480,
            y: y + 240,
            props: {
              w: 240,
              h: 110,
              label: "",
              name: "Alex Morgan",
              role: "CEO",
            },
          },
          ...(["Head of Product", "Head of Engineering", "Head of Ops"] as const).map(
            (r, i) => ({
              id: id(),
              type: CUSTOM_SHAPE_TYPES.orgNode,
              x: x + i * 320 + 80,
              y: y + 410,
              props: {
                w: 240,
                h: 110,
                label: "",
                name: ["Sam Lee", "Jordan Patel", "Riley Chen"][i],
                role: r,
              },
            }),
          ),
        ]);
      }),
  },
  {
    id: "onboarding",
    name: "Onboarding Guide",
    description: "Title, three process steps, and a callout.",
    accent: "#f59e0b",
    apply: (editor) =>
      applyAt(editor, ({ x, y }) => {
        editor.markHistoryStoppingPoint("apply-template-onboarding");
        editor.createShapes([
          {
            id: id(),
            type: CUSTOM_SHAPE_TYPES.titleBlock,
            x,
            y,
            props: {
              w: 1200,
              h: 180,
              label: "Welcome aboard",
              subtitle: "Your first-week guide",
            },
          },
          ...(
            [
              "Read the welcome email",
              "Install the required tools",
              "Book your kick-off call",
            ] as const
          ).map((label, i) => ({
            id: id(),
            type: CUSTOM_SHAPE_TYPES.processStep,
            x: x + i * 320,
            y: y + 240,
            props: {
              w: 300,
              h: 120,
              label,
              stepNumber: i + 1,
              accent: "#f59e0b",
            },
          })),
          {
            id: id(),
            type: CUSTOM_SHAPE_TYPES.callout,
            x: x + 160,
            y: y + 400,
            props: {
              w: 880,
              h: 96,
              label:
                "Tip: bookmark this doc — we'll refer back to it during our first session together.",
              tone: "info",
            },
          },
        ]);
      }),
  },
];

export const BLANK_TEMPLATE: Template = {
  id: "blank",
  name: "Blank canvas",
  description: "Start from nothing and build your own.",
  accent: "#ffffff",
  apply: () => {
    /* no-op */
  },
};
