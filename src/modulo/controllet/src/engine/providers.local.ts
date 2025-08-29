// Extremely lightweight local provider (rule-based + tiny n-gramish fallback)
// Goal: zero heavy dependencies, minimal RAM, fast start.

import { ModelProvider, ModelResponse, GenOptions, defaultGenOptions } from './types';
import { learner } from './learner';

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-záéíóúñü0-9\s.,!?]/gi, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

// Simple heuristics for common intents (demo only)
const rules: { match: RegExp; reply: (q: string) => string }[] = [
  { match: /hola|buenas|hello/i, reply: () => '¡Hola! ¿En qué puedo ayudarte?' },
  { match: /quién eres|quien eres|qué eres|que eres/i, reply: () => 'Soy un motor de IA ligero diseñado para integrarme a APIs.' },
  { match: /ayuda|help/i, reply: () => 'Puedo responder preguntas cortas, resumir texto y generar respuestas simples.' },
];

export class LocalLightProvider implements ModelProvider {
  async generate(prompt: string, options?: Partial<GenOptions>): Promise<ModelResponse> {
    const start = Date.now();
    const opts = { ...defaultGenOptions, ...(options || {}) };

    // 1) Learned suggestions first (if any close match is found)
    const learned = learner.suggest(prompt);
    if (learned) {
      const text = learned;
      return {
        text,
        tokensIn: tokenize(prompt).length,
        tokensOut: tokenize(text).length,
        latencyMs: Date.now() - start,
      };
    }

    // 2) Rule-based quick answers
    for (const r of rules) {
      if (r.match.test(prompt)) {
        const text = r.reply(prompt);
        return {
          text,
          tokensIn: tokenize(prompt).length,
          tokensOut: tokenize(text).length,
          latencyMs: Date.now() - start,
        };
      }
    }

    // 3) Tiny extractive summary if looks long
    if (prompt.length > 400) {
      const sentences = prompt
        .split(/[.!?]\s+/)
        .map(s => s.trim())
        .filter(Boolean);
      const firstTwo = sentences.slice(0, 2).join('. ');
      const text = `${firstTwo}${firstTwo ? '.' : ''} (resumen breve)`;
      return {
        text: text.slice(0, Math.max(10, opts.maxTokens * 6)), // rough chars per token
        tokensIn: tokenize(prompt).length,
        tokensOut: tokenize(text).length,
        latencyMs: Date.now() - start,
      };
    }

    // 4) N-gram-ish continuation: choose common next words based on prompt tail
    const words = tokenize(prompt);
    const last = words.slice(-1)[0] || '';
    const smallVocab = ['es', 'un', 'motor', 'ligero', 'para', 'apis', 'y', 'respuestas', 'simples'];
    let out = [] as string[];
    for (let i = 0; i < Math.max(5, Math.min(25, Math.floor(opts.maxTokens / 2))); i++) {
      const pick = smallVocab[(last.charCodeAt(0) + i) % smallVocab.length] || 'ai';
      out.push(pick);
    }
    const text = (prompt.trim() ? prompt.trim() + ' ' : '') + out.join(' ');

    return {
      text: text.slice(0, Math.max(10, opts.maxTokens * 6)),
      tokensIn: words.length,
      tokensOut: tokenize(text).length,
      latencyMs: Date.now() - start,
    };
  }
}