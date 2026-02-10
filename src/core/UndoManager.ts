/**
 * Interface for undoable commands.
 * Each command knows how to execute and undo itself.
 */
export interface UndoableCommand {
  /** Human-readable description of the action */
  description: string;
  /** Execute the command (or re-execute for redo) */
  execute(): void;
  /** Undo the command */
  undo(): void;
}

/**
 * Manages undo/redo history using the command pattern.
 */
export class UndoManager {
  private undoStack: UndoableCommand[] = [];
  private redoStack: UndoableCommand[] = [];
  private readonly maxHistorySize: number;
  private listeners: Array<() => void> = [];

  constructor(maxHistorySize = 50) {
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Execute a command and add it to the undo stack.
   * Clears the redo stack since we're branching from history.
   */
  execute(command: UndoableCommand): void {
    command.execute();
    this.undoStack.push(command);
    this.redoStack = []; // Clear redo stack on new action

    // Limit history size
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }

    this.notifyListeners();
  }

  /**
   * Undo the most recent command.
   * @returns The command that was undone, or undefined if nothing to undo.
   */
  undo(): UndoableCommand | undefined {
    const command = this.undoStack.pop();
    if (command) {
      command.undo();
      this.redoStack.push(command);
      this.notifyListeners();
    }
    return command;
  }

  /**
   * Redo the most recently undone command.
   * @returns The command that was redone, or undefined if nothing to redo.
   */
  redo(): UndoableCommand | undefined {
    const command = this.redoStack.pop();
    if (command) {
      command.execute();
      this.undoStack.push(command);
      this.notifyListeners();
    }
    return command;
  }

  /**
   * Check if there are commands to undo.
   */
  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Check if there are commands to redo.
   */
  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Get the description of the next undo action.
   */
  get undoDescription(): string | undefined {
    const command = this.undoStack[this.undoStack.length - 1];
    return command?.description;
  }

  /**
   * Get the description of the next redo action.
   */
  get redoDescription(): string | undefined {
    const command = this.redoStack[this.redoStack.length - 1];
    return command?.description;
  }

  /**
   * Clear all undo/redo history.
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.notifyListeners();
  }

  /**
   * Subscribe to changes in undo/redo state.
   */
  onChange(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
