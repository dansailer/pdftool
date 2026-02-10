import { DocumentManager } from "../core/DocumentManager";

const VIEWER_SCALE_STEP = 0.25;
const VIEWER_MIN_SCALE = 0.25;
const VIEWER_MAX_SCALE = 5.0;
const DEFAULT_SCALE = 1.5;
const PINCH_ZOOM_SENSITIVITY = 0.01;

export class MainViewer {
  private container: HTMLDivElement;
  private panel: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  
  // Zoom controls
  private zoomOutBtn: HTMLButtonElement;
  private zoomInBtn: HTMLButtonElement;
  private zoomFitBtn: HTMLButtonElement;
  private zoomLabel: HTMLSpanElement;
  
  // Page navigation
  private prevPageBtn: HTMLButtonElement;
  private nextPageBtn: HTMLButtonElement;
  private pageInfo: HTMLSpanElement;
  
  // Page manipulation
  private rotateLeftBtn: HTMLButtonElement;
  private rotateRightBtn: HTMLButtonElement;
  private moveUpBtn: HTMLButtonElement;
  private moveDownBtn: HTMLButtonElement;
  private deleteBtn: HTMLButtonElement;

  private docManager: DocumentManager | null = null;
  private currentPageIndex = 0;
  private scale = DEFAULT_SCALE;
  private rendering = false;
  private unsubscribe: (() => void) | null = null;
  private pendingUpdate: number | null = null; // Debounce timer

  // Pinch-to-zoom state
  private initialPinchDistance: number | null = null;
  private initialPinchScale: number | null = null;
  private pinchRenderPending = false;

  onPageChange: ((pageIndex: number) => void) | null = null;
  onPageDeleted: ((pageIndex: number) => void) | null = null;
  onPageRotated: ((pageIndex: number) => void) | null = null;
  onPageMoved: ((fromIndex: number, toIndex: number) => void) | null = null;
  
  // Request callbacks for undoable actions
  onRequestRotateLeft: ((pageIndex: number) => void) | null = null;
  onRequestRotateRight: ((pageIndex: number) => void) | null = null;
  onRequestDelete: ((pageIndex: number) => void) | null = null;
  onRequestMoveUp: (() => void) | null = null;
  onRequestMoveDown: (() => void) | null = null;

  constructor() {
    this.container = document.getElementById("viewer-container") as HTMLDivElement;
    this.panel = document.getElementById("viewer-panel") as HTMLDivElement;
    this.canvas = document.getElementById("viewer-canvas") as HTMLCanvasElement;
    
    // Zoom controls
    this.zoomOutBtn = document.getElementById("btn-zoom-out") as HTMLButtonElement;
    this.zoomInBtn = document.getElementById("btn-zoom-in") as HTMLButtonElement;
    this.zoomFitBtn = document.getElementById("btn-zoom-fit") as HTMLButtonElement;
    this.zoomLabel = document.getElementById("zoom-level") as HTMLSpanElement;
    
    // Page navigation
    this.prevPageBtn = document.getElementById("btn-prev-page") as HTMLButtonElement;
    this.nextPageBtn = document.getElementById("btn-next-page") as HTMLButtonElement;
    this.pageInfo = document.getElementById("page-info") as HTMLSpanElement;
    
    // Page manipulation
    this.rotateLeftBtn = document.getElementById("btn-rotate-left") as HTMLButtonElement;
    this.rotateRightBtn = document.getElementById("btn-rotate-right") as HTMLButtonElement;
    this.moveUpBtn = document.getElementById("btn-move-up") as HTMLButtonElement;
    this.moveDownBtn = document.getElementById("btn-move-down") as HTMLButtonElement;
    this.deleteBtn = document.getElementById("btn-delete") as HTMLButtonElement;

    this.setupControls();
    this.setupPinchZoom();
  }

  private setupControls(): void {
    // Zoom controls
    this.zoomOutBtn.addEventListener("click", () => this.zoomOut());
    this.zoomInBtn.addEventListener("click", () => this.zoomIn());
    this.zoomFitBtn.addEventListener("click", () => this.zoomFitWidth());
    
    // Page navigation
    this.prevPageBtn.addEventListener("click", () => this.goToPreviousPage());
    this.nextPageBtn.addEventListener("click", () => this.goToNextPage());
    
    // Page manipulation - use request callbacks for undoable actions
    this.rotateLeftBtn.addEventListener("click", () => {
      if (this.onRequestRotateLeft) {
        this.onRequestRotateLeft(this.currentPageIndex);
      } else {
        this.rotateCurrentPageLeft();
      }
    });
    this.rotateRightBtn.addEventListener("click", () => {
      if (this.onRequestRotateRight) {
        this.onRequestRotateRight(this.currentPageIndex);
      } else {
        this.rotateCurrentPageRight();
      }
    });
    this.moveUpBtn.addEventListener("click", () => {
      if (this.onRequestMoveUp) {
        this.onRequestMoveUp();
      } else {
        this.moveCurrentPageUp();
      }
    });
    this.moveDownBtn.addEventListener("click", () => {
      if (this.onRequestMoveDown) {
        this.onRequestMoveDown();
      } else {
        this.moveCurrentPageDown();
      }
    });
    this.deleteBtn.addEventListener("click", () => {
      if (this.onRequestDelete) {
        this.onRequestDelete(this.currentPageIndex);
      } else {
        this.deleteCurrentPage();
      }
    });
  }

  private setupPinchZoom(): void {
    // Handle wheel events with ctrl key (trackpad pinch on macOS)
    this.panel.addEventListener("wheel", (e) => this.handleWheelZoom(e), { passive: false });

    // Handle touch events for pinch-to-zoom on touch devices
    this.panel.addEventListener("touchstart", (e) => this.handleTouchStart(e), { passive: true });
    this.panel.addEventListener("touchmove", (e) => this.handleTouchMove(e), { passive: false });
    this.panel.addEventListener("touchend", () => this.handleTouchEnd(), { passive: true });
  }

  private handleWheelZoom(e: WheelEvent): void {
    // Check for pinch gesture (ctrl+wheel on trackpad) or meta key
    if (!e.ctrlKey && !e.metaKey) return;
    
    e.preventDefault();
    
    // deltaY is positive when pinching out (zoom out gesture), negative when pinching in
    // But we want pinch-out to zoom in (make things bigger), so we invert
    const delta = -e.deltaY * PINCH_ZOOM_SENSITIVITY;
    const newScale = Math.max(VIEWER_MIN_SCALE, Math.min(VIEWER_MAX_SCALE, this.scale + delta));
    
    if (newScale !== this.scale) {
      this.scale = newScale;
      this.updateZoomLabel();
      this.scheduleRender();
    }
  }

  private handleTouchStart(e: TouchEvent): void {
    if (e.touches.length === 2) {
      this.initialPinchDistance = this.getTouchDistance(e.touches);
      this.initialPinchScale = this.scale;
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    if (e.touches.length !== 2 || this.initialPinchDistance === null || this.initialPinchScale === null) {
      return;
    }

    e.preventDefault();

    const currentDistance = this.getTouchDistance(e.touches);
    const scaleFactor = currentDistance / this.initialPinchDistance;
    const newScale = Math.max(VIEWER_MIN_SCALE, Math.min(VIEWER_MAX_SCALE, this.initialPinchScale * scaleFactor));

    if (newScale !== this.scale) {
      this.scale = newScale;
      this.updateZoomLabel();
      this.scheduleRender();
    }
  }

  private handleTouchEnd(): void {
    this.initialPinchDistance = null;
    this.initialPinchScale = null;
  }

  private getTouchDistance(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private scheduleRender(): void {
    if (this.pinchRenderPending) return;
    this.pinchRenderPending = true;
    requestAnimationFrame(() => {
      this.pinchRenderPending = false;
      this.renderCurrentPage();
    });
  }

  private enableControls(): void {
    this.zoomOutBtn.disabled = false;
    this.zoomInBtn.disabled = false;
    this.zoomFitBtn.disabled = false;
    this.rotateLeftBtn.disabled = false;
    this.rotateRightBtn.disabled = false;
    this.deleteBtn.disabled = false;
    this.updateNavigationButtons();
    this.updateMoveButtons();
  }

  private disableControls(): void {
    this.zoomOutBtn.disabled = true;
    this.zoomInBtn.disabled = true;
    this.zoomFitBtn.disabled = true;
    this.prevPageBtn.disabled = true;
    this.nextPageBtn.disabled = true;
    this.rotateLeftBtn.disabled = true;
    this.rotateRightBtn.disabled = true;
    this.moveUpBtn.disabled = true;
    this.moveDownBtn.disabled = true;
    this.deleteBtn.disabled = true;
  }

  private updateNavigationButtons(): void {
    if (!this.docManager || this.docManager.isEmpty) {
      this.prevPageBtn.disabled = true;
      this.nextPageBtn.disabled = true;
      return;
    }
    this.prevPageBtn.disabled = this.currentPageIndex <= 0;
    this.nextPageBtn.disabled = this.currentPageIndex >= this.docManager.pageCount - 1;
  }

  private updateMoveButtons(): void {
    if (!this.docManager || this.docManager.isEmpty) {
      this.moveUpBtn.disabled = true;
      this.moveDownBtn.disabled = true;
      return;
    }
    this.moveUpBtn.disabled = this.currentPageIndex <= 0;
    this.moveDownBtn.disabled = this.currentPageIndex >= this.docManager.pageCount - 1;
  }

  private updateZoomLabel(): void {
    this.zoomLabel.textContent = `${Math.round(this.scale * 100)}%`;
  }

  private updatePageInfo(): void {
    if (!this.docManager || this.docManager.isEmpty) {
      this.pageInfo.textContent = "";
      return;
    }
    const current = this.currentPageIndex + 1;
    const total = this.docManager.pageCount;
    this.pageInfo.textContent = `${current} / ${total}`;
    this.updateNavigationButtons();
    this.updateMoveButtons();
  }

  setDocumentManager(docManager: DocumentManager): void {
    // Unsubscribe from previous manager
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    this.docManager = docManager;
    this.currentPageIndex = 0;

    // Subscribe to changes - use debounced update to prevent rapid re-renders
    this.unsubscribe = docManager.onChange(() => {
      this.scheduleUpdate();
    });

    this.onDocumentChange();
  }

  /**
   * Schedule an update with debouncing to coalesce rapid changes
   */
  private scheduleUpdate(): void {
    if (this.pendingUpdate !== null) {
      cancelAnimationFrame(this.pendingUpdate);
    }
    this.pendingUpdate = requestAnimationFrame(() => {
      this.pendingUpdate = null;
      this.onDocumentChange();
    });
  }

  private onDocumentChange(): void {
    if (!this.docManager || this.docManager.isEmpty) {
      this.hideViewer();
      this.disableControls();
      return;
    }

    // Adjust current page if needed
    if (this.currentPageIndex >= this.docManager.pageCount) {
      this.currentPageIndex = Math.max(0, this.docManager.pageCount - 1);
    }

    this.enableControls();
    this.showViewer();
    this.renderCurrentPage();
  }

  private showViewer(): void {
    const dropZone = document.getElementById("drop-zone") as HTMLDivElement;
    dropZone.classList.remove("visible");
    this.container.classList.add("visible");
  }

  private hideViewer(): void {
    const dropZone = document.getElementById("drop-zone") as HTMLDivElement;
    dropZone.classList.add("visible");
    this.container.classList.remove("visible");
    this.canvas.width = 0;
    this.canvas.height = 0;
    this.updatePageInfo();
  }

  async goToPage(pageIndex: number): Promise<void> {
    if (!this.docManager) return;
    if (pageIndex < 0 || pageIndex >= this.docManager.pageCount) return;
    this.currentPageIndex = pageIndex;
    await this.renderCurrentPage();
    this.onPageChange?.(pageIndex);
  }

  getCurrentPageIndex(): number {
    return this.currentPageIndex;
  }

  /**
   * Set the current page index and update UI.
   * Use this when page moves are handled externally (e.g., with undo/redo).
   */
  setCurrentPageIndex(index: number): void {
    if (!this.docManager) return;
    if (index < 0 || index >= this.docManager.pageCount) return;
    this.currentPageIndex = index;
    this.updatePageInfo();
    this.updateMoveButtons();
  }

  getPageCount(): number {
    return this.docManager?.pageCount ?? 0;
  }

  private async renderCurrentPage(): Promise<void> {
    if (!this.docManager || this.rendering) return;
    
    const pageRef = this.docManager.getPage(this.currentPageIndex);
    if (!pageRef) return;

    this.rendering = true;

    try {
      await pageRef.document.renderPage(this.canvas, pageRef.sourcePageNumber, {
        scale: this.scale,
        rotation: pageRef.rotation,
      });
      this.updatePageInfo();
      this.updateZoomLabel();
    } finally {
      this.rendering = false;
    }
  }

  /**
   * Re-render the current page (e.g., after rotation)
   */
  async refresh(): Promise<void> {
    await this.renderCurrentPage();
  }

  async zoomIn(): Promise<void> {
    if (this.scale >= VIEWER_MAX_SCALE) return;
    this.scale = Math.min(this.scale + VIEWER_SCALE_STEP, VIEWER_MAX_SCALE);
    await this.renderCurrentPage();
  }

  async zoomOut(): Promise<void> {
    if (this.scale <= VIEWER_MIN_SCALE) return;
    this.scale = Math.max(this.scale - VIEWER_SCALE_STEP, VIEWER_MIN_SCALE);
    await this.renderCurrentPage();
  }

  async zoomFitWidth(): Promise<void> {
    if (!this.docManager) return;
    
    const pageRef = this.docManager.getPage(this.currentPageIndex);
    if (!pageRef) return;

    const page = await pageRef.document.getPage(pageRef.sourcePageNumber);
    const viewport = page.getViewport({ scale: 1, rotation: pageRef.rotation });
    const panelWidth = document.getElementById("viewer-panel")!.clientWidth - 32;
    this.scale = panelWidth / viewport.width;
    await this.renderCurrentPage();
  }

  // Page navigation
  async goToPreviousPage(): Promise<void> {
    if (this.currentPageIndex > 0) {
      await this.goToPage(this.currentPageIndex - 1);
    }
  }

  async goToNextPage(): Promise<void> {
    if (!this.docManager) return;
    if (this.currentPageIndex < this.docManager.pageCount - 1) {
      await this.goToPage(this.currentPageIndex + 1);
    }
  }

  // Page manipulation
  rotateCurrentPageLeft(): void {
    if (!this.docManager) return;
    if (this.docManager.rotatePageLeft(this.currentPageIndex)) {
      this.onPageRotated?.(this.currentPageIndex);
    }
  }

  rotateCurrentPageRight(): void {
    if (!this.docManager) return;
    if (this.docManager.rotatePageRight(this.currentPageIndex)) {
      this.onPageRotated?.(this.currentPageIndex);
    }
  }

  deleteCurrentPage(): void {
    if (!this.docManager) return;
    const deletedIndex = this.currentPageIndex;
    const deleted = this.docManager.deletePage(this.currentPageIndex);
    if (deleted) {
      // Adjust current page index if needed
      if (this.currentPageIndex >= this.docManager.pageCount && this.docManager.pageCount > 0) {
        this.currentPageIndex = this.docManager.pageCount - 1;
      }
      this.onPageDeleted?.(deletedIndex);
    }
  }

  /**
   * Move current page up (towards start of document)
   */
  moveCurrentPageUp(): boolean {
    if (!this.docManager) return false;
    const fromIndex = this.currentPageIndex;
    // Move without notifying listeners (thumbnail will handle DOM reorder)
    if (this.docManager.movePageUp(fromIndex, false)) {
      this.currentPageIndex = fromIndex - 1;
      this.updateMoveButtons();
      this.updatePageInfo();
      this.onPageMoved?.(fromIndex, this.currentPageIndex);
      return true;
    }
    return false;
  }

  /**
   * Move current page down (towards end of document)
   */
  moveCurrentPageDown(): boolean {
    if (!this.docManager) return false;
    const fromIndex = this.currentPageIndex;
    // Move without notifying listeners (thumbnail will handle DOM reorder)
    if (this.docManager.movePageDown(fromIndex, false)) {
      this.currentPageIndex = fromIndex + 1;
      this.updateMoveButtons();
      this.updatePageInfo();
      this.onPageMoved?.(fromIndex, this.currentPageIndex);
      return true;
    }
    return false;
  }

  destroy(): void {
    if (this.pendingUpdate !== null) {
      cancelAnimationFrame(this.pendingUpdate);
      this.pendingUpdate = null;
    }
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}
