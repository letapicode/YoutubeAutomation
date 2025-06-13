#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

"$ROOT_DIR/scripts/bootstrap.sh"

cd "$ROOT_DIR/ytapp"
if [ -d node_modules ]; then
    echo "node_modules already present; skipping npm install"
else
    npm install
fi

cd src-tauri
if [ -d target ]; then
    echo "Rust target directory exists; skipping cargo fetch"
else
    cargo fetch
fi
