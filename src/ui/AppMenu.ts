import {
  Menu,
  Submenu,
  MenuItem,
  PredefinedMenuItem,
} from "@tauri-apps/api/menu";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { themeManager } from "../utils/ThemeManager";
import { i18nManager, Locale } from "../utils/I18nManager";
import { aboutDialog } from "./AboutDialog";
import { updateManager } from "../utils/UpdateManager";

export interface MenuActions {
  onOpen: () => void;
  onClose: () => void;
  onSaveAs: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

// Store menu item references for dynamic updates
let appSubmenu: Submenu;
let aboutMenuItem: MenuItem;
let checkForUpdatesMenuItem: MenuItem;
let fileSubmenu: Submenu;
let openMenuItem: MenuItem;
let closeMenuItem: MenuItem;
let saveAsMenuItem: MenuItem;
let editSubmenu: Submenu;
let undoMenuItem: MenuItem;
let redoMenuItem: MenuItem;
let viewSubmenu: Submenu;
let devToolsMenuItem: MenuItem;
let windowSubmenu: Submenu;
let themeMenuItem: MenuItem;
let languageSubmenu: Submenu;
let englishMenuItem: MenuItem;
let germanMenuItem: MenuItem;

export async function setupAppMenu(actions: MenuActions): Promise<Menu> {
  const t = (key: string) => i18nManager.t(key);

  // Language submenu items
  englishMenuItem = await MenuItem.new({
    id: "lang-en",
    text: getLanguageMenuText("en"),
    action: async () => {
      await i18nManager.setLocale("en");
      await updateAllMenuTexts();
    },
  });

  germanMenuItem = await MenuItem.new({
    id: "lang-de",
    text: getLanguageMenuText("de"),
    action: async () => {
      await i18nManager.setLocale("de");
      await updateAllMenuTexts();
    },
  });

  languageSubmenu = await Submenu.new({
    id: "language",
    text: t("menu.language"),
    items: [englishMenuItem, germanMenuItem],
  });

  themeMenuItem = await MenuItem.new({
    id: "toggle-theme",
    text: getThemeMenuText(),
    accelerator: "CmdOrCtrl+Shift+T",
    action: async () => {
      themeManager.toggle();
      await themeMenuItem.setText(getThemeMenuText());
    },
  });

  aboutMenuItem = await MenuItem.new({
    id: "about",
    text: t("about.title"),
    action: () => {
      aboutDialog.show();
    },
  });

  checkForUpdatesMenuItem = await MenuItem.new({
    id: "check-for-updates",
    text: t("menu.check_for_updates"),
    action: async () => {
      await updateManager.checkForUpdate(false);
    },
  });

  // Application menu (first menu on macOS - shows as app name)
  appSubmenu = await Submenu.new({
    id: "app",
    text: t("app.name"),
    items: [
      aboutMenuItem,
      checkForUpdatesMenuItem,
      await PredefinedMenuItem.new({ item: "Separator" }),
      languageSubmenu,
      themeMenuItem,
      await PredefinedMenuItem.new({ item: "Separator" }),
      await PredefinedMenuItem.new({ item: "Services" }),
      await PredefinedMenuItem.new({ item: "Separator" }),
      await PredefinedMenuItem.new({ item: "Hide" }),
      await PredefinedMenuItem.new({ item: "HideOthers" }),
      await PredefinedMenuItem.new({ item: "ShowAll" }),
      await PredefinedMenuItem.new({ item: "Separator" }),
      await PredefinedMenuItem.new({ item: "Quit" }),
    ],
  });

  openMenuItem = await MenuItem.new({
    id: "open",
    text: t("menu.open"),
    accelerator: "CmdOrCtrl+O",
    action: actions.onOpen,
  });

  closeMenuItem = await MenuItem.new({
    id: "close",
    text: t("menu.close"),
    accelerator: "CmdOrCtrl+W",
    action: actions.onClose,
  });

  saveAsMenuItem = await MenuItem.new({
    id: "save-as",
    text: t("menu.save_as"),
    accelerator: "CmdOrCtrl+S",
    action: actions.onSaveAs,
  });

  fileSubmenu = await Submenu.new({
    id: "file",
    text: t("menu.file"),
    items: [
      openMenuItem,
      closeMenuItem,
      await PredefinedMenuItem.new({ item: "Separator" }),
      saveAsMenuItem,
    ],
  });

  undoMenuItem = await MenuItem.new({
    id: "undo",
    text: t("menu.undo"),
    accelerator: "CmdOrCtrl+Z",
    action: actions.onUndo,
  });

  redoMenuItem = await MenuItem.new({
    id: "redo",
    text: t("menu.redo"),
    accelerator: "CmdOrCtrl+Shift+Z",
    action: actions.onRedo,
  });

  editSubmenu = await Submenu.new({
    id: "edit",
    text: t("menu.edit"),
    items: [
      undoMenuItem,
      redoMenuItem,
      await PredefinedMenuItem.new({ item: "Separator" }),
      await PredefinedMenuItem.new({ item: "Cut" }),
      await PredefinedMenuItem.new({ item: "Copy" }),
      await PredefinedMenuItem.new({ item: "Paste" }),
      await PredefinedMenuItem.new({ item: "SelectAll" }),
    ],
  });

  devToolsMenuItem = await MenuItem.new({
    id: "devtools",
    text: t("menu.devtools"),
    accelerator: "CmdOrCtrl+Alt+I",
    action: async () => {
      const webview = getCurrentWebview();
      // Use Tauri's internal command to toggle devtools
      await invoke("plugin:webview|internal_toggle_devtools", {
        label: webview.label,
      });
    },
  });

  viewSubmenu = await Submenu.new({
    id: "view",
    text: t("menu.view"),
    items: [
      devToolsMenuItem,
    ],
  });

  windowSubmenu = await Submenu.new({
    id: "window",
    text: t("menu.window"),
    items: [
      await PredefinedMenuItem.new({ item: "Minimize" }),
      await PredefinedMenuItem.new({ item: "Maximize" }),
    ],
  });

  const menu = await Menu.new({
    items: [appSubmenu, fileSubmenu, editSubmenu, viewSubmenu, windowSubmenu],
  });

  await menu.setAsAppMenu();
  return menu;
}

function getThemeMenuText(): string {
  const t = (key: string) => i18nManager.t(key);
  return themeManager.getTheme() === "dark"
    ? t("theme.switch_to_light")
    : t("theme.switch_to_dark");
}

function getLanguageMenuText(locale: Locale): string {
  const t = (key: string) => i18nManager.t(key);
  const currentLocale = i18nManager.getLocale();
  const checkmark = currentLocale === locale ? "✓ " : "   ";
  return checkmark + t(`language.${locale}`);
}

async function updateAllMenuTexts(): Promise<void> {
  const t = (key: string) => i18nManager.t(key);

  // Update submenu texts
  await fileSubmenu.setText(t("menu.file"));
  await editSubmenu.setText(t("menu.edit"));
  await viewSubmenu.setText(t("menu.view"));
  await windowSubmenu.setText(t("menu.window"));
  await languageSubmenu.setText(t("menu.language"));

  // Update menu items
  await aboutMenuItem.setText(t("about.title"));
  await checkForUpdatesMenuItem.setText(t("menu.check_for_updates"));
  await openMenuItem.setText(t("menu.open"));
  await closeMenuItem.setText(t("menu.close"));
  await saveAsMenuItem.setText(t("menu.save_as"));
  await undoMenuItem.setText(t("menu.undo"));
  await redoMenuItem.setText(t("menu.redo"));
  await devToolsMenuItem.setText(t("menu.devtools"));
  await themeMenuItem.setText(getThemeMenuText());
  await englishMenuItem.setText(getLanguageMenuText("en"));
  await germanMenuItem.setText(getLanguageMenuText("de"));

  // Update DOM translations
  i18nManager.updateDOMTranslations();
}
