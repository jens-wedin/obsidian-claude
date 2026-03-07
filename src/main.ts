import { Notice, Plugin } from "obsidian";
import {
  ClaudeAssistantSettings,
  ClaudeAssistantSettingTab,
  DEFAULT_SETTINGS,
} from "./settings";

export default class ClaudeAssistantPlugin extends Plugin {
  settings: ClaudeAssistantSettings = DEFAULT_SETTINGS;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new ClaudeAssistantSettingTab(this.app, this));

    if (!this.settings.apiKey) {
      new Notice("Claude Assistant: Please set your API key in Settings.");
    }
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
