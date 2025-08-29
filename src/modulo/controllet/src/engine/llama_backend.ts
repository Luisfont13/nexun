import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import axios from 'axios';
import { config } from 'dotenv';

config();

// Configuración de OpenRouters
const OPENROUTERS_API_KEY = process.env.OPENROUTERS_API_KEY || "your_openrouters_api_key";
const OPENROUTERS_API_URL = "https://api.openrouters.com/v1/generate";

const app: FastifyInstance = fastify({ logger: true });

interface GenRequest {
    prompt: string;
    options: {
        maxTokens?: number;
        temperature?: number;
        topK?: number;
        topP?: number;
    };
}

app.post('/v1/generate', async (request: FastifyRequest<{ Body: GenRequest }>, reply: FastifyReply) => {
    const { prompt, options = {} } = request.body;
    const maxTokens = options.maxTokens || 128;
    const temperature = options.temperature || 0.7;
    const topK = options.topK || 50;
    const topP = options.topP || 0.95;

    try {
        const response = await axios.post(
            OPENROUTERS_API_URL,
            {
                prompt,
                max_tokens: maxTokens,
                temperature,
                top_k: topK,
                top_p: topP
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENROUTERS_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const text = response.data.choices[0].text.trim();
        // Logging opcional
        console.log(`[LLAMA] Prompt: ${prompt}\n[LLAMA] Respuesta: ${text}`);
        return reply.send({ text });
    } catch (e) {
        console.error(`[ERROR] Llama inference: ${e}`);
        return reply.send({ text: `[ERROR] ${e}` });
    }
});

const start = async () => {
    try {
        await app.listen({ port: 8000, host: '0.0.0.0' });
        console.log(`Servidor corriendo en http://0.0.0.0:8000`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
