# Phân tích repo nexu-io/open-design

## Tổng quan

| Thuộc tính | Giá trị |
|---|---|
| **Owner** | `nexu-io` (tổ chức GitHub) |
| **Tên repo** | `open-design` |
| **Mô tả** | Open-source Claude Design alternative. Ứng dụng desktop local-first (macOS/Windows) biến coding agent CLI (Claude Code, Codex, Cursor, DeepSeek Harness, OpenCode, …) thành design engine cho prototypes, landing pages, dashboards, decks, images, video. |
| **Ngôn ngữ chính** | TypeScript |
| **License** | Apache-2.0 |
| **Stars** | ~96.8k |
| **Forks** | ~11.2k |
| **Nhánh mặc định** | `main` |
| **Issues đang mở** | ~1.088 |
| **Hoạt động gần đây** | Rất tích cực: commit mới nhất `2026-09-18` (fix daemon + fix web). |

Repo được tạo `2026-04-28`, duy trì cập nhật thường xuyên với nhiều workflow CI/CD và kênh release (beta/prerelease/stable).

---

## Cấu trúc repo

```
open-design/
├── apps/                  # Ứng dụng chính
│   ├── daemon/            # Express + SQLite, spawn agent CLI, /api/*
│   ├── web/               # Next.js 16 App Router + React 18
│   ├── desktop/           # Electron shell
│   ├── packaged/          # Packaged Electron runtime entry
│   └── closure/           # OpenDesign Closure content (distributable)
├── packages/              # Shared packages
│   ├── contracts/         # DTOs chung web/daemon
│   ├── sidecar-proto/     # Protocol DTOs
│   ├── sidecar/           # Sidecar client boundary
│   ├── platform/          # OS process primitives
│   ├── plugin-runtime/    # Plugin runtime
│   ├── registry-protocol/ # Registry protocol
│   ├── release/           # Release metadata/publishing
│   └── diagnostics/       # Diagnostics
├── plugins/               # Plugin hệ thống + cộng đồng
│   ├── _official/         # 277+ official plugins
│   ├── community/         # Community plugins
│   ├── registry/          # Registry publishing flow
│   └── spec/              # Plugin spec + examples
├── skills/                # 100+ functional skills (SKILL.md)
├── design-templates/      # Rendering catalog (prototype, deck, image, video, hyperframes)
├── design-systems/        # 151 brand DESIGN.md packages
├── craft/                 # Universal craft rules (typography, color, accessibility, …)
├── docs/                  # Kiến trúc, protocol, agent adapters, modes, roadmap
├── tools/                 # tools-dev, tools-pack, tools-release, tools-serve
├── shells/                # Terminal carrier + lifecycle commands
├── e2e/                   # Playwright UI + Vitest harness
├── scripts/               # Dev scripts (guard, i18n, sync, seed)
├── .github/               # CI workflows, action configs, handoff scripts
├── .claude/               # Claude Code commands + skills
├── .claude-plugin/        # Claude Code marketplace manifest
├── deploy/                # Docker Compose + .env.example
├── vercel.json            # Vercel deploy config (build Next.js export)
├── package.json           # Root workspace scripts + od bin
├── pnpm-workspace.yaml    # Monorepo globs
└── AGENTS.md              # Repo-wide agent conventions
```

---

## Stack

| Lớp | Công nghệ |
|---|---|
| **Frontend** | Next.js 16 App Router + React 18 + TypeScript |
| **Daemon** | Node ~24 + Express + SSE + better-sqlite3 |
| **Desktop** | Electron (sandboxed renderer + sidecar IPC) |
| **Package manager** | pnpm 10.33.x (workspace monorepo) |
| **Runtime** | Node ~24 |
| **Build/Dev** | `pnpm tools-dev` (lifecycle control plane), tsx, TypeScript 5.9 |
| **Export** | HTML (inlined) · PDF (browser print) · PPTX · ZIP · Markdown · MP4 (HyperFrames) |
| **Preview** | Sandboxed iframe (srcdoc/URL) |
| **Deploy** | Docker Compose (port 7456), Vercel (static Next.js export) |

---

## Kiến trúc

```
┌───────────────────── browser / Electron shell ─────────────────────┐
│  chat · file workspace · iframe preview · settings · MCP           │
└──────────────────────┬──────────────────────────┬──────────────────┘
                       │ /api/*                   │
                       ▼                          ▼
            ┌──────────────────────┐   /api/proxy/{provider}/stream (SSE)
            │  Express Daemon      │   BYOK proxy → OpenAI-compatible endpoints
            │  (SQLite + file svc) │
            │  /api/skills         │
            │  /api/design-templates│
            │  /api/design-systems │
            │  /api/plugins        │
            │  /api/chat (SSE)     │
            │  /api/proxy/*        │
            └──────────┬───────────┘
                       │ spawn(<agent-cli>, …)
                       ▼
            ┌──────────────────────────────────────────┐
            │  Runtime Registry (~27 defs / 26 CLIs)  │
            │  Claude · Codex · Cursor · Copilot       │
            │  DeepSeek · OpenCode · Hermes · Kimi …   │
            └──────────────────────────────────────────┘
```

- **Web ↔ Daemon**: HTTP/SSE, same `/api/*` surface.
- **Daemon ↔ Agent**: Spawn local CLI với prompt + skill + DESIGN.md, stream events qua SSE.
- **BYOK mode**: Không spawn CLI; proxy `/api/proxy/{anthropic,openai,azure,google,ollama,senseaudio}/stream` trực tiếp đến provider.
- **Electron**: Sidecar IPC (STATUS · EVAL · SCREENSHOT · CONSOLE · CLICK · SHUTDOWN).
- **Plugin runtime**: 277 official plugins + 183 examples, quản lý qua `/api/plugins`.

---

## Điểm mở rộng

1. **Agent adapters** — Thêm CLI mới chỉ cần 1 file `runtimes/defs/<cli>.ts` + registry entry. Engine chung tự động detect/launch/stream.
2. **Skills** — Thả folder `SKILL.md` vào `skills/` hoặc cài từ remote (`od skill install github:owner/repo`).
3. **Design templates** — Folder trong `design-templates/` với `SKILL.md` + assets.
4. **Design systems** — Package trong `design-systems/<brand>/` gồm `manifest.json` + `DESIGN.md` + `tokens.css`.
5. **Plugins** — `open-design.json` manifest + payload. Có scenarios, image/video templates, atoms, design-systems.
6. **Craft rules** — `craft/<slug>.md` universal rules (typography, color, accessibility, anti-ai-slop).
7. **Plugin registry** — Hỗ trợ cộng đồng publish ra skills.sh / ClawHub / standalone GitHub.

---

## Bảo mật

| Vấn đề | Giải pháp / Ghi chú |
|---|---|
| **SSRF** | BYOK proxy chặn IP nội bộ (RFC1918, link-local, CGNAT, cloud-metadata) theo mặc định. |
| **OD_API_TOKEN** | Bắt buộc cho Docker/remote; Basic Auth với username `open-design`. Có escape hatch `OPEN_DESIGN_DISABLE_API_AUTH=1` (chỉ cho trusted reverse proxy). |
| **Bind host** | Daemon bind `127.0.0.1` mặc định. LAN exposure cần `OD_BIND_HOST` + `OD_ALLOWED_ORIGINS`. |
| **Internal host allowlist** | `OD_ALLOWED_INTERNAL_HOSTS` opt-in cho provider endpoint nội bộ (LiteLLM/Ollama trên VPN). Strict opt-in, exact-host, không CIDR. |
| **Sandbox preview** | Artifacts/plugins chạy trong sandboxed iframe, không có same-origin access. |
| **Desktop folder import** | HMAC token ngắn hạn minted by main process sau native folder picker. |
| **Credentials** | BYOK keys, tokens lưu local; không gửi về OpenDesign team. Daemon-owned data phải tuân `RUNTIME_DATA_DIR`. |
| **Telemetry** | Consent-gated: analytics + masked session replay (opt-out). Safety/reliability telemetry luôn bật nhưng đã scrub. |
| **Prompt/event budgets** | Run events giới hạn 64KB/event. Truncation có marker rõ ràng. Raw parser bounded. |
| **Token handling** | MCP config/tokens nằm dưới daemon data root. Không copy vào project files. |
| **Desktop IPC** | Sidecar protocol private; IPC không phải stamp field. Endpoint derived từ 5-field stamp + OS principal. |
| **Process reaping** | Daemon crash → leftover agents được terminate ở startup; prompt file-backed để tránh truncated prompt. |

---

## Cách chạy dev

```bash
# Yêu cầu
Node ~24 + pnpm 10.33.x (dùng Corepack)

# One-shot dev (foreground)
corepack enable
pnpm install
pnpm tools-dev run web    # daemon + web foreground

# Hoặc background (daemon + web + desktop)
pnpm tools-dev

# Kiểm tra
pnpm typecheck
pnpm guard

# Docker
cd deploy && cp .env.example .env
echo "OD_API_TOKEN=$(openssl rand -hex 32)" >> .env
docker compose up -d
# → http://127.0.0.1:7456
```

**Lưu ý quan trọng**:
- Dùng `pnpm tools-dev` làm entrypoint duy nhất. Không dùng `pnpm dev`, `pnpm start` (đã bị xóa).
- Đọc `AGENTS.md` → **Daemon data directory contract** trước khi đụng vào storage paths.
- Mỗi feature phải có cả web UI và `od` CLI surface (dual-track rule).

---

## Nhận xét nổi bật

- **Monorepo lớn, rất có tổ chức**: pnpm workspace với apps/*, packages/*, tools/*, shells/*, e2e. Tách biệt rõ ràng giữa web, daemon, desktop, packaged.
- **Agent-agnostic by design**: Không ship model runtime riêng; tái sử dụng 26+ CLI đã có trên máy user. Adapter là plain data object, engine chung.
- **Local-first + BYOK**: Mọi thứ chạy local; BYOK proxy cho cloud APIs. Không lock-in model hay vendor.
- **Plugin ecosystem phong phú**: 277 official plugins, 151 design systems, 100+ skills — đều portable, versionable directories.
- **CI/CD phức tạp và có chủ đích**: `ci.yml` + atomic capabilities (`comment.atom.yml`, `autofix.atom.yml`, `report.atom.yml`, `convergence.atom.yml`) + handoff artifacts. Có release channels rõ ràng: beta → prerelease → stable, với smoke test, signing, notarization.
- **Bảo mật có chiều sâu**: SSRF guard, sandboxed iframe, loopback bind, HMAC folder import, credential isolation, telemetry consent, prompt/event payload budgets.
- **Kỹ vọng cao về boundary**: `AGENTS.md` quy định nghiêm ngặt data-root, dual-track UI/CLI, sidecar IPC, cross-app imports. Nhiều “must not” và “must read before changing”.
- **Hỗ trợ đa ngôn ngữ**: README + docs + UI i18n (19 locales), nhưng prompt bodies/skills/design-systems giữ nguyên English để tránh prompt QA multiply.
- **Linux chưa có desktop binary**: Chỉ chạy từ source trên Linux; macOS + Windows có native app.
