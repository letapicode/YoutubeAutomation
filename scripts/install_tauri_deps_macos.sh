#!/usr/bin/env bash
set -euo pipefail

if ! command -v brew >/dev/null; then
  echo "Homebrew is required to install Tauri dependencies." >&2
  exit 1
fi

brew update
brew install glib gobject-introspection webkit2gtk || true

PKGCONFIG_DIR="$(brew --prefix)/lib/pkgconfig"
echo "PKG_CONFIG_PATH=$PKGCONFIG_DIR" > .env.tauri

echo "System dependencies installed for macOS."
echo "A .env.tauri file has been created with PKG_CONFIG_PATH."
