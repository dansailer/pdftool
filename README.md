# Priska PDF Tool

A sleek, cross-platform PDF manipulation application built with Rust, Tauri, pdf.js and lopdf. Inspired by the intuitive interface of Mac Preview, Priska PDF Tool offers a simple yet powerful way to handle your PDF documents.

## Current Status

**Version 1.0 Release Candidate** - All core features are complete. Cross-platform testing in progress.

## Features

| Feature | Status |
|---------|--------|
| **View PDFs** | ✅ Complete |
| **Thumbnail navigation** | ✅ Complete |
| **Merge Multiple PDFs** | ✅ Complete |
| **Delete Pages** | ✅ Complete |
| **Rotate Pages** | ✅ Complete |
| **Reorder pages (drag)** | ✅ Complete |
| **Multi-select pages** | ✅ Complete |
| **Undo/Redo** | ✅ Complete |
| **Zoom controls** | ✅ Complete |
| **Pinch-to-zoom** | ✅ Complete |
| **Page navigation** | ✅ Complete |
| **Drag and Drop files** | ✅ Complete |
| **Save As** | ✅ Complete |
| **Dark/Light theme** | ✅ Complete |
| **Internationalization (EN/DE)** | ✅ Complete |
| **Developer Tools menu** | ✅ Complete |
| **Window title with filename** | ✅ Complete |

## Usage

### Getting Started

1. Launch Priska PDF Tool.
2. Drag and drop PDF files into the application window, or use File > Open to browse and select PDFs.
3. Multiple PDFs are automatically combined in the thumbnail view.

### Viewing PDFs

- Click thumbnails in the left panel to navigate pages
- Use arrow keys (Up/Down) to navigate between pages
- Zoom with the toolbar controls (+, -, Fit) or pinch-to-zoom on trackpad
- Toggle dark/light theme with Cmd+Shift+T
- Window title shows the first loaded filename

### Merging PDFs

1. Add multiple PDF files to the workspace (drag-drop or File > Open).
2. Pages from all PDFs appear in the thumbnail panel.
3. Reorder pages by dragging thumbnails or using Shift+Arrow keys.
4. Use File > Save As (Cmd+S) to export the merged document.

### Reordering Pages

- **Drag and drop**: Drag thumbnails to reorder pages
- **Multi-select**: Shift+click for range, Cmd/Ctrl+click to toggle
- **Keyboard**: Shift+Up/Down to move the current page
- All reordering operations support undo/redo

### Deleting Pages

1. Navigate to the page you want to delete.
2. Click the delete button (trash icon) in the toolbar.
3. Or press Delete/Backspace key.

### Rotating Pages

1. Navigate to the page you want to rotate.
2. Click the rotate buttons in the toolbar (left or right arrow icons).
3. Rotation is preserved when saving.

### Keyboard Shortcuts

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
| Navigate up | Up | Up |
| Navigate down | Down | Down |
| Toggle theme | Cmd+Shift+T | Ctrl+Shift+T |
| Developer Tools | Cmd+Alt+I | Ctrl+Alt+I |

### Interface Overview

- **Left Panel**: Thumbnail view of all pages from loaded PDFs
- **Right Panel**: Full-page viewer with zoom and page controls
- **Toolbar**: Rotate, delete, navigation, and zoom controls

## Development

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install)
- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/installation)
- Platform-specific dependencies for Tauri (see [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/))

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

### Running in Development Mode

```bash
pnpm tauri dev
```

This starts the Vite dev server and opens the Tauri application.

### Building for Production

```bash
pnpm tauri build
```

Outputs are in `src-tauri/target/release/bundle/`.

### Type Checking

```bash
pnpm exec tsc --noEmit
```

### Project Structure

```
pdftool/
├── src/                       # Frontend TypeScript source
│   ├── main.ts               # Application entry point
│   ├── styles.css            # Global styles with theming
│   ├── core/                 # Core business logic
│   │   ├── PdfDocument.ts    # pdf.js wrapper
│   │   ├── DocumentManager.ts # Multi-PDF management
│   │   ├── PageReference.ts  # Page tracking with rotation
│   │   ├── UndoManager.ts    # Undo/redo command stack
│   │   └── Commands.ts       # Undoable command implementations
│   ├── rendering/            # UI rendering
│   │   ├── MainViewer.ts     # Full-page viewer
│   │   └── ThumbnailRenderer.ts # Thumbnail panel with drag-drop
│   ├── manipulation/
│   │   └── PdfMerger.ts      # Calls Rust lopdf backend
│   ├── ui/
│   │   ├── AppMenu.ts        # Native menu setup
│   │   └── AboutDialog.ts    # About dialog
│   └── utils/                # Utilities
│       ├── FileHandler.ts    # File dialogs & drag-drop
│       ├── I18nManager.ts    # Internationalization
│       ├── ThemeManager.ts   # Dark/light theme
│       ├── KeyboardHandler.ts
│       ├── Toast.ts          # Toast notifications
│       ├── Loading.ts        # Loading overlay
│       └── Logger.ts         # Tauri log forwarding
├── src-tauri/                # Tauri/Rust backend
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs
│   │   └── pdf_merger.rs     # lopdf PDF merging
│   ├── locales/
│   │   └── app.yml           # i18n translations
│   ├── capabilities/
│   │   └── default.json      # Security permissions
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
├── tsconfig.json
├── vite.config.ts
├── plan.md                   # Implementation plan
└── AGENT.md                  # Development guide
```

### Important Notes

- **pdfjs-dist version**: Pinned to v4.10.38. Do NOT upgrade to v5.x due to a multi-document rendering bug.
- **Package manager**: Always use `pnpm`, never `npm`.
- **TypeScript**: Strict mode enabled, avoid `any` types.

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Guidelines

- Follow Rust and TypeScript best practices
- Use `pnpm`, not `npm`
- Keep TypeScript strict (no `any` unless unavoidable)
- Test on macOS (primary target, Windows/Linux support planned)
- Update documentation as needed

## Acknowledgments

- [Tauri](https://tauri.app/) - Cross-platform app framework
- [pdf.js](https://mozilla.github.io/pdf.js/) - PDF rendering
- [lopdf](https://github.com/J-F-Liu/lopdf) - PDF manipulation (Rust)
- Mac Preview for UI design inspiration

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with Rust and Tauri
