import { PdfDocument } from "./core/PdfDocument";
import { DocumentManager } from "./core/DocumentManager";
import { UndoManager } from "./core/UndoManager";
import {
  DeletePageCommand,
  MovePageCommand,
  MovePagesCommand,
  RotatePageCommand,
} from "./core/Commands";
import { MainViewer } from "./rendering/MainViewer";
import { ThumbnailRenderer } from "./rendering/ThumbnailRenderer";
import { FileHandler, FileResult } from "./utils/FileHandler";
import { KeyboardHandler } from "./utils/KeyboardHandler";
import { setupAppMenu } from "./ui/AppMenu";
import { aboutDialog } from "./ui/AboutDialog";
import { metadataDialog } from "./ui/MetadataDialog";
import { i18nManager } from "./utils/I18nManager";
import { updateManager } from "./utils/UpdateManager";
import { PdfMerger } from "./manipulation/PdfMerger";
import { attachConsoleToTauriLog } from "./utils/Logger";
import { toast } from "./utils/Toast";
import { loading } from "./utils/Loading";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ask } from "@tauri-apps/plugin-dialog";

// Forward console logs to Tauri log plugin (visible in terminal)
attachConsoleToTauriLog();

// Disable the default context menu (right-click menu with Reload/Inspect)
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

class App {
  private docManager: DocumentManager;
  private undoManager: UndoManager;
  private viewer: MainViewer;
  private thumbnails: ThumbnailRenderer;
  private fileHandler: FileHandler;
  private keyboard: KeyboardHandler;
  private currentFileName: string | null = null;

  constructor() {
    this.docManager = new DocumentManager();
    this.undoManager = new UndoManager(50);
    this.viewer = new MainViewer();
    this.thumbnails = new ThumbnailRenderer();
    this.fileHandler = new FileHandler();
    this.keyboard = new KeyboardHandler();
  }

  async init(): Promise<void> {
    // Initialize i18n before setting up menu
    await i18nManager.init();
    i18nManager.updateDOMTranslations();

    // Initialize UI components
    await aboutDialog.init();
    metadataDialog.init();

    // Connect components to document manager
    this.viewer.setDocumentManager(this.docManager);
    this.thumbnails.setDocumentManager(this.docManager);

    // Subscribe to document changes for title updates
    this.docManager.onChange(() => this.updateWindowTitle());

    await this.setupMenu();
    await this.setupDragDrop();
    await this.setupCloseHandler();
    this.setupThumbnailNavigation();
    this.setupKeyboardShortcuts();
    this.keyboard.start();

    // Check for updates silently on startup
    updateManager.checkOnStartup();
  }

  private async setupCloseHandler(): Promise<void> {
    const window = getCurrentWindow();
    
    // Listen for close request - handle unsaved changes prompt
    await window.onCloseRequested(async (event) => {
      console.log("Close requested, isModified:", this.docManager.isModified);
      
      // Always prevent default - we'll handle the close ourselves
      event.preventDefault();
      
      // If document is modified, ask user to confirm
      if (this.docManager.isModified) {
        const shouldClose = await ask(
          i18nManager.t("dialog.unsaved_changes"),
          {
            title: i18nManager.t("dialog.unsaved_title"),
            kind: "warning",
          }
        );
        
        console.log("User response:", shouldClose);
        
        if (!shouldClose) {
          return; // User cancelled, don't close
        }
      }
      
      // Close the window
      await window.destroy();
    });
  }

  private async updateWindowTitle(): Promise<void> {
    const window = getCurrentWindow();
    const appName = i18nManager.t("app.name");
    
    if (this.docManager.isEmpty) {
      this.currentFileName = null;
      await window.setTitle(appName);
    } else if (this.currentFileName) {
      if (this.docManager.isModified) {
        const edited = i18nManager.t("app.edited");
        await window.setTitle(`${this.currentFileName} - ${edited} - ${appName}`);
      } else {
        await window.setTitle(`${this.currentFileName} - ${appName}`);
      }
    } else {
      if (this.docManager.isModified) {
        const edited = i18nManager.t("app.edited");
        await window.setTitle(`${appName} - ${edited}`);
      } else {
        await window.setTitle(appName);
      }
    }
  }

  private async setupMenu(): Promise<void> {
    await setupAppMenu({
      onOpen: () => this.handleOpenFiles(),
      onClose: () => this.handleClose(),
      onSaveAs: () => this.handleSaveAs(),
      onUndo: () => this.undo(),
      onRedo: () => this.redo(),
    });
  }

  private async setupDragDrop(): Promise<void> {
    const dropZone = document.getElementById("drop-zone") as HTMLDivElement;
    const viewerPanel = document.getElementById("viewer-panel") as HTMLDivElement;

    await this.fileHandler.setupDragDrop(dropZone, (files) => this.loadFiles(files));
    await this.fileHandler.setupDragDrop(viewerPanel, (files) => this.loadFiles(files));

    // Click on drop zone opens file dialog
    dropZone.addEventListener("click", () => this.handleOpenFiles());
    dropZone.style.cursor = "pointer";
  }

  private setupThumbnailNavigation(): void {
    this.thumbnails.onPageSelected = (pageIndex) => {
      this.viewer.goToPage(pageIndex);
    };

    this.viewer.onPageChange = (pageIndex) => {
      this.thumbnails.selectThumbnail(pageIndex);
    };

    // Handle page rotation - refresh main viewer first (what user sees), then thumbnail
    this.viewer.onPageRotated = async (pageIndex) => {
      await this.viewer.refresh();
      await this.thumbnails.refreshThumbnail(pageIndex);
    };

    // Handle page deletion - thumbnails will auto-refresh via onChange
    this.viewer.onPageDeleted = () => {
      // DocumentManager already notifies on delete, thumbnails will re-render
      // Just sync the thumbnail selection with the current viewer page
      this.thumbnails.selectThumbnail(this.viewer.getCurrentPageIndex());
    };

    // Handle page move from main viewer (keyboard shortcuts, toolbar buttons)
    this.viewer.onPageMoved = (fromIndex, toIndex) => {
      // Reorder thumbnail DOM directly without re-rendering
      this.thumbnails.handleExternalPageMove(fromIndex, toIndex);
    };

    // Wire up request callbacks for undoable actions
    this.viewer.onRequestRotateLeft = (pageIndex) => this.rotatePageLeft(pageIndex);
    this.viewer.onRequestRotateRight = (pageIndex) => this.rotatePageRight(pageIndex);
    this.viewer.onRequestDelete = (pageIndex) => this.deletePage(pageIndex);
    this.viewer.onRequestMoveUp = () => this.movePageUp();
    this.viewer.onRequestMoveDown = () => this.movePageDown();

    // Wire up thumbnail drag-drop request callbacks for undoable actions
    this.thumbnails.onRequestMovePage = (fromIndex, toIndex) => 
      this.movePageDragDrop(fromIndex, toIndex);
    this.thumbnails.onRequestMovePages = (fromIndices, toIndex) =>
      this.movePagesDragDrop(fromIndices, toIndex);
  }

  private setupKeyboardShortcuts(): void {
    // Page navigation
    this.keyboard.register({
      key: "ArrowUp",
      action: () => this.navigatePage(-1),
    });

    this.keyboard.register({
      key: "ArrowDown",
      action: () => this.navigatePage(1),
    });

    // Page reordering with Shift+Arrow
    this.keyboard.register({
      key: "ArrowUp",
      shift: true,
      action: () => this.movePageUp(),
    });

    this.keyboard.register({
      key: "ArrowDown",
      shift: true,
      action: () => this.movePageDown(),
    });

    // Undo/Redo
    this.keyboard.register({
      key: "z",
      ctrl: true,
      action: () => this.undo(),
    });

    this.keyboard.register({
      key: "z",
      ctrl: true,
      shift: true,
      action: () => this.redo(),
    });
  }

  // --- Undoable Actions ---

  private movePageUp(): void {
    const fromIndex = this.viewer.getCurrentPageIndex();
    const toIndex = fromIndex - 1;
    if (toIndex < 0) return;

    const command = new MovePageCommand(
      this.docManager,
      fromIndex,
      toIndex,
      // onExecute
      (from, to) => {
        this.viewer.setCurrentPageIndex(to);
        this.thumbnails.handleExternalPageMove(from, to);
      },
      // onUndo
      (from, to) => {
        this.viewer.setCurrentPageIndex(to);
        this.thumbnails.handleExternalPageMove(from, to);
      }
    );
    this.undoManager.execute(command);
  }

  private movePageDown(): void {
    const fromIndex = this.viewer.getCurrentPageIndex();
    const toIndex = fromIndex + 1;
    if (toIndex >= this.docManager.pageCount) return;

    const command = new MovePageCommand(
      this.docManager,
      fromIndex,
      toIndex,
      // onExecute
      (from, to) => {
        this.viewer.setCurrentPageIndex(to);
        this.thumbnails.handleExternalPageMove(from, to);
      },
      // onUndo
      (from, to) => {
        this.viewer.setCurrentPageIndex(to);
        this.thumbnails.handleExternalPageMove(from, to);
      }
    );
    this.undoManager.execute(command);
  }

  /**
   * Move a single page via drag-drop (undoable).
   */
  private movePageDragDrop(fromIndex: number, toIndex: number): void {
    const command = new MovePageCommand(
      this.docManager,
      fromIndex,
      toIndex,
      // onExecute
      (from, to) => {
        this.thumbnails.handleExternalPageMove(from, to);
        this.viewer.setCurrentPageIndex(to);
      },
      // onUndo
      (from, to) => {
        this.thumbnails.handleExternalPageMove(from, to);
        this.viewer.setCurrentPageIndex(to);
      }
    );
    this.undoManager.execute(command);
  }

  /**
   * Move multiple pages via drag-drop (undoable).
   */
  private movePagesDragDrop(fromIndices: number[], targetIndex: number): void {
    const command = new MovePagesCommand(
      this.docManager,
      fromIndices,
      targetIndex,
      // onExecute
      (newIndices) => {
        this.thumbnails.handleExternalPagesMove(fromIndices, targetIndex, newIndices);
        if (newIndices.length > 0) {
          this.viewer.setCurrentPageIndex(newIndices[0]);
        }
      },
      // onUndo
      (originalIndices) => {
        // The undo moves pages back; we need to reorder DOM accordingly
        // For undo, we need to compute where they came from
        const minOriginal = Math.min(...originalIndices);
        this.thumbnails.handleExternalPagesMove(
          originalIndices.map((_, i) => minOriginal + i),
          minOriginal,
          originalIndices
        );
        if (originalIndices.length > 0) {
          this.viewer.setCurrentPageIndex(originalIndices[0]);
        }
      }
    );
    this.undoManager.execute(command);
  }

  private rotatePageLeft(pageIndex: number): void {
    const command = new RotatePageCommand(
      this.docManager,
      pageIndex,
      "left",
      // onExecute - refresh viewer first (what user sees), then thumbnail
      async (idx) => {
        await this.viewer.refresh();
        await this.thumbnails.refreshThumbnail(idx);
      },
      // onUndo
      async (idx) => {
        await this.viewer.refresh();
        await this.thumbnails.refreshThumbnail(idx);
      }
    );
    this.undoManager.execute(command);
  }

  private rotatePageRight(pageIndex: number): void {
    const command = new RotatePageCommand(
      this.docManager,
      pageIndex,
      "right",
      // onExecute - refresh viewer first (what user sees), then thumbnail
      async (idx) => {
        await this.viewer.refresh();
        await this.thumbnails.refreshThumbnail(idx);
      },
      // onUndo
      async (idx) => {
        await this.viewer.refresh();
        await this.thumbnails.refreshThumbnail(idx);
      }
    );
    this.undoManager.execute(command);
  }

  private deletePage(pageIndex: number): void {
    const command = new DeletePageCommand(
      this.docManager,
      pageIndex,
      // onExecute
      () => {
        // Thumbnails will re-render via onChange
        // Adjust viewer to show appropriate page
        const newIndex = Math.min(pageIndex, this.docManager.pageCount - 1);
        if (newIndex >= 0) {
          this.viewer.goToPage(newIndex);
        }
      },
      // onUndo
      () => {
        // Thumbnails will re-render via onChange
        // Go back to the restored page
        this.viewer.goToPage(pageIndex);
      }
    );
    this.undoManager.execute(command);
  }

  private undo(): void {
    if (this.undoManager.canUndo) {
      this.undoManager.undo();
    }
  }

  private redo(): void {
    if (this.undoManager.canRedo) {
      this.undoManager.redo();
    }
  }

  private async handleOpenFiles(): Promise<void> {
    const files = await this.fileHandler.openFiles();
    if (files.length > 0) {
      await this.loadFiles(files);
    }
  }

  private async loadFiles(files: FileResult[]): Promise<void> {
    if (files.length === 0) return;

    // Show loading overlay for large operations
    const loadingText = i18nManager.t("loading.processing");
    loading.show(loadingText);

    try {
      // Clear undo history when loading new files
      this.undoManager.clear();

      // Track if this is the first file being loaded (for window title)
      const isFirstLoad = this.docManager.isEmpty;

      let loadedCount = 0;
      const errors: string[] = [];

      // Load all documents without triggering re-renders on each add
      for (const file of files) {
        try {
          const doc = await PdfDocument.fromBytes(file.data);
          // Don't notify on each add - batch them
          await this.docManager.addDocument(doc, file.name, false);
          
          // Track the first successfully loaded filename
          if (isFirstLoad && loadedCount === 0) {
            this.currentFileName = file.name;
          }
          
          loadedCount++;
        } catch (err) {
          console.error("Failed to load PDF:", file.name, err);
          errors.push(file.name);
        }
      }

      // Show errors for failed files
      if (errors.length > 0) {
        for (const filename of errors) {
          const title = i18nManager
            .t("error.load_failed")
            .replace("{filename}", filename);
          const message = i18nManager.t("error.load_failed_detail");
          toast.error(title, message);
        }
      }

      // Notify once after all documents are loaded (if any succeeded)
      if (loadedCount > 0) {
        this.docManager.notifyChange();
      }
    } finally {
      loading.hide();
    }
  }

  private handleClose(): void {
    // Clear all documents and reset to empty state
    this.docManager.clear();
    this.undoManager.clear();
    this.currentFileName = null;
  }

  private async handleSaveAs(): Promise<void> {
    if (this.docManager.isEmpty) return;

    // Show metadata dialog first
    const defaultTitle = this.currentFileName?.replace(/\.pdf$/i, "") || "";
    const metadata = await metadataDialog.show({
      defaultTitle,
    });

    // If user cancelled, abort save
    if (metadata === null) return;

    try {
      const mergedData = await loading.wrap(
        async () => {
          return await PdfMerger.merge(this.docManager, metadata);
        },
        i18nManager.t("loading.processing")
      );
      
      // Use the first loaded filename as the suggested save name
      const suggestedName = this.currentFileName ?? "merged.pdf";
      const savedPath = await this.fileHandler.saveFile(mergedData, suggestedName);
      
      if (savedPath) {
        this.docManager.markSaved();
        await this.updateWindowTitle();
        toast.success("Saved", `File saved to ${savedPath}`);
      }
    } catch (err) {
      console.error("Failed to save PDF:", err);
      const title = i18nManager.t("error.save_failed");
      const message = i18nManager.t("error.save_failed_detail");
      toast.error(title, message);
    }
  }

  private navigatePage(delta: number): void {
    const current = this.viewer.getCurrentPageIndex();
    const target = current + delta;
    if (target >= 0 && target < this.viewer.getPageCount()) {
      this.viewer.goToPage(target);
      this.thumbnails.selectThumbnail(target);
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const app = new App();
  app.init();
});
