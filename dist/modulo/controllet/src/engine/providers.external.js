"use strict";
// Optional external provider using a simple HTTP POST to a configurable endpoint.
// Keeps deps minimal by reusing axios already in package.json.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const types_1 = require("./types");
class ExternalProvider {
    constructor(cfg) {
        this.cfg = cfg;
    }
    async generate(prompt, options) {
        const start = Date.now();
        const opts = { ...types_1.defaultGenOptions, ...(options || {}) };
        const headers = { 'Content-Type': 'application/json' };
        if (this.cfg.apiKey)
            headers['Authorization'] = `Bearer ${this.cfg.apiKey}`;
        const res = await axios_1.default.post(this.cfg.endpoint, { prompt, options: opts }, { headers, timeout: this.cfg.timeoutMs ?? 10000 });
        // Expected response shape: { text: string }
        const text = res.data?.text ?? '';
        return {
            text,
            tokensIn: prompt.split(/\s+/).filter(Boolean).length,
            tokensOut: text.split(/\s+/).filter(Boolean).length,
            latencyMs: Date.now() - start,
        };
    }
}
exports.ExternalProvider = ExternalProvider;
