import { Effect, Schema } from "effect"
import { SessionID } from "@/session/schema"

export const ArtifactType = Schema.Literals([
  "prototype",
  "landing",
  "dashboard",
  "deck",
  "image",
  "document",
  "video",
])
export type ArtifactType = Schema.Schema.Type<typeof ArtifactType>

export const DesignTask = Schema.Struct({
  sessionID: SessionID,
  brief: Schema.String,
  artifactType: Schema.optional(ArtifactType).pipe(Schema.withDefault(() => "prototype")),
  designSystem: Schema.optional(Schema.String),
  template: Schema.optional(Schema.String),
  refine: Schema.optional(Schema.String),
})
export type DesignTask = Schema.Schema.Type<typeof DesignTask>

export const DesignTaskManifest = Schema.Struct({
  sessionID: SessionID,
  artifactType: ArtifactType,
  designSystem: Schema.String,
  template: Schema.String,
  brief: Schema.String,
  createdAt: Schema.Number,
  updatedAt: Schema.Number,
  files: Schema.Array(Schema.String),
  preview: Schema.optional(Schema.String),
})
export type DesignTaskManifest = Schema.Schema.Type<typeof DesignTaskManifest>

export namespace DesignTask {
  export function create(input: Omit<DesignTask, "sessionID"> & { sessionID?: SessionID }): DesignTask {
    return {
      sessionID: input.sessionID ?? SessionID.make(`design-${Date.now()}`),
      brief: input.brief.trim(),
      artifactType: input.artifactType ?? "prototype",
      designSystem: input.designSystem ?? "default",
      template: input.template ?? "web-prototype",
      refine: input.refine,
    }
  }

  export function workspace(sessionID: SessionID, root?: string): string {
    const base = root ?? process.cwd()
    return `${base}/.kilo-design/${sessionID}`
  }

  export function manifestPath(sessionID: SessionID, root?: string): string {
    return `${workspace(sessionID, root)}/manifest.json`
  }
}
