/**
 * Loading overlay manager for async operations.
 */

class LoadingManager {
  private overlay: HTMLElement | null = null;
  private textEl: HTMLElement | null = null;
  private activeCount = 0;

  private getOverlay(): HTMLElement {
    if (!this.overlay) {
      this.overlay = document.getElementById("loading-overlay");
    }
    return this.overlay!;
  }

  private getTextEl(): HTMLElement | null {
    if (!this.textEl) {
      this.textEl = this.getOverlay()?.querySelector(".loading-text") ?? null;
    }
    return this.textEl;
  }

  show(text?: string): void {
    this.activeCount++;
    const overlay = this.getOverlay();
    if (overlay) {
      overlay.classList.add("visible");
      if (text) {
        const textEl = this.getTextEl();
        if (textEl) {
          textEl.textContent = text;
        }
      }
    }
  }

  hide(): void {
    this.activeCount = Math.max(0, this.activeCount - 1);
    if (this.activeCount === 0) {
      const overlay = this.getOverlay();
      if (overlay) {
        overlay.classList.remove("visible");
      }
    }
  }

  /**
   * Execute an async function while showing the loading overlay.
   */
  async wrap<T>(fn: () => Promise<T>, text?: string): Promise<T> {
    this.show(text);
    try {
      return await fn();
    } finally {
      this.hide();
    }
  }
}

export const loading = new LoadingManager();
