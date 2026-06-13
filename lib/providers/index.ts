import { getSettings } from "../settings";
import { claudeCliProvider } from "./anthropic-cli";
import { createAnthropicApiProvider } from "./anthropic-api";
import { createOpenAIProvider } from "./openai";
import { createGeminiProvider } from "./gemini";
import { createPerplexityProvider } from "./perplexity";
import type { LLMProvider, ProviderId } from "./types";

export type { LLMProvider, ProviderId, GenerateResult, GenerateOptions } from "./types";

export async function getAllProviders(): Promise<LLMProvider[]> {
  const s = await getSettings();
  return [
    claudeCliProvider,
    createAnthropicApiProvider(s.anthropicApiKey),
    createOpenAIProvider(s.openaiApiKey),
    createGeminiProvider(s.googleApiKey),
    createPerplexityProvider(s.perplexityApiKey),
  ];
}

export async function getProvider(id: ProviderId): Promise<LLMProvider> {
  const all = await getAllProviders();
  const provider = all.find((p) => p.id === id);
  if (!provider) throw new Error(`Unknown provider: ${id}`);
  return provider;
}

export async function getDefaultProvider(): Promise<LLMProvider> {
  const s = await getSettings();
  return getProvider(s.defaultProvider as ProviderId);
}

// For GEO tracker: returns every provider that's currently configured.
// Each enabled engine in this list will be polled when running a citation
// check, so we can measure brand presence across the whole AI search market.
export async function getAvailableProviders(): Promise<LLMProvider[]> {
  const all = await getAllProviders();
  const results = await Promise.all(
    all.map(async (p) => ((await p.isAvailable()) ? p : null)),
  );
  return results.filter((p): p is LLMProvider => p !== null);
}
