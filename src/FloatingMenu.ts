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
    this.containerEl.setAttribute("role", "toolbar");
    this.containerEl.setAttribute("aria-label", "Text actions");
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
        btn.setAttribute("aria-disabled", "true");
        btn.createSpan({ cls: "spinner", attr: { "aria-hidden": "true" } });
        btn.appendText(action.label);
      } else {
        const iconSpan = btn.createSpan({ attr: { "aria-hidden": "true" } });
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
      customBtn.setAttribute("aria-disabled", "true");
      customBtn.createSpan({ cls: "spinner", attr: { "aria-hidden": "true" } });
      customBtn.appendText("Custom...");
    } else {
      const iconSpan = customBtn.createSpan({ attr: { "aria-hidden": "true" } });
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
      attr: {
        type: "text",
        placeholder: "Enter your instruction...",
        "aria-label": "Custom prompt instruction",
      },
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
