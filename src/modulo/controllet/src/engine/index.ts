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
    // Forzado a local para eliminar dependencias externas
    this.provider = new LocalLightProvider();
  }

  async ask(prompt: string) {
    return this.provider.generate(prompt);
  }
}

export * from './types';