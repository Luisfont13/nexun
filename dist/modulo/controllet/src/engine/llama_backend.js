"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
// Configuración de OpenRouters
const OPENROUTERS_API_KEY = process.env.OPENROUTERS_API_KEY || "your_openrouters_api_key";
const OPENROUTERS_API_URL = "https://api.openrouters.com/v1/generate";
const app = (0, fastify_1.default)({ logger: true });
app.post('/v1/generate', async (request, reply) => {
    const { prompt, options = {} } = request.body;
    const maxTokens = options.maxTokens || 128;
    const temperature = options.temperature || 0.7;
    const topK = options.topK || 50;
    const topP = options.topP || 0.95;
    try {
        const response = await axios_1.default.post(OPENROUTERS_API_URL, {
            prompt,
            max_tokens: maxTokens,
            temperature,
            top_k: topK,
            top_p: topP
        }, {
            headers: {
                'Authorization': `Bearer ${OPENROUTERS_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        const text = response.data.choices[0].text.trim();
        // Logging opcional
        console.log(`[LLAMA] Prompt: ${prompt}\n[LLAMA] Respuesta: ${text}`);
        return reply.send({ text });
    }
    catch (e) {
        console.error(`[ERROR] Llama inference: ${e}`);
        return reply.send({ text: `[ERROR] ${e}` });
    }
});
const start = async () => {
    try {
        await app.listen({ port: 8000, host: '0.0.0.0' });
        console.log(`Servidor corriendo en http://0.0.0.0:8000`);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
start();
