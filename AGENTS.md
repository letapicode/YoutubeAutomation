# Development Instructions

These guidelines apply to the entire repository.

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
cd ytapp && npm install
cd src-tauri && cargo check
cd .. && npx ts-node src/cli.ts --help
```

`cargo check` may require system packages. Run the appropriate install script
for your OS (`./scripts/install_tauri_deps.sh`, `./scripts/install_tauri_deps_macos.sh` or `./scripts/install_tauri_deps_windows.ps1`) if needed.
After running the script, source the generated `.env.tauri` file (or export the `PKG_CONFIG_PATH` it contains) before running cargo.

## Additional Notes
- Do not commit `.env.tauri` or build artifacts.
- Prefer cross-platform paths when invoking external tools.
- System fonts are detected on all platforms; `fc-list` is optional on Linux.
- To create release installers for all platforms, run `./scripts/package.sh`.
- Language definitions live in `ytapp/src/features/languages/defs`. Add a new
  `<code>.json` file in that directory to support another language. Each file
  contains `value`, `label` and `rtl` fields.
