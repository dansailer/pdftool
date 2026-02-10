import { DocumentManager } from "../core/DocumentManager";
import { PageReference } from "../core/PageReference";

const THUMBNAIL_SCALE = 0.4;

export class ThumbnailRenderer {
  private listEl: HTMLDivElement;
  private panelEl: HTMLDivElement;
  private docManager: DocumentManager | null = null;
  private selectedIndices: Set<number> = new Set([0]);
  private lastClickedIndex = 0; // For shift+click range selection
  private primaryIndex = 0; // The "active" page shown in main viewer
  private unsubscribe: (() => void) | null = null;
  private renderGeneration = 0; // Used to cancel stale renders
  private pendingRender: number | null = null; // Debounce timer

  // Lazy loading state
  private intersectionObserver: IntersectionObserver | null = null;
  private renderedThumbnails: Set<string> = new Set(); // Track rendered pageIds
  private renderQueue: Map<string, { element: HTMLDivElement; pageRef: PageReference }> = new Map();

  // Drag-and-drop state
  private draggedIndices: number[] = [];
  private dropIndicator: HTMLDivElement | null = null;
  private dropTargetIndex: number | null = null;

  onPageSelected: ((pageIndex: number) => void) | null = null;
  onPageMoved: ((fromIndex: number, toIndex: number) => void) | null = null;
  onPagesMoved: ((fromIndices: number[], toIndex: number) => number[]) | null = null;

  // Request callbacks for undoable actions (drag-drop)
  onRequestMovePage: ((fromIndex: number, toIndex: number) => void) | null = null;
  onRequestMovePages: ((fromIndices: number[], toIndex: number) => void) | null = null;

  constructor() {
    this.listEl = document.getElementById("thumbnail-list") as HTMLDivElement;
    this.panelEl = document.getElementById("thumbnail-panel") as HTMLDivElement;
    
    // Use event delegation for click handling
    this.listEl.addEventListener("click", (e) => this.handleClick(e));

    // Setup drag-and-drop event listeners
    this.setupDragAndDrop();

    // Setup IntersectionObserver for lazy thumbnail rendering
    this.setupIntersectionObserver();
  }

  private setupIntersectionObserver(): void {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const item = entry.target as HTMLDivElement;
            const pageId = item.dataset.pageId;
            if (pageId && !this.renderedThumbnails.has(pageId)) {
              const queuedItem = this.renderQueue.get(pageId);
              if (queuedItem) {
                this.renderedThumbnails.add(pageId);
                this.renderThumbnail(queuedItem.element, queuedItem.pageRef);
              }
            }
          }
        }
      },
      {
        root: this.panelEl,
        rootMargin: "100px 0px", // Preload thumbnails 100px before they're visible
        threshold: 0,
      }
    );
  }

  private setupDragAndDrop(): void {
    // Create drop indicator element
    this.dropIndicator = document.createElement("div");
    this.dropIndicator.className = "thumbnail-drop-indicator";

    // Drag events on individual items (using delegation)
    this.listEl.addEventListener("dragstart", (e) => this.handleDragStart(e));
    this.listEl.addEventListener("dragend", (e) => this.handleDragEnd(e));

    // Drop target events on the list container
    this.listEl.addEventListener("dragover", (e) => this.handleDragOver(e));
    this.listEl.addEventListener("dragleave", (e) => this.handleDragLeave(e));
    this.listEl.addEventListener("drop", (e) => this.handleDrop(e));
  }

  private handleDragStart(e: DragEvent): void {
    const target = e.target as HTMLElement;
    const item = target.closest(".thumbnail-item") as HTMLElement | null;
    if (!item || !e.dataTransfer) return;

    const indexStr = item.dataset.pageIndex;
    if (indexStr === undefined) return;

    const index = parseInt(indexStr, 10);
    if (isNaN(index)) return;

    // If dragging a non-selected item, select only that item
    if (!this.selectedIndices.has(index)) {
      this.selectedIndices.clear();
      this.selectedIndices.add(index);
      this.primaryIndex = index;
      this.lastClickedIndex = index;
      this.updateSelectionVisuals();
    }

    // Store all selected indices for the drag
    this.draggedIndices = Array.from(this.selectedIndices).sort((a, b) => a - b);
    
    // Set drag data
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", this.draggedIndices.join(","));

    // Add dragging class to all selected items
    requestAnimationFrame(() => {
      const items = this.listEl.querySelectorAll(".thumbnail-item");
      this.draggedIndices.forEach((idx) => {
        items[idx]?.classList.add("dragging");
      });
    });
  }

  private handleDragEnd(_e: DragEvent): void {
    // Remove dragging class from all items
    const items = this.listEl.querySelectorAll(".thumbnail-item");
    items.forEach((el) => el.classList.remove("dragging"));

    // Remove drop indicator
    this.dropIndicator?.remove();
    this.draggedIndices = [];
    this.dropTargetIndex = null;
  }

  private handleDragOver(e: DragEvent): void {
    if (this.draggedIndices.length === 0) return;
    
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }

    // Find which item we're over and calculate drop position
    const items = Array.from(this.listEl.querySelectorAll(".thumbnail-item")) as HTMLElement[];
    if (items.length === 0) return;

    const mouseY = e.clientY;
    let insertBeforeIndex: number | null = null;

    for (let i = 0; i < items.length; i++) {
      const rect = items[i].getBoundingClientRect();
      const midY = rect.top + rect.height / 2;

      if (mouseY < midY) {
        insertBeforeIndex = i;
        break;
      }
    }

    // If past all items, insert at end
    if (insertBeforeIndex === null) {
      insertBeforeIndex = items.length;
    }

    // Don't show indicator if dropping within the selection range (no-op)
    const minDragged = Math.min(...this.draggedIndices);
    const maxDragged = Math.max(...this.draggedIndices);
    const isWithinRange = insertBeforeIndex >= minDragged && insertBeforeIndex <= maxDragged + 1;
    
    // Check if all dragged items are contiguous and we're dropping in place
    const isContiguous = this.draggedIndices.length === maxDragged - minDragged + 1;
    const isNoOp = isContiguous && isWithinRange;
    
    if (isNoOp) {
      this.dropIndicator?.remove();
      this.dropTargetIndex = null;
      return;
    }

    this.dropTargetIndex = insertBeforeIndex;

    // Position the drop indicator
    if (this.dropIndicator) {
      if (insertBeforeIndex < items.length) {
        // Insert before this item
        items[insertBeforeIndex].before(this.dropIndicator);
      } else {
        // Append at end
        this.listEl.appendChild(this.dropIndicator);
      }
    }
  }

  private handleDragLeave(e: DragEvent): void {
    // Only remove indicator if leaving the list entirely
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (relatedTarget && this.listEl.contains(relatedTarget)) {
      return;
    }
    
    this.dropIndicator?.remove();
    this.dropTargetIndex = null;
  }

  private handleDrop(e: DragEvent): void {
    e.preventDefault();
    
    if (this.draggedIndices.length === 0 || this.dropTargetIndex === null || !this.docManager) {
      this.handleDragEnd(e);
      return;
    }

    const fromIndices = [...this.draggedIndices];
    const toIndex = this.dropTargetIndex;

    // Clean up drag state first (removes indicator, dragging classes)
    this.handleDragEnd(e);

    // If request callbacks are set, use them (enables undo/redo)
    if (fromIndices.length === 1) {
      // Single page move
      let adjustedTo = toIndex;
      if (toIndex > fromIndices[0]) {
        adjustedTo--;
      }
      if (fromIndices[0] !== adjustedTo && adjustedTo >= 0 && adjustedTo < this.docManager.pageCount) {
        if (this.onRequestMovePage) {
          // Use undoable callback
          this.onRequestMovePage(fromIndices[0], adjustedTo);
        } else {
          // Direct move (legacy, no undo)
          this.docManager.movePage(fromIndices[0], adjustedTo, false);
          this.reorderDOMElement(fromIndices[0], adjustedTo);
          this.selectedIndices.clear();
          this.selectedIndices.add(adjustedTo);
          this.primaryIndex = adjustedTo;
          this.lastClickedIndex = adjustedTo;
          this.updateSelectionVisuals();
          this.onPageSelected?.(adjustedTo);
        }
      }
    } else {
      // Multi-page move
      if (this.onRequestMovePages) {
        // Use undoable callback
        this.onRequestMovePages(fromIndices, toIndex);
      } else {
        // Direct move (legacy, no undo)
        const newIndices = this.docManager.movePages(fromIndices, toIndex, false);
        if (newIndices.length > 0) {
          this.reorderDOMElements(fromIndices, toIndex);
          this.selectedIndices = new Set(newIndices);
          this.primaryIndex = newIndices[0];
          this.lastClickedIndex = newIndices[0];
          this.updateSelectionVisuals();
          this.onPageSelected?.(newIndices[0]);
        }
      }
    }
  }

  /**
   * Reorder a single DOM element from one position to another
   */
  private reorderDOMElement(fromIndex: number, toIndex: number): void {
    const items = Array.from(this.listEl.querySelectorAll(".thumbnail-item")) as HTMLElement[];
    if (fromIndex < 0 || fromIndex >= items.length) return;
    
    const element = items[fromIndex];
    
    // Remove from current position
    element.remove();
    
    // Insert at new position
    const remainingItems = Array.from(this.listEl.querySelectorAll(".thumbnail-item")) as HTMLElement[];
    if (toIndex >= remainingItems.length) {
      this.listEl.appendChild(element);
    } else {
      remainingItems[toIndex].before(element);
    }
    
    // Update all page indices and labels
    this.updatePageIndices();
  }

  /**
   * Reorder multiple DOM elements
   */
  private reorderDOMElements(fromIndices: number[], targetIndex: number): void {
    const sortedFromIndices = [...fromIndices].sort((a, b) => a - b);
    const items = Array.from(this.listEl.querySelectorAll(".thumbnail-item")) as HTMLElement[];
    
    // Collect elements to move (in order)
    const elementsToMove: HTMLElement[] = [];
    for (const idx of sortedFromIndices) {
      if (idx >= 0 && idx < items.length) {
        elementsToMove.push(items[idx]);
      }
    }
    
    // Remove all elements to move
    for (const el of elementsToMove) {
      el.remove();
    }
    
    // Calculate adjusted insertion point
    let insertAt = targetIndex;
    for (const idx of sortedFromIndices) {
      if (idx < targetIndex) {
        insertAt--;
      }
    }
    
    // Get remaining items after removal
    const remainingItems = Array.from(this.listEl.querySelectorAll(".thumbnail-item")) as HTMLElement[];
    
    // Insert at new position
    if (insertAt >= remainingItems.length) {
      // Append at end
      for (const el of elementsToMove) {
        this.listEl.appendChild(el);
      }
    } else {
      // Insert before the item at insertAt
      const insertBefore = remainingItems[insertAt];
      for (const el of elementsToMove) {
        insertBefore.before(el);
      }
    }
    
    // Update all page indices and labels
    this.updatePageIndices();
  }

  /**
   * Update all page indices and labels after reordering
   */
  private updatePageIndices(): void {
    const items = this.listEl.querySelectorAll(".thumbnail-item");
    items.forEach((item, index) => {
      const el = item as HTMLElement;
      el.dataset.pageIndex = String(index);
      const label = el.querySelector(".thumbnail-page-number");
      if (label) {
        label.textContent = String(index + 1);
      }
    });
  }

  private handleClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    const item = target.closest(".thumbnail-item") as HTMLElement | null;
    if (!item) return;

    const indexStr = item.dataset.pageIndex;
    if (indexStr === undefined) return;

    const index = parseInt(indexStr, 10);
    if (isNaN(index)) return;

    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const isToggleModifier = isMac ? e.metaKey : e.ctrlKey;
    const isRangeModifier = e.shiftKey;

    if (isRangeModifier && this.docManager) {
      // Shift+click: range selection from last clicked to current
      const start = Math.min(this.lastClickedIndex, index);
      const end = Math.max(this.lastClickedIndex, index);
      
      if (!isToggleModifier) {
        // Replace selection with range
        this.selectedIndices.clear();
      }
      
      for (let i = start; i <= end; i++) {
        this.selectedIndices.add(i);
      }
      this.primaryIndex = index;
    } else if (isToggleModifier) {
      // Cmd/Ctrl+click: toggle selection
      if (this.selectedIndices.has(index)) {
        // Don't allow deselecting the last item
        if (this.selectedIndices.size > 1) {
          this.selectedIndices.delete(index);
          // Update primary to first remaining selected
          if (this.primaryIndex === index) {
            this.primaryIndex = Math.min(...this.selectedIndices);
          }
        }
      } else {
        this.selectedIndices.add(index);
        this.primaryIndex = index;
      }
      this.lastClickedIndex = index;
    } else {
      // Normal click: select only this item
      this.selectedIndices.clear();
      this.selectedIndices.add(index);
      this.primaryIndex = index;
      this.lastClickedIndex = index;
    }

    this.updateSelectionVisuals();
    this.onPageSelected?.(this.primaryIndex);
  }

  private updateSelectionVisuals(): void {
    const items = this.listEl.querySelectorAll(".thumbnail-item");
    items.forEach((el, i) => {
      el.classList.toggle("selected", this.selectedIndices.has(i));
    });

    // Scroll the primary selection into view
    const primaryItem = items[this.primaryIndex] as HTMLElement | undefined;
    if (primaryItem) {
      requestAnimationFrame(() => {
        primaryItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
      });
    }
  }

  setDocumentManager(docManager: DocumentManager): void {
    // Unsubscribe from previous manager
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    this.docManager = docManager;
    this.selectedIndices = new Set([0]);
    this.primaryIndex = 0;
    this.lastClickedIndex = 0;
    this.panelEl.classList.add("visible");

    // Subscribe to changes - use debounced render to prevent rapid re-renders
    this.unsubscribe = docManager.onChange(() => {
      this.scheduleRender();
    });

    this.renderAllThumbnails();
  }

  /**
   * Schedule a render with debouncing to coalesce rapid changes
   */
  private scheduleRender(): void {
    if (this.pendingRender !== null) {
      cancelAnimationFrame(this.pendingRender);
    }
    this.pendingRender = requestAnimationFrame(() => {
      this.pendingRender = null;
      this.renderAllThumbnails();
    });
  }

  private async renderAllThumbnails(): Promise<void> {
    if (!this.docManager) return;

    // Increment generation to invalidate any in-progress renders
    ++this.renderGeneration;

    const pages = this.docManager.getPages();
    
    console.log(`[ThumbnailRenderer] renderAllThumbnails called, pages=${pages.length}`);
    
    // Clear existing thumbnails and reset lazy loading state
    this.listEl.innerHTML = "";
    this.renderQueue.clear();
    this.renderedThumbnails.clear();

    if (pages.length === 0) {
      this.panelEl.classList.remove("visible");
      return;
    }

    this.panelEl.classList.add("visible");

    // Create all thumbnail items first (synchronously) and observe them for lazy loading
    for (let i = 0; i < pages.length; i++) {
      const pageRef = pages[i];
      const item = this.createThumbnailItem(i, pageRef);
      this.listEl.appendChild(item);
      
      // Add to render queue and observe for visibility
      this.renderQueue.set(pageRef.id, { element: item, pageRef });
      this.intersectionObserver?.observe(item);
    }

    console.log(`[ThumbnailRenderer] Created ${pages.length} thumbnail items (lazy loading enabled)`);

    // Adjust selection if needed (remove invalid indices, ensure at least one selected)
    const validIndices = new Set<number>();
    for (const idx of this.selectedIndices) {
      if (idx >= 0 && idx < pages.length) {
        validIndices.add(idx);
      }
    }
    if (validIndices.size === 0) {
      validIndices.add(Math.max(0, Math.min(this.primaryIndex, pages.length - 1)));
    }
    this.selectedIndices = validIndices;
    
    // Ensure primary index is valid and in selection
    if (this.primaryIndex >= pages.length) {
      this.primaryIndex = Math.max(0, pages.length - 1);
    }
    if (!this.selectedIndices.has(this.primaryIndex)) {
      this.primaryIndex = Math.min(...this.selectedIndices);
    }
    
    // Update visuals after DOM is created
    this.updateSelectionVisuals();
  }

  private createThumbnailItem(index: number, pageRef: PageReference): HTMLDivElement {
    const item = document.createElement("div");
    item.className = "thumbnail-item";
    item.dataset.pageIndex = String(index);
    item.dataset.pageId = pageRef.id;
    item.draggable = true; // Enable drag-and-drop

    const canvas = document.createElement("canvas");
    // Set placeholder size for layout (typical A4 aspect ratio ~0.707)
    // This ensures proper scrolling/layout before actual render
    canvas.width = 100;
    canvas.height = 141;
    canvas.style.width = "100px";
    canvas.style.height = "141px";
    canvas.style.background = "var(--bg-tertiary)";
    item.appendChild(canvas);

    const label = document.createElement("span");
    label.className = "thumbnail-page-number";
    label.textContent = String(index + 1);
    item.appendChild(label);

    // No individual click listener - using event delegation

    return item;
  }

  private async renderThumbnail(
    item: HTMLDivElement,
    pageRef: PageReference
  ): Promise<void> {
    const canvas = item.querySelector("canvas") as HTMLCanvasElement;
    if (!canvas) {
      console.error(`[ThumbnailRenderer] No canvas found in item`);
      return;
    }
    try {
      await pageRef.document.renderPage(canvas, pageRef.sourcePageNumber, {
        scale: THUMBNAIL_SCALE,
        rotation: pageRef.rotation,
      });
      // Clear placeholder styling after successful render
      canvas.style.width = "";
      canvas.style.height = "";
      canvas.style.background = "";
    } catch (err) {
      console.error(`[ThumbnailRenderer] Error rendering page ${pageRef.sourcePageNumber}:`, err);
    }
  }

  /**
   * Select a single thumbnail (clears multi-selection)
   */
  selectThumbnail(index: number): void {
    this.selectedIndices.clear();
    this.selectedIndices.add(index);
    this.primaryIndex = index;
    this.lastClickedIndex = index;
    this.updateSelectionVisuals();
  }

  /**
   * Get the primary selected index (the "active" page)
   */
  getSelectedIndex(): number {
    return this.primaryIndex;
  }

  /**
   * Get all selected indices
   */
  getSelectedIndices(): number[] {
    return Array.from(this.selectedIndices).sort((a, b) => a - b);
  }

  /**
   * Set the selected index without updating DOM.
   * Useful when a re-render will follow immediately.
   */
  setSelectedIndex(index: number): void {
    this.selectedIndices.clear();
    this.selectedIndices.add(index);
    this.primaryIndex = index;
    this.lastClickedIndex = index;
  }

  /**
   * Set multiple selected indices without updating DOM.
   */
  setSelectedIndices(indices: number[]): void {
    this.selectedIndices = new Set(indices);
    if (indices.length > 0) {
      this.primaryIndex = indices[0];
      this.lastClickedIndex = indices[0];
    }
  }

  /**
   * Refresh a single thumbnail (e.g., after rotation)
   */
  async refreshThumbnail(index: number): Promise<void> {
    if (!this.docManager) return;
    
    const pageRef = this.docManager.getPage(index);
    if (!pageRef) return;

    const items = this.listEl.querySelectorAll(".thumbnail-item");
    const item = items[index] as HTMLDivElement | undefined;
    if (item) {
      // Mark as needing re-render (for rotated pages)
      this.renderedThumbnails.delete(pageRef.id);
      await this.renderThumbnail(item, pageRef);
      this.renderedThumbnails.add(pageRef.id);
    }
  }

  /**
   * Handle a page move initiated externally (e.g., keyboard shortcut).
   * This reorders the DOM without re-rendering thumbnails.
   */
  handleExternalPageMove(fromIndex: number, toIndex: number): void {
    this.reorderDOMElement(fromIndex, toIndex);
    this.selectedIndices.clear();
    this.selectedIndices.add(toIndex);
    this.primaryIndex = toIndex;
    this.lastClickedIndex = toIndex;
    this.updateSelectionVisuals();
  }

  /**
   * Handle multiple page moves initiated externally (e.g., drag-drop undo/redo).
   * This reorders the DOM without re-rendering thumbnails.
   */
  handleExternalPagesMove(fromIndices: number[], toIndex: number, newIndices: number[]): void {
    this.reorderDOMElements(fromIndices, toIndex);
    this.selectedIndices = new Set(newIndices);
    if (newIndices.length > 0) {
      this.primaryIndex = newIndices[0];
      this.lastClickedIndex = newIndices[0];
    }
    this.updateSelectionVisuals();
  }

  destroy(): void {
    if (this.pendingRender !== null) {
      cancelAnimationFrame(this.pendingRender);
      this.pendingRender = null;
    }
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.renderQueue.clear();
    this.renderedThumbnails.clear();
  }
}
