// Common types for the lightweight AI engine

export type ModelResponse = {
  text: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
};

export interface ModelProvider {
  // Simple text-in text-out interface
  generate(prompt: string, options?: Partial<GenOptions>): Promise<ModelResponse>;
}

export type GenOptions = {
  // Max output tokens (keep small to be lightweight)
  maxTokens: number;
  // Temperature for randomness
  temperature: number; // 0.0 - 1.0
  // Top-k/top-p optional in future
};

export const defaultGenOptions: GenOptions = {
  maxTokens: 128,
  temperature: 0.7,
};