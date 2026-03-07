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
