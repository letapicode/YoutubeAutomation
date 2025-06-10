# Design Guide

This project follows a minimalist approach inspired by the principle **"Less but better"**. Interfaces should focus on clarity and essential functions.

## Layout
- Use CSS grid to organize pages. Containers like `.app` and `.row` provide consistent spacing.
- Buttons and form groups should align on a tidy grid with about `1rem` gaps.
- Collapse advanced options using the `Collapsible` component to keep primary screens concise.

## Colors
- Prefer a neutral palette: light backgrounds (`#f5f5f5`) and dark text (`#333`).
- Use the CSS variables defined in `theme.css` to support light and dark themes.
- Buttons use subtle rounded corners and light shadows via the `--radius` and `--shadow` variables.
- Keep iconography simple and high‑contrast.

## Components
- Only present controls that are necessary for the task.
- Display selected file paths as plain text instead of editable inputs.
- File inputs should support drag & drop via the `DropZone` component.
- Use SVG icons next to key actions (e.g., Upload, Settings) for clarity. Icons share the current text color for high contrast.

Following these guidelines keeps the UI clear and purposeful.
