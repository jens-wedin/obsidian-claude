import { MarkdownView, Notice, Plugin } from "obsidian";
import {
  ClaudeAssistantSettings,
  ClaudeAssistantSettingTab,
  DEFAULT_SETTINGS,
} from "./settings";
import { ClaudeService } from "./ClaudeService";
import { FloatingMenu } from "./FloatingMenu";
import { ActionDefinition } from "./actions";

export default class ClaudeAssistantPlugin extends Plugin {
  settings: ClaudeAssistantSettings = DEFAULT_SETTINGS;
  private floatingMenu: FloatingMenu | null = null;
  private selectionTimeout: ReturnType<typeof setTimeout> | null = null;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new ClaudeAssistantSettingTab(this.app, this));

    if (!this.settings.apiKey) {
      new Notice("Claude Assistant: Please set your API key in Settings.");
    }

    // Create floating menu in the workspace container
    this.app.workspace.onLayoutReady(() => {
      const container = document.body;
      this.floatingMenu = new FloatingMenu(container, (action, customPrompt) =>
        this.handleAction(action, customPrompt)
      );
    });

    // Listen for selection changes
    this.registerDomEvent(document, "selectionchange", () => {
      if (this.selectionTimeout) clearTimeout(this.selectionTimeout);
      this.selectionTimeout = setTimeout(() => this.onSelectionChange(), 300);
    });

    // Dismiss on click outside
    this.registerDomEvent(document, "mousedown", (e: MouseEvent) => {
      if (
        this.floatingMenu?.isVisible() &&
        !(e.target as HTMLElement).closest(".claude-floating-menu")
      ) {
        this.floatingMenu.hide();
      }
    });

    // Dismiss on Escape
    this.registerDomEvent(document, "keydown", (e: KeyboardEvent) => {
      if (e.key === "Escape" && this.floatingMenu?.isVisible()) {
        this.floatingMenu.hide();
      }
    });
  }

  onunload() {
    this.floatingMenu?.destroy();
    if (this.selectionTimeout) clearTimeout(this.selectionTimeout);
  }

  private onSelectionChange() {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) return;

    const editor = activeView.editor;
    const selectedText = editor.getSelection();

    if (!selectedText || selectedText.trim().length === 0) {
      return;
    }

    // Get cursor position to place the menu
    const cursor = editor.getCursor("to");
    const coords = (editor as any).coordsAtPos(
      editor.posToOffset(cursor)
    );

    if (!coords) return;

    const x = coords.left;
    const y = coords.top - 8;

    this.floatingMenu?.show(x, y);
  }

  private async handleAction(action: ActionDefinition, customPrompt?: string) {
    if (!this.settings.apiKey) {
      new Notice("Claude Assistant: Please set your API key in Settings.");
      return;
    }

    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) return;

    const editor = activeView.editor;
    const selectedText = editor.getSelection();

    if (!selectedText) {
      new Notice("No text selected.");
      return;
    }

    this.floatingMenu?.setLoading(action.id);

    try {
      const service = new ClaudeService(
        this.settings.apiKey,
        this.settings.model
      );

      let systemPrompt: string;
      if (typeof action.systemPrompt === "function") {
        systemPrompt = action.systemPrompt({
          translateLanguage: this.settings.translateLanguage,
          defaultTone: this.settings.defaultTone,
        });
      } else if (customPrompt) {
        systemPrompt = `You are a writing assistant. Follow this instruction for the given text: ${customPrompt}. Return ONLY the result. No preamble, no explanation, no markdown fencing.`;
      } else {
        systemPrompt = action.systemPrompt;
      }

      const response = await service.complete(systemPrompt, selectedText);

      if (action.responseMode === "replace") {
        editor.replaceSelection(response.text);
      } else {
        const cursor = editor.getCursor("to");
        const lineEnd = editor.getLine(cursor.line).length;
        editor.setCursor({ line: cursor.line, ch: lineEnd });
        editor.replaceRange(
          "\n\n" + response.text,
          { line: cursor.line, ch: lineEnd }
        );
      }

      this.floatingMenu?.hide();
    } catch (error) {
      this.floatingMenu?.clearLoading();
      const message =
        error instanceof Error ? error.message : "Unknown error";
      new Notice(`Claude Assistant: ${message}`);
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
