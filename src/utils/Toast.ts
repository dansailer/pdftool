/**
 * Toast notification system for user feedback.
 */

export type ToastType = "error" | "success" | "warning" | "info";

interface ToastOptions {
  title: string;
  message?: string;
  type?: ToastType;
  duration?: number; // ms, 0 = manual dismiss only
}

const ICONS: Record<ToastType, string> = {
  error: "⚠️",
  success: "✓",
  warning: "⚠",
  info: "ℹ️",
};

class ToastManager {
  private container: HTMLElement | null = null;

  private getContainer(): HTMLElement {
    if (!this.container) {
      this.container = document.getElementById("toast-container");
      if (!this.container) {
        // Create container if it doesn't exist
        this.container = document.createElement("div");
        this.container.id = "toast-container";
        document.body.appendChild(this.container);
      }
    }
    return this.container;
  }

  show(options: ToastOptions): void {
    const { title, message, type = "info", duration = 5000 } = options;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    const icon = document.createElement("span");
    icon.className = "toast-icon";
    icon.textContent = ICONS[type];

    const content = document.createElement("div");
    content.className = "toast-content";

    const titleEl = document.createElement("div");
    titleEl.className = "toast-title";
    titleEl.textContent = title;
    content.appendChild(titleEl);

    if (message) {
      const messageEl = document.createElement("div");
      messageEl.className = "toast-message";
      messageEl.textContent = message;
      content.appendChild(messageEl);
    }

    const closeBtn = document.createElement("button");
    closeBtn.className = "toast-close";
    closeBtn.textContent = "×";
    closeBtn.onclick = () => this.dismiss(toast);

    toast.appendChild(icon);
    toast.appendChild(content);
    toast.appendChild(closeBtn);

    this.getContainer().appendChild(toast);

    if (duration > 0) {
      setTimeout(() => this.dismiss(toast), duration);
    }
  }

  private dismiss(toast: HTMLElement): void {
    if (!toast.parentElement) return;

    toast.classList.add("toast-out");
    toast.addEventListener("animationend", () => {
      toast.remove();
    });
  }

  error(title: string, message?: string): void {
    this.show({ title, message, type: "error", duration: 8000 });
  }

  success(title: string, message?: string): void {
    this.show({ title, message, type: "success" });
  }

  warning(title: string, message?: string): void {
    this.show({ title, message, type: "warning" });
  }

  info(title: string, message?: string): void {
    this.show({ title, message, type: "info" });
  }
}

export const toast = new ToastManager();
