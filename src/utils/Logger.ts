import { debug, info, warn, error, trace } from "@tauri-apps/plugin-log";

/**
 * Logger utility that forwards to Tauri's log plugin.
 * Logs appear in the terminal running `tauri dev`.
 */
export const logger = {
  trace: (message: string) => {
    console.log(message);
    trace(message);
  },
  debug: (message: string) => {
    console.log(message);
    debug(message);
  },
  info: (message: string) => {
    console.log(message);
    info(message);
  },
  warn: (message: string) => {
    console.warn(message);
    warn(message);
  },
  error: (message: string) => {
    console.error(message);
    error(message);
  },
};

/**
 * Attach console log forwarding to Tauri log plugin.
 * Call this once at app startup.
 */
export function attachConsoleToTauriLog(): void {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  console.log = (...args: unknown[]) => {
    originalLog.apply(console, args);
    const message = args.map(arg => 
      typeof arg === 'string' ? arg : JSON.stringify(arg)
    ).join(' ');
    info(message).catch(() => {});
  };

  console.warn = (...args: unknown[]) => {
    originalWarn.apply(console, args);
    const message = args.map(arg => 
      typeof arg === 'string' ? arg : JSON.stringify(arg)
    ).join(' ');
    warn(message).catch(() => {});
  };

  console.error = (...args: unknown[]) => {
    originalError.apply(console, args);
    const message = args.map(arg => 
      typeof arg === 'string' ? arg : JSON.stringify(arg)
    ).join(' ');
    error(message).catch(() => {});
  };
}
