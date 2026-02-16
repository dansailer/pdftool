---
layout: page
lang: en
title: Troubleshooting
description: Solutions to common problems with Priska PDF Tool
permalink: /en/troubleshooting/
---

Having issues with Priska PDF Tool? This guide covers common problems and their solutions.

---

## Common Issues {#common-issues}

### The app won't open on macOS

**Problem:** When you try to open the app, macOS shows a security warning or the app doesn't launch.

**Solution:**
1. Right-click (or Control+click) on the app
2. Select "Open" from the context menu
3. Click "Open" in the dialog that appears
4. The app should now launch and be remembered as safe

This is required because the app is not notarized with Apple. It only needs to be done once.

---

### PDF files aren't displaying correctly

**Problem:** Some PDFs appear blank, distorted, or with missing content.

**Possible causes and solutions:**

1. **Corrupted PDF file**
   - Try opening the PDF in another application to verify it's valid
   - Re-download or re-create the PDF if possible

2. **Encrypted or password-protected PDF**
   - Priska PDF Tool does not currently support password-protected PDFs
   - Remove the password protection using another tool before opening

3. **Complex PDF features**
   - Some advanced PDF features may not render correctly
   - Try printing the PDF to a new PDF file first

---

### Saved PDF is much larger than expected

**Problem:** The merged PDF file is significantly larger than the sum of the original files.

**Solution:** This issue was addressed in recent versions. Make sure you're running the latest version of Priska PDF Tool, which uses optimized PDF merging that removes duplicate resources.

If you're still experiencing this issue, please [report it on GitHub](https://github.com/dansailer/pdftool/issues).

---

### Drag and drop isn't working

**Problem:** Dragging PDF files onto the window doesn't open them.

**Solutions:**
1. Make sure you're dragging PDF files (`.pdf` extension)
2. Drag files to the main window area, not the title bar
3. Try using File > Open instead

---

### Thumbnails are slow to load

**Problem:** Thumbnails take a long time to appear for large PDFs.

**This is normal behavior.** Large PDFs with many pages or high-resolution images take longer to render. The app renders thumbnails in the background to keep the interface responsive.

**Tips:**
- Wait a moment for thumbnails to fully load
- Large PDFs (hundreds of pages) may take 10-30 seconds

---

### Changes aren't being saved

**Problem:** After editing, my changes don't appear in the saved PDF.

**Make sure you:**
1. Use **File > Save As...** (not just close the window)
2. Choose a new filename or confirm overwriting
3. Wait for the save operation to complete

**Note:** The "(Edited)" indicator in the title bar shows when you have unsaved changes.

---

### Undo isn't working

**Problem:** Pressing Cmd+Z / Ctrl+Z doesn't undo my action.

**Possible causes:**
1. You've already undone all available actions (50 maximum)
2. You're trying to undo after reopening the app (undo history is not persisted)
3. The focus might be on a different element

**Solution:** Click somewhere in the main window to ensure it has focus, then try Undo again.

---

### Application crashes

**Problem:** The app crashes when performing certain operations.

**Steps to resolve:**
1. Restart the application
2. Try with a smaller or different PDF file
3. Check if you have enough disk space and memory
4. Update to the latest version

**If crashes persist:**
1. Note what you were doing when the crash occurred
2. Check the console logs (Developer Tools > Console)
3. [Report the issue on GitHub](https://github.com/dansailer/pdftool/issues) with details

---

## Getting Help {#contact-support}

If you can't find a solution to your problem:

### Check the FAQ
See the [Frequently Asked Questions](/en/faq/) for more answers.

### Report an Issue
1. Go to the [GitHub Issues page](https://github.com/dansailer/pdftool/issues)
2. Search for existing issues that match your problem
3. If not found, create a new issue with:
   - Your operating system and version
   - App version (see About dialog)
   - Steps to reproduce the problem
   - Any error messages you see

### View Source Code
Priska PDF Tool is open source. You can:
- View the code on [GitHub](https://github.com/dansailer/pdftool)
- Contribute fixes or improvements
- Build from source for your platform
