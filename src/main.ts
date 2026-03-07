import { Plugin } from "obsidian";

export default class ClaudeAssistantPlugin extends Plugin {
  async onload() {
    console.log("Claude Assistant plugin loaded");
  }

  onunload() {
    console.log("Claude Assistant plugin unloaded");
  }
}
