# Project Overview

This repository contains a cross-platform desktop application built with Tauri. The frontend is written in React/TypeScript while the backend is implemented in Rust. The project also exposes a command line interface for generating and uploading videos.

The `ytapp` directory holds the application source. TypeScript/React code lives in `ytapp/src` and the Tauri (Rust) code is under `ytapp/src-tauri`.

The frontend communicates with the backend exclusively through Tauri `invoke` calls. Small wrapper modules under `features/` expose these commands as typed functions that can be reused by both the GUI and the CLI. React components reside in `components/` and compose the main `App.tsx` UI.

## Components
- **src/App.tsx** – main React component handling video generation UI and navigation.
- **components/** – reusable React components such as file pickers, modals and batch tools.
- **features/** – small TypeScript modules that wrap Tauri commands (video processing, YouTube upload, settings, etc.).
- **cli.ts** – command line interface providing the same functionality as the GUI.

## Backend
- **src-tauri/main.rs** – Rust entry point exposing commands for video generation, uploads, transcription and configuration management.
- **language.rs**, **model_check.rs**, **token_store.rs** – helper modules used by the backend commands.

Utilities shared between the CLI and renderer (like subtitle translation) live in `src/utils`.

The application can optionally overlay a watermark image on generated videos. The watermark position is configurable in both the GUI and CLI.

Supporting documentation is found in `readme.md`, `design.md` and language definition files under `features/languages` and `public/locales`.

