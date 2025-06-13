#!/usr/bin/env bash
set -e

./scripts/setup_codex.sh

source .env.tauri

cd ytapp/src-tauri
cargo check --locked --all-targets

