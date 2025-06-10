### FINAL IMPLEMENTATION PLAN (clean version)

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
  * Configurable resolution via `--width`/`--height` or UI dropdown
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
* Output `.srt` file
* Burn `.srt` captions into video using FFmpeg:

  * Font (user-selectable)
  * Size (user-selectable)
  * Position (top / center / bottom)

---

### 4️⃣ YouTube Integration

* OAuth 2.0 flow via Google Cloud Desktop App OAuth client
* Scopes:

  * `https://www.googleapis.com/auth/youtube.upload`
* Token storage (encrypted local storage)
* Upload video via YouTube Data API v3
  * Implemented in Rust backend using google-youtube3 crate
  * Requires `client_secret.json` path via `YOUTUBE_CLIENT_SECRET` env variable
  * Tokens stored in `youtube_tokens.json`
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

---

### 6️⃣ UI Features

* Audio file picker (single / multiple)
* Background picker (image / video)
* Intro picker (video / image, user-provided)
* Outro picker (video / image, user-provided)
* Captions settings:

  * Language (Auto-detect, Nepali, Hindi, English, Spanish, French, Chinese,
    Arabic, Portuguese, Russian, Japanese, German)
  * Font selector
  * Size slider
  * Position (top / center / bottom)
* YouTube sign-in button + status
* Generate video button
* Generate & upload to YouTube button
* Generation progress bar
* Batch process progress UI
* Drag & drop support for file inputs
* Theme toggle (light/dark)
* Settings page with persistent defaults
* Interface translations (English, Nepali, Hindi, Spanish, French, Chinese,
  Arabic, Portuguese, Russian, Japanese, German, Italian, Korean,
  Vietnamese, Turkish, Indonesian, plus many more). Translations
  for the newer languages may be incomplete – contributions are
  very welcome.
* Video preview modal after generation

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
* `scripts/package.sh` builds installers for Windows, macOS and Linux

---

### Setup

Run the helper script to install required system packages on Ubuntu/Debian:

```bash
./scripts/install_tauri_deps.sh
```

Install Tauri's system dependencies (Ubuntu/Debian):

```bash
sudo apt-get update
sudo apt-get install -y libgtk-3-dev libglib2.0-dev libsoup2.4-dev \
    libwebkit2gtk-4.1-dev libjavascriptcoregtk-4.1-dev build-essential \
    pkg-config libssl-dev
```

Ubuntu 24.04 only provides the `webkit2gtk-4.1` and `javascriptcoregtk-4.1` packages.
Create compatibility links so Cargo can find the expected `*-4.0.pc` files:

```bash
sudo ln -s /usr/lib/x86_64-linux-gnu/pkgconfig/webkit2gtk-4.1.pc \
    /usr/lib/x86_64-linux-gnu/pkgconfig/webkit2gtk-4.0.pc
sudo ln -s /usr/lib/x86_64-linux-gnu/pkgconfig/webkit2gtk-web-extension-4.1.pc \
    /usr/lib/x86_64-linux-gnu/pkgconfig/webkit2gtk-web-extension-4.0.pc
sudo ln -s /usr/lib/x86_64-linux-gnu/pkgconfig/javascriptcoregtk-4.1.pc \
    /usr/lib/x86_64-linux-gnu/pkgconfig/javascriptcoregtk-4.0.pc
```

`PKG_CONFIG_PATH` must include `/usr/lib/x86_64-linux-gnu/pkgconfig` when running
`cargo check`. For example:

```bash
export PKG_CONFIG_PATH=/usr/lib/x86_64-linux-gnu/pkgconfig
```

Install Node dependencies and run checks:

```bash
cd ytapp
npm install
cargo check          # run inside ytapp/src-tauri
npx ts-node src/cli.ts --help
```

### Onboarding

The first time you start the app a short guide appears explaining how to:

1. Select an audio file.
2. Generate the video.
3. Upload directly to YouTube.

The guide only shows once and the preference is stored in `settings.json`.

### Design Guidelines

See [design.md](design.md) for the updated design approach. The interface now uses generous whitespace, consistent grid spacing and subtle transitions in the spirit of Dieter Rams and Jony Ive.

Finally, start the Tauri application:

```bash
npm run start
```


### Custom Fonts

Use the **Font** dropdown in the settings page to load any font installed on your
system. If your font does not appear in the list, choose **Select File** to pick
a `.ttf` or `.otf` file. The selected font and style are stored in the
application settings and passed to FFmpeg so subtitles render with your custom
font.

### CLI Usage

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



