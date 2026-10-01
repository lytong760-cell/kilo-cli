# Kilo Design Templates

Rendering blueprints for `/kilo-design`. Each template defines an artifact type, prompt scaffold, and output contract.

Bundled templates are registered in `src/kilocode/session/design/render.ts`. To add a new template, add it to `DesignTemplates` in that file.

| Template | Artifact Type | Description |
|---|---|---|
| `web-prototype` | `prototype` | Single-page HTML prototype |
| `dashboard` | `dashboard` | Admin dashboard with KPIs |
| `landing` | `landing` | Marketing landing page |
| `deck` | `deck` | Multi-slide presentation |
