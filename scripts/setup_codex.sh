#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -z "${SKIP_DEPS:-}" ]; then
  if [[ "$(uname -s)" == "Linux" ]] && ! command -v sudo >/dev/null; then
    echo "Error: sudo is required to install system packages. Set SKIP_DEPS=1 to skip." >&2
    exit 1
  fi

  "$ROOT_DIR/scripts/setup.sh"

  if [[ "$(uname -s)" == "Linux" ]]; then
    "$ROOT_DIR/scripts/install_tauri_deps.sh"
  fi
else
  echo "SKIP_DEPS set; skipping system package installation" >&2
fi

if [ -f "$ROOT_DIR/.env.tauri" ]; then
  source "$ROOT_DIR/.env.tauri"
fi
