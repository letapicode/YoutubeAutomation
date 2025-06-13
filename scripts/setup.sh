#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Perform OS level setup and download the Whisper model
"$ROOT_DIR/scripts/bootstrap.sh"

# Install language toolchains using asdf if available
if ! command -v asdf >/dev/null; then
  git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.14.0
  echo '. "$HOME/.asdf/asdf.sh"' >> ~/.bashrc
  export PATH="$HOME/.asdf/bin:$PATH"
fi
. "$HOME/.asdf/asdf.sh"

if ! asdf plugin-list | grep -q nodejs; then
  asdf plugin-add nodejs https://github.com/asdf-vm/asdf-nodejs.git
fi
if ! asdf plugin-list | grep -q rust; then
  asdf plugin-add rust https://github.com/code-lever/asdf-rust.git
fi
asdf install

# Install system libs for Tauri/GTK
case "$(uname -s)" in
  Linux*)
    "$ROOT_DIR/scripts/install_tauri_deps.sh"
    ;;
  Darwin*)
    command -v brew >/dev/null && brew bundle --file=- <<BREW
brew \'glib\'
brew \'gobject-introspection\'
BREW
    ;;
esac

# Generate PKG_CONFIG_PATH from .env.tauri if present
if [ -f "$ROOT_DIR/.env.tauri" ]; then
  source "$ROOT_DIR/.env.tauri"
fi

# Run npm install and setup Husky
cd "$ROOT_DIR/ytapp"
if [ -d node_modules ]; then
  echo "node_modules already present; skipping npm install"
else
  npm install
fi
if [ "${CI:-}" = "1" ]; then
  HUSKY=0 npx husky install
else
  npx husky install
fi
cd "$ROOT_DIR"

# Cargo fetch and check if PKG_CONFIG_PATH is set
if [ -n "${PKG_CONFIG_PATH:-}" ]; then
  cd ytapp/src-tauri
  if [ -d target ]; then
    echo "Rust target directory exists; skipping cargo fetch"
  else
    cargo fetch
  fi
  cargo check --quiet
  cd "$ROOT_DIR"
else
  echo "PKG_CONFIG_PATH not set. Run scripts/install_tauri_deps.sh" >&2
  exit 1
fi

# Setup complete
