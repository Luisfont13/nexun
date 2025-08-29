// Lightweight local NLP + FAQ-based responder
// - Loads a JSON knowledge base with patterns and answers
// - Contains small rule-based intents for common Minecraft actions
// - No external services

import * as fs from 'fs';
import * as path from 'path';

type QAItem = {
  patterns: string[]; // regex strings (case-insensitive)
  answers: string[];  // candidate answers
};

let kb: QAItem[] = [];

function loadKnowledgeBase() {
  try {
    const kbPath = path.resolve(process.cwd(), 'data', 'knowledge.json');
    const raw = fs.readFileSync(kbPath, 'utf-8');
    const data = JSON.parse(raw);
    if (Array.isArray(data)) kb = data;
  } catch (_) {
    kb = [];
  }
}

loadKnowledgeBase();

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function localFAQ(text: string): string | null {
  const msg = text.trim();
  for (const item of kb) {
    for (const pat of item.patterns) {
      try {
        const r = new RegExp(pat, 'i');
        if (r.test(msg)) return pick(item.answers);
      } catch {
        // ignore bad regex
      }
    }
  }
  return null;
}

export function localSmallTalk(text: string): string | null {
  if (/^(hola|buenas|hello|hi)(\b|!|\.)/i.test(text)) return pick([
    '¡Hola! ¿Qué necesitas?',
    '¡Buenas! ¿En qué te ayudo?',
  ]);
  if (/gracias|thank(s)?/i.test(text)) return pick([
    '¡De nada!',
    'Cuando quieras.',
  ]);
  if (/quien eres|tu eres un bot|eres un bot/i.test(text)) return 'Soy un bot ayudante de Minecraft con IA local.';
  return null;
}

export function localGameplayHints(text: string): string | null {
  if (/madera|tronco|wood/i.test(text)) return 'Para madera, tala árboles cercanos con un hacha.';
  if (/comida|food|hambr/i.test(text)) return 'Consigue comida cazando, pescando o cosechando trigo para pan.';
  if (/mesa de crafteo|crafting table/i.test(text)) return 'Craftea una mesa con 4 tablones. Úsala para recetas avanzadas.';
  if (/min(a|ar)/i.test(text)) return 'Para minar mejor, usa un pico adecuado y antorchas. Evita la lava.';
  return null;
}

export function hablarEnLenguajeNaturalLocal(text: string): string {
  // Priority: FAQ -> SmallTalk -> Hints -> fallback
  return (
    localFAQ(text) ||
    localSmallTalk(text) ||
    localGameplayHints(text) ||
    'No estoy seguro, pero puedo intentarlo si me das una orden más específica.'
  );
}