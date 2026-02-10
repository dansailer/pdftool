import I18n from "@razein97/tauri-plugin-i18n";

export type Locale = "en" | "de";

const STORAGE_KEY = "pdftool-locale";
const DEFAULT_LOCALE: Locale = "en";

export class I18nManager {
  private static instance: I18nManager;
  private currentLocale: Locale = DEFAULT_LOCALE;
  private i18n: I18n | null = null;
  private listeners: Array<(locale: Locale) => void> = [];
  private initialized = false;

  private constructor() {}

  static getInstance(): I18nManager {
    if (!I18nManager.instance) {
      I18nManager.instance = new I18nManager();
    }
    return I18nManager.instance;
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    // Load saved locale or detect system locale
    this.currentLocale = this.loadLocale();

    // Get the I18n singleton and load translations
    this.i18n = I18n.getInstance();
    await this.i18n.load();

    // Set the initial locale
    await I18n.setLocale(this.currentLocale);

    this.initialized = true;
  }

  private loadLocale(): Locale {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "de") {
      return stored;
    }
    // Try to detect system locale
    const systemLocale = navigator.language.toLowerCase();
    if (systemLocale.startsWith("de")) {
      return "de";
    }
    return DEFAULT_LOCALE;
  }

  private saveLocale(locale: Locale): void {
    localStorage.setItem(STORAGE_KEY, locale);
  }

  getLocale(): Locale {
    return this.currentLocale;
  }

  async setLocale(locale: Locale): Promise<void> {
    if (locale === this.currentLocale) return;

    this.currentLocale = locale;
    this.saveLocale(locale);
    await I18n.setLocale(locale);

    // Update all elements with data-i18n attribute
    this.updateDOMTranslations();

    this.notifyListeners();
  }

  translate(key: string): string {
    if (!this.i18n) {
      console.warn("I18nManager not initialized, returning key:", key);
      return key;
    }
    return this.i18n.translate(key) ?? key;
  }

  t(key: string): string {
    return this.translate(key);
  }

  async getAvailableLocales(): Promise<string[]> {
    return await I18n.getAvailableLocales();
  }

  /**
   * Updates all DOM elements with data-i18n attribute
   */
  updateDOMTranslations(): void {
    const elements = document.querySelectorAll("[data-i18n]");
    elements.forEach((element) => {
      const key = element.getAttribute("data-i18n");
      if (key) {
        element.textContent = this.translate(key);
      }
    });

    // Also update elements with data-i18n-title for title attributes
    const titleElements = document.querySelectorAll("[data-i18n-title]");
    titleElements.forEach((element) => {
      const key = element.getAttribute("data-i18n-title");
      if (key) {
        element.setAttribute("title", this.translate(key));
      }
    });
  }

  onLocaleChange(callback: (locale: Locale) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.currentLocale);
    }
  }
}

export const i18nManager = I18nManager.getInstance();
