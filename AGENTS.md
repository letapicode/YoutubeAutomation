# Development Instructions

These guidelines apply to the entire repository.

## Project Structure
- The Tauri desktop application is under `ytapp`.
- Rust sources live in `ytapp/src-tauri/src` and TypeScript/React sources in `ytapp/src`.

## Code Style
- Keep existing indentation styles: TypeScript files generally use two spaces and TSX files use four spaces.
- Document new functions with brief comments describing their purpose.

## Required Checks
Run the following commands before committing changes:

```bash
cd ytapp && npm install
cd src-tauri && cargo check
cd .. && npx ts-node src/cli.ts --help
```

`cargo check` may require system packages; run `./scripts/install_tauri_deps.sh` if needed.

## Additional Notes
- Do not commit `.env.tauri` or build artifacts.
- Prefer cross-platform paths when invoking external tools.
