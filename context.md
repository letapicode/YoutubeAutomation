# Project Overview

This repository contains a cross-platform desktop application built with Tauri. The frontend is written in React/TypeScript while the backend is implemented in Rust. The project also exposes a command line interface for generating and uploading videos.

The `ytapp` directory holds the application source. TypeScript/React code lives in `ytapp/src` and the Tauri (Rust) code is under `ytapp/src-tauri`.

## Components
- **src/App.tsx** – main React component handling video generation UI and navigation.
- **components/** – reusable React components such as file pickers, modals and batch tools.
- **features/** – small TypeScript modules that wrap Tauri commands (video processing, YouTube upload, settings, etc.).
- **cli.ts** – command line interface providing the same functionality as the GUI.

## Backend
- **src-tauri/main.rs** – Tauri backend exposing commands for video generation, uploads, transcription and configuration management.
- **language.rs**, **model_check.rs**, **token_store.rs** – helper modules used by the backend commands.

Supporting documentation is found in `readme.md`, `design.md` and language definition files under `features/languages` and `public/locales`.

