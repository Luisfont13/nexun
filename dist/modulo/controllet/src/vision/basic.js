"use strict";
// Ultra-light vision stubs: no heavy deps, just metadata and simple heuristics
// The client computes basic info (width/height) via canvas and sends it if needed.
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeBase64 = analyzeBase64;
function analyzeBase64(dataUrlOrBase64, kind = 'image') {
    // Accept either pure base64 or data URL
    const commaIdx = dataUrlOrBase64.indexOf(',');
    const base64 = commaIdx >= 0 ? dataUrlOrBase64.slice(commaIdx + 1) : dataUrlOrBase64;
    const bytes = Math.floor((base64.length * 3) / 4);
    const note = kind === 'image' ? 'Imagen recibida' : 'Frame de video recibido';
    return { kind, bytes, note };
}
