export type ProviderId =
  | "claude-cli"
  | "anthropic-api"
  | "openai"
  | "gemini"
  | "perplexity";

export interface GenerateOptions {
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export interface GenerateResult {
  text: string;
  provider: ProviderId;
  model: string;
  sources?: string[];
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
}

export interface LLMProvider {
  id: ProviderId;
  label: string;
  description: string;
  isAvailable(): Promise<boolean>;
  generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult>;
}

export class ProviderUnavailableError extends Error {
  constructor(public providerId: ProviderId, message: string) {
    super(`[${providerId}] ${message}`);
    this.name = "ProviderUnavailableError";
  }
}
