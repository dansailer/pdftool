---
layout: page
lang: en
title: Frequently Asked Questions
description: Find answers to common questions about Priska PDF Tool
permalink: /en/faq/
---

## General Questions

### What is Priska PDF Tool?

Priska PDF Tool is a free, open-source desktop application for viewing and manipulating PDF files. It lets you merge multiple PDFs, reorder pages, delete pages, rotate pages, and save the result as a new PDF.

### Is Priska PDF Tool free?

Yes! Priska PDF Tool is completely free and open source. You can use it for personal or commercial purposes without any restrictions.

### What platforms does it support?

Priska PDF Tool runs on:
- **macOS** (Intel and Apple Silicon)
- **Windows** (64-bit)
- **Linux** (AppImage and DEB packages)

### Is there a mobile version?

Currently, Priska PDF Tool is only available for desktop operating systems. There are no plans for a mobile version at this time.

---

## Features

### Can I add pages from one PDF to another?

Yes! Simply open both PDFs (drag and drop or use File > Open) and they will be automatically merged. You can then reorder the pages as needed and save as a new PDF.

### Can I split a PDF into multiple files?

No, this feature is not currently available. Priska PDF Tool focuses on merging and rearranging pages within a single document.

### Can I add annotations or notes?

No, annotation features are not included in the current version. Consider using a dedicated PDF annotation tool for this purpose.

### Can I edit text in a PDF?

No, Priska PDF Tool is designed for page-level operations (merge, reorder, delete, rotate). It does not support editing text content within pages.

### Can I open password-protected PDFs?

No, password-protected PDFs are not currently supported. You'll need to remove the password using another tool before opening in Priska PDF Tool.

### How many PDFs can I merge at once?

There's no hard limit. You can merge as many PDFs as your computer's memory can handle. Very large documents may take longer to process.

---

## Saving and Exporting

### What format does it save in?

Priska PDF Tool saves documents as standard PDF files that can be opened by any PDF viewer.

### Can I overwrite the original file?

Yes, but we recommend saving to a new filename first until you're confident the output is correct.

### What metadata can I add?

When saving, you can add:
- Title
- Author
- Subject
- Keywords

All fields are optional.

---

## Technical Questions

### Why is the merged PDF larger than expected?

Earlier versions had an issue with file size. The current version uses optimized PDF merging that removes duplicate resources. Make sure you're using the latest version.

### Does it upload my files anywhere?

No! Priska PDF Tool is a completely offline application. Your PDF files are never uploaded to any server. All processing happens locally on your computer.

### How does auto-update work?

The app checks GitHub Releases for new versions on startup. If an update is available, you'll see a notification. Updates are downloaded directly from GitHub and installed locally.

---

## Troubleshooting

### Why can't I open the app on macOS?

macOS may block the app because it's not notarized. Right-click the app and select "Open" to bypass this warning. See [Troubleshooting](/en/troubleshooting/) for details.

### Why are some PDFs not displaying correctly?

Some complex PDF features may not render correctly. Try opening the PDF in another application to verify it's valid. See [Troubleshooting](/en/troubleshooting/) for more solutions.

### I found a bug. How do I report it?

Please report bugs on the [GitHub Issues page](https://github.com/dansailer/pdftool/issues). Include:
- Your operating system and version
- Steps to reproduce the bug
- Any error messages

---

## Contributing

### Is the source code available?

Yes! Priska PDF Tool is open source and available on [GitHub](https://github.com/dansailer/pdftool).

### How can I contribute?

You can contribute by:
- Reporting bugs and suggesting features on GitHub
- Submitting pull requests for bug fixes or improvements
- Improving documentation
- Testing on different platforms

### What technologies does it use?

Priska PDF Tool is built with:
- **Tauri** - Desktop application framework
- **Rust** - Backend language for PDF processing
- **TypeScript** - Frontend language
- **pdf.js** - PDF rendering
- **lopdf** - PDF manipulation (Rust library)
