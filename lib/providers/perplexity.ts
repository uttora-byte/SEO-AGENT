import OpenAI from "openai";
import type { LLMProvider, GenerateOptions, GenerateResult } from "./types";
import { ProviderUnavailableError } from "./types";

const DEFAULT_MODEL = "sonar";

// Perplexity exposes an OpenAI-compatible API at api.perplexity.ai. Reusing
// the OpenAI SDK with a custom baseURL keeps things simple. Perplexity
// returns citations in a non-standard `citations` field on the response.
export function createPerplexityProvider(apiKey: string | null): LLMProvider {
  return {
    id: "perplexity",
    label: "Perplexity",
    description:
      "Calls api.perplexity.ai. Required for GEO tracking — Perplexity is one of the major AI search engines.",

    async isAvailable() {
      return Boolean(apiKey);
    },

    async generate(
      prompt: string,
      options: GenerateOptions = {},
    ): Promise<GenerateResult> {
      if (!apiKey) {
        throw new ProviderUnavailableError(
          "perplexity",
          "No Perplexity API key configured. Add one in Settings.",
        );
      }
      const client = new OpenAI({
        apiKey,
        baseURL: "https://api.perplexity.ai",
      });
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

      const sources = (response as unknown as { citations?: string[] })
        .citations;

      return {
        text: response.choices[0]?.message?.content ?? "",
        provider: "perplexity",
        model: response.model,
        sources,
        usage: {
          inputTokens: response.usage?.prompt_tokens,
          outputTokens: response.usage?.completion_tokens,
        },
      };
    },
  };
}
