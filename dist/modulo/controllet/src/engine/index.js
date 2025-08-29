"use strict";
// Public entrypoint for the lightweight AI engine
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AILightEngine = void 0;
const providers_local_1 = require("./providers.local");
const providers_external_1 = require("./providers.external");
class AILightEngine {
    constructor(opts) {
        const providerName = opts?.provider ?? process.env.AI_PROVIDER ?? 'local';
        if (providerName === 'external') {
            const endpoint = opts?.external?.endpoint || process.env.AI_ENDPOINT || '';
            if (!endpoint)
                throw new Error('External provider requires endpoint');
            this.provider = new providers_external_1.ExternalProvider({
                endpoint,
                apiKey: opts?.external?.apiKey || process.env.AI_API_KEY,
                timeoutMs: opts?.external?.timeoutMs ? Number(opts.external.timeoutMs) : undefined,
            });
        }
        else {
            this.provider = new providers_local_1.LocalLightProvider();
        }
    }
    async ask(prompt) {
        return this.provider.generate(prompt);
    }
}
exports.AILightEngine = AILightEngine;
__exportStar(require("./types"), exports);
