import { DocumentManager } from "./DocumentManager";
import { PageReference } from "./PageReference";
import { UndoableCommand } from "./UndoManager";

/**
 * Command to delete a page.
 */
export class DeletePageCommand implements UndoableCommand {
  readonly description: string;
  private deletedPage: PageReference | null = null;
  private pageIndex: number;

  constructor(
    private docManager: DocumentManager,
    pageIndex: number,
    private onExecute?: () => void,
    private onUndo?: () => void
  ) {
    this.pageIndex = pageIndex;
    this.description = `Delete page ${pageIndex + 1}`;
  }

  execute(): void {
    // Store the page before deleting so we can restore it
    this.deletedPage = this.docManager.getPage(this.pageIndex) ?? null;
    if (this.deletedPage) {
      this.docManager.deletePage(this.pageIndex);
      this.onExecute?.();
    }
  }

  undo(): void {
    if (this.deletedPage) {
      this.docManager.insertPage(this.pageIndex, this.deletedPage);
      this.onUndo?.();
    }
  }
}

/**
 * Command to delete multiple pages.
 */
export class DeletePagesCommand implements UndoableCommand {
  readonly description: string;
  private deletedPages: Array<{ index: number; page: PageReference }> = [];

  constructor(
    private docManager: DocumentManager,
    private pageIndices: number[],
    private onExecute?: () => void,
    private onUndo?: () => void
  ) {
    this.description = `Delete ${pageIndices.length} pages`;
  }

  execute(): void {
    // Sort indices in descending order and store pages before deleting
    const sortedIndices = [...this.pageIndices].sort((a, b) => b - a);
    this.deletedPages = [];

    for (const index of sortedIndices) {
      const page = this.docManager.getPage(index);
      if (page) {
        this.deletedPages.push({ index, page });
        this.docManager.deletePage(index);
      }
    }
    this.onExecute?.();
  }

  undo(): void {
    // Restore in ascending order (reverse of deletion order)
    const sorted = [...this.deletedPages].sort((a, b) => a.index - b.index);
    for (const { index, page } of sorted) {
      this.docManager.insertPage(index, page);
    }
    this.onUndo?.();
  }
}

/**
 * Command to move a single page.
 */
export class MovePageCommand implements UndoableCommand {
  readonly description: string;

  constructor(
    private docManager: DocumentManager,
    private fromIndex: number,
    private toIndex: number,
    private onExecute?: (fromIndex: number, toIndex: number) => void,
    private onUndo?: (fromIndex: number, toIndex: number) => void
  ) {
    this.description = `Move page ${fromIndex + 1} to position ${toIndex + 1}`;
  }

  execute(): void {
    this.docManager.movePage(this.fromIndex, this.toIndex, false);
    this.onExecute?.(this.fromIndex, this.toIndex);
  }

  undo(): void {
    // Reverse the move
    this.docManager.movePage(this.toIndex, this.fromIndex, false);
    this.onUndo?.(this.toIndex, this.fromIndex);
  }
}

/**
 * Command to move multiple pages.
 */
export class MovePagesCommand implements UndoableCommand {
  readonly description: string;
  private originalIndices: number[] = [];
  private newIndices: number[] = [];
  private targetIndex: number;

  constructor(
    private docManager: DocumentManager,
    fromIndices: number[],
    toIndex: number,
    private onExecute?: (newIndices: number[]) => void,
    private onUndo?: (originalIndices: number[]) => void
  ) {
    this.description = `Move ${fromIndices.length} pages`;
    this.originalIndices = [...fromIndices].sort((a, b) => a - b);
    this.targetIndex = toIndex;
  }

  execute(): void {
    this.newIndices = this.docManager.movePages(this.originalIndices, this.targetIndex, false);
    this.onExecute?.(this.newIndices);
  }

  undo(): void {
    // Move pages back to original positions
    // First, figure out where they need to go
    const sortedNew = [...this.newIndices].sort((a, b) => a - b);
    const minOriginal = Math.min(...this.originalIndices);
    
    // Move the pages back
    this.docManager.movePages(sortedNew, minOriginal, false);
    this.onUndo?.(this.originalIndices);
  }
}

/**
 * Command to rotate a page.
 */
export class RotatePageCommand implements UndoableCommand {
  readonly description: string;
  private previousRotation: number = 0;

  constructor(
    private docManager: DocumentManager,
    private pageIndex: number,
    private direction: "left" | "right",
    private onExecute?: (pageIndex: number) => void,
    private onUndo?: (pageIndex: number) => void
  ) {
    this.description = `Rotate page ${pageIndex + 1} ${direction}`;
  }

  execute(): void {
    const page = this.docManager.getPage(this.pageIndex);
    if (page) {
      this.previousRotation = page.rotation;
      if (this.direction === "right") {
        this.docManager.rotatePageRight(this.pageIndex);
      } else {
        this.docManager.rotatePageLeft(this.pageIndex);
      }
      this.onExecute?.(this.pageIndex);
    }
  }

  undo(): void {
    const page = this.docManager.getPage(this.pageIndex);
    if (page) {
      // Restore the previous rotation directly
      page.rotation = this.previousRotation;
      this.docManager.notifyChange();
      this.onUndo?.(this.pageIndex);
    }
  }
}
