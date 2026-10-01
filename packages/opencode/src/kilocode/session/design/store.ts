import { Effect } from "effect"
import { DesignTask, DesignTaskManifest } from "./task"

export namespace DesignStore {
  export function init(task: DesignTask): Effect.Effect<void> {
    return Effect.promise(async () => {
      const fs = await import("node:fs/promises")
      const path = await import("node:path")
      const root = DesignTask.workspace(task.sessionID)
      const manifest: DesignTaskManifest = {
        sessionID: task.sessionID,
        artifactType: task.artifactType,
        designSystem: task.designSystem,
        template: task.template,
        brief: task.brief,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        files: [],
        preview: `${root}/index.html`,
      }
      await fs.mkdir(`${root}/assets`, { recursive: true })
      await fs.writeFile(`${root}/manifest.json`, JSON.stringify(manifest, null, 2))
      await fs.writeFile(`${root}/index.html`, "")
      await fs.writeFile(`${root}/DESIGN.md`, "")
    })
  }

  export function readManifest(task: DesignTask): Effect.Effect<DesignTaskManifest | undefined> {
    return Effect.promise(async () => {
      const fs = await import("node:fs/promises")
      const path = await import("node:path")
      const manifestPath = DesignTask.manifestPath(task.sessionID)
      try {
        const raw = await fs.readFile(manifestPath, "utf-8")
        return JSON.parse(raw) as DesignTaskManifest
      } catch {
        return undefined
      }
    })
  }

  export function writeManifest(
    task: DesignTask,
    update: Partial<DesignTaskManifest>,
  ): Effect.Effect<DesignTaskManifest> {
    return readManifest(task).pipe(
      Effect.flatMap((existing) =>
        Effect.promise(async () => {
          const fs = await import("node:fs/promises")
          const path = await import("node:path")
          const manifestPath = DesignTask.manifestPath(task.sessionID)
          const manifest: DesignTaskManifest = {
            ...(existing ?? {
              sessionID: task.sessionID,
              artifactType: task.artifactType,
              designSystem: task.designSystem,
              template: task.template,
              brief: task.brief,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              files: [],
              preview: DesignTask.workspace(task.sessionID) + "/index.html",
            }),
            ...update,
            updatedAt: Date.now(),
          }
          await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2))
          return manifest
        }),
      ),
    )
  }

  export function appendFile(task: DesignTask, relativePath: string, content: string): Effect.Effect<void> {
    return Effect.promise(async () => {
      const fs = await import("node:fs/promises")
      const path = await import("node:path")
      const root = DesignTask.workspace(task.sessionID)
      const full = path.join(root, relativePath)
      await fs.mkdir(path.dirname(full), { recursive: true })
      await fs.writeFile(full, content)
    })
  }

  export function openPreview(task: DesignTask): Effect.Effect<string> {
    return Effect.promise(async () => {
      const fs = await import("node:fs/promises")
      const path = await import("node:path")
      const root = DesignTask.workspace(task.sessionID)
      const preview = path.join(root, "index.html")
      const exists = await fs.access(preview).then(() => true).catch(() => false)
      if (!exists) return `file://${preview}`
      const { exec } = await import("node:child_process")
      const url = `file://${preview}`
      const platform = process.platform
      if (platform === "darwin") exec(`open "${preview}"`)
      else if (platform === "win32") exec(`start "" "${preview}"`)
      else exec(`xdg-open "${preview}"`)
      return url
    })
  }
}
