// Optional external provider using a simple HTTP POST to a configurable endpoint.
// Keeps deps minimal by reusing axios already in package.json.

import axios from 'axios';
import { ModelProvider, ModelResponse, GenOptions, defaultGenOptions } from './types';

export type ExternalProviderConfig = {
  endpoint: string; // e.g., 'http://localhost:8000/generate'
  apiKey?: string;
  timeoutMs?: number;
};

export class ExternalProvider implements ModelProvider {
  constructor(private cfg: ExternalProviderConfig) {}

  async generate(prompt: string, options?: Partial<GenOptions>): Promise<ModelResponse> {
    const start = Date.now();
    const opts = { ...defaultGenOptions, ...(options || {}) };

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.cfg.apiKey) headers['Authorization'] = `Bearer ${this.cfg.apiKey}`;

    const res = await axios.post(
      this.cfg.endpoint,
      { prompt, options: opts },
      { headers, timeout: this.cfg.timeoutMs ?? 10000 }
    );

    // Expected response shape: { text: string }
    const text: string = res.data?.text ?? '';

    return {
      text,
      tokensIn: prompt.split(/\s+/).filter(Boolean).length,
      tokensOut: text.split(/\s+/).filter(Boolean).length,
      latencyMs: Date.now() - start,
    };
  }
}