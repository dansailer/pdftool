import { PdfMetadata } from "../manipulation/PdfMerger";
import { i18nManager } from "../utils/I18nManager";

/**
 * Options for showing the metadata dialog with pre-filled defaults.
 */
export interface MetadataDialogOptions {
  defaultTitle?: string;
  defaultSubject?: string;
  defaultKeywords?: string;
}

const STORAGE_KEY_AUTHOR = "pdf-tool-last-author";

/**
 * Metadata dialog manager for collecting PDF document properties before saving.
 */
class MetadataDialogManager {
  private dialog: HTMLElement | null = null;
  private form: HTMLFormElement | null = null;
  private titleInput: HTMLInputElement | null = null;
  private authorInput: HTMLInputElement | null = null;
  private subjectInput: HTMLInputElement | null = null;
  private keywordsInput: HTMLInputElement | null = null;
  private saveBtn: HTMLElement | null = null;
  private cancelBtn: HTMLElement | null = null;

  private resolvePromise: ((value: PdfMetadata | null) => void) | null = null;

  init(): void {
    this.dialog = document.getElementById("metadata-dialog");
    this.form = document.getElementById("metadata-form") as HTMLFormElement;
    this.titleInput = document.getElementById(
      "metadata-doc-title"
    ) as HTMLInputElement;
    this.authorInput = document.getElementById(
      "metadata-author"
    ) as HTMLInputElement;
    this.subjectInput = document.getElementById(
      "metadata-subject"
    ) as HTMLInputElement;
    this.keywordsInput = document.getElementById(
      "metadata-keywords"
    ) as HTMLInputElement;
    this.saveBtn = document.getElementById("metadata-save");
    this.cancelBtn = document.getElementById("metadata-cancel");

    // Save button handler
    this.saveBtn?.addEventListener("click", () => this.handleSave());

    // Cancel button handler
    this.cancelBtn?.addEventListener("click", () => this.handleCancel());

    // Close on clicking outside the content
    this.dialog?.addEventListener("click", (e) => {
      if (e.target === this.dialog) {
        this.handleCancel();
      }
    });

    // Handle keyboard events
    document.addEventListener("keydown", (e) => {
      if (!this.isVisible()) return;

      if (e.key === "Escape") {
        e.preventDefault();
        this.handleCancel();
      } else if (e.key === "Enter" && !e.shiftKey) {
        // Enter saves (unless in a textarea, which we don't have)
        e.preventDefault();
        this.handleSave();
      }
    });

    // Prevent form submission
    this.form?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSave();
    });
  }

  /**
   * Show the metadata dialog and return a promise that resolves with the metadata
   * or null if the user cancels.
   */
  show(options: MetadataDialogOptions = {}): Promise<PdfMetadata | null> {
    return new Promise((resolve) => {
      this.resolvePromise = resolve;

      // Pre-fill fields with defaults
      if (this.titleInput) {
        this.titleInput.value = options.defaultTitle || "";
      }

      if (this.authorInput) {
        // Load last used author from localStorage
        const lastAuthor = localStorage.getItem(STORAGE_KEY_AUTHOR) || "";
        this.authorInput.value = lastAuthor;
      }

      if (this.subjectInput) {
        this.subjectInput.value =
          options.defaultSubject || i18nManager.t("metadata.default_subject");
      }

      if (this.keywordsInput) {
        this.keywordsInput.value =
          options.defaultKeywords || i18nManager.t("metadata.default_keywords");
      }

      // Show the dialog
      this.dialog?.classList.add("visible");

      // Focus the title field
      this.titleInput?.focus();
      this.titleInput?.select();
    });
  }

  private handleSave(): void {
    const metadata: PdfMetadata = {
      title: this.titleInput?.value.trim() || undefined,
      author: this.authorInput?.value.trim() || undefined,
      subject: this.subjectInput?.value.trim() || undefined,
      keywords: this.keywordsInput?.value.trim() || undefined,
    };

    // Remember author for next time
    if (metadata.author) {
      localStorage.setItem(STORAGE_KEY_AUTHOR, metadata.author);
    }

    this.hide();
    this.resolvePromise?.(metadata);
    this.resolvePromise = null;
  }

  private handleCancel(): void {
    this.hide();
    this.resolvePromise?.(null);
    this.resolvePromise = null;
  }

  private hide(): void {
    this.dialog?.classList.remove("visible");
  }

  isVisible(): boolean {
    return this.dialog?.classList.contains("visible") ?? false;
  }

  /**
   * Update dialog text for i18n changes.
   */
  updateTranslations(): void {
    // The data-i18n attributes handle most translations automatically
    // But we need to update placeholder hints
    const keywordsHint = document.querySelector(
      "#metadata-form .form-hint"
    ) as HTMLElement;
    if (keywordsHint) {
      keywordsHint.textContent = i18nManager.t("metadata.keywords_hint");
    }
  }
}

export const metadataDialog = new MetadataDialogManager();
