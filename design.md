# Design Guide

This project follows a minimalist approach inspired by the principle **"Less but better"**. Interfaces should focus on clarity and essential functions.

## Layout
- Use CSS grid or flexbox to create simple, well-spaced layouts.
- Provide generous spacing between controls to reduce visual clutter.

## Colors
- Prefer a neutral palette: light backgrounds (`#f5f5f5`) and dark text (`#333`).
- Use the CSS variables defined in `theme.css` to support light and dark themes.
- Avoid excessive decoration and keep iconography minimal.

## Components
- Only present controls that are necessary for the task.
- Display selected file paths as plain text instead of editable inputs.
- File inputs should support drag & drop via the `DropZone` component.

Following these guidelines keeps the UI clear and purposeful.
