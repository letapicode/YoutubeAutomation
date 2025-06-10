# Design Guide

This project follows a minimalist approach inspired by the principle **"Less but better"**. Interfaces should focus on clarity and essential functions.

## Layout
- Use CSS grid for the main `.app` container with a `2rem` gap to allow generous whitespace.
- Rows are flex containers with a `1.5rem` gap for consistent spacing.
- On small screens rows stack vertically, while `[dir="rtl"]` reverses the row direction.

## Colors & Themes
- Use a restrained palette: light grey backgrounds (`#f5f5f5`) and dark grey text (`#333`).
- Accent colors are defined via variables in `theme.css` and should be used sparingly.
- Buttons rely on `--button-radius` and `--button-shadow` for subtle depth.
- Keep iconography simple and high-contrast.

## Motion
- Interactive elements use subtle transitions (`0.2s ease`) for background and shadow changes.

## Components
- Only present controls that are necessary for the task.
- Display selected file paths as plain text instead of editable inputs.
- File inputs should support drag & drop via the `DropZone` component.
- Advanced options are placed inside collapsible panels to keep screens tidy.
- Action buttons may include small SVG icons for clarity.

Inspired by the work of Dieter Rams and Jony Ive, these rules emphasize clarity, restrained color use and quiet motion.
