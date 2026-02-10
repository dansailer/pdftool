import { PdfDocument } from "./PdfDocument";
import { PageReference, createPageReference } from "./PageReference";

/**
 * Manages multiple PDF documents and their pages in a unified workspace.
 * Provides a flat list of page references that can be reordered, deleted, etc.
 */
export class DocumentManager {
  private documents: Map<string, { doc: PdfDocument; fileName: string }> = new Map();
  private pages: PageReference[] = [];
  private listeners: Array<() => void> = [];
  private documentIdCounter = 0;
  private _modified = false;

  /**
   * Add a PDF document to the workspace.
   * All pages from the document are appended to the current page list.
   * @param notify - Whether to notify listeners (default: true). Set to false when batch loading.
   */
  async addDocument(doc: PdfDocument, fileName: string, notify = true): Promise<void> {
    const docId = `doc-${++this.documentIdCounter}`;
    this.documents.set(docId, { doc, fileName });

    // Create page references for all pages in the document
    for (let i = 1; i <= doc.numPages; i++) {
      const pageRef = createPageReference(doc, i, fileName);
      this.pages.push(pageRef);
    }

    this._modified = true;
    if (notify) {
      this.notifyListeners();
    }
  }

  /**
   * Notify all listeners of changes.
   * Call this after batch operations with notify=false.
   */
  notifyChange(): void {
    this.notifyListeners();
  }

  /**
   * Get all page references in current order
   */
  getPages(): readonly PageReference[] {
    return this.pages;
  }

  /**
   * Get a specific page reference by index
   */
  getPage(index: number): PageReference | undefined {
    return this.pages[index];
  }

  /**
   * Get the total number of pages across all documents
   */
  get pageCount(): number {
    return this.pages.length;
  }

  /**
   * Check if the workspace has been modified
   */
  get isModified(): boolean {
    return this._modified;
  }

  /**
   * Mark the workspace as saved (not modified)
   */
  markSaved(): void {
    this._modified = false;
  }

  /**
   * Check if workspace is empty
   */
  get isEmpty(): boolean {
    return this.pages.length === 0;
  }

  /**
   * Delete a page at the given index
   */
  deletePage(index: number): PageReference | undefined {
    if (index < 0 || index >= this.pages.length) return undefined;
    const [removed] = this.pages.splice(index, 1);
    this._modified = true;
    this.notifyListeners();
    return removed;
  }

  /**
   * Delete multiple pages by their indices
   */
  deletePages(indices: number[]): PageReference[] {
    // Sort in descending order to delete from end first
    const sorted = [...indices].sort((a, b) => b - a);
    const removed: PageReference[] = [];
    
    for (const index of sorted) {
      if (index >= 0 && index < this.pages.length) {
        removed.push(this.pages.splice(index, 1)[0]);
      }
    }
    
    if (removed.length > 0) {
      this._modified = true;
      this.notifyListeners();
    }
    
    return removed.reverse();
  }

  /**
   * Move a page from one index to another
   * @param notify - Whether to notify listeners (default: true). Set to false for DOM-only updates.
   */
  movePage(fromIndex: number, toIndex: number, notify = true): boolean {
    if (fromIndex < 0 || fromIndex >= this.pages.length) return false;
    if (toIndex < 0 || toIndex >= this.pages.length) return false;
    if (fromIndex === toIndex) return false;

    const [page] = this.pages.splice(fromIndex, 1);
    this.pages.splice(toIndex, 0, page);
    this._modified = true;
    if (notify) {
      this.notifyListeners();
    }
    return true;
  }

  /**
   * Move multiple pages to a target position.
   * Pages are moved in order, maintaining their relative positions.
   * @param notify - Whether to notify listeners (default: true). Set to false for DOM-only updates.
   * @returns The new indices of the moved pages
   */
  movePages(fromIndices: number[], toIndex: number, notify = true): number[] {
    // Validate and sort indices
    const validIndices = fromIndices
      .filter((i) => i >= 0 && i < this.pages.length)
      .sort((a, b) => a - b);

    if (validIndices.length === 0) return [];

    // Extract pages in order (from end first to preserve indices)
    const pagesToMove: { page: PageReference; originalIndex: number }[] = [];
    for (let i = validIndices.length - 1; i >= 0; i--) {
      const idx = validIndices[i];
      pagesToMove.unshift({
        page: this.pages.splice(idx, 1)[0],
        originalIndex: idx,
      });
    }

    // Calculate insertion point, adjusted for removed pages before it
    let insertAt = toIndex;
    for (const idx of validIndices) {
      if (idx < toIndex) {
        insertAt--;
      }
    }
    insertAt = Math.max(0, Math.min(insertAt, this.pages.length));

    // Insert pages at new position
    const newIndices: number[] = [];
    for (let i = 0; i < pagesToMove.length; i++) {
      this.pages.splice(insertAt + i, 0, pagesToMove[i].page);
      newIndices.push(insertAt + i);
    }

    this._modified = true;
    if (notify) {
      this.notifyListeners();
    }
    return newIndices;
  }

  /**
   * Move a page up (decrease index)
   * @param notify - Whether to notify listeners (default: true)
   */
  movePageUp(index: number, notify = true): boolean {
    return this.movePage(index, index - 1, notify);
  }

  /**
   * Move a page down (increase index)
   * @param notify - Whether to notify listeners (default: true)
   */
  movePageDown(index: number, notify = true): boolean {
    return this.movePage(index, index + 1, notify);
  }

  /**
   * Rotate a page by 90 degrees clockwise
   */
  rotatePageRight(index: number): boolean {
    const page = this.pages[index];
    if (!page) return false;
    page.rotation = (page.rotation + 90) % 360;
    this._modified = true;
    this.notifyListeners();
    return true;
  }

  /**
   * Rotate a page by 90 degrees counter-clockwise
   */
  rotatePageLeft(index: number): boolean {
    const page = this.pages[index];
    if (!page) return false;
    page.rotation = (page.rotation - 90 + 360) % 360;
    this._modified = true;
    this.notifyListeners();
    return true;
  }

  /**
   * Insert a page reference at a specific index
   */
  insertPage(index: number, pageRef: PageReference): void {
    this.pages.splice(index, 0, pageRef);
    this._modified = true;
    this.notifyListeners();
  }

  /**
   * Clear all documents and pages
   */
  clear(): void {
    // Destroy all documents
    for (const { doc } of this.documents.values()) {
      doc.destroy();
    }
    this.documents.clear();
    this.pages = [];
    this._modified = false;
    this.notifyListeners();
  }

  /**
   * Subscribe to changes in the document manager
   */
  onChange(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  /**
   * Get all unique documents in the workspace
   */
  getDocuments(): Array<{ doc: PdfDocument; fileName: string }> {
    return Array.from(this.documents.values());
  }

  /**
   * Get the raw bytes of all source documents for merging
   */
  getSourceDocuments(): Map<PdfDocument, string> {
    const result = new Map<PdfDocument, string>();
    for (const { doc, fileName } of this.documents.values()) {
      result.set(doc, fileName);
    }
    return result;
  }
}
