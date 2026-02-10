/**
 * About dialog manager.
 */

class AboutDialogManager {
  private dialog: HTMLElement | null = null;
  private closeBtn: HTMLElement | null = null;

  init(): void {
    this.dialog = document.getElementById("about-dialog");
    this.closeBtn = document.getElementById("about-close-btn");

    if (this.closeBtn) {
      this.closeBtn.addEventListener("click", () => this.hide());
    }

    // Close on clicking outside the content
    this.dialog?.addEventListener("click", (e) => {
      if (e.target === this.dialog) {
        this.hide();
      }
    });

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isVisible()) {
        this.hide();
      }
    });
  }

  show(): void {
    this.dialog?.classList.add("visible");
  }

  hide(): void {
    this.dialog?.classList.remove("visible");
  }

  isVisible(): boolean {
    return this.dialog?.classList.contains("visible") ?? false;
  }
}

export const aboutDialog = new AboutDialogManager();
