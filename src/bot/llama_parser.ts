// Parser de instrucciones estructuradas para Llama
// Interpreta respuestas de la IA en formato JSON o texto y ejecuta acciones seguras del bot

import { botApi } from './bot';

// Lista blanca de acciones permitidas
const ALLOWED_ACTIONS = ['mover', 'minar', 'recolectar', 'atacar', 'chatear', 'equipar'];

export function parseAndExecuteLlamaInstruction(instruction: string) {
  let parsed;
  try {
    parsed = JSON.parse(instruction);
  } catch {
    // Si no es JSON, intenta parsear comandos simples tipo "mover x y z"
    const parts = instruction.trim().split(/\s+/);
    const action = parts[0].toLowerCase();
    if (!ALLOWED_ACTIONS.includes(action)) return false;
    if (action === 'mover' && parts.length === 4) return botApi.mover(Number(parts[1]), Number(parts[2]), Number(parts[3]));
    if (action === 'minar' && parts.length === 2) return botApi.minar(parts[1]);
    if (action === 'recolectar' && parts.length === 2) return botApi.recolectar(parts[1]);
    if (action === 'atacar' && parts.length === 2) return botApi.atacar(parts[1]);
    if (action === 'chatear' && parts.length >= 2) return botApi.chatear(parts.slice(1).join(' '));
  if (action === 'equipar') return botApi.equipar();
    return false;
  }
  // Si es JSON estructurado
  if (typeof parsed === 'object' && parsed.action && ALLOWED_ACTIONS.includes(parsed.action)) {
    const { action, args = [] } = parsed;
    if (typeof botApi[action] === 'function') {
      return botApi[action](...args);
    }
  }
  return false;
}

// Ejemplo de uso:
// parseAndExecuteLlamaInstruction('{"action":"mover","args":[10,64,20]}')
// parseAndExecuteLlamaInstruction('mover 10 64 20')
