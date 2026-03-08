import { App, Modal } from "obsidian";

export class CustomPromptModal extends Modal {
  private result: string | null = null;
  private onSubmit: (prompt: string) => void;

  constructor(app: App, onSubmit: (prompt: string) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.createEl("h3", { text: "Custom prompt" });
    contentEl.createEl("p", {
      text: "Enter your instruction for Claude:",
      cls: "setting-item-description",
    });

    const inputEl = contentEl.createEl("input", {
      type: "text",
      cls: "claude-custom-prompt-modal-input",
      attr: {
        placeholder: "e.g. Make this more formal",
        "aria-label": "Custom prompt instruction",
      },
    });
    inputEl.style.width = "100%";
    inputEl.style.marginBottom = "1em";

    const buttonContainer = contentEl.createDiv({
      cls: "claude-custom-prompt-modal-buttons",
    });
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "flex-end";
    buttonContainer.style.gap = "8px";

    const cancelBtn = buttonContainer.createEl("button", { text: "Cancel" });
    cancelBtn.addEventListener("click", () => this.close());

    const submitBtn = buttonContainer.createEl("button", {
      text: "Submit",
      cls: "mod-cta",
    });

    const submit = () => {
      const value = inputEl.value.trim();
      if (!value) return;
      this.result = value;
      this.close();
      this.onSubmit(value);
    };

    submitBtn.addEventListener("click", submit);
    inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submit();
      }
    });

    // Focus the input after the modal is rendered
    setTimeout(() => inputEl.focus(), 50);
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
