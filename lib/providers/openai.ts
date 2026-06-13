import OpenAI from "openai";
import type { LLMProvider, GenerateOptions, GenerateResult } from "./types";
import { ProviderUnavailableError } from "./types";

const DEFAULT_MODEL = "gpt-4o";

export function createOpenAIProvider(apiKey: string | null): LLMProvider {
  return {
    id: "openai",
    label: "OpenAI",
    description:
      "Calls api.openai.com. Required for the GEO tracker to measure citations in ChatGPT-style answers.",

    async isAvailable() {
      return Boolean(apiKey);
    },

    async generate(
      prompt: string,
      options: GenerateOptions = {},
    ): Promise<GenerateResult> {
      if (!apiKey) {
        throw new ProviderUnavailableError(
          "openai",
          "No OpenAI API key configured. Add one in Settings.",
        );
      }
      const client = new OpenAI({ apiKey });
      const model = options.model ?? DEFAULT_MODEL;

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
      if (options.systemPrompt) {
        messages.push({ role: "system", content: options.systemPrompt });
      }
      messages.push({ role: "user", content: prompt });

      const response = await client.chat.completions.create({
        model,
        messages,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
      });

      return {
        text: response.choices[0]?.message?.content ?? "",
        provider: "openai",
        model: response.model,
        usage: {
          inputTokens: response.usage?.prompt_tokens,
          outputTokens: response.usage?.completion_tokens,
        },
      };
    },
  };
}
