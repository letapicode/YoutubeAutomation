# Development Instructions

These guidelines apply to the entire repository.

## Devcontainer
A pre-built development container image exists for this project: `ghcr.io/letapicode/ytapp-dev:latest`. Codex should
start from this image (or run `devcontainer open` if supported) before executing
`make verify`. Environment initialization is handled by `scripts/setup_codex.sh`
(invoked automatically via `.codex/bootstrap.sh`). This script installs Tauri
dependencies and writes `.env.tauri`. Source that file or restart your shell so
its variables are available before running any checks.

## Project Structure
- The Tauri desktop application is under `ytapp`.
- Rust sources live in `ytapp/src-tauri/src` and TypeScript/React sources in `ytapp/src`.

## Code Style
- Keep existing indentation styles: TypeScript files generally use two spaces and TSX files use four spaces.
- Document new functions with brief comments describing their purpose.
- A `.editorconfig` at the repo root enforces indentation and newline rules; configure your editor to use it.

## Required Checks
Run the following commands before committing changes:

```bash
npx ts-node --project ytapp/tsconfig.json scripts/generate-schema.ts
cd ytapp && npm install
cd src-tauri && cargo check
cd .. && npx ts-node src/cli.ts --help
```

Install `ts-node` globally with `npm install -g ts-node` or ensure `npx` can
download it to run the CLI checks and examples.

`cargo check` may require system packages. Run the appropriate install script
for your OS (`./scripts/install_tauri_deps.sh`, `./scripts/install_tauri_deps_macos.sh` or `./scripts/install_tauri_deps_windows.ps1`) if needed.
Be sure `.env.tauri` from `scripts/setup_codex.sh` is sourced (or export the
`PKG_CONFIG_PATH` it contains) before running cargo.

## Additional Notes
- Do not commit `.env.tauri` or build artifacts.
- Prefer cross-platform paths when invoking external tools.
- System fonts are detected on all platforms; `fc-list` is optional on Linux.
- To create release installers for all platforms, run `./scripts/package.sh`.
- CI builds run `.github/workflows/package.yml` which executes this script and
  uploads the installers as artifacts.
- Language definitions live in `ytapp/src/features/languages/defs`. Add a new
  `<code>.json` file in that directory to support another language. Each file
  contains `value`, `label` and `rtl` fields.
