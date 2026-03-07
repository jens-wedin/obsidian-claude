import { App, PluginSettingTab, Setting } from "obsidian";
import type ClaudeAssistantPlugin from "./main";

export interface ClaudeAssistantSettings {
  apiKey: string;
  model: string;
  translateLanguage: string;
  defaultTone: string;
}

export const DEFAULT_SETTINGS: ClaudeAssistantSettings = {
  apiKey: "",
  model: "claude-sonnet-4-6-20250514",
  translateLanguage: "English",
  defaultTone: "Professional",
};

export const MODEL_OPTIONS: Record<string, string> = {
  "claude-sonnet-4-6-20250514": "Claude Sonnet 4.6",
  "claude-opus-4-6-20250605": "Claude Opus 4.6",
  "claude-haiku-4-5-20251001": "Claude Haiku 4.5",
};

export class ClaudeAssistantSettingTab extends PluginSettingTab {
  plugin: ClaudeAssistantPlugin;

  constructor(app: App, plugin: ClaudeAssistantPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("API Key")
      .setDesc("Your Anthropic API key")
      .addText((text) =>
        text
          .setPlaceholder("sk-ant-...")
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (value) => {
            this.plugin.settings.apiKey = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Model")
      .setDesc("Claude model to use")
      .addDropdown((dropdown) => {
        for (const [id, name] of Object.entries(MODEL_OPTIONS)) {
          dropdown.addOption(id, name);
        }
        dropdown.setValue(this.plugin.settings.model);
        dropdown.onChange(async (value) => {
          this.plugin.settings.model = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Translation language")
      .setDesc("Default target language for the Translate action")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.translateLanguage)
          .onChange(async (value) => {
            this.plugin.settings.translateLanguage = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Default tone")
      .setDesc("Default tone for the Change tone action")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.defaultTone)
          .onChange(async (value) => {
            this.plugin.settings.defaultTone = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
