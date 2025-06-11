#!/usr/bin/env bash
set -e

# 1) Install GTK/WebKit/GLib headers
./scripts/install_tauri_deps.sh

# 2) Export PKG_CONFIG_PATH for this shell
source .env.tauri

# 3) Optional Ubuntu 24 / Debian 13 WebKit rename fix
ln -sf /usr/lib/x86_64-linux-gnu/pkgconfig/webkit2gtk-4.1.pc \
      /usr/lib/x86_64-linux-gnu/pkgconfig/webkit2gtk-4.0.pc
ln -sf /usr/lib/x86_64-linux-gnu/pkgconfig/javascriptcoregtk-4.1.pc \
      /usr/lib/x86_64-linux-gnu/pkgconfig/javascriptcoregtk-4.0.pc

# 4) Quick health check
cd ytapp
npm install --no-fund --no-audit
cd src-tauri
cargo check --locked --all-targets
cd ..
npx ts-node src/cli.ts --help
