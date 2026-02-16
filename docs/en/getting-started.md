---
layout: page
lang: en
title: Getting Started
description: Learn how to install and start using Priska PDF Tool
permalink: /en/getting-started/
---

## Installation

### macOS

1. Download the `.dmg` file from the [Releases page](https://github.com/dansailer/pdftool/releases)
2. Open the downloaded DMG file
3. Drag **Priska PDF Tool** to your Applications folder
4. On first launch, right-click the app and select "Open" to bypass Gatekeeper

**Note:** The app is a universal binary that runs natively on both Intel and Apple Silicon Macs.

### Windows

1. Download the `.msi` installer from the [Releases page](https://github.com/dansailer/pdftool/releases)
2. Run the installer and follow the prompts
3. Launch Priska PDF Tool from the Start Menu

### Linux

**AppImage:**
1. Download the `.AppImage` file from the [Releases page](https://github.com/dansailer/pdftool/releases)
2. Make it executable: `chmod +x Priska-PDF-Tool.AppImage`
3. Run the AppImage

**Debian/Ubuntu:**
1. Download the `.deb` package from the [Releases page](https://github.com/dansailer/pdftool/releases)
2. Install with: `sudo dpkg -i priska-pdf-tool_*.deb`

---

## Opening Files {#opening-files}

There are several ways to open PDF files in Priska PDF Tool:

### Drag and Drop
Simply drag one or more PDF files from your file manager and drop them onto the application window. Multiple files will be automatically merged in the order they were dropped.

### File Menu
1. Click **File** in the menu bar
2. Select **Open...** (or press `Cmd+O` / `Ctrl+O`)
3. Select one or more PDF files from the file dialog
4. Click **Open**

### Opening Multiple Files
When you open multiple PDF files, they are automatically combined into a single document. You can then:
- Reorder pages by dragging thumbnails
- Delete unwanted pages
- Save the combined result as a new PDF

---

## Basic Navigation {#basic-navigation}

### Viewing Pages

The main window consists of two panels:

- **Thumbnail Panel (Left):** Shows small previews of all pages. Click a thumbnail to navigate to that page.
- **Main Viewer (Right):** Displays the currently selected page at full size.

### Navigating Between Pages

| Method | Description |
|--------|-------------|
| Click thumbnail | Jump directly to any page |
| Up/Down arrow keys | Move to previous/next page |
| Scroll | Scroll through the main viewer |

### Zoom Controls

The toolbar provides zoom controls:

- **Zoom In (+):** Increase magnification
- **Zoom Out (-):** Decrease magnification  
- **Fit Width:** Fit the page to the window width

You can also use **pinch-to-zoom** gestures on trackpads.

### Selecting Multiple Pages

To select multiple pages for batch operations:

- **Shift+Click:** Select a range of pages
- **Cmd+Click / Ctrl+Click:** Toggle individual page selection

Selected pages are highlighted in the thumbnail panel.

---

## Your First Edit

Let's walk through a simple editing workflow:

### 1. Open Your PDFs
Drag two or more PDF files onto the window. They will be merged automatically.

### 2. Reorder Pages
Drag thumbnails up or down in the thumbnail panel to rearrange pages. You can also use **Shift+Up/Down** arrow keys.

### 3. Delete Unwanted Pages
Select pages you want to remove and press **Delete** or **Backspace**, or click the delete button in the toolbar.

### 4. Rotate Pages
Select pages and use the rotate buttons in the toolbar to rotate left or right by 90 degrees.

### 5. Save Your Work
1. Go to **File > Save As...** (or press `Cmd+S` / `Ctrl+S`)
2. Fill in the optional metadata (title, author, subject, keywords)
3. Choose a save location and filename
4. Click **Save**

---

## Next Steps

- Learn about all [Features](/en/features/) available in Priska PDF Tool
- Master the [Keyboard Shortcuts](/en/keyboard-shortcuts/) for faster editing
- Check the [FAQ](/en/faq/) for answers to common questions
