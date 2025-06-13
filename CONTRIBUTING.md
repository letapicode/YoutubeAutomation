# Contributing

Thank you for helping improve this project!

## Adding a New Language
1. Create `ytapp/src/features/languages/defs/<code>.json` with:
   ```json
   { "value": "<code>", "label": "<Language Name>", "rtl": false }
   ```
2. Add a directory `ytapp/public/locales/<code>` containing `translation.json`.
   Start with `{ "title": "Youtube Automation" }` if you don't have full translations.
3. Run `make verify` or the individual commands in `AGENTS.md` before committing.
   If `cargo check` fails, run `scripts/install_tauri_deps.sh`.

## Development
Please read `AGENTS.md` for coding standards and required commands.
