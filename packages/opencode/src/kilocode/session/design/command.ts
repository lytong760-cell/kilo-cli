import { Effect } from "effect"
import type { CommandInput } from "@/session/prompt"
import { SessionV1 } from "@opencode-ai/core/v1/session"
import { NamedError } from "@opencode-ai/core/util/error"
import { MessageID, PartID, SessionID } from "@/session/schema"
import { EventV2Bridge } from "@/event-v2-bridge"
import { Session } from "@/session/session"
import { DesignTask } from "./task"
import { DesignStore } from "./store"
import { DesignRender } from "./render"
import { DesignExport, ExportFormat } from "./export"

export namespace DesignCommand {
  export function command(input: CommandInput) {
    return Effect.gen(function* () {
      const events = yield* EventV2Bridge.Service

      const args = input.arguments.trim()
      const parts = args.match(/^(\w+)(?:\s+(.*))?$/)
      let action = "create"
      let rest = args

      if (parts && ["create", "refine", "export", "open", "preview"].includes(parts[1]?.toLowerCase())) {
        action = parts[1]!.toLowerCase()
        rest = (parts[2] ?? "").trim()
      }

      const existing = yield* DesignStore.readManifest({
        sessionID: input.sessionID,
        brief: "",
        artifactType: "prototype",
        designSystem: "default",
        template: "web-prototype",
      })

      const task = DesignTask.create({
        sessionID: input.sessionID,
        brief: rest || existing?.brief || "Untitled design task",
        artifactType: existing?.artifactType ?? "prototype",
        designSystem: existing?.designSystem ?? "default",
        template: existing?.template ?? "web-prototype",
        refine: action === "refine" ? rest : undefined,
      })

      if (action === "create" || action === "refine") {
        yield* DesignStore.init(task)

        const messageID = input.messageID ?? MessageID.ascending()
        const systemPrompt = DesignRender.systemPrompt(task)
        const userPrompt = DesignRender.userPrompt(task)

        yield* events.publish(SessionV1.Event.PartUpdated, {
          sessionID: input.sessionID,
          part: {
            id: PartID.ascending(),
            messageID,
            sessionID: input.sessionID,
            type: "text",
            text: `Design task started: ${task.artifactType} — ${task.brief}\n\nSystem prompt:\n${systemPrompt}\n\nUser prompt:\n${userPrompt}`,
          },
        })

        const previewUrl = yield* DesignStore.openPreview(task)

        yield* events.publish(SessionV1.Event.PartUpdated, {
          sessionID: input.sessionID,
          part: {
            id: PartID.ascending(),
            messageID,
            sessionID: input.sessionID,
            type: "text",
            text: `Design workspace initialized at ${DesignTask.workspace(task.sessionID)}\nPreview: ${previewUrl}\n\nUse /kilo-design export <html|pdf|pptx|zip|md> to export.`,
          },
        })

        return {
          info: {
            id: MessageID.ascending(),
            sessionID: input.sessionID,
            parentID: input.messageID ?? MessageID.ascending(),
            role: "assistant",
            mode: input.agent ?? "code",
            agent: input.agent ?? "code",
            providerID: "kilo",
            modelID: "design",
            variant: input.variant,
            path: { cwd: "", root: "" },
            cost: 0,
            tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
            time: { created: Date.now(), completed: Date.now() },
            finish: "stop",
          },
          parts: [
            {
              id: PartID.ascending(),
              messageID: MessageID.ascending(),
              sessionID: input.sessionID,
              type: "text",
              text: `Design artifact created.\nType: ${task.artifactType}\nTemplate: ${task.template}\nDesign system: ${task.designSystem}\nWorkspace: ${DesignTask.workspace(task.sessionID)}\nPreview: ${previewUrl}\n\nUse /kilo-design export <html|pdf|pptx|zip|md> to export.`,
            },
          ],
        } as SessionV1.WithParts
      }

      if (action === "export") {
        const format = (rest || "html").toLowerCase() as ExportFormat
        if (!["html", "pdf", "pptx", "zip", "md"].includes(format)) {
          yield* events.publish(Session.Event.Error, {
            sessionID: input.sessionID,
            error: new NamedError.Unknown({ message: `Unknown export format: ${format}. Use html, pdf, pptx, zip, or md.` }).toObject(),
          })
          return yield* Effect.fail(new Error(`Unknown export format: ${format}`))
        }
        const path = yield* DesignExport.exportTask(task, format)
        yield* events.publish(SessionV1.Event.PartUpdated, {
          sessionID: input.sessionID,
          part: {
            id: PartID.ascending(),
            messageID: input.messageID ?? MessageID.ascending(),
            sessionID: input.sessionID,
            type: "text",
            text: `Exported ${format}: ${path}`,
          },
        })
        return {
          info: {
            id: MessageID.ascending(),
            sessionID: input.sessionID,
            parentID: input.messageID ?? MessageID.ascending(),
            role: "assistant",
            mode: input.agent ?? "code",
            agent: input.agent ?? "code",
            providerID: "kilo",
            modelID: "design-export",
            variant: undefined,
            path: { cwd: "", root: "" },
            cost: 0,
            tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
            time: { created: Date.now(), completed: Date.now() },
            finish: "stop",
          },
          parts: [
            {
              id: PartID.ascending(),
              messageID: MessageID.ascending(),
              sessionID: input.sessionID,
              type: "text",
              text: `Exported ${format}: ${path}`,
            },
          ],
        } as SessionV1.WithParts
      }

      if (action === "open" || action === "preview") {
        const url = yield* DesignStore.openPreview(task)
        yield* events.publish(SessionV1.Event.PartUpdated, {
          sessionID: input.sessionID,
          part: {
            id: PartID.ascending(),
            messageID: input.messageID ?? MessageID.ascending(),
            sessionID: input.sessionID,
            type: "text",
            text: `Preview opened: ${url}`,
          },
        })
        return {
          info: {
            id: MessageID.ascending(),
            sessionID: input.sessionID,
            parentID: input.messageID ?? MessageID.ascending(),
            role: "assistant",
            mode: input.agent ?? "code",
            agent: input.agent ?? "code",
            providerID: "kilo",
            modelID: "design-preview",
            variant: undefined,
            path: { cwd: "", root: "" },
            cost: 0,
            tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
            time: { created: Date.now(), completed: Date.now() },
            finish: "stop",
          },
          parts: [
            {
              id: PartID.ascending(),
              messageID: MessageID.ascending(),
              sessionID: input.sessionID,
              type: "text",
              text: `Preview opened: ${url}`,
            },
          ],
        } as SessionV1.WithParts
      }

      yield* events.publish(Session.Event.Error, {
        sessionID: input.sessionID,
        error: new NamedError.Unknown({ message: `Unknown design action: ${action}` }).toObject(),
      })
      return yield* Effect.fail(new Error(`Unknown design action: ${action}`))
    })
  }
}
