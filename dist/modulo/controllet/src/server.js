"use strict";
// Ultra-light HTTP + static UI + simple vision + learning
// No heavy frameworks: use Node's http module
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const engine_1 = require("./engine");
const learner_1 = require("./engine/learner");
const basic_1 = require("./vision/basic");
const engine = new engine_1.AILightEngine({ provider: process.env.AI_PROVIDER || 'local' });
const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path_1.default.join(process.cwd(), 'public');
function json(res, status, body) {
    const data = Buffer.from(JSON.stringify(body));
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': data.length,
    });
    res.end(data);
}
function sendFile(res, filePath, contentType = 'text/html; charset=utf-8') {
    try {
        const data = fs_1.default.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': contentType, 'Content-Length': data.length });
        res.end(data);
    }
    catch {
        json(res, 404, { error: 'not found' });
    }
}
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => (body += chunk));
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            }
            catch (e) {
                reject(e);
            }
        });
        req.on('error', reject);
    });
}
const server = http_1.default.createServer(async (req, res) => {
    if (!req.url)
        return json(res, 404, { error: 'not found' });
    // Static UI
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
        const file = path_1.default.join(PUBLIC_DIR, 'index.html');
        return sendFile(res, file, 'text/html; charset=utf-8');
    }
    if (req.method === 'GET' && req.url === '/health') {
        return json(res, 200, { ok: true });
    }
    // Simple text API
    if (req.method === 'POST' && req.url === '/v1/generate') {
        try {
            const parsed = await parseBody(req);
            const prompt = parsed.prompt || '';
            if (!prompt)
                return json(res, 400, { error: 'prompt required' });
            const result = await engine.ask(prompt);
            return json(res, 200, { text: result.text, usage: { tokensIn: result.tokensIn, tokensOut: result.tokensOut }, latencyMs: result.latencyMs });
        }
        catch (e) {
            return json(res, 400, { error: e?.message || 'bad request' });
        }
    }
    // Learning endpoint (user provides correct answer for a prompt)
    if (req.method === 'POST' && req.url === '/v1/learn') {
        try {
            const parsed = await parseBody(req);
            const prompt = parsed.prompt || '';
            const answer = parsed.answer || '';
            if (!prompt || !answer)
                return json(res, 400, { error: 'prompt and answer required' });
            learner_1.learner.learn(prompt, answer);
            return json(res, 200, { ok: true, stats: learner_1.learner.stats() });
        }
        catch (e) {
            return json(res, 400, { error: e?.message || 'bad request' });
        }
    }
    // Learning config (adjust threshold)
    if (req.method === 'POST' && req.url === '/v1/learn/config') {
        try {
            const parsed = await parseBody(req);
            if (typeof parsed.threshold === 'number') {
                learner_1.learner.setThreshold(parsed.threshold);
            }
            return json(res, 200, { ok: true, stats: learner_1.learner.stats() });
        }
        catch (e) {
            return json(res, 400, { error: e?.message || 'bad request' });
        }
    }
    // Image endpoint (base64 or data URL)
    if (req.method === 'POST' && req.url === '/v1/generate-image') {
        try {
            const parsed = await parseBody(req);
            const image = parsed.image || '';
            const prompt = parsed.prompt || 'describe';
            if (!image)
                return json(res, 400, { error: 'image required (base64 or data URL)' });
            const info = (0, basic_1.analyzeBase64)(image, 'image');
            const text = `Imagen recibida (${Math.round(info.bytes / 1024)} KB). Nota: ${info.note}. Prompt: ${prompt}.`;
            return json(res, 200, { text, usage: { tokensIn: prompt.length / 4 | 0, tokensOut: text.length / 4 | 0 }, latencyMs: 2 });
        }
        catch (e) {
            return json(res, 400, { error: e?.message || 'bad request' });
        }
    }
    // Video frame endpoint (data URL)
    if (req.method === 'POST' && req.url === '/v1/generate-frame') {
        try {
            const parsed = await parseBody(req);
            const frame = parsed.frame || '';
            const prompt = parsed.prompt || 'describe';
            if (!frame)
                return json(res, 400, { error: 'frame required (data URL)' });
            const info = (0, basic_1.analyzeBase64)(frame, 'video-frame');
            const text = `Frame recibido (${Math.round(info.bytes / 1024)} KB). Nota: ${info.note}. Prompt: ${prompt}.`;
            return json(res, 200, { text, usage: { tokensIn: prompt.length / 4 | 0, tokensOut: text.length / 4 | 0 }, latencyMs: 2 });
        }
        catch (e) {
            return json(res, 400, { error: e?.message || 'bad request' });
        }
    }
    // Fallback
    return json(res, 404, { error: 'not found' });
});
server.listen(PORT, () => {
    console.log(`[AI-Light] listening on http://0.0.0.0:${PORT}`);
    console.log(`UI: open http://localhost:${PORT}/`);
});
