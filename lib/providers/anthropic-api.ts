import Anthropic from "@anthropic-ai/sdk";
import type { LLMProvider, GenerateOptions, GenerateResult } from "./types";
import { ProviderUnavailableError } from "./types";

const DEFAULT_MODEL = "claude-sonnet-4-6";

export function createAnthropicApiProvider(apiKey: string | null): LLMProvider {
  return {
    id: "anthropic-api",
    label: "Anthropic API (bring your own key)",
    description:
      "Direct calls to api.anthropic.com. Requires ANTHROPIC_API_KEY. Pay per token.",

    async isAvailable() {
      return Boolean(apiKey);
    },

    async generate(
      prompt: string,
      options: GenerateOptions = {},
    ): Promise<GenerateResult> {
      if (!apiKey) {
        throw new ProviderUnavailableError(
          "anthropic-api",
          "No Anthropic API key configured. Add one in Settings.",
        );
      }
      const client = new Anthropic({ apiKey });
      const model = options.model ?? DEFAULT_MODEL;
      const response = await client.messages.create({
        model,
        max_tokens: options.maxTokens ?? 4096,
        temperature: options.temperature,
        system: options.systemPrompt,
        messages: [{ role: "user", content: prompt }],
      });

      const text = response.content
        .filter((block) => block.type === "text")
        .map((block) => (block as { type: "text"; text: string }).text)
        .join("\n");

      return {
        text,
        provider: "anthropic-api",
        model: response.model,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      };
    },
  };
}
