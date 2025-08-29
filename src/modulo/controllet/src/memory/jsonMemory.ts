// JSON memory store: stores frequent/recurrent interactions in a JSONL file
// Keeps data small and easy to read/append. Designed for low overhead.

import fs from 'fs';
import path from 'path';

export type Interaction = {
  ts: number; // timestamp ms
  prompt: string;
  text: string;
  tokensIn: number;
  tokensOut: number;
};

export class JsonMemoryStore {
  private filePath: string;
  constructor(baseDir = path.join(process.cwd(), 'data'), fileName = 'sessions.jsonl') {
    this.filePath = path.join(baseDir, fileName);
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    if (!fs.existsSync(this.filePath)) fs.writeFileSync(this.filePath, '');
  }

  append(interaction: Interaction) {
    const line = JSON.stringify(interaction);
    fs.appendFileSync(this.filePath, line + '\n');
  }

  readLast(n = 50): Interaction[] {
    try {
      const content = fs.readFileSync(this.filePath, 'utf-8');
      const lines = content.trim().split(/\n+/).filter(Boolean);
      const last = lines.slice(-n);
      return last.map(l => JSON.parse(l));
    } catch {
      return [];
    }
  }

  allCount(): number {
    try {
      const content = fs.readFileSync(this.filePath, 'utf-8');
      return content.trim() ? content.trim().split(/\n+/).length : 0;
    } catch {
      return 0;
    }
  }
}