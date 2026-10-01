import { Effect } from "effect"
import { DesignTask } from "./task"
import { DesignStore } from "./store"

export type ExportFormat = "html" | "pdf" | "pptx" | "zip" | "md"

export namespace DesignExport {
  export function exportHtml(task: DesignTask): Effect.Effect<string> {
    return Effect.promise(async () => {
      const path = await import("node:path")
      return `${DesignTask.workspace(task.sessionID)}/index.html`
    })
  }

  export function exportMd(task: DesignTask): Effect.Effect<string> {
    return Effect.promise(async () => {
      const fs = await import("node:fs/promises")
      const path = await import("node:path")
      const root = DesignTask.workspace(task.sessionID)
      const htmlPath = path.join(root, "index.html")
      const mdPath = path.join(root, "artifact.md")
      let html = ""
      try {
        html = await fs.readFile(htmlPath, "utf-8")
      } catch {
        html = "<p>Artifact not yet generated.</p>"
      }
      const md = `# ${task.brief}\n\nGenerated artifact:\n\n${html}\n`
      await fs.writeFile(mdPath, md)
      return mdPath
    })
  }

  export function exportPdf(task: DesignTask): Effect.Effect<string> {
    return exportHtml(task).pipe(
      Effect.flatMap((htmlPath) =>
        Effect.promise(async () => {
          const path = await import("node:path")
          const root = DesignTask.workspace(task.sessionID)
          const pdfPath = path.join(root, "artifact.pdf")
          const { exec } = await import("node:child_process")
          await new Promise<void>((resolve, reject) => {
            exec(
              `chromium --headless --disable-gpu --print-to-pdf="${pdfPath}" "${htmlPath}"`,
              (err) => (err ? reject(err) : resolve()),
            )
          })
          return pdfPath
        }),
      ),
    )
  }

  export function exportPptx(task: DesignTask): Effect.Effect<string> {
    return exportHtml(task).pipe(
      Effect.flatMap((htmlPath) =>
        Effect.promise(async () => {
          const fs = await import("node:fs/promises")
          const path = await import("node:path")
          const root = DesignTask.workspace(task.sessionID)
          const pptxPath = path.join(root, "artifact.pptx")
          const AdmZip = (await import("adm-zip")).default
          const zip = new AdmZip()
          zip.addFile("[Content_Types].xml", Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/></Types>`))
          zip.addFile("_rels/.rels", Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>`))
          zip.addFile("ppt/presentation.xml", Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldIdLst><p:sldId id="256" r:id="rId2"/></p:sldIdLst></p:presentation>`))
          zip.addFile("ppt/slides/slide1.xml", Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:pic><p:nvPicPr><p:cNvPr id="1" name="Artifact"/><p:cNvPicPr/></p:nvPicPr></p:pic></p:spTree></p:cSld></p:sld>`))
          const zipPath = path.join(root, "artifact.pptx.zip")
          zip.writeZip(zipPath)
          await fs.rename(zipPath, pptxPath)
          return pptxPath
        }),
      ),
    )
  }

  export function exportZip(task: DesignTask): Effect.Effect<string> {
    return Effect.promise(async () => {
      const fs = await import("node:fs/promises")
      const path = await import("node:path")
      const root = DesignTask.workspace(task.sessionID)
      const zipPath = path.join(root, "artifact.zip")
      const AdmZip = (await import("adm-zip")).default
      const zip = new AdmZip()
      const entries = await fs.readdir(root, { withFileTypes: true, recursive: true })
      for (const entry of entries) {
        const full = path.join(entry.parentPath ?? root, entry.name)
        const relative = path.relative(root, full)
        if (relative === "artifact.zip") continue
        if (entry.isDirectory()) zip.addLocalFolder(full, relative)
        else zip.addLocalFile(full, path.dirname(relative), path.basename(relative))
      }
      zip.writeZip(zipPath)
      return zipPath
    })
  }

  export function exportTask(task: DesignTask, format: ExportFormat): Effect.Effect<string> {
    switch (format) {
      case "html":
        return exportHtml(task)
      case "pdf":
        return exportPdf(task)
      case "pptx":
        return exportPptx(task)
      case "zip":
        return exportZip(task)
      case "md":
        return exportMd(task)
    }
  }
}
