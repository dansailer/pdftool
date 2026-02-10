import { open, save } from "@tauri-apps/plugin-dialog";
import { readFile, writeFile } from "@tauri-apps/plugin-fs";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { i18nManager } from "./I18nManager";
import { toast } from "./Toast";

export interface FileResult {
  name: string;
  data: Uint8Array;
}

export class FileHandler {
  private dropZones: Set<HTMLElement> = new Set();
  private unlistenDragDrop: (() => void) | null = null;
  private onFilesCallback: ((files: FileResult[]) => void) | null = null;

  async openFiles(): Promise<FileResult[]> {
    const selected = await open({
      multiple: true,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });

    if (!selected) return [];

    const paths = Array.isArray(selected) ? selected : [selected];
    const results: FileResult[] = [];

    for (const path of paths) {
      const data = await readFile(path);
      const name = path.split(/[/\\]/).pop() ?? "unknown.pdf";
      results.push({ name, data: new Uint8Array(data) });
    }

    return results;
  }

  async saveFile(data: Uint8Array, suggestedName = "merged.pdf"): Promise<string | null> {
    const path = await save({
      filters: [{ name: "PDF", extensions: ["pdf"] }],
      defaultPath: suggestedName,
    });

    if (!path) return null;

    await writeFile(path, data);
    return path;
  }

  /**
   * Setup drag and drop using Tauri's native file drop event.
   * This handles files dragged from the system file manager.
   */
  async setupDragDrop(
    element: HTMLElement,
    onFiles: (files: FileResult[]) => void
  ): Promise<void> {
    this.dropZones.add(element);
    this.onFilesCallback = onFiles;

    // Setup visual feedback for HTML5 dragover (for styling)
    element.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      element.classList.add("drag-over");
    });

    element.addEventListener("dragleave", (e) => {
      e.preventDefault();
      e.stopPropagation();
      element.classList.remove("drag-over");
    });

    element.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      element.classList.remove("drag-over");
      // The actual file handling is done via Tauri's onDragDropEvent
    });

    // Setup Tauri native file drop handler (only once)
    if (!this.unlistenDragDrop) {
      const webview = getCurrentWebviewWindow();
      this.unlistenDragDrop = await webview.onDragDropEvent(async (event) => {
        const dropEvent = event.payload;
        
        if (dropEvent.type === "over" || dropEvent.type === "enter") {
          // Add drag-over class to all drop zones
          this.dropZones.forEach((el) => el.classList.add("drag-over"));
        } else if (dropEvent.type === "leave") {
          // Remove drag-over class from all drop zones
          this.dropZones.forEach((el) => el.classList.remove("drag-over"));
        } else if (dropEvent.type === "drop") {
          // Remove drag-over class
          this.dropZones.forEach((el) => el.classList.remove("drag-over"));

          // Filter for PDF files and load them
          const allPaths = dropEvent.paths as string[];
          const paths = allPaths.filter(
            (p: string) => p.toLowerCase().endsWith(".pdf")
          );

          // Show warning if non-PDF files were dropped
          if (paths.length === 0 && allPaths.length > 0) {
            const title = i18nManager.t("error.no_pdf_files");
            const message = i18nManager.t("error.no_pdf_files_detail");
            toast.warning(title, message);
            return;
          }

          if (paths.length === 0) return;

          const results: FileResult[] = [];
          for (const path of paths) {
            try {
              const data = await readFile(path);
              const name = path.split(/[/\\]/).pop() ?? "unknown.pdf";
              results.push({ name, data: new Uint8Array(data) });
            } catch (err) {
              console.error("Failed to read dropped file:", path, err);
            }
          }

          if (results.length > 0 && this.onFilesCallback) {
            this.onFilesCallback(results);
          }
        }
      });
    }
  }

  /**
   * Cleanup the drag drop event listener
   */
  destroy(): void {
    if (this.unlistenDragDrop) {
      this.unlistenDragDrop();
      this.unlistenDragDrop = null;
    }
    this.dropZones.clear();
  }
}
