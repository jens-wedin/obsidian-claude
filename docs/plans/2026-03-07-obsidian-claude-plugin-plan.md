# Obsidian Claude Plugin Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an Obsidian plugin that shows a floating context menu on text selection with Claude AI-powered writing actions.

**Architecture:** Vanilla Obsidian plugin (TypeScript). Floating menu built with plain DOM, API calls via Obsidian's `requestUrl`. Six source files: main, floating menu, Claude service, actions config, settings, styles.

**Tech Stack:** TypeScript, Obsidian API, CodeMirror 6 (editor extensions), Anthropic REST API, esbuild

---

### Task 1: Scaffold the Obsidian Plugin Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `esbuild.config.mjs`
- Create: `manifest.json`
- Create: `.gitignore`
- Create: `src/main.ts`

**Step 1: Create `manifest.json`**

```json
{
  "id": "obsidian-claude",
  "name": "Claude Assistant",
  "version": "0.1.0",
  "minAppVersion": "1.0.0",
  "description": "AI-powered writing assistant using Claude. Select text to improve, translate, summarize, and more.",
  "author": "Jens Wedin",
  "isDesktopOnly": false
}
```

**Step 2: Create `package.json`**

```json
{
  "name": "obsidian-claude",
  "version": "0.1.0",
  "description": "Obsidian plugin for Claude AI writing assistance",
  "main": "main.js",
  "scripts": {
    "dev": "node esbuild.config.mjs",
    "build": "tsc -noEmit -skipLibCheck && node esbuild.config.mjs production"
  },
  "keywords": [],
  "author": "Jens Wedin",
  "license": "MIT",
  "devDependencies": {
    "@types/node": "^22.0.0",
    "builtin-modules": "^4.0.0",
    "esbuild": "^0.24.0",
    "obsidian": "latest",
    "tslib": "^2.7.0",
    "typescript": "^5.6.0"
  }
}
```

**Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "inlineSourceMap": true,
    "inlineSources": true,
    "module": "ESNext",
    "target": "ES6",
    "allowJs": true,
    "noImplicitAny": true,
    "moduleResolution": "node",
    "importHelpers": true,
    "isolatedModules": true,
    "strictNullChecks": true,
    "lib": ["DOM", "ES5", "ES6", "ES7"]
  },
  "include": ["src/**/*.ts"]
}
```

**Step 4: Create `esbuild.config.mjs`**

```javascript
import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";

const prod = process.argv[2] === "production";

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: [
    "obsidian",
    "electron",
    "@codemirror/autocomplete",
    "@codemirror/collab",
    "@codemirror/commands",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    ...builtins,
  ],
  format: "cjs",
  target: "es2018",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
});

if (prod) {
  await context.rebuild();
  process.exit(0);
} else {
  await context.watch();
}
```

**Step 5: Create `.gitignore`**

```
node_modules/
main.js
*.js.map
data.json
```

**Step 6: Create minimal `src/main.ts`**

```typescript
import { Plugin } from "obsidian";

export default class ClaudeAssistantPlugin extends Plugin {
  async onload() {
    console.log("Claude Assistant plugin loaded");
  }

  onunload() {
    console.log("Claude Assistant plugin unloaded");
  }
}
```

**Step 7: Install dependencies and verify build**

Run: `npm install`
Run: `npm run build`
Expected: `main.js` created in project root with no errors.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold obsidian plugin project"
```

---

### Task 2: Settings — Types, Storage, and Settings Tab

**Files:**
- Create: `src/settings.ts`
- Modify: `src/main.ts`

**Step 1: Create `src/settings.ts`**

```typescript
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
```

**Step 2: Update `src/main.ts` to load settings and register the tab**

```typescript
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
```

**Step 3: Build and verify**

Run: `npm run build`
Expected: No errors.

**Step 4: Commit**

```bash
git add src/settings.ts src/main.ts
git commit -m "feat: add plugin settings with API key, model, language, tone"
```

---

### Task 3: Claude Service — API Integration

**Files:**
- Create: `src/ClaudeService.ts`

**Step 1: Create `src/ClaudeService.ts`**

```typescript
import { requestUrl } from "obsidian";

const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2023-06-01";

export interface ClaudeResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

export class ClaudeService {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async complete(
    systemPrompt: string,
    userMessage: string
  ): Promise<ClaudeResponse> {
    const response = await requestUrl({
      url: API_URL,
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": API_VERSION,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (response.status !== 200) {
      const error = response.json;
      throw new Error(
        error?.error?.message ?? `API error: ${response.status}`
      );
    }

    const data = response.json;
    return {
      text: data.content[0].text,
      inputTokens: data.usage.input_tokens,
      outputTokens: data.usage.output_tokens,
    };
  }
}
```

**Step 2: Build and verify**

Run: `npm run build`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/ClaudeService.ts
git commit -m "feat: add Claude API service using requestUrl"
```

---

### Task 4: Actions Configuration

**Files:**
- Create: `src/actions.ts`

**Step 1: Create `src/actions.ts`**

```typescript
export type ResponseMode = "replace" | "insert-below";

export interface ActionDefinition {
  id: string;
  label: string;
  icon: string;
  responseMode: ResponseMode;
  systemPrompt: string | ((settings: { translateLanguage: string; defaultTone: string }) => string);
}

const COMMON_INSTRUCTION = "Return ONLY the transformed text. No preamble, no explanation, no markdown fencing.";

export const ACTIONS: ActionDefinition[] = [
  {
    id: "improve",
    label: "Improve",
    icon: "pencil",
    responseMode: "replace",
    systemPrompt: `You are a writing assistant. Improve the given text for clarity, grammar, and flow while preserving the original meaning and tone. ${COMMON_INSTRUCTION}`,
  },
  {
    id: "shorter",
    label: "Shorter",
    icon: "minimize-2",
    responseMode: "replace",
    systemPrompt: `You are a writing assistant. Make the given text more concise while keeping the key meaning. ${COMMON_INSTRUCTION}`,
  },
  {
    id: "longer",
    label: "Longer",
    icon: "maximize-2",
    responseMode: "replace",
    systemPrompt: `You are a writing assistant. Expand the given text with more detail and supporting points while keeping the same style. ${COMMON_INSTRUCTION}`,
  },
  {
    id: "translate",
    label: "Translate",
    icon: "languages",
    responseMode: "replace",
    systemPrompt: (settings) =>
      `You are a translator. Translate the given text into ${settings.translateLanguage}. ${COMMON_INSTRUCTION}`,
  },
  {
    id: "tone",
    label: "Change tone",
    icon: "megaphone",
    responseMode: "replace",
    systemPrompt: (settings) =>
      `You are a writing assistant. Rewrite the given text in a ${settings.defaultTone} tone. ${COMMON_INSTRUCTION}`,
  },
  {
    id: "summarize",
    label: "Summarize",
    icon: "list",
    responseMode: "insert-below",
    systemPrompt: `You are a writing assistant. Provide a concise summary of the given text. ${COMMON_INSTRUCTION}`,
  },
  {
    id: "explain",
    label: "Explain",
    icon: "help-circle",
    responseMode: "insert-below",
    systemPrompt: `You are a writing assistant. Explain the given text in simpler terms. ${COMMON_INSTRUCTION}`,
  },
];
```

**Step 2: Build and verify**

Run: `npm run build`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/actions.ts
git commit -m "feat: add action definitions with prompts and response modes"
```

---

### Task 5: Floating Menu — DOM Component

**Files:**
- Create: `src/FloatingMenu.ts`
- Create: `src/styles.css`

**Step 1: Create `src/styles.css`**

```css
.claude-floating-menu {
  position: absolute;
  z-index: var(--layer-popover);
  background: var(--background-primary);
  border: 1px solid var(--background-modifier-border);
  border-radius: 8px;
  padding: 4px;
  box-shadow: var(--shadow-s);
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  max-width: 320px;
}

.claude-floating-menu-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-normal);
  font-size: var(--font-ui-small);
  cursor: pointer;
  white-space: nowrap;
}

.claude-floating-menu-btn:hover {
  background: var(--background-modifier-hover);
}

.claude-floating-menu-btn.is-loading {
  opacity: 0.6;
  pointer-events: none;
}

.claude-floating-menu-btn .spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid var(--text-faint);
  border-top-color: var(--text-accent);
  border-radius: 50%;
  animation: claude-spin 0.6s linear infinite;
}

@keyframes claude-spin {
  to { transform: rotate(360deg); }
}

.claude-custom-prompt-input {
  display: flex;
  gap: 4px;
  padding: 4px;
  width: 100%;
}

.claude-custom-prompt-input input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid var(--background-modifier-border);
  border-radius: 4px;
  background: var(--background-primary);
  color: var(--text-normal);
  font-size: var(--font-ui-small);
}

.claude-custom-prompt-input button {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  background: var(--interactive-accent);
  color: var(--text-on-accent);
  font-size: var(--font-ui-small);
  cursor: pointer;
}
```

**Step 2: Create `src/FloatingMenu.ts`**

```typescript
import { setIcon } from "obsidian";
import { ACTIONS, ActionDefinition } from "./actions";

export class FloatingMenu {
  private containerEl: HTMLElement;
  private customPromptEl: HTMLElement | null = null;
  private loadingActionId: string | null = null;
  private onAction: (action: ActionDefinition, customPrompt?: string) => void;

  constructor(
    parentEl: HTMLElement,
    onAction: (action: ActionDefinition, customPrompt?: string) => void
  ) {
    this.onAction = onAction;
    this.containerEl = parentEl.createDiv({ cls: "claude-floating-menu" });
    this.containerEl.style.display = "none";
    this.render();
  }

  private render() {
    this.containerEl.empty();

    for (const action of ACTIONS) {
      const btn = this.containerEl.createEl("button", {
        cls: "claude-floating-menu-btn",
        attr: { "aria-label": action.label },
      });

      if (this.loadingActionId === action.id) {
        btn.addClass("is-loading");
        const spinner = btn.createSpan({ cls: "spinner" });
        btn.appendText(action.label);
      } else {
        const iconSpan = btn.createSpan();
        setIcon(iconSpan, action.icon);
        btn.appendText(action.label);
        btn.addEventListener("click", () => this.onAction(action));
      }
    }

    // Custom prompt button
    const customBtn = this.containerEl.createEl("button", {
      cls: "claude-floating-menu-btn",
      attr: { "aria-label": "Custom prompt" },
    });

    if (this.loadingActionId === "custom") {
      customBtn.addClass("is-loading");
      customBtn.createSpan({ cls: "spinner" });
      customBtn.appendText("Custom...");
    } else {
      const iconSpan = customBtn.createSpan();
      setIcon(iconSpan, "message-square");
      customBtn.appendText("Custom...");
      customBtn.addEventListener("click", () => this.showCustomPromptInput());
    }
  }

  private showCustomPromptInput() {
    if (this.customPromptEl) return;

    this.customPromptEl = this.containerEl.createDiv({
      cls: "claude-custom-prompt-input",
    });
    const input = this.customPromptEl.createEl("input", {
      attr: { type: "text", placeholder: "Enter your instruction..." },
    });
    const submitBtn = this.customPromptEl.createEl("button", { text: "Go" });

    const submit = () => {
      const prompt = input.value.trim();
      if (!prompt) return;
      const customAction: ActionDefinition = {
        id: "custom",
        label: "Custom",
        icon: "message-square",
        responseMode: "insert-below",
        systemPrompt: prompt,
      };
      this.onAction(customAction, prompt);
    };

    submitBtn.addEventListener("click", submit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submit();
      if (e.key === "Escape") this.hideCustomPromptInput();
    });

    input.focus();
  }

  private hideCustomPromptInput() {
    if (this.customPromptEl) {
      this.customPromptEl.remove();
      this.customPromptEl = null;
    }
  }

  show(x: number, y: number) {
    this.loadingActionId = null;
    this.hideCustomPromptInput();
    this.render();
    this.containerEl.style.display = "flex";
    this.containerEl.style.left = `${x}px`;
    this.containerEl.style.top = `${y}px`;

    // Reposition if overflowing viewport
    requestAnimationFrame(() => {
      const rect = this.containerEl.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (rect.right > viewportWidth) {
        this.containerEl.style.left = `${x - (rect.right - viewportWidth) - 8}px`;
      }
      if (rect.top < 0) {
        this.containerEl.style.top = `${y + 30}px`;
      }
    });
  }

  hide() {
    this.containerEl.style.display = "none";
    this.hideCustomPromptInput();
    this.loadingActionId = null;
  }

  setLoading(actionId: string) {
    this.loadingActionId = actionId;
    this.render();
  }

  clearLoading() {
    this.loadingActionId = null;
    this.render();
  }

  isVisible(): boolean {
    return this.containerEl.style.display !== "none";
  }

  destroy() {
    this.containerEl.remove();
  }
}
```

**Step 3: Build and verify**

Run: `npm run build`
Expected: No errors.

**Step 4: Commit**

```bash
git add src/FloatingMenu.ts src/styles.css
git commit -m "feat: add floating context menu with themed styles"
```

---

### Task 6: Wire Everything Together in main.ts

**Files:**
- Modify: `src/main.ts`

**Step 1: Update `src/main.ts` with full integration**

Replace the entire contents of `src/main.ts`:

```typescript
import { Editor, MarkdownView, Notice, Plugin } from "obsidian";
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
```

**Step 2: Import styles in the entry point**

Add to the top of `src/main.ts` (esbuild will handle CSS):

Actually, Obsidian plugins load CSS from `styles.css` in the plugin root. The file must be named `styles.css` at the root. Move `src/styles.css` to `./styles.css`.

Run: `mv src/styles.css styles.css` (or create it at root directly in Task 5)

**Step 3: Build and verify**

Run: `npm run build`
Expected: `main.js` produced with no errors.

**Step 4: Commit**

```bash
git add src/main.ts styles.css
git commit -m "feat: wire floating menu, selection detection, and Claude actions"
```

---

### Task 7: Manual Integration Test

**Files:** None (testing only)

**Step 1: Symlink plugin into Obsidian vault**

```bash
ln -s /Users/jens.wedin/Documents/Code/obsidian-claude /Users/jens.wedin/Documents/Obsidian/.obsidian/plugins/obsidian-claude
```

**Step 2: Build the plugin**

Run: `npm run build`

**Step 3: Enable in Obsidian**

1. Open Obsidian
2. Go to Settings > Community plugins > Installed plugins
3. Enable "Claude Assistant"
4. Go to Settings > Claude Assistant
5. Enter your Anthropic API key

**Step 4: Test each action**

1. Open a note, type some text, select it
2. Verify the floating menu appears near the selection
3. Click "Improve" — verify text is replaced
4. Select text again, click "Summarize" — verify summary inserted below
5. Click "Custom..." — type an instruction, click Go — verify result inserted below
6. Press Escape — verify menu dismisses
7. Click outside menu — verify it dismisses
8. Test with no API key — verify error notice

**Step 5: Fix any issues found, commit**

```bash
git add -A
git commit -m "fix: address issues from integration testing"
```

---

### Task 8: README and Documentation

**Files:**
- Create: `README.md`
- Create: `CHANGELOG.md`

**Step 1: Create `README.md`**

```markdown
# Claude Assistant — Obsidian Plugin

AI-powered writing assistant for Obsidian using Anthropic's Claude.

## Features

Select text in any note to get a floating menu with AI actions:

- **Improve** — Fix grammar, clarity, and flow
- **Make shorter** — Condense text
- **Make longer** — Expand with more detail
- **Translate** — Translate to a configured language
- **Change tone** — Rewrite in a different tone
- **Summarize** — Add a summary below the selection
- **Explain** — Add a simpler explanation below
- **Custom prompt** — Type any instruction

## Installation

1. Clone or download this repository into your vault's `.obsidian/plugins/` folder
2. Run `npm install && npm run build`
3. Enable "Claude Assistant" in Obsidian Settings > Community plugins
4. Add your Anthropic API key in Settings > Claude Assistant

## Settings

| Setting | Description |
|---------|-------------|
| API Key | Your Anthropic API key |
| Model | Claude model (Sonnet, Opus, or Haiku) |
| Translation language | Target language for Translate |
| Default tone | Tone for Change tone action |

## Development

```bash
npm install
npm run dev    # Watch mode
npm run build  # Production build
```

## License

MIT
```

**Step 2: Create `CHANGELOG.md`**

```markdown
# Changelog

## 0.1.0 (2026-03-07)

- Initial release
- Floating context menu on text selection
- Actions: Improve, Shorter, Longer, Translate, Change tone, Summarize, Explain, Custom prompt
- Settings: API key, model selection, translation language, default tone
- Light and dark theme support
```

**Step 3: Commit**

```bash
git add README.md CHANGELOG.md
git commit -m "docs: add README and CHANGELOG"
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Project scaffold | manifest.json, package.json, tsconfig, esbuild, main.ts |
| 2 | Settings | settings.ts, main.ts |
| 3 | Claude API service | ClaudeService.ts |
| 4 | Actions config | actions.ts |
| 5 | Floating menu + CSS | FloatingMenu.ts, styles.css |
| 6 | Integration wiring | main.ts |
| 7 | Manual testing | — |
| 8 | Documentation | README.md, CHANGELOG.md |
