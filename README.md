# Infinite Idea

A browser-based documentation & graphics tool for producing amazing, easy-to-follow client-facing docs. Freeform canvas — shapes, diagrams, images, and pre-built template blocks — with **stateless** client-side operation. Your work is never stored on a server: you download a `.infidoc.json` save file to resume later, and export to **PDF / PNG / SVG** when finished.

Built on Next.js + tldraw, deployed on Vercel.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Canvas engine | tldraw 3 |
| Styling | Tailwind CSS 3 + glassmorphic theme |
| PDF | pdf-lib |
| Tests | Vitest (unit) + Playwright (e2e) |
| Hosting | Vercel (static-friendly) |

## Getting started

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Next.js dev server on :3000 |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest unit tests (save-file parsing) |
| `npm run test:e2e` | Playwright smoke tests — starts a dev server automatically |
| `npm run lint` | Next.js lint |

## Features

- **Freeform canvas** — shapes, text, arrows, connectors, freehand drawing, image embedding (via tldraw)
- **7 template blocks** — Title Block, Process Step, Decision Gate, Milestone, Org Node, Swimlane, Callout
- **Save / resume** — download a `.infidoc.json` file and re-upload to continue editing
- **Exports** — PDF, PNG (2×), SVG
- **Stateless** — no backend, no database, no login

## Save file format

```json
{
  "version": 1,
  "createdAt": "2026-04-24T14:55:00Z",
  "appName": "infinite-idea",
  "snapshot": { /* tldraw store snapshot */ }
}
```

Validated on import; files from other apps or future versions are rejected with a clear error toast.

## Deploy to Vercel

The app is pure static-friendly Next.js — nothing server-side is needed at runtime.

```bash
npm i -g vercel     # if you don't already have it
vercel              # preview deploy
vercel --prod       # production deploy
```

Or push the repo to GitHub and import it at [vercel.com/new](https://vercel.com/new) — zero configuration needed. The app will deploy at a `*.vercel.app` URL.

## Project layout

```
app/                  Next.js App Router (layout, page, globals.css)
components/
  editor/             Canvas + custom tldraw shapes
  ui/                 TopBar · FileMenu · ExportMenu · ToolboxPanel · InspectorPanel · Toast
lib/io/               saveJson · loadJson · exportImage · exportPdf
types/                Shape type definitions and save-file schema
e2e/                  Playwright smoke tests
```

## License

Private — internal client tool.
