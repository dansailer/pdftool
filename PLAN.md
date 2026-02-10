# Priska PDF Tool Implementation Plan

## Summary

Build a cross-platform PDF manipulation desktop application using:
- **Frontend**: Vanilla TypeScript with pdf.js (npm) for viewing
- **Backend**: Rust/Tauri with lopdf for PDF merging, native dialogs, file operations, and app shell
- **Architecture**: Phased milestones with working checkpoints

---

## Current Progress

| Phase | Version | Status | Description |
|-------|---------|--------|-------------|
| 1 | v0.1 | ✅ Complete | Foundation & PDF Viewing |
| 2 | v0.2 | ✅ Complete | Thumbnail Panel (integrated into Phase 1) |
| 7 | v0.7 | ✅ Complete | Internationalization (i18n) - moved up |
| 3 | v0.3 | ✅ Complete | Multi-PDF Support & Merging |
| 4 | v0.4 | ✅ Complete | Page Manipulation |
| 5 | v0.5 | ✅ Complete | Drag-and-Drop Reordering |
| 6 | v0.6 | ✅ Complete | Undo/Redo & Polish |
| 8 | v0.8 | ✅ Complete | Metadata Integration |
| 9 | v1.0 | 🔄 In Progress | Production Release |

---

## Decisions Made

The following decisions were made during planning:

1. **Scope**: Full application plan with all features
2. **Frontend Framework**: Vanilla TypeScript (no framework)
3. **Plan Structure**: Phased milestones with working checkpoints
4. **pdf.js Integration**: npm package (pdfjs-dist)
5. **File Operations**: Both Tauri file dialogs AND HTML5 drag-drop
6. **PDF Manipulation**: Rust backend with lopdf (replaced pdf-lib due to file size bloat)
7. **Undo/Redo**: Yes, included in Phase 6
8. **Page Rotation**: Yes, included in Phase 4
9. **Annotations**: No, out of scope for v1.0
10. **Internationalization (i18n)**: Yes, using `tauri-plugin-i18n` (razein97) with `_version: 2` YAML files
11. **Theming**: Light/dark theme support with toggle in Application menu
12. **Menu Structure**: Dedicated Application menu (PDF Tool) with Language/Theme, separate File menu

---

## Phase 1: Foundation & PDF Viewing (v0.1) ✅ COMPLETE

**Goal**: Replace the template with a working PDF viewer

**Tasks**:

1. **Install dependencies**
   - Add `pdfjs-dist` for PDF rendering
   - Add `pdf-lib` for PDF manipulation
   - Add `@tauri-apps/plugin-fs` and `@tauri-apps/plugin-dialog` for file operations

2. **Create basic UI structure**
   - Replace `index.html` with two-panel layout (left thumbnails, right viewer)
   - Create basic CSS layout using flexbox/grid
   - Set up responsive design

3. **Implement PDF loading**
   - Create `PdfDocument` class to wrap pdf.js document
   - Implement Tauri file dialog integration (Open menu item)
   - Implement HTML5 drag-and-drop zone
   - Handle file reading and passing to pdf.js

4. **Implement PDF rendering**
   - Render selected page in right panel
   - Add zoom controls (fit width, fit page, percentage)
   - Add page navigation controls

5. **Update Tauri capabilities**
   - Add `fs:read` permission
   - Add `dialog:open` permission
   - Configure CSP if needed for blob URLs

**Deliverable**: App opens a single PDF and displays it with navigation ✅

---

## Phase 2: Thumbnail Panel (v0.2) ✅ COMPLETE

> Note: Thumbnail functionality was implemented as part of Phase 1.

**Goal**: Add thumbnail sidebar with selection

**Tasks**:

1. **Thumbnail rendering**
   - Create `ThumbnailRenderer` class
   - Render lower-resolution thumbnails for all pages
   - Use canvas elements for efficient rendering
   - Implement lazy loading for large PDFs

2. **Thumbnail interaction**
   - Click to select page (updates main viewer)
   - Visual highlight for selected page
   - Scroll thumbnails into view on navigation

3. **Keyboard navigation**
   - Arrow up/down to navigate pages
   - Scroll sync between thumbnail and main view

**Deliverable**: Full thumbnail panel with click-to-navigate ✅

---

## Phase 3: Multi-PDF Support & Merging (v0.3) ✅ COMPLETE

**Goal**: Load multiple PDFs and merge them

**Tasks**:

1. **Document management** ✅
   - Created `DocumentManager` class to hold multiple PDFs
   - Display all pages from all loaded PDFs in thumbnail panel
   - Track page origin (which PDF, which page index) via `PageReference`

2. **Multi-file loading** ✅
   - Allow selecting multiple files in dialog
   - Allow dropping multiple files
   - Auto-append new PDFs to existing workspace

3. **PDF merging with lopdf (Rust)** ✅
   - Moved from pdf-lib to lopdf due to pdf-lib's file size bloat issue
   - Created `PdfMerger.ts` frontend wrapper calling Rust backend
   - Rust implementation uses `delete_pages()` and `prune_objects()` for efficiency
   - Handles page rotation preservation

4. **Save functionality** ✅
   - Added save dialog integration
   - Export merged PDF to user-selected location
   - Added "Save" and "Save As" menu items

**Deliverable**: Load multiple PDFs, view all pages, save merged result ✅

---

## Phase 4: Page Manipulation (v0.4) ✅ COMPLETE

**Goal**: Delete, reorder, rotate pages

**Tasks**:

1. **Delete pages** ✅
   - Toolbar delete button on main viewer
   - Keyboard shortcut: Delete/Backspace
   - Visual feedback on deletion

2. **Rotate pages** ✅
   - Toolbar rotate buttons (left/right) on main viewer
   - Store rotation state per page in `PageReference`
   - Apply rotation in both thumbnail and main viewer
   - Preserve rotation on export via pdf-lib

3. **Reorder pages** ✅
   - Keyboard shortcuts: Shift+Up, Shift+Down
   - Thumbnails sync with page moves

4. **State management** ✅
   - Track modifications to document via `isModified` flag
   - "Edited" indicator in window title bar
   - Confirmation dialog on close with unsaved changes

**Deliverable**: Full page manipulation (delete, reorder, rotate) with keyboard shortcuts ✅

---

## Phase 5: Drag-and-Drop Reordering (v0.5) ✅ COMPLETE

**Goal**: Intuitive drag-and-drop page reordering

**Tasks**:

1. **Drag-and-drop in thumbnails** ✅
   - Make thumbnails draggable
   - Visual drop indicator between pages
   - Smooth reordering animation
   - Optimized DOM reordering (no re-rendering of thumbnails)

2. **Multi-select support** ✅
   - Shift+click for range select
   - Cmd/Ctrl+click for toggle select
   - Drag multiple selected pages together

3. **Move button state management** ✅
   - Move Up button disabled when page is at first position
   - Move Down button disabled when page is at last position
   - Updates correctly for keyboard, toolbar, and drag-drop moves

**Deliverable**: Intuitive Mac Preview-like drag reordering ✅

---

## Phase 6: Undo/Redo & Polish (v0.6) ✅ COMPLETE

**Goal**: Add undo/redo support and prepare for production

**Tasks**:

1. **Undo/Redo system** ✅
   - Created `UndoManager` class with command pattern
   - Created command classes in `Commands.ts`:
     - `DeletePageCommand` / `DeletePagesCommand`
     - `MovePageCommand` / `MovePagesCommand`
     - `RotatePageCommand`
   - Support undo/redo for:
     - Page deletion
     - Page reordering (keyboard and drag-drop)
     - Page rotation
   - Keyboard shortcuts: Cmd/Ctrl+Z (undo), Cmd/Ctrl+Shift+Z (redo)
   - Edit menu integration with custom Undo/Redo items

2. **Undo stack management** ✅
   - Undo history limited to 50 actions
   - Clear undo stack on new document load or close
   - Request callbacks on MainViewer and ThumbnailRenderer for undoable actions

**Deliverable**: Full undo/redo support for all page manipulations ✅

---

## Phase 7: Internationalization (i18n) (v0.7) ✅ COMPLETE

> Note: Moved up to implement early in the development cycle.

**Goal**: Add multi-language support

**Implementation**:

1. **i18n infrastructure** ✅
   - Using `tauri-plugin-i18n` (razein97/tauri-plugin-i18n)
   - `_version: 2` YAML format with all languages in single file (`src-tauri/locales/app.yml`)
   - `I18nManager.ts` wrapper class with singleton pattern
   - Detects system locale, stores preference in localStorage

2. **Translated UI elements** ✅
   - Menu items (File, Edit, Window, Language)
   - Theme toggle text
   - Toolbar labels and tooltips
   - Drop zone text
   - Language names

3. **Language switching** ✅
   - Language submenu in Application menu (PDF Tool menu)
   - Supports: English, German
   - Hot-reload translations without app restart
   - Checkmark indicates current language

4. **Menu structure** ✅
   - Application menu: Language, Theme, Services, Hide/Show, Quit
   - File menu: Open, Close Window
   - Edit menu: Standard items
   - Window menu: Minimize, Maximize, Close Window

**Deliverable**: Fully localized UI with language switcher ✅

---

## Phase 8: Metadata Integration (v0.8) ✅ COMPLETE

**Goal**: Complete integration of the metadata dialog to embed searchable document properties in saved PDFs

**Tasks**:

1. **Initialize metadata dialog** ✅
   - Call `metadataDialog.init()` in the App initialization
   - Ensure dialog is ready before any save operation

2. **Wire dialog into save workflow** ✅
   - Modify `handleSaveAs()` to show metadata dialog before merging
   - Pass the first loaded filename as `defaultTitle` option
   - Collect user input and pass to `PdfMerger.merge(docManager, metadata)`
   - If user cancels dialog, abort the save operation

3. **Verify existing functionality** ✅
   - Author field persists to localStorage and auto-fills on next save
   - Default keywords are internationalized (from `metadata.default_keywords`)
   - Default subject includes the prompt injection (from `metadata.default_subject`)
   - All translations work correctly (EN/DE)

**Deliverable**: Metadata dialog shown before each save, with author remembered and internationalized defaults ✅

---

## Phase 9: Production Release (v1.0) 🔄 IN PROGRESS

**Goal**: Production-ready application with auto-updates

**Tasks**:

1. **Menu bar** ✅
   - File menu: Open, Save As, Close
   - Edit menu: Undo, Redo, Cut, Copy, Paste
   - View menu: Developer Tools
   - Native macOS/Windows/Linux menu integration

2. **Error handling** ✅
   - Graceful handling of corrupt PDFs with user-friendly toast notifications
   - User-friendly error messages for load/save failures
   - Loading indicators for large files (loading overlay)
   - Warning when dropping non-PDF files

3. **Performance optimization** ✅
   - Lazy canvas rendering using IntersectionObserver
   - Thumbnails only render when visible in viewport
   - Placeholder sizing for smooth scrolling before render

4. **Auto-update functionality** 🔲
   - Using `tauri-plugin-updater` with GitHub Releases
   - Plain portable binaries (no NSIS/MSI installers) using `uploadPlainBinary`
   - Signed updates with public/private key pair
   - Check for updates on app startup (silent) and via manual menu item
   - "Check for Updates" menu item in Application menu
   - Update dialog with version info and release notes
   - Download progress indication
   - Platform-specific update handling:
     - macOS: Download and replace `.app` bundle
     - Windows: Download `.exe`, prompt to restart
     - Linux: Download AppImage, prompt to restart
   - GitHub Actions workflow for automated builds and releases

5. **Cross-platform testing** 🔲
   - Test on macOS, Windows, Linux
   - Ensure keyboard shortcuts work per platform
   - Platform-specific modifier keys (Cmd vs Ctrl)

6. **App polish** ✅
   - Custom app icon generated from source image
   - About dialog with app info and version
   - Window title shows filename with "Edited" indicator
   - First filename used as suggested save name
   - Thumbnail drag-drop fully undoable
   - Debug logging removed from production code
   - App name and UI text fully localized

**Deliverable**: Production-ready v1.0 release with auto-updates

---

## Technical Architecture

```
src/
├── main.ts                    # Entry point, app initialization ✅
├── styles.css                 # Global styles with CSS variables for theming ✅
├── core/
│   ├── DocumentManager.ts     # Manages loaded PDFs and pages ✅
│   ├── PdfDocument.ts         # Wrapper around pdf.js document ✅
│   ├── PageReference.ts       # Tracks page origin, order, rotation ✅
│   ├── UndoManager.ts         # Undo/redo command stack ✅
│   └── Commands.ts            # Command implementations ✅
├── rendering/
│   ├── MainViewer.ts          # Right panel full-page viewer ✅
│   └── ThumbnailRenderer.ts   # Left panel thumbnails ✅
├── manipulation/
│   └── PdfMerger.ts           # Calls Rust lopdf backend for merge/export ✅
├── ui/
│   ├── AppMenu.ts             # Native menu setup ✅
│   ├── AboutDialog.ts         # About dialog component ✅
│   ├── MetadataDialog.ts      # PDF metadata input dialog ✅
│   ├── ThumbnailPanel.ts      # Thumbnail panel component (Phase 5)
│   ├── ContextMenu.ts         # Right-click menu (Phase 4)
│   └── DragDropHandler.ts     # Page drag-drop reordering (Phase 5)
└── utils/
    ├── FileHandler.ts         # Tauri file dialog + native drag-drop ✅
    ├── KeyboardHandler.ts     # Keyboard shortcuts ✅
    ├── ThemeManager.ts        # Light/dark theme management ✅
    ├── I18nManager.ts         # Internationalization wrapper ✅
    ├── Toast.ts               # Toast notification system ✅
    ├── Loading.ts             # Loading overlay manager ✅
    └── Logger.ts              # Tauri log forwarding ✅

src-tauri/
├── locales/
│   └── app.yml                # Translations (_version: 2 format) ✅
├── src/
│   ├── main.rs
│   ├── lib.rs                 # Plugin registration ✅
│   └── pdf_merger.rs          # lopdf PDF merging implementation ✅
└── capabilities/
    └── default.json           # Permissions ✅
```

---

## Dependencies (Installed)

**Frontend (package.json)**:
```json
"dependencies": {
  "pdfjs-dist": "^4.10.38",
  "@tauri-apps/plugin-dialog": "^2",
  "@tauri-apps/plugin-fs": "^2",
  "@razein97/tauri-plugin-i18n": "^2.0"
}
```

> **Note**: pdf-lib was removed from frontend dependencies. PDF merging is now handled by lopdf in the Rust backend.

> **CRITICAL**: Do NOT upgrade pdfjs-dist to v5.x! Version 5.x has a breaking bug where the
> `PagesMapper` class uses static/global state shared across all PDF documents. When loading
> multiple PDFs, the global `pagesNumber` gets overwritten by the last loaded document,
> causing "Invalid page request" errors.

**Backend (Cargo.toml)**:
```toml
tauri = { version = "2", features = ["devtools"] }
tauri-plugin-dialog = "2"
tauri-plugin-fs = "2"
tauri-plugin-i18n = "2"
tauri-plugin-opener = "2"
tauri-plugin-log = "2"
lopdf = "0.39"
base64 = "0.22"
```

---

## Keyboard Shortcuts Summary

| Action | macOS | Windows/Linux |
|--------|-------|---------------|
| Open file | Cmd+O | Ctrl+O |
| Save As | Cmd+S | Ctrl+S |
| Close | Cmd+W | Ctrl+W |
| Undo | Cmd+Z | Ctrl+Z |
| Redo | Cmd+Shift+Z | Ctrl+Shift+Z |
| Delete page | Delete/Backspace | Delete/Backspace |
| Move page up | Shift+Up | Shift+Up |
| Move page down | Shift+Down | Shift+Down |
| Rotate left | Cmd+L | Ctrl+L |
| Rotate right | Cmd+R | Ctrl+R |
| Navigate up | Up | Up |
| Navigate down | Down | Down |
| Toggle theme | Cmd+Shift+T | Ctrl+Shift+T |
| Developer Tools | Cmd+Alt+I | Ctrl+Alt+I |

---

## Out of Scope for v1.0

- PDF annotations
- Text selection/search
- Form filling
- Digital signatures
- Password-protected PDFs (may add later)
- Page splitting to separate files
