#!/usr/bin/env bash
set -e

./scripts/setup_codex.sh

source .env.tauri

# Optional Ubuntu 24 / Debian 13 WebKit rename fix
ln -sf /usr/lib/x86_64-linux-gnu/pkgconfig/webkit2gtk-4.1.pc \
      /usr/lib/x86_64-linux-gnu/pkgconfig/webkit2gtk-4.0.pc
ln -sf /usr/lib/x86_64-linux-gnu/pkgconfig/javascriptcoregtk-4.1.pc \
      /usr/lib/x86_64-linux-gnu/pkgconfig/javascriptcoregtk-4.0.pc

cd ytapp/src-tauri
cargo check --locked --all-targets
