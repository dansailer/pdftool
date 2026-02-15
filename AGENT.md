# Agent Guide (Security-First)

This project is a Rust + Tauri + pdf.js desktop app with a TypeScript frontend. This guide defines how to work safely, how to keep architecture clean, and how to evolve the codebase.

## Architecture Expectations

- Keep a clean, layered design: UI ↔ application/core ↔ infrastructure.
- Keep modules small and focused; isolate platform-specific code.

## Dependency Policy

- Only use dependencies that are recent and have strong community adoption (many GitHub stars).
- Ask before adding any new dependencies (Rust or JS).
- **Do NOT downgrade dependency versions without explicit user approval.** This includes GitHub Actions versions (e.g., `actions/checkout@v4` should not be changed to `@v3`).

## Frontend PDF Viewer

- Use `pdf.js` (pdfjs-dist v4.x) for the frontend PDF viewer.
- Prefer local files using object URLs; do not upload PDFs to external services.

## PDF Manipulation

- Use `lopdf` (Rust crate) in the Tauri backend for PDF merging and export.
- **Why not pdf-lib?** The JavaScript `pdf-lib` library has a known limitation where `copyPages()` duplicates ALL resources (fonts, images, streams) from source documents without deduplication. This causes severe file size bloat - merging 3 PDFs totaling 1.7MB produced a 35MB output file.
- **Why lopdf?** The Rust `lopdf` crate provides `delete_pages()` and `prune_objects()` methods that properly remove unused pages and their associated resources, resulting in much smaller merged files.
- pdf-lib is no longer used for merging (removed from active dependencies).

## Documentation Rule

- Any new knowledge discovered while working on the project must be recorded here in `AGENT.md`.

## Non-Negotiables

- Security-first decisions in both Rust and TypeScript.
- Use `pnpm`, never `npm`.
- Keep TypeScript strict and avoid `any` unless there is no viable alternative.
- Avoid code duplication; refactor shared logic instead.
- Use comments sparingly and only to clarify non-obvious behavior.
- Keep architecture clean and modular.

## Security Principles

- Default to least privilege; lock down Tauri permissions and capabilities.
- Validate all user inputs on both frontend and backend boundaries.
- Avoid arbitrary file access; always scope file operations to explicit user selections.
- Never execute external commands unless absolutely required and explicitly reviewed.
- Prefer memory-safe Rust patterns; avoid `unsafe` unless a strong case is documented.
- Handle errors explicitly; never leak sensitive data into logs.
- Keep secrets out of the repo; no `.env` commits or local secrets.

## Architecture Design

┌─────────────────────────────────────────────────────────┐
│             Priska PDF Tool Tauri App                   │
├──────────────────────┬──────────────────────────────────┤
│   Left Panel         │        Right Panel               │
│   (Thumbnails)       │        (Full Page View)          │
│                      │                                  │
│   ┌──────────┐       │       ┌──────────────────┐       │
│   │ Page 1   │       │       │                  │       │
│   └──────────┘       │       │   Selected Page  │       │
│   ┌──────────┐       │       │   (Full Size)    │       │
│   │ Page 2   │       │       │                  │       │
│   └──────────┘       │       └──────────────────┘       │
│   Right-click menu:  │                                  │
│   • Delete           │                                  │
│   • Move Up          │                                  │
│   • Move Down        │                                  │
└──────────────────────┴──────────────────────────────────┘

Rendering: PDF.js          Manipulation: lopdf (Rust)

## Planning Decisions (Q&A)

The following decisions were made during the planning phase:

1. **Scope**: Full application plan covering all features from README
2. **Frontend Framework**: Vanilla TypeScript with direct DOM manipulation (no framework)
3. **Milestones**: Phased approach with 8 working checkpoints (v0.1 through v1.0)
4. **pdf.js Integration**: Via `pdfjs-dist` npm package v4.x (bundled with Vite, no CDN)
5. **File Operations**: Both Tauri file dialogs (menu item) AND HTML5 drag-and-drop
6. **PDF Manipulation**: In the Rust backend using `lopdf` (replaced pdf-lib due to file size issues)
7. **Undo/Redo**: Command pattern via `UndoManager` class (Phase 6)
8. **Page Rotation**: Rotate left/right per page (Phase 4)
9. **Annotations**: Out of scope for v1.0
10. **Internationalization (i18n)**: Using `tauri-plugin-i18n` with `_version: 2` YAML format
11. **Theming**: Light/dark theme with CSS variables and menu toggle
12. **Menu Structure**: Application menu (Priska PDF Tool) contains Language/Theme; File menu is separate
13. **Window Title**: Shows first loaded filename with edited indicator

See `plan.md` for the full implementation plan.

## Technical Learnings

### pdfjs-dist v5 (ESM-only)

- v5 is ESM-only: all files are `.mjs`, no `.js` fallbacks.
- Worker setup with Vite: use `new Worker(new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url), { type: "module" })` and assign to `GlobalWorkerOptions.workerPort`.
- The `render()` method in v5 requires a `canvas` property (HTMLCanvasElement) instead of `canvasContext`. The `canvasContext` is optional/deprecated.
- CSP must include `script-src: 'self' blob:` and `worker-src: 'self' blob:` for the pdf.js worker to load.

### Tauri v2 File Dialog + FS Plugin

- When a user selects a file via `@tauri-apps/plugin-dialog`'s `open()`, that path is automatically added to the fs scope at runtime. No pre-configured scope entries needed.
- Minimum permissions: `dialog:allow-open`, `dialog:allow-save`, `fs:allow-read-file`, `fs:allow-write-file`.
- Each Tauri plugin must be registered in `lib.rs` via `.plugin(tauri_plugin_xxx::init())`.

### Build Notes

- DMG bundling may fail on macOS without proper code signing setup; the `.app` bundle builds correctly.
- The pdf.js worker file is ~1MB bundled; this is expected.

### Tauri v2 Native Menus

- Use `@tauri-apps/api/menu` for native menus (Menu, Submenu, MenuItem, PredefinedMenuItem).
- Menu permissions are included in `core:default` - no extra permissions needed.
- Use `Menu.setAsAppMenu()` for app-wide menus (required on macOS).
- MenuItem actions are callbacks; use `setText()` to update menu item text dynamically.
- Accelerators use `CmdOrCtrl+X` format for cross-platform shortcuts.

### CSS Theming

- Use `data-theme` attribute on `<html>` element for theme switching.
- Define theme-specific CSS variables in `[data-theme="light"]` and `[data-theme="dark"]` selectors.
- Store theme preference in localStorage for persistence.
- ThemeManager singleton pattern works well for global state.

### Tauri v2 Native File Drag-and-Drop

- HTML5 drag-drop events (`dragover`, `drop`) do NOT work for files dragged from the system file manager in Tauri.
- Must use Tauri's native `onDragDropEvent` from `@tauri-apps/api/webviewWindow`.
- Enable `dragDropEnabled: true` in `tauri.conf.json` window configuration.
- Event types: `enter` (file enters window), `over` (hovering), `drop` (file dropped), `leave` (cancelled/left).
- The event callback receives `event.payload` containing the `type` and `paths` array.
- Use `readFile` from `@tauri-apps/plugin-fs` to read the dropped file paths.

### tauri-plugin-i18n (razein97)

- Plugin: `tauri-plugin-i18n` (Rust) + `@razein97/tauri-plugin-i18n` (JS)
- Uses `rust_i18n` under the hood for parsing locale files.
- Locale files go in `src-tauri/locales/` directory.
- `_version: 2` format: All languages in one YAML file, structured as:
  ```yaml
  _version: 2
  key.name:
    en: English text
    de: German text
  ```
- Initialize with `.plugin(tauri_plugin_i18n::init(None))` in Rust.
- JS usage: `I18n.getInstance().load()` then `i18n.translate(key)`.
- Use `data-i18n` attribute on HTML elements for automatic translation.
- Use `I18n.setLocale(locale)` to change language at runtime.
- Permission: `i18n:default` in capabilities.

### Tauri v2 Menu Structure (macOS)

- First submenu becomes the Application menu (shows as app name in menu bar).
- Application menu typically contains: app preferences, language, theme, Services, Hide/Show, Quit.
- `PredefinedMenuItem` types: `Separator`, `Quit`, `Hide`, `HideOthers`, `ShowAll`, `Minimize`, `Maximize`, `CloseWindow`, `Services`, `Undo`, `Redo`, `Cut`, `Copy`, `Paste`, `SelectAll`.
- Note: `About` is NOT a valid `PredefinedMenuItem` type in Tauri v2 - must create custom MenuItem.
- Use `Submenu` for nested menus (e.g., Language submenu inside Application menu).
- Dynamic menu updates: Store menu item references, call `.setText()` to update text.

### pdfjs-dist v5.x Multi-Document Bug (CRITICAL)

- **DO NOT upgrade pdfjs-dist to v5.x!**
- Version 5.x has a breaking bug where the `PagesMapper` class uses static/global state shared across all PDF documents.
- When loading multiple PDFs, the global `pagesNumber` gets overwritten by the last loaded document.
- This causes "Invalid page request" errors when trying to render pages from earlier-loaded documents.
- Current working version: `pdfjs-dist@4.10.38`
- In v4.x, the `render()` method requires `{ canvasContext, viewport }` (not `{ canvas, viewport }` as in v5).

### Tauri v2 Developer Tools

- DevTools requires the `devtools` feature enabled in `Cargo.toml`: `tauri = { version = "2", features = ["devtools"] }`
- Permission required: `core:webview:allow-internal-toggle-devtools` in capabilities.
- No public `openDevtools()` method in JS API; use invoke with internal command:
  ```typescript
  import { invoke } from "@tauri-apps/api/core";
  import { getCurrentWebview } from "@tauri-apps/api/webview";
  
  await invoke("plugin:webview|internal_toggle_devtools", {
    label: getCurrentWebview().label,
  });
  ```
- This toggles devtools (opens if closed, closes if open).

### Disabling Browser Context Menu

- The default right-click context menu (with Reload, Inspect Element) can be disabled:
  ```typescript
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });
  ```
- Add this in main.ts before app initialization.

### Page Rotation with pdf-lib

- Store rotation state per page in `PageReference` class (0, 90, 180, 270 degrees).
- When rendering with pdf.js, apply rotation via viewport: `page.getViewport({ scale, rotation })`.
- When exporting with pdf-lib, apply rotation: `page.setRotation(degrees(rotation))`.
- Rotation is cumulative with existing page rotation in the PDF.

### Toolbar UI Pattern

- Three-section toolbar layout works well: left (actions), center (navigation), right (zoom).
- Use flexbox with `justify-content: space-between` for the sections.
- Pinch-to-zoom via trackpad uses `wheel` event with `ctrlKey` modifier.

### Tauri v2 Logging

- Use `tauri-plugin-log` for structured logging visible in terminal.
- Forward console.log to Tauri logs by wrapping console methods.
- Logs appear in terminal when running `pnpm tauri dev`.

### CSS Background Colors

- Use separate CSS variables for different panel backgrounds:
  - `--bg-secondary`: thumbnail panel (lighter)
  - `--bg-viewer`: main viewer area (darker, provides contrast)
- Dark theme viewer: `#121212`, Light theme viewer: `#c8c8cd`

### pdf.js ArrayBuffer Transfer Issue

- pdf.js may transfer/detach the ArrayBuffer when loading a document, making it unusable for pdf-lib later.
- **Solution**: Create separate copies of the Uint8Array data:
  - One copy for pdf.js to use (may be transferred)
  - One copy to store for later use (e.g., pdf-lib merging)
- See `PdfDocument.fromBytes()` for the implementation.

### Tauri v2 Permissions for File Operations

- For Save As functionality, need both `fs:read-all` and `fs:write-all` in capabilities.
- Also need `core:window:allow-set-title` for window title updates.
- Example capabilities:
  ```json
  "permissions": [
    "core:default",
    "core:window:allow-set-title",
    "fs:default",
    "fs:read-all",
    "fs:write-all"
  ]
  ```

### Undo/Redo with Async Callbacks

- Command pattern callbacks (`onExecute`, `onUndo`) may be async functions.
- The command's `execute()` method doesn't await these callbacks.
- Callbacks still execute, but the caller doesn't wait for completion.
- For UI refresh operations, order matters: refresh the main viewer first (what user sees), then thumbnails.

### Localization Best Practices

- Store app name in localization file (`app.name`) for easy renaming.
- Also localize dynamic text like "Edited" indicator (`app.edited`).
- Window title format: `filename.pdf - Edited - App Name`
- Use first loaded filename as suggested save name.