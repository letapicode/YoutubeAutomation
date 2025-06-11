#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

os="$(uname -s)"
case "$os" in
    Linux*) platform=linux ;;
    Darwin*) platform=macos ;;
    MINGW*|MSYS*|CYGWIN*|Windows_NT*) platform=windows ;;
    *) platform=unknown ;;
esac

echo "Detected OS: $platform"

install_rust() {
    if ! command -v cargo >/dev/null; then
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        export PATH="$HOME/.cargo/bin:$PATH"
    fi
}

install_node() {
    if ! command -v node >/dev/null || ! node -v | grep -q '^v20'; then
        if [ "$platform" = linux ]; then
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            sudo apt-get install -y nodejs
        elif [ "$platform" = macos ]; then
            if command -v brew >/dev/null; then
                brew install node@20
                brew link --overwrite --force node@20
            fi
        fi
    fi
    if ! command -v yarn >/dev/null; then
        npm install -g yarn
    fi
}

install_ffmpeg() {
    if ! command -v ffmpeg >/dev/null; then
        if [ "$platform" = linux ]; then
            sudo apt-get update && sudo apt-get install -y ffmpeg
        elif [ "$platform" = macos ]; then
            command -v brew >/dev/null && brew install ffmpeg
        fi
    fi
}

install_whisper_model() {
    local dir="$HOME/.cache/whisper"
    local model="$dir/ggml-base.bin"
    if [ ! -f "$model" ]; then
        mkdir -p "$dir"
        curl -L https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin -o "$model"
    fi
}

if [ "$platform" = linux ]; then
    "$ROOT_DIR/scripts/install_tauri_deps.sh"
    source "$ROOT_DIR/.env.tauri"
    PKG_CONFIG_PATH_VALUE="$(cut -d= -f2 "$ROOT_DIR/.env.tauri")"
elif [ "$platform" = macos ]; then
    install_ffmpeg
    install_node
    install_rust
    PKG_CONFIG_PATH_VALUE="/opt/homebrew/lib/pkgconfig:/usr/local/lib/pkgconfig"
else
    install_node
    install_rust
fi

install_ffmpeg
install_node
install_rust
install_whisper_model

if [ -n "${PKG_CONFIG_PATH_VALUE:-}" ]; then
    echo "PKG_CONFIG_PATH=$PKG_CONFIG_PATH_VALUE" > "$ENV_FILE"
else
    : > "$ENV_FILE"
fi

echo "Bootstrap complete. Environment variables written to $ENV_FILE"
