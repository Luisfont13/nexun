import { AILightEngine } from "./index";

// Instancia global del motor IA, configurado para external (Llama backend)
export const iaEngine = new AILightEngine({
  provider: 'external',
  external: {
    endpoint: process.env.AI_ENDPOINT || 'http://localhost:8000/v1/generate',
    apiKey: process.env.AI_API_KEY || undefined
  }
});

export async function hablarEnLenguajeNatural(texto: string): Promise<string> {
  try {
    const res = await iaEngine.ask(texto);
    return res.text || 'Sin respuesta de Llama.';
  } catch (e) {
    return 'Error consultando Llama.';
  }
}
