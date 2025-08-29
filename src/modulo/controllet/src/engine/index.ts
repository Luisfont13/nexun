// Public entrypoint for the lightweight AI engine

import { ModelProvider } from './types';
import { LocalLightProvider } from './providers.local';
import { ExternalProvider, ExternalProviderConfig } from './providers.external';

export type EngineOptions = {
  provider: 'local' | 'external';
  external?: ExternalProviderConfig;
};

export class AILightEngine {
  private provider: ModelProvider;

  constructor(opts?: Partial<EngineOptions>) {
    const providerName = opts?.provider ?? (process.env.AI_PROVIDER as 'local' | 'external') ?? 'local';
    if (providerName === 'external') {
      const endpoint = opts?.external?.endpoint || process.env.AI_ENDPOINT || '';
      if (!endpoint) throw new Error('External provider requires endpoint');
      this.provider = new ExternalProvider({
        endpoint,
        apiKey: opts?.external?.apiKey || process.env.AI_API_KEY,
        timeoutMs: opts?.external?.timeoutMs ? Number(opts.external.timeoutMs) : undefined,
      });
    } else {
      this.provider = new LocalLightProvider();
    }
  }

  async ask(prompt: string) {
    return this.provider.generate(prompt);
  }
}

export * from './types';