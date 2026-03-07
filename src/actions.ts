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
