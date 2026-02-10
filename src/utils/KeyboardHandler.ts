type KeyAction = () => void;

interface ShortcutEntry {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  action: KeyAction;
}

export class KeyboardHandler {
  private shortcuts: ShortcutEntry[] = [];

  register(entry: ShortcutEntry): void {
    this.shortcuts.push(entry);
  }

  start(): void {
    document.addEventListener("keydown", (e) => this.handleKeyDown(e));
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const isMeta = e.metaKey || e.ctrlKey;

    for (const shortcut of this.shortcuts) {
      const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = shortcut.ctrl ? isMeta : !isMeta;
      const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;

      if (keyMatch && ctrlMatch && shiftMatch) {
        e.preventDefault();
        shortcut.action();
        return;
      }
    }
  }
}
