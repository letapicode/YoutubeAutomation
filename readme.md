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

---

### 3️⃣ Transcription & Captions

* OpenAI Whisper ([https://github.com/openai/whisper](https://github.com/openai/whisper)), local model
* Transcribe input audio
* Supported languages:

  * Nepali
  * Hindi
  * English
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

  * Language (Nepali / Hindi / English / Auto)
  * Font selector
  * Size slider
  * Position (top / center / bottom)
* YouTube sign-in button + status
* Generate video button
* Generate & upload to YouTube button
* Batch process progress UI

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

### Design Guidelines

See [design.md](design.md) for the UI style guide based on the principle "Less but better".

Finally, start the Tauri application:

```bash
npm run start
```


