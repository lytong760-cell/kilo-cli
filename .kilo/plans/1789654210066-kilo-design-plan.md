# Plan: `/kilo-design` end-to-end design feature in Kilo CLI chat

## Goal
Add a `/kilo-design` chat slash command inside Kilo's chat surface that lets users generate design artifacts (prototypes, landing pages, dashboards, decks, images, video briefs) from a natural-language brief, using the local agent runtime already present in Kilo CLI. Preview and export should be available both in-browser and as a fallback terminal summary.

## Scope
- Slash command surface only: `/kilo-design <brief>` inside Kilo chat/TUI and remote session endpoints.
- Generation via existing Kilo agent + tool execution, no separate daemon.
- Preview via system browser + optional embedded artifact card in chat.
- Export: HTML, PDF (browser print), PPTX (agent-driven), ZIP, Markdown.
- Out of scope for v1: desktop Electron shell, HyperFrames MP4 rendering, plugin marketplace, MCP installer for external agents.

## Architecture

```
/kilo-design <brief>
    │
    ▼
Builtin slash command handler (session/prompt.ts)
    │
    ▼
DesignTool + DesignAgent (new kilocode/session/design/)
    │  - binds DESIGN.md / design system
    │  - picks template / artifact type
    │  - runs agent loop to generate files
    │
    ▼
Artifact store (local project directory)
    │  index.html, assets/, manifest.json
    │
    ▼
Preview + Export
    ├─ Browser: open artifact HTML in system browser
    ├─ Chat: artifact card with path + metadata
    └─ Export: PDF / PPTX / ZIP / MD via agent skill
```

## Key decisions (resolved)
1. `/kilo-design` is a **builtin slash command**, not a yargs CLI command, because it lives in the chat surface.
2. Generation runs inside the existing Kilo session agent via a dedicated `DesignTool` and optional `DesignAgent` mode, not a separate daemon.
3. Artifacts are written to the project workspace under `.kilo-design/<session-id>/` so they are git-friendly and disposable.
4. Preview defaults to opening the system browser; chat UI shows an artifact card with path and quick actions.
5. Template and design-system catalogs ship inside the repo under `packages/opencode/src/kilocode/design/`.

## Data flow
1. User types `/kilo-design a landing page for a seed-stage AI startup`
2. Slash parser routes to builtin handler in `session/prompt.ts`
3. Handler creates a `DesignTask` with brief, artifact type, and selected design system
4. `DesignAgent` or tool-binding runs the generation loop:
   - Resolve template from `design-templates/`
   - Bind `DESIGN.md` tokens from selected design system
   - Stream generation into `.kilo-design/<session-id>/`
5. On completion, publish `Session.Event.Artifact` with artifact metadata
6. Chat UI renders artifact card; system browser opens `index.html`
7. User can request export: `/kilo-design export pdf`

## Files to add/modify
| Path | Action |
|---|---|
| `packages/opencode/src/kilocode/session/builtin-commands.ts` | Add `"design"` to `BUILTIN_COMMANDS` |
| `packages/opencode/src/session/prompt.ts` | Route `input.command === "design"` to design handler |
| `packages/opencode/src/kilocode/session/design/task.ts` | New: `DesignTask` schema + create/handle |
| `packages/opencode/src/kilocode/session/design/agent.ts` | New: `DesignAgent` mode / prompt wrapper |
| `packages/opencode/src/kilocode/session/design/tool.ts` | New: `DesignTool` for generation loop |
| `packages/opencode/src/kilocode/session/design/store.ts` | New: artifact workspace layout + manifest |
| `packages/opencode/src/kilocode/session/design/render.ts` | New: template + DESIGN.md binding |
| `packages/opencode/src/kilocode/design-templates/` | New: bundled templates (web-prototype, dashboard, deck) |
| `packages/opencode/src/kilocode/design-systems/` | New: bundled design systems (default, opencode-ai, warm-editorial) |
| `packages/opencode/src/kilocode/session/design/export.ts` | New: PDF/PPTX/ZIP/MD export handlers |
| `packages/opencode/src/cli/cmd/run/prompt.editor.ts` | Minor: ensure `/kilo-design` shows in slash menu |

## Failure modes
| Mode | Handling |
|---|---|
| No agent runtime available | Fall back to builtin simple-render path using template + brief only |
| Template missing | Return available template list in chat error |
| Browser open fails | Show artifact path + `file://` URL in chat card |
| Generation exceeds token budget | Truncate brief, emit partial artifact, suggest `/kilo-design export md` |
| Concurrent `/kilo-design` in same session | Queue or reject with message |

## Validation
1. `/kilo-design` appears in slash command menu.
2. `/kilo-design <brief>` generates `.kilo-design/<session-id>/index.html`.
3. Browser opens artifact successfully on macOS/Windows/Linux.
4. Export commands produce valid PDF/PPTX/ZIP/MD.
5. Existing `/goal`, `/compact`, `/summarize` behavior unchanged.

## Open questions
- Should `/kilo-design` support resume/edit of previous artifact in same session? Recommended: yes, detect existing `.kilo-design/<session-id>/` and allow `/kilo-design refine <direction>`.
- Should design systems be user-extensible outside the repo? Recommended: yes, `design-systems/` in project root overrides bundled catalog.
