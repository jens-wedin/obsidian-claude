import { Editor, MarkdownFileInfo, Menu, Notice, Plugin } from "obsidian";
import {
  ClaudeAssistantSettings,
  ClaudeAssistantSettingTab,
  DEFAULT_SETTINGS,
} from "./settings";
import { ClaudeService } from "./ClaudeService";
import { ACTIONS, ActionDefinition } from "./actions";
import { CustomPromptModal } from "./CustomPromptModal";

export default class ClaudeAssistantPlugin extends Plugin {
  settings: ClaudeAssistantSettings = DEFAULT_SETTINGS;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new ClaudeAssistantSettingTab(this.app, this));

    if (!this.settings.apiKey) {
      new Notice("Claude Assistant: Please set your API key in Settings.");
    }

    // Register context menu items on right-click inside a submenu
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu: Menu, editor: Editor, info: MarkdownFileInfo) => {
        const selectedText = editor.getSelection();
        if (!selectedText || selectedText.trim().length === 0) return;

        menu.addItem((item) => {
          item.setTitle("Claude Assistant").setIcon("bot");

          // Use undocumented setSubmenu() to group actions neatly
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const submenu: Menu = (item as any).setSubmenu();

          // Add each predefined action
          for (const action of ACTIONS) {
            submenu.addItem((sub) => {
              sub
                .setTitle(action.label)
                .setIcon(action.icon)
                .onClick(() => this.handleAction(editor, action));
            });
          }

          submenu.addSeparator();

          // Add custom prompt action
          submenu.addItem((sub) => {
            sub
              .setTitle("Custom prompt...")
              .setIcon("message-square")
              .onClick(() => {
                new CustomPromptModal(this.app, (prompt) => {
                  const customAction: ActionDefinition = {
                    id: "custom",
                    label: "Custom",
                    icon: "message-square",
                    responseMode: "insert-below",
                    systemPrompt: prompt,
                  };
                  this.handleAction(editor, customAction, prompt);
                }).open();
              });
          });
        });
      })
    );
  }

  private async handleAction(editor: Editor, action: ActionDefinition, customPrompt?: string) {
    if (!this.settings.apiKey) {
      new Notice("Claude Assistant: Please set your API key in Settings.");
      return;
    }

    const selectedText = editor.getSelection();

    if (!selectedText) {
      new Notice("No text selected.");
      return;
    }

    new Notice(`Claude: Running "${action.label}"...`);

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

      new Notice(`Claude: "${action.label}" complete.`);
    } catch (error) {
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
