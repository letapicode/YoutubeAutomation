#!/usr/bin/env bash
set -euo pipefail

# Build the Tauri application for Windows, macOS and Linux.
# Generated installers are copied into the repository level 'dist' directory.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT_DIR/ytapp"
DIST_DIR="$ROOT_DIR/dist"

mkdir -p "$DIST_DIR"

build_target() {
    local target="$1"
    echo "==> Building target $target"
    (cd "$APP_DIR" && tauri build --target "$target")

    find "$APP_DIR/src-tauri/target/$target" -path '*/bundle/*' -type f \
        \( -name '*.exe' -o -name '*.dmg' -o -name '*.AppImage' \) \
        -exec cp {} "$DIST_DIR/" \;
}

build_target x86_64-pc-windows-msvc
build_target x86_64-apple-darwin
build_target x86_64-unknown-linux-gnu

