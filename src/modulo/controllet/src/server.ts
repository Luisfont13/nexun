// Ultra-light HTTP + static UI + simple vision + learning
// No heavy frameworks: use Node's http module

import http from 'http';
import fs from 'fs';
import path from 'path';
import { AILightEngine } from './engine';
import { learner } from './engine/learner';
import { analyzeBase64 } from './vision/basic';

const engine = new AILightEngine({ provider: (process.env.AI_PROVIDER as any) || 'local' });

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(process.cwd(), 'public');

function json(res: http.ServerResponse, status: number, body: unknown) {
  const data = Buffer.from(JSON.stringify(body));
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': data.length,
  });
  res.end(data);
}

function sendFile(res: http.ServerResponse, filePath: string, contentType = 'text/html; charset=utf-8') {
  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType, 'Content-Length': data.length });
    res.end(data);
  } catch {
    json(res, 404, { error: 'not found' });
  }
}

function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (!req.url) return json(res, 404, { error: 'not found' });

  // Static UI
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    const file = path.join(PUBLIC_DIR, 'index.html');
    return sendFile(res, file, 'text/html; charset=utf-8');
  }

  if (req.method === 'GET' && req.url === '/health') {
    return json(res, 200, { ok: true });
  }

  // Simple text API
  if (req.method === 'POST' && req.url === '/v1/generate') {
    try {
      const parsed = await parseBody(req);
      const prompt: string = parsed.prompt || '';
      if (!prompt) return json(res, 400, { error: 'prompt required' });
      const result = await engine.ask(prompt);
      return json(res, 200, { text: result.text, usage: { tokensIn: result.tokensIn, tokensOut: result.tokensOut }, latencyMs: result.latencyMs });
    } catch (e: any) {
      return json(res, 400, { error: e?.message || 'bad request' });
    }
  }

  // Learning endpoint (user provides correct answer for a prompt)
  if (req.method === 'POST' && req.url === '/v1/learn') {
    try {
      const parsed = await parseBody(req);
      const prompt: string = parsed.prompt || '';
      const answer: string = parsed.answer || '';
      if (!prompt || !answer) return json(res, 400, { error: 'prompt and answer required' });
      learner.learn(prompt, answer);
      return json(res, 200, { ok: true, stats: learner.stats() });
    } catch (e: any) {
      return json(res, 400, { error: e?.message || 'bad request' });
    }
  }

  // Learning config (adjust threshold)
  if (req.method === 'POST' && req.url === '/v1/learn/config') {
    try {
      const parsed = await parseBody(req);
      if (typeof parsed.threshold === 'number') {
        learner.setThreshold(parsed.threshold);
      }
      return json(res, 200, { ok: true, stats: learner.stats() });
    } catch (e: any) {
      return json(res, 400, { error: e?.message || 'bad request' });
    }
  }

  // Image endpoint (base64 or data URL)
  if (req.method === 'POST' && req.url === '/v1/generate-image') {
    try {
      const parsed = await parseBody(req);
      const image: string = parsed.image || '';
      const prompt: string = parsed.prompt || 'describe';
      if (!image) return json(res, 400, { error: 'image required (base64 or data URL)' });
      const info = analyzeBase64(image, 'image');
      const text = `Imagen recibida (${Math.round(info.bytes/1024)} KB). Nota: ${info.note}. Prompt: ${prompt}.`;
      return json(res, 200, { text, usage: { tokensIn: prompt.length / 4 | 0, tokensOut: text.length / 4 | 0 }, latencyMs: 2 });
    } catch (e: any) {
      return json(res, 400, { error: e?.message || 'bad request' });
    }
  }

  // Video frame endpoint (data URL)
  if (req.method === 'POST' && req.url === '/v1/generate-frame') {
    try {
      const parsed = await parseBody(req);
      const frame: string = parsed.frame || '';
      const prompt: string = parsed.prompt || 'describe';
      if (!frame) return json(res, 400, { error: 'frame required (data URL)' });
      const info = analyzeBase64(frame, 'video-frame');
      const text = `Frame recibido (${Math.round(info.bytes/1024)} KB). Nota: ${info.note}. Prompt: ${prompt}.`;
      return json(res, 200, { text, usage: { tokensIn: prompt.length / 4 | 0, tokensOut: text.length / 4 | 0 }, latencyMs: 2 });
    } catch (e: any) {
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