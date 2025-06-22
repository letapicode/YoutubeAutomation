# Design Guide

This project follows a minimalist approach inspired by the principle **"Less but better"**. Interfaces should focus on clarity and essential functions.

## Core Principles
- **Dieter Rams** advocates for useful, honest and unobtrusive products that avoid excess.
- **Jony Ive** focuses on simplicity, refined materials and a seamless user experience.

## Layout
- Use CSS grid for the main `.app` container with a `calc(var(--spacing-8) * 4)` gap to allow generous whitespace.
- Rows are flex containers with a `var(--spacing)` gap for consistent spacing.
- On small screens rows stack vertically, while `[dir="rtl"]` reverses the row direction.
- Spacing follows a strict grid to reinforce order and simplicity.

## Colors & Themes
- Use a restrained palette: light grey backgrounds (`#f5f5f5`) and dark grey text (`#333`).
- Accent colors are defined via variables in `theme.css` and should be used sparingly.
- Buttons rely on `--button-radius` and `--button-shadow` for subtle depth.
- Keep iconography simple and high-contrast.
- Provide a `high` contrast theme for accessibility.
- Detect the user's preferred color scheme and use it as the initial theme.

## Motion
- Interactive elements use subtle transitions (`0.2s ease`) for background and shadow changes.
- Respect `prefers-reduced-motion` by avoiding unnecessary animation.

## CSS Recommendations
- Base layout spacing on an 8‑pt grid for consistent rhythm. Theme variables like `--spacing-8` help enforce these increments across the UI.
- Define typography scales in `theme.css` so headings and body text align.
- Honor `@media (prefers-reduced-motion: reduce)` to disable transitions when requested.
- The `--transition` CSS variable is set to `none` in this media query so buttons, modals and other components automatically minimize motion.

## Components
- Only present controls that are necessary for the task.
- Display selected file paths as plain text instead of editable inputs.
- File inputs should support drag & drop via the `DropZone` component.
- Advanced options are placed inside collapsible panels to keep screens tidy.
- Action buttons may include small SVG icons for clarity.
- Components should remain visually quiet, leaving generous whitespace around elements.
- Typography scales in small increments (1.25x) for harmony.
- The Font selector includes a search field to quickly filter large font lists.
- The Playlist picker lets users choose from existing YouTube playlists instead of typing IDs.
- The Queue status panel offers a **Clear Completed and Failed** button to remove finished jobs.
- The onboarding modal uses a simple multi-step wizard with Next/Back controls.

Inspired by the work of Dieter Rams and Jony Ive, these rules emphasize clarity, restrained color use and quiet motion. Always strive for "as little design as possible".

## UX Audit
The interface was reviewed using Dieter Rams' ten principles of good design and remains minimal, useful and unobtrusive.

## Accessibility Checklist
- ARIA labels for buttons and inputs
- Full keyboard navigation
- High‑contrast theme option
- Screen reader announcements for progress messages
- Focus outlines use the `--focus-color` CSS variable for visibility

## Wireframes
Early sketches live in `design/wireframes` outlining the flow: select audio → configure captions → preview → upload.
