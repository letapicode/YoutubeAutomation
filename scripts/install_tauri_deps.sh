#!/usr/bin/env bash
set -euo pipefail

# Install system dependencies required for building the Tauri application.
# Intended for Ubuntu/Debian systems.

DEPS=(
    libgtk-3-dev
    libglib2.0-dev
    libsoup2.4-dev
    libwebkit2gtk-4.1-dev
    libjavascriptcoregtk-4.1-dev
    build-essential
    pkg-config
    libssl-dev
    clang
)

if ! command -v apt-get >/dev/null; then
    echo "This script currently supports apt based systems only." >&2
    exit 1
fi

sudo apt-get update

# Determine the libclang development package to install.
LIBCLANG_PKG=$(apt-cache search --names-only '^libclang-[0-9]+-dev$' | \
    sort -V | grep -o 'libclang-[0-9]*-dev' | tail -n1)
if [ -z "$LIBCLANG_PKG" ]; then
    LIBCLANG_PKG="libclang-dev"
fi
DEPS+=("$LIBCLANG_PKG")

sudo apt-get install -y "${DEPS[@]}"

PKGCONFIG_DIR=/usr/lib/x86_64-linux-gnu/pkgconfig

# Create compatibility links for Ubuntu 24.04 where only *-4.1.pc files exist
if [ -f "$PKGCONFIG_DIR/webkit2gtk-4.1.pc" ] && [ ! -f "$PKGCONFIG_DIR/webkit2gtk-4.0.pc" ]; then
    sudo ln -sf "$PKGCONFIG_DIR/webkit2gtk-4.1.pc" "$PKGCONFIG_DIR/webkit2gtk-4.0.pc"
    sudo ln -sf "$PKGCONFIG_DIR/webkit2gtk-web-extension-4.1.pc" "$PKGCONFIG_DIR/webkit2gtk-web-extension-4.0.pc"
fi

if [ -f "$PKGCONFIG_DIR/javascriptcoregtk-4.1.pc" ] && [ ! -f "$PKGCONFIG_DIR/javascriptcoregtk-4.0.pc" ]; then
    sudo ln -sf "$PKGCONFIG_DIR/javascriptcoregtk-4.1.pc" "$PKGCONFIG_DIR/javascriptcoregtk-4.0.pc"
fi

# Write PKG_CONFIG_PATH to .env file for tauri\'s build scripts
echo "PKG_CONFIG_PATH=$PKGCONFIG_DIR" > .env.tauri

cat <<MSG
System dependencies installed.
A .env.tauri file has been created with PKG_CONFIG_PATH.
Source it or add the variable to your shell profile before running cargo.
MSG
