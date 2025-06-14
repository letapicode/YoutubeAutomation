#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

"$ROOT_DIR/scripts/setup.sh"

if [[ "$(uname -s)" == "Linux" ]]; then
  "$ROOT_DIR/scripts/install_tauri_deps.sh"
fi

if [ -f "$ROOT_DIR/.env.tauri" ]; then
  source "$ROOT_DIR/.env.tauri"
fi
