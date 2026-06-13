import type { LLMProvider, GenerateOptions, GenerateResult } from "./types";
import { ProviderUnavailableError } from "./types";

const DEFAULT_MODEL = "gemini-2.5-pro";

interface GeminiContent {
  parts: Array<{ text: string }>;
  role?: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: GeminiContent;
    groundingMetadata?: {
      groundingChunks?: Array<{ web?: { uri?: string } }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
}

// Direct REST calls to Generative Language API. Skipping the @google/genai
// SDK to keep dependency footprint small.
export function createGeminiProvider(apiKey: string | null): LLMProvider {
  return {
    id: "gemini",
    label: "Google Gemini",
    description:
      "Calls generativelanguage.googleapis.com. Required for GEO tracking — Gemini powers Google AI Overviews.",

    async isAvailable() {
      return Boolean(apiKey);
    },

    async generate(
      prompt: string,
      options: GenerateOptions = {},
    ): Promise<GenerateResult> {
      if (!apiKey) {
        throw new ProviderUnavailableError(
          "gemini",
          "No Google API key configured. Add one in Settings.",
        );
      }
      const model = options.model ?? DEFAULT_MODEL;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model,
      )}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const body: Record<string, unknown> = {
        contents: [{ parts: [{ text: prompt }], role: "user" }],
        generationConfig: {
          maxOutputTokens: options.maxTokens,
          temperature: options.temperature,
        },
      };
      if (options.systemPrompt) {
        body.systemInstruction = { parts: [{ text: options.systemPrompt }] };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API ${res.status}: ${errText}`);
      }
      const data = (await res.json()) as GeminiResponse;

      const text =
        data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n") ??
        "";
      const sources = data.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map((c) => c.web?.uri)
        .filter((u): u is string => Boolean(u));

      return {
        text,
        provider: "gemini",
        model,
        sources,
        usage: {
          inputTokens: data.usageMetadata?.promptTokenCount,
          outputTokens: data.usageMetadata?.candidatesTokenCount,
        },
      };
    },
  };
}
