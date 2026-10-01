# Kilo Design Systems

Brand-grade design systems for `/kilo-design`. Each system is a `DESIGN.md`-style token package that the renderer binds into generated artifacts.

Bundled systems are registered in `src/kilocode/session/design/render.ts`. To add a new system, add it to `DesignSystems` in that file.

| System | Description |
|---|---|
| `default` | Neutral modern design system |
| `opencode-ai` | Dark-first developer tool aesthetic |

User-defined systems can be placed in `<project-root>/design-systems/<brand>/` and will be discovered by the renderer in a future release.
