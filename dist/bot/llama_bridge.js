"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.iaEngine = void 0;
exports.hablarEnLenguajeNatural = hablarEnLenguajeNatural;
const index_1 = require("../modulo/controllet/src/engine/index");
// Instancia global del motor IA, configurado para external (Llama backend)
exports.iaEngine = new index_1.AILightEngine({
    provider: 'external',
    external: {
        endpoint: process.env.AI_ENDPOINT || 'http://localhost:8000/v1/generate',
        apiKey: process.env.AI_API_KEY || undefined
    }
});
async function hablarEnLenguajeNatural(texto) {
    try {
        const res = await exports.iaEngine.ask(texto);
        return res.text || 'Sin respuesta de Llama.';
    }
    catch (e) {
        return 'Error consultando Llama.';
    }
}
