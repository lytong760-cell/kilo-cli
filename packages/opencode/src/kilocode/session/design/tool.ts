import { Effect, Schema } from "effect"
import * as Tool from "@/tool/tool"
import { DesignTask } from "./task"
import { DesignStore } from "./store"
import { DesignRender } from "./render"

const Parameters = Schema.Struct({
  brief: Schema.String,
  artifactType: Schema.optional(Schema.String),
  designSystem: Schema.optional(Schema.String),
  template: Schema.optional(Schema.String),
  refine: Schema.optional(Schema.String),
})

export const DesignTool = Tool.define(
  "design",
  Effect.succeed({
    description:
      "Generate a design artifact (prototype, landing page, dashboard, deck) from a brief. Writes files to .kilo-design/<session-id>/ and opens a browser preview.",
    parameters: Parameters,
    execute: (input: Schema.Schema.Type<typeof Parameters>, ctx: Tool.Context) =>
      Effect.gen(function* () {
        const task = DesignTask.create({
          sessionID: ctx.sessionID,
          brief: input.brief,
          artifactType: input.artifactType,
          designSystem: input.designSystem,
          template: input.template,
          refine: input.refine,
        })

        yield* DesignStore.init(task)
        const manifest = yield* DesignStore.writeManifest(task, {
          brief: task.brief,
          artifactType: task.artifactType,
          designSystem: task.designSystem,
          template: task.template,
        })

        const systemPrompt = DesignRender.systemPrompt(task)
        const userPrompt = DesignRender.userPrompt(task)

        yield* ctx.metadata({
          title: "Design task created",
          metadata: {
            design: {
              systemPrompt,
              userPrompt,
              manifest,
            },
          },
        })

        const previewUrl = yield* DesignStore.openPreview(task)

        return {
          title: `Design task created: ${manifest.artifactType}`,
          output: `Artifact workspace: ${DesignTask.workspace(task.sessionID)}\nPreview: ${previewUrl}\nManifest: ${DesignTask.manifestPath(task.sessionID)}`,
          metadata: {
            design: {
              task,
              manifest,
              previewUrl,
            },
          },
        }
      }),
  }),
)
