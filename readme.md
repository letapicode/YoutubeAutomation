### FINAL IMPLEMENTATION PLAN (clean version)

**Table of Contents**

1. [Framework](#1️⃣-framework)
2. [Audio/Video Processing](#2️⃣-audiovideo-processing)
3. [Transcription & Captions](#3️⃣-transcription--captions)
4. [YouTube Integration](#4️⃣-youtube-integration)
5. [Batch Processing](#5️⃣-batch-processing)
6. [UI Features](#6️⃣-ui-features)
7. [Packaging & Deployment](#7️⃣-packaging--deployment)
8. [Setup](#setup)
9. [Onboarding](#onboarding)
10. [Design Guidelines](#design-guidelines)
11. [Custom Fonts](#custom-fonts)
12. [CLI Usage](#cli-usage)
13. [Documentation](#documentation)


### Quick start

```bash
git clone https://github.com/letapicode/YoutubeAutomation.git && cd YoutubeAutomation
./scripts/setup_codex.sh       # installs everything (auto-run in Codex/devcontainer)
make dev                 # launches the Tauri app
```

Before every commit run `make verify` (or the commands in `AGENTS.md`).
This command first runs `npx ts-node --project ytapp/tsconfig.json scripts/generate-schema.ts` to keep TypeScript and Rust
schemas in sync before linting and compilation.
If `cargo check` fails on Linux, run `scripts/install_tauri_deps.sh`.
Run `make test` (or `npm test` inside `ytapp`) to run the automated tests.

---

### 1️⃣ Framework

* Tauri + React + Rust backend

---

### 2️⃣ Audio/Video Processing

* FFmpeg CLI integration
* Pipeline:

  * Optional Intro (user-provided video or image)
  * Main section:

    * If image → loop to match audio length
    * If short video → loop to match audio length
    * Burn captions into video via FFmpeg
  * Optional Outro (user-provided video or image)
  * Output: Final video (H.264 MP4)
  * Configurable resolution via `--width`/`--height` or UI dropdown, with a default set in Settings
  * Optional frame rate via `--fps` or default in Settings
  * Supports vertical short-form formats (720x1280 and 1080x1920)

---

### 3️⃣ Transcription & Captions

* OpenAI Whisper ([https://github.com/openai/whisper](https://github.com/openai/whisper)), local model
* Transcribe input audio
* Supported languages (with automatic detection when "Auto" is selected):

  * Nepali
  * Hindi
  * English
  * Spanish
  * French
  * Chinese
  * Arabic
  * Portuguese
  * Russian
  * Japanese
  * German
  * Italian
  * Korean
  * Vietnamese
  * Turkish
  * Indonesian
  * Dutch
  * Thai
  * Polish
  * Swedish
  * Finnish
  * Hebrew
  * Ukrainian
  * Greek
  * Malay
  * Czech
  * Romanian
  * Danish
  * Hungarian
  * Norwegian
  * Urdu
  * Croatian
  * Bulgarian
  * Lithuanian
  * Latvian
  * Slovak
  * Catalan
  * Serbian
  * Macedonian
  * Slovenian
  * Galician
  * Azerbaijani
  * Estonian
  * Nynorsk
  * Welsh
  * Punjabi
  * Afrikaans
  * Persian
  * Basque
  * Bengali
  * Marathi
  * Belarusian
  * Kazakh
  * Armenian
  * Swahili
  * Tamil
  * Albanian
  * Filipino
  * Bosnian
  * Icelandic
  * Kannada
  * Telugu
  * Maori
  * Gujarati
* Output `.srt` file
* Translations use the transcription language as the source when specified
* Burn `.srt` captions into video using FFmpeg:

  * Font (user-selectable)
  * Size (user-selectable)
  * Position (top / center / bottom)
  * Optional watermark overlay with configurable position

---

### 4️⃣ YouTube Integration

* OAuth 2.0 flow via Google Cloud Desktop App OAuth client
* Scopes:

  * `https://www.googleapis.com/auth/youtube.upload`
* Token storage (encrypted local storage)
* Upload video via YouTube Data API v3
  * Implemented in Rust backend using google-youtube3 crate
  * Requires `client_secret.json` path via `YOUTUBE_CLIENT_SECRET` env variable
    (defaults to `client_secret.json` in the project root if unset)
  * Tokens stored in the file from `YOUTUBE_TOKEN_FILE` (defaults to
    `youtube_tokens.enc`)
  * Encryption key provided via `YOUTUBE_TOKEN_KEY` which must be **32 bytes**.
    Generate with `openssl rand -hex 32` and export it before running the app
* Publish dates entered in the UI use your local time zone and are converted to UTC on upload
* Batch upload support

---

### 5️⃣ Batch Processing

* Multi-file audio input
* Apply same settings to all files:

  * Background image or video
  * Intro video/image
  * Outro video/image
  * Captions style and position
* Process queue → generate multiple videos
* Optional batch YouTube upload
* Import per-file metadata from a CSV file

---

### 6️⃣ UI Features

* Audio file picker (single / multiple)
* Background picker (image / video)
* Intro picker (video / image, user-provided)
* Outro picker (video / image, user-provided)
* Captions settings:

  * Language selector with 60+ options (see list above)
  * Font selector
  * Size slider
  * Position (top / center / bottom)
  * Watermark opacity and scale controls (persisted in settings)
  * Custom accent color setting
* YouTube sign-in/sign-out buttons
* Generate video button
* Generate & upload to YouTube button
* Generation progress bar
* Batch process progress UI
* Upload progress bar
* Drag & drop support for file inputs
* Theme toggle (light/dark)
* Accessible labels and full keyboard navigation
* Improved focus outlines and ARIA labels on modal and file picker buttons
* Thumbnail selector in the GUI
* Output path picker for generated videos
* Settings page with persistent defaults (resolution, privacy and playlist)
* Profiles page to save and load sets of options
 * Interface translations are handled via i18n files in `public/locales`.
   Over 60 languages are supported and fall back to English when a
   translation is missing. The app selects your system language on first
   launch when a matching translation exists. The chosen language is
   stored in the application settings so the interface stays consistent
   across restarts. Contributions to improve translations are welcome.
* Video preview modal after generation
* Logs page to view and clear application logs

---

### 7️⃣ Packaging & Deployment

* Tauri build pipeline
* Target:

  * Windows `.exe` installer
  * Mac `.dmg` installer
  * Linux `.AppImage`
* Bundle Whisper model downloader on first launch
* Checks for FFmpeg and the Whisper model at startup. Missing dependencies
  trigger a dialog explaining how to install them.
* Optional auto-update check notifies users when a new version is available using the Tauri updater plugin.
* Install the Tauri CLI first: `cargo install tauri-cli`
* `scripts/package.sh` builds installers for Windows, macOS and Linux

```bash
cargo install tauri-cli
./scripts/package.sh
```

---

### Setup

Clone the repository and run the setup script after entering the project
directory. Use `./scripts/setup_codex.sh` locally or `.codex/bootstrap.sh`
when starting the devcontainer. This script installs toolchains, downloads
the Whisper model and calls `scripts/install_tauri_deps.sh` to install the
GTK/WebKit development headers. It also writes `.env.tauri` which defines
`PKG_CONFIG_PATH` for Cargo.

After the script finishes **source `.env.tauri`** (or restart your shell)
before running `cargo check` or `make verify`.

Run `npm install` inside `ytapp` (or `npm install -g ts-node`) before using
any `ts-node` or CLI commands to avoid the "Need to install ts-node" prompt.

The application automatically verifies that FFmpeg and Whisper are installed at
startup. To run this check manually use:
`npx ts-node src/cli.ts check-deps`

For subtitle translation **Argos Translate** must also be available in your
`PATH`. Verify installation with:
`argos-translate --version`
See <https://www.argosopentech.com/> for download instructions.

```bash
git clone https://github.com/letapicode/YoutubeAutomation.git
cd YoutubeAutomation
./scripts/setup_codex.sh && make dev
```

The script is safe to re-run and detects your platform.
Use the matching dependency script for your OS which installs GTK/WebKit
packages and writes `.env.tauri`:

* Linux: `scripts/install_tauri_deps.sh`
  - Requires `clang` and `libclang-dev` on Linux; the script installs them automatically.
* macOS: `scripts/install_tauri_deps_macos.sh`
* Windows (PowerShell): `scripts/install_tauri_deps_windows.ps1`
* Windows full setup and build: `scripts/setup_windows.ps1`
  - Installs all dependencies, writes `.env.tauri`, and compiles the Tauri app into a Windows executable.

You may also use the provided devcontainer which automatically executes the setup script (`scripts/setup_codex.sh`) when first created.
Codex and all contributors should open the repo using the prebuilt image `ghcr.io/letapicode/ytapp-dev:latest` for the fastest startup.
The same setup steps are mirrored in `.codex/Dockerfile` which Codex uses as a
bootstrap container.

Before committing run `make verify` or the steps in `AGENTS.md`.
`make verify` runs `npx ts-node --project ytapp/tsconfig.json scripts/generate-schema.ts` first, then lints and compiles:
```bash
make verify
```
The CI pipeline runs the same command using the devcontainer image.


### Codex Container

`.codex/config.yaml` lists the verification steps Codex runs and references `.codex/bootstrap.sh` for initialization. The development container is built from `.codex/Dockerfile` and published as `ghcr.io/letapicode/ytapp-dev:latest`. Starting from this prebuilt image allows Codex to skip dependency installation; the bootstrap script runs `scripts/setup.sh` and sources `.env.tauri` so the environment is ready immediately. See [docs/SELF_REFLECTION.md](docs/SELF_REFLECTION.md) for more details on Codex operations.

### Troubleshooting

Errors about `glib-2.0`, `gdk-3.0`, `glib-sys`, `gdk-sys` or `gobject-sys`
usually mean `PKG_CONFIG_PATH` is not set or the GTK/WebKit development
packages are missing. When this occurs run `./scripts/setup_codex.sh`
(or the OS-specific install script such as `scripts/install_tauri_deps.sh`)
to install the dependencies and generate `.env.tauri`. **Source `.env.tauri`**
(which sets `PKG_CONFIG_PATH`) before running any Cargo command, then re-run
`cargo check`.

To automatically process files placed in a folder set the **Watch Directory**
and enable **Auto Upload** in the settings page or use the CLI `watch` command.
When the app starts it will immediately begin watching the configured folder using your saved settings.
Run `npx ts-node src/cli.ts watch-stop` to disable watching again. Use `--recursive` with the `watch` command to include subdirectories.

If CLI commands fail with "Need to install ts-node" run `npm install` in `ytapp` or install it globally with `npm install -g ts-node`.

Capture build output to a file for easier troubleshooting:

```powershell
cargo build 2>&1 | Tee-Object -FilePath build.log
```

See [docs/troubleshooting.md](docs/troubleshooting.md) for resolving Windows linker warnings such as `.drectve` messages.

### Contribution

To add a new language create a JSON file in
`ytapp/src/features/languages/defs` and a matching folder inside
`ytapp/public/locales`. See `CONTRIBUTING.md` for details.

### Onboarding

The first time you start the app a short guide appears explaining how to:

1. Select an audio file.
2. Generate the video.
3. Upload directly to YouTube.

The guide only shows once and the preference is stored in `settings.json`.
On first launch the interface language matches your system locale when a
corresponding translation file exists.

### Design Guidelines

See [design.md](docs/design.md) for the design approach. The interface follows the principles of Dieter Rams and Jony Ive with generous whitespace and a focus on accessibility.

Finally, start the Tauri application:

```bash
npm run start
```


### Custom Fonts

Use the **Font** dropdown in the settings page to load any font installed on your
system. Fonts are now detected on Windows, macOS and Linux by scanning the
standard font folders (on Linux `fc-list` is used when available). If your font
does not appear in the list, choose **Select File** to pick a `.ttf` or `.otf`
file. A search field filters the font list as you type with a short debounce so large libraries remain responsive. The selected font and style are stored in the application settings and
passed to FFmpeg so subtitles render with your custom font. You can also select a **UI Font** to change the interface typography.

### CLI Usage

All CLI commands use `ts-node`. If you do not have it installed globally run
`npm install -g ts-node` or prefix the commands with `npx` (requires internet
access).

Verify dependencies:
```bash
npx ts-node src/cli.ts check-deps
```

Authenticate with YouTube:

```bash
npx ts-node src/cli.ts sign-in
```

Sign out again:

```bash
npx ts-node src/cli.ts sign-out
```

Check if you are signed in:

```bash
npx ts-node src/cli.ts is-signed-in
```

List available fonts:

```bash
npx ts-node src/cli.ts list-fonts
```

List YouTube playlists:

```bash
npx ts-node src/cli.ts list-playlists
```
List available languages:
```bash
npx ts-node src/cli.ts list-languages
```

Generate and schedule an upload:

```bash
npx ts-node src/cli.ts generate-upload input.wav --title "My Video" \
  --description "Demo" --tags tag1,tag2 \
  --publish-at "2024-07-01T12:00:00Z"
```

Upload an existing video with metadata:

```bash
npx ts-node src/cli.ts upload video.mp4 --title "My Video"
```

Generate multiple videos without uploading:

```bash
npx ts-node src/cli.ts generate-batch a.wav b.wav -d ./out --title "Batch Title"
```

During uploads the CLI prints progress percentages similar to video generation.
Press `Ctrl-C` at any time to cancel the current operation.

Cancel generation or upload from another terminal:

```bash
npx ts-node src/cli.ts generate-cancel
npx ts-node src/cli.ts upload-cancel
```

`--caption-color` and `--caption-bg` accept hex colors. You may also use the
shorter `--color` and `--bg-color` aliases.
`--watermark` adds an overlay image. Use `--watermark-position` to place it in
any corner (top-left, top-right, bottom-left or bottom-right).
`--thumbnail` uploads a custom thumbnail image after the video finishes uploading.

Batch commands (`generate-batch`, `generate-upload-batch` and `upload-batch`) accept `--csv <file>`
to provide per-file metadata. The CSV must contain `file,title,description,tags,publish_at`
columns, where `tags` is a comma-separated list.

#### Directory Watching

Use `watch <dir>` to monitor a folder for new audio files and generate videos
with the same options available to `generate`. Common flags are:

- `--auto-upload` – upload after generation completes
- `--recursive` – include subdirectories

```bash
# Watch "incoming" and upload videos automatically
npx ts-node src/cli.ts watch ./incoming --auto-upload --recursive
```

Stop watching with:

```bash
npx ts-node src/cli.ts watch-stop
```

Queue up a file for later processing:

```bash
npx ts-node src/cli.ts queue-add input.wav --title "My Queued Video"
```

Add multiple jobs at once from a CSV file or list of audio files:

```bash
npx ts-node src/cli.ts queue-add-batch a.wav b.wav --csv metadata.csv -d output
```

Show queued jobs:

```bash
npx ts-node src/cli.ts queue-list
```
Show a summary of queue statuses:

```bash
npx ts-node src/cli.ts queue-status
```
Remove a job by its index:
```bash
npx ts-node src/cli.ts queue-remove 0
```
Move a job within the queue:
```bash
npx ts-node src/cli.ts queue-move 2 0
```
Export the queue to a file:
```bash
npx ts-node src/cli.ts queue-export queue.json
```
Import a queue from a file, appending to existing jobs:
```bash
npx ts-node src/cli.ts queue-import queue.json --append
```
Each job now tracks a `status` and `retries` count in `queue.json`.
Failed jobs remain in the queue until they succeed or exceed the retry limit.

Clear the queue:

```bash
npx ts-node src/cli.ts queue-clear
```
Clear completed and failed jobs:
```bash
npx ts-node src/cli.ts queue-clear-completed
```
Remove only failed jobs:
```bash
npx ts-node src/cli.ts queue-clear-failed
```

Process all queued jobs (retry failed jobs with `--retry-failed`):

```bash
npx ts-node src/cli.ts queue-run --retry-failed
```
Pause or resume queue processing:

```bash
npx ts-node src/cli.ts queue-pause
npx ts-node src/cli.ts queue-resume
```
View recent logs:

Use `--level` to filter by log level and `--search` to match text within log messages.
Use `--output <file>` to save the logs instead of printing them.

```bash
npx ts-node src/cli.ts logs 200 --level error --search failed --output logs.txt
```
Clear the log file:

```bash
npx ts-node src/cli.ts logs-clear
```
Shift all timestamps in an SRT file forward by 1.5 seconds:

```bash
npx ts-node src/cli.ts shift-srt captions.srt 1.5 --output adjusted.srt
```
The maximum retry count is configurable in the Settings page or by `max_retries` in `settings.json` (default `3`).

Profiles can store commonly used generation options in `settings.json`.
Save a profile from a JSON file:

```bash
npx ts-node src/cli.ts profile-save gaming profile.json
```

List or delete profiles:

```bash
npx ts-node src/cli.ts profile-list
npx ts-node src/cli.ts profile-delete gaming
```

Profiles can also be imported or exported from the Profiles page in the GUI using JSON files.

Use a profile with other commands using `--profile <name>`:

```bash
npx ts-node src/cli.ts generate input.wav --profile gaming
```




### AI Model Training

The maintainers welcome using this code base for AI model training if it helps your research or product. See [AI Model Training Policy](docs/AI_MODEL_TRAINING_POLICY.md) for details.

### Documentation

Additional references live in the `docs` folder:

- [Documentation Index](docs/index.md)
- [Contribution Guide](CONTRIBUTING.md)
- [Development Instructions](AGENTS.md)
- [Design Guide](design.md)
- [Project Overview](context.md)
- [Codex Self Reflection](SELF_REFLECTION.md)
- [AI Model Training Policy](docs/AI_MODEL_TRAINING_POLICY.md)
- [Future Features](docs/FUTURE_FEATURES.md)
- [Troubleshooting](docs/troubleshooting.md)

Licensed under the Apache-2.0 License.
