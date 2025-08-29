// Simple, lightweight learner for text associations
// Stores mappings from normalized prompts to preferred responses.
// Uses a tiny JSON file for persistence to keep RAM and dependencies minimal.

import fs from 'fs';
import path from 'path';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-záéíóúñü0-9\s.,!?]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export type LearnedEntry = {
  response: string;
  count: number;
  updatedAt: number;
};

export class SimpleLearner {
  private filePath: string;
  private cache: Record<string, LearnedEntry> = {};
  private minScore = 0.45; // similarity threshold (0..1)

  constructor(baseDir = path.join(process.cwd(), 'data'), fileName = 'learn.json') {
    this.filePath = path.join(baseDir, fileName);
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.cache = raw ? JSON.parse(raw) : {};
      } else {
        this.cache = {};
        fs.writeFileSync(this.filePath, JSON.stringify(this.cache));
      }
    } catch {
      this.cache = {};
    }
  }

  private persist() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.cache));
    } catch {
      // ignore
    }
  }

  // Very small token overlap score between two strings (0..1)
  private similarity(a: string, b: string): number {
    const ta = new Set(a.split(' '));
    const tb = new Set(b.split(' '));
    let inter = 0;
    for (const t of ta) if (tb.has(t)) inter++;
    const denom = Math.max(1, ta.size + tb.size - inter);
    return inter / denom; // Jaccard
  }

  getThreshold() { return this.minScore; }
  setThreshold(v: number) { this.minScore = Math.min(1, Math.max(0, v)); }

  suggest(prompt: string): string | null {
    const p = normalize(prompt);
    let bestKey = '';
    let bestScore = 0;
    for (const key of Object.keys(this.cache)) {
      const s = this.similarity(p, key);
      if (s > bestScore) {
        bestScore = s;
        bestKey = key;
      }
    }
    if (bestKey && bestScore >= this.minScore) {
      return this.cache[bestKey].response;
    }
    return null;
  }

  learn(prompt: string, desiredResponse: string) {
    const key = normalize(prompt);
    const prev = this.cache[key];
    this.cache[key] = {
      response: desiredResponse,
      count: (prev?.count || 0) + 1,
      updatedAt: Date.now(),
    };
    this.persist();
  }

  stats() {
    return {
      entries: Object.keys(this.cache).length,
      threshold: this.minScore,
    };
  }
}

// Singleton learner used by provider and server
export const learner = new SimpleLearner();