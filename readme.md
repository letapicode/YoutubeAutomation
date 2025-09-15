## Overview

YouTube Automation is a Tauri v2 desktop app that automates subtitle generation, video assembly and YouTube uploads. It pairs a React/TypeScript UI with a Rust backend and uses local tools (FFmpeg, Whisper, Argos Translate) for fast and private processing.

## Stack

- Frontend: React + TypeScript (Vite)
- Desktop: Tauri v2
- Backend: Rust (`ytapp/src-tauri`)
- Media: FFmpeg (rendering), Whisper CLI (transcription)
- Tauri Plugins:
  - `@tauri-apps/plugin-shell` (open/execute/spawn)
  - `@tauri-apps/plugin-process` (subprocess management)
  - `@tauri-apps/plugin-dialog`, `@tauri-apps/plugin-fs`, `@tauri-apps/plugin-updater`, `@tauri-apps/plugin-notification`

## Repository Structure

- `ytapp/src` — React UI (components, features, commands)
- `ytapp/src-tauri/src` — Rust backend (commands, queue, logging, model checks)
- `ytapp/scripts` — app-side helpers (dev runner, postinstall)
- `scripts/` — OS-level installers and setup scripts

## One‑Command Dev

From `ytapp/`:

```bash
npm install             # platform-aware postinstall provisions system deps
npm run tauri:dev       # preflight + Vite + Tauri
```

Notes (Windows):
- The dev runner neutralizes MinGW overrides, forces `CMAKE_GENERATOR="Visual Studio 17 2022"`, and sets C11 for `aws-lc-sys`.
- Cargo artifacts go to `%USERPROFILE%\.ytarget` to avoid long paths.

## Full Bootstrap (Windows)

Run once from repo root to provision everything system‑wide:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup_windows.ps1
```

Installs: VS Build Tools, WebView2, Rust toolchain, CMake/LLVM, FFmpeg, Python + Argos Translate; configures MSVC and CMake generator.

## Dependency Provisioning (Cross‑Platform)

Provisioning is idempotent and runs in three places:

- `scripts/install_tauri_deps_windows.ps1` — WebView2 → FFmpeg → Python/Argos (adds `%USERPROFILE%\.cargo\bin\argos-translate.cmd` shim)
- `scripts/install_tauri_deps_macos.sh` — macOS deps (brew‑based)
- `scripts/install_tauri_deps.sh` — Linux GTK/WebKit/Clang deps (apt‑based)
- `ytapp/scripts/postinstall.js` — invoked by `npm install`
- `ytapp/scripts/run-tauri.js` — preflight before dev/build

The UI verifies at startup and auto‑installs silently if needed; it logs guidance if verification still fails — no blocking dialogs.

## Configuration

- `ytapp/src-tauri/tauri.conf.json` — Tauri config
  - `plugins.shell.open: true` (v2 schema)
- `ytapp/src-tauri/capabilities/default.json` — grants:
  - `shell:allow-execute`, `shell:allow-spawn`, `shell:allow-kill`, `shell:allow-stdin-write`, `shell:allow-open`

## Required Checks (Before Commit)

```bash
npx ts-node --project ytapp/tsconfig.json scripts/generate-schema.ts
cd ytapp && npm install
cd src-tauri && cargo check
cd .. && npx ts-node src/cli.ts --help
```

If `cargo check` fails on Linux due to `glib-2.0.pc` missing, run `scripts/install_tauri_deps.sh` and ensure `PKG_CONFIG_PATH` is exported (written to `.env.tauri`).

## Audio/Video Pipeline

- Optional intro/outro clips
- Main segment (loop image/short video to audio length)
- Burn captions with FFmpeg
- Output: MP4 (H.264), configurable resolution/FPS (1080p/720p; vertical 1080x1920/720x1280)

## Transcription & Captions

- Whisper CLI (local) with automatic model download
- Language selection and RTL support through `ytapp/src/features/languages/defs`

## YouTube Integration

- OAuth via `yup-oauth2`, uploads/playlists with `google-youtube3`
- Token encryption stored locally

## Batch Processing

- Queue add/list/remove/move/export/import; retry policy and progress tracking

## Packaging

```bash
./scripts/package.sh           # all platforms
```

CI uses `.github/workflows/package.yml` to build and upload installers.

## Troubleshooting

- CMake generator mismatch (Windows):
  - Clear `CMAKE_GENERATOR*`, `CMAKE_MAKE_PROGRAM`, `CC/CXX/AR/RANLIB` in the shell.
  - Use `npm run tauri:dev`; our runner sets `Visual Studio 17 2022` and C11 for `aws-lc-sys`.
- WebView2 missing:
  - `scripts/install_tauri_deps_windows.ps1` (winget → choco → MS bootstrapper)
- Argos Translate not detected:
  - Installer creates `%USERPROFILE%\.cargo\bin\argos-translate.cmd`. Restart the shell if needed.

## Contributing

- Follow `.editorconfig` for indentation/newlines (TS 2 spaces, TSX 4 spaces).
- Keep functions documented briefly; prefer small, modular helpers.

## License

Apache-2.0

