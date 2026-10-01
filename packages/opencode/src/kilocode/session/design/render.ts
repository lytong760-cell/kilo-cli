import { Effect } from "effect"
import { DesignTask } from "./task"
import { DesignStore } from "./store"

export const DesignTemplate = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  artifactType: Schema.String,
  description: Schema.String,
  prompt: Schema.String,
})
export type DesignTemplate = Schema.Schema.Type<typeof DesignTemplate>

export const DesignSystem = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  description: Schema.String,
  tokens: Schema.Record(Schema.String, Schema.String),
  preview: Schema.optional(Schema.String),
})
export type DesignSystem = Schema.Schema.Type<typeof DesignSystem>

export namespace DesignTemplates {
  const webPrototype: DesignTemplate = {
    id: "web-prototype",
    name: "Web Prototype",
    artifactType: "prototype",
    description: "Single-page HTML prototype with responsive layout",
    prompt: `Generate a single-page HTML prototype for: {{brief}}. Use the design system tokens in DESIGN.md. Output must be a single self-contained index.html with inline CSS and minimal JS. Include: header, hero, 2-3 feature sections, footer. Use the brand colors, typography, and spacing from DESIGN.md. Make it visually polished and responsive.`,
  }

  const dashboard: DesignTemplate = {
    id: "dashboard",
    name: "Dashboard",
    artifactType: "dashboard",
    description: "Admin dashboard with sidebar, KPIs, and data visualization",
    prompt: `Generate a single-page HTML dashboard for: {{brief}}. Use the design system tokens in DESIGN.md. Output must be a single self-contained index.html with inline CSS and minimal JS. Include: sidebar navigation, top bar, 4 KPI cards, 1 data table, 1 chart area. Use the brand colors, typography, and spacing from DESIGN.md. Make it visually polished and responsive.`,
  }

  const landing: DesignTemplate = {
    id: "landing",
    name: "Landing Page",
    artifactType: "landing",
    description: "Marketing landing page with hero, features, pricing, CTA",
    prompt: `Generate a marketing landing page for: {{brief}}. Use the design system tokens in DESIGN.md. Output must be a single self-contained index.html with inline CSS and minimal JS. Include: hero section, 3 feature cards, social proof, pricing table, CTA section, footer. Use the brand colors, typography, and spacing from DESIGN.md. Make it visually polished and conversion-focused.`,
  }

  const deck: DesignTemplate = {
    id: "deck",
    name: "Presentation Deck",
    artifactType: "deck",
    description: "Multi-slide presentation exported as HTML/PPTX",
    prompt: `Generate a presentation deck for: {{brief}}. Use the design system tokens in DESIGN.md. Output must be a single self-contained index.html with inline CSS and minimal JS. Include 5 slides: title, problem, solution, features, call to action. Use the brand colors, typography, and spacing from DESIGN.md. Make it visually polished and presentation-ready.`,
  }

  const catalog = [webPrototype, dashboard, landing, deck] as const

  export function get(id?: string): DesignTemplate | undefined {
    if (!id) return webPrototype
    return catalog.find((t) => t.id === id)
  }

  export function list(): DesignTemplate[] {
    return [...catalog]
  }
}

export namespace DesignSystems {
  const defaultSystem: DesignSystem = {
    id: "default",
    name: "Default Modern",
    description: "Neutral modern design system",
    tokens: {
      "color.primary": "#6366f1",
      "color.primary.hover": "#4f46e5",
      "color.secondary": "#8b5cf6",
      "color.background": "#ffffff",
      "color.surface": "#f8fafc",
      "color.text": "#0f172a",
      "color.text.muted": "#64748b",
      "font.sans": "system-ui, -apple-system, sans-serif",
      "font.mono": "ui-monospace, monospace",
      "radius.sm": "0.25rem",
      "radius.md": "0.5rem",
      "radius.lg": "1rem",
      "spacing.1": "0.25rem",
      "spacing.2": "0.5rem",
      "spacing.4": "1rem",
      "spacing.6": "1.5rem",
      "spacing.8": "2rem",
      "shadow.sm": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      "shadow.md": "0 4px 6px -1px rgb(0 0 0 / 0.1)",
      "shadow.lg": "0 10px 15px -3px rgb(0 0 0 / 0.1)",
    },
  }

  const opencodeSystem: DesignSystem = {
    id: "opencode-ai",
    name: "OpenCode AI",
    description: "Dark-first developer tool aesthetic",
    tokens: {
      "color.primary": "#22d3ee",
      "color.primary.hover": "#06b6d4",
      "color.secondary": "#a78bfa",
      "color.background": "#0f172a",
      "color.surface": "#1e293b",
      "color.text": "#f1f5f9",
      "color.text.muted": "#94a3b8",
      "font.sans": "ui-monospace, SF Mono, Menlo, monospace",
      "font.mono": "ui-monospace, SF Mono, Menlo, monospace",
      "radius.sm": "0.25rem",
      "radius.md": "0.375rem",
      "radius.lg": "0.75rem",
      "spacing.1": "0.25rem",
      "spacing.2": "0.5rem",
      "spacing.4": "1rem",
      "spacing.6": "1.5rem",
      "spacing.8": "2rem",
      "shadow.sm": "0 1px 2px 0 rgb(0 0 0 / 0.3)",
      "shadow.md": "0 4px 6px -1px rgb(0 0 0 / 0.4)",
      "shadow.lg": "0 10px 15px -3px rgb(0 0 0 / 0.5)",
    },
  }

  const catalog = [defaultSystem, opencodeSystem] as const

  export function get(id?: string): DesignSystem {
    if (!id) return defaultSystem
    return catalog.find((s) => s.id === id) ?? defaultSystem
  }

  export function list(): DesignSystem[] {
    return [...catalog]
  }
}

export namespace DesignRender {
  export function bindTokens(template: DesignTemplate, system: DesignSystem, brief: string): string {
    const prompt = template.prompt.replace(/\{\{brief\}\}/g, brief)
    const tokenBlock = Object.entries(system.tokens)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n")
    return `${prompt}\n\nDesign system tokens:\n${tokenBlock}\n`
  }

  export function systemPrompt(task: DesignTask): string {
    const template = DesignTemplates.get(task.template) ?? DesignTemplates.get("web-prototype")!
    const system = DesignSystems.get(task.designSystem)
    const base = bindTokens(template, system, task.brief)
    if (task.refine) {
      return `${base}\n\nRefine direction: ${task.refine}`
    }
    return base
  }

  export function userPrompt(task: DesignTask): string {
    if (task.refine) {
      return `Refine the existing artifact at ${DesignTask.workspace(task.sessionID)} with this direction: ${task.refine}`
    }
    return `Create the artifact in ${DesignTask.workspace(task.sessionID)}. Write index.html and any assets under assets/. Keep everything self-contained.`
  }
}
