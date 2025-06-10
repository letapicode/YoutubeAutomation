# Design Guide

This project follows a minimalist approach inspired by the principle **"Less but better"**. Interfaces should focus on clarity and essential functions.

## Layout
- Use CSS grid for the main `.app` container with a `1.5rem` gap.
- Rows are flex containers with a `1rem` gap for consistent spacing.

## Colors & Themes
- Prefer a neutral palette: light backgrounds (`#f5f5f5`) and dark text (`#333`).
- Use variables in `theme.css` to support light and dark themes and button styles.
- Buttons use `--button-radius` and `--button-shadow` for subtle depth.
- Keep iconography simple and high-contrast.

## Components
- Only present controls that are necessary for the task.
- Display selected file paths as plain text instead of editable inputs.
- File inputs should support drag & drop via the `DropZone` component.
- Advanced options are placed inside collapsible panels to keep screens tidy.
- Action buttons may include small SVG icons for clarity.

Following these guidelines keeps the UI clear and purposeful.
