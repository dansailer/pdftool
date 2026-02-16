---
layout: page
lang: en
title: Features
description: Discover all the powerful features of Priska PDF Tool
permalink: /en/features/
---

Priska PDF Tool provides a comprehensive set of features for viewing and manipulating PDF documents. Here's everything you can do:

---

## PDF Viewing {#viewing}

### High-Quality Rendering
Priska PDF Tool uses pdf.js for high-fidelity PDF rendering that accurately displays:
- Text and fonts
- Vector graphics
- Images and photos
- Complex layouts

### Thumbnail Navigation
The left panel shows thumbnail previews of all pages in your document, making it easy to:
- Get an overview of your entire document
- Jump directly to any page with a single click
- See the effects of your edits in real-time

### Zoom Controls
Adjust the view to your preference:
- **Zoom In / Out:** Increase or decrease magnification
- **Fit to Width:** Automatically fit the page to window width
- **Pinch-to-Zoom:** Use trackpad gestures for precise zoom control

---

## Merge PDFs {#merging}

Combine multiple PDF documents into a single file:

### How to Merge
1. **Drag and drop** multiple PDF files onto the window, OR
2. Use **File > Open** to select multiple files at once

The PDFs are combined in the order they were added. You can then rearrange pages as needed.

### Tips for Merging
- There's no limit to the number of PDFs you can merge
- Large files may take a moment to process
- The thumbnail panel shows all pages from all merged documents
- Use drag-and-drop in the thumbnail panel to reorder pages from different source files

---

## Reorder Pages {#reordering}

Rearrange pages in your document with intuitive drag-and-drop:

### Using the Mouse
1. Click on a thumbnail to select it
2. Drag the thumbnail to its new position
3. A visual indicator shows where the page will be inserted
4. Release to drop the page

### Using the Keyboard
1. Select the page(s) you want to move
2. Press **Shift+Up Arrow** to move up
3. Press **Shift+Down Arrow** to move down

### Moving Multiple Pages
1. Select multiple pages using **Shift+Click** (range) or **Cmd/Ctrl+Click** (toggle)
2. Drag the selection to the new position
3. All selected pages move together, maintaining their relative order

---

## Delete Pages {#deleting}

Remove unwanted pages from your document:

### How to Delete
1. Select the page(s) you want to delete
2. Either:
   - Press **Delete** or **Backspace** key
   - Click the **Delete** button in the toolbar

### Deleting Multiple Pages
Select multiple pages first, then delete them all at once. This is useful for:
- Removing blank pages
- Extracting only the pages you need
- Removing cover pages or appendices

### Undo Deletion
Accidentally deleted a page? Press **Cmd+Z** / **Ctrl+Z** to undo immediately.

---

## Rotate Pages {#rotating}

Rotate individual pages or selections:

### How to Rotate
1. Select the page(s) you want to rotate
2. Click the rotation buttons in the toolbar:
   - **Rotate Left:** 90° counter-clockwise
   - **Rotate Right:** 90° clockwise

### Rotation Behavior
- Rotation is applied in 90-degree increments
- Multiple rotations accumulate (e.g., two right rotations = 180°)
- Rotation is preserved when saving the PDF

---

## Undo/Redo {#undo-redo}

Full undo and redo support for all editing operations:

### Supported Operations
- Page deletion
- Page reordering (single and multiple)
- Page rotation

### How to Use
- **Undo:** Press **Cmd+Z** / **Ctrl+Z** or use **Edit > Undo**
- **Redo:** Press **Cmd+Shift+Z** / **Ctrl+Shift+Z** or use **Edit > Redo**

### History Limit
The undo history stores up to **50 actions**. Older actions are automatically removed to save memory.

---

## Dark/Light Theme {#themes}

Choose your preferred appearance:

### Switching Themes
- Press **Cmd+Shift+T** / **Ctrl+Shift+T**
- Or use **View > Toggle Theme** from the menu

### Theme Persistence
Your theme preference is automatically saved and restored when you reopen the application.

---

## Document Metadata {#metadata}

Set PDF metadata when saving your document:

### Available Fields
- **Title:** The document title
- **Author:** The document author
- **Subject:** A brief description of the content
- **Keywords:** Searchable keywords for the document

### How to Set Metadata
1. Go to **File > Save As...**
2. A metadata dialog appears before the save dialog
3. Fill in the desired fields (all fields are optional)
4. Click **Save** to proceed to the file save dialog

---

## Auto Updates {#auto-update}

Stay up to date with the latest features and bug fixes:

### How It Works
1. On startup, the app checks for new versions on GitHub Releases
2. If an update is available, you'll see a notification
3. Click to download and install the update
4. The app will restart with the new version

### Manual Check
Currently, update checks happen automatically at startup. Future versions may include a manual check option.

---

## Multi-Select Operations

Perform operations on multiple pages at once:

### Selecting Pages
- **Single page:** Click a thumbnail
- **Range selection:** Click first page, then **Shift+Click** last page
- **Toggle selection:** **Cmd+Click** / **Ctrl+Click** to add or remove pages from selection
- **Select All:** Use **Cmd+A** / **Ctrl+A**

### Batch Operations
Once multiple pages are selected, you can:
- Delete all selected pages at once
- Rotate all selected pages in the same direction
- Move all selected pages together (maintaining relative order)

---

## Unsaved Changes Warning

Never lose your work:

### How It Works
- The window title shows "(Edited)" when you have unsaved changes
- If you try to close the window with unsaved changes, a confirmation dialog appears
- Choose to save, discard changes, or cancel and continue editing

---

## Next Steps

- Master all [Keyboard Shortcuts](/en/keyboard-shortcuts/)
- Read the [FAQ](/en/faq/) for tips and answers
- Check [Troubleshooting](/en/troubleshooting/) if you encounter issues
