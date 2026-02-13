/**
 * UpdateManager - Handles checking for and installing application updates.
 * Uses tauri-plugin-updater with GitHub Releases as the update server.
 */

import { check, Update } from "@tauri-apps/plugin-updater";
import { ask, message } from "@tauri-apps/plugin-dialog";
import { relaunch } from "@tauri-apps/plugin-process";
import { i18nManager } from "./I18nManager";
import { toast } from "./Toast";

class UpdateManager {
  private static instance: UpdateManager;
  private isChecking = false;
  private lastCheck: Date | null = null;
  private pendingUpdate: Update | null = null;

  private constructor() {}

  static getInstance(): UpdateManager {
    if (!UpdateManager.instance) {
      UpdateManager.instance = new UpdateManager();
    }
    return UpdateManager.instance;
  }

  /**
   * Check for updates silently on startup.
   * Only shows UI if an update is available.
   */
  async checkOnStartup(): Promise<void> {
    // Don't check too frequently - wait at least 1 hour between checks
    if (this.lastCheck) {
      const hoursSinceLastCheck =
        (Date.now() - this.lastCheck.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastCheck < 1) {
        return;
      }
    }

    try {
      await this.checkForUpdate(true);
    } catch (error) {
      // Silent failure on startup - don't bother the user
      console.warn("Startup update check failed:", error);
    }
  }

  /**
   * Check for updates. Can be called manually from menu.
   * @param silent If true, only shows UI when update is available
   */
  async checkForUpdate(silent = false): Promise<void> {
    if (this.isChecking) {
      return;
    }

    this.isChecking = true;
    const t = (key: string) => i18nManager.t(key);

    try {
      const update = await check();
      this.lastCheck = new Date();

      if (update) {
        this.pendingUpdate = update;
        await this.promptForUpdate(update);
      } else if (!silent) {
        // Only show "up to date" message for manual checks
        await message(t("update.up_to_date_message"), {
          title: t("update.up_to_date"),
          kind: "info",
        });
      }
    } catch (error) {
      console.error("Update check failed:", error);
      if (!silent) {
        toast.error(t("update.check_failed"), t("update.check_failed_message"));
      }
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Show update available dialog and handle user response.
   */
  private async promptForUpdate(update: Update): Promise<void> {
    const t = (key: string) => i18nManager.t(key);

    const currentVersion = update.currentVersion;
    const newVersion = update.version;

    // Build message with version info
    let updateMessage = t("update.available_message")
      .replace("{current}", currentVersion)
      .replace("{new}", newVersion);

    // Add release notes if available
    if (update.body) {
      updateMessage += "\n\n" + t("update.release_notes") + "\n" + update.body;
    }

    const shouldUpdate = await ask(updateMessage, {
      title: t("update.available"),
      kind: "info",
      okLabel: t("update.download_install"),
      cancelLabel: t("update.later"),
    });

    if (shouldUpdate) {
      await this.downloadAndInstall(update);
    }
  }

  /**
   * Download and install the update.
   */
  private async downloadAndInstall(update: Update): Promise<void> {
    const t = (key: string) => i18nManager.t(key);

    try {
      // Show downloading toast
      toast.info(t("update.downloading"), t("update.please_wait"));

      // Download and install
      await update.downloadAndInstall((progress) => {
        // Progress callback - could show progress bar in future
        if (progress.event === "Started" && progress.data.contentLength) {
          console.log(`Download started: ${progress.data.contentLength} bytes`);
        } else if (progress.event === "Progress") {
          console.log(`Downloaded: ${progress.data.chunkLength} bytes`);
        } else if (progress.event === "Finished") {
          console.log("Download finished");
        }
      });

      // Ask user to restart
      const shouldRestart = await ask(t("update.restart_message"), {
        title: t("update.restart_required"),
        kind: "info",
        okLabel: t("update.restart_now"),
        cancelLabel: t("update.restart_later"),
      });

      if (shouldRestart) {
        await relaunch();
      } else {
        toast.success(
          t("update.installed"),
          t("update.restart_to_apply")
        );
      }
    } catch (error) {
      console.error("Update installation failed:", error);
      toast.error(t("update.install_failed"), t("update.install_failed_message"));
    }
  }

  /**
   * Get the pending update if one was found.
   */
  getPendingUpdate(): Update | null {
    return this.pendingUpdate;
  }
}

export const updateManager = UpdateManager.getInstance();
