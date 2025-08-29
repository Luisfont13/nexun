"use strict";
// Simple, lightweight learner for text associations
// Stores mappings from normalized prompts to preferred responses.
// Uses a tiny JSON file for persistence to keep RAM and dependencies minimal.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.learner = exports.SimpleLearner = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function normalize(text) {
    return text
        .toLowerCase()
        .replace(/[^a-záéíóúñü0-9\s.,!?]/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
class SimpleLearner {
    constructor(baseDir = path_1.default.join(process.cwd(), 'data'), fileName = 'learn.json') {
        this.cache = {};
        this.minScore = 0.45; // similarity threshold (0..1)
        this.filePath = path_1.default.join(baseDir, fileName);
        fs_1.default.mkdirSync(path_1.default.dirname(this.filePath), { recursive: true });
        this.load();
    }
    load() {
        try {
            if (fs_1.default.existsSync(this.filePath)) {
                const raw = fs_1.default.readFileSync(this.filePath, 'utf-8');
                this.cache = raw ? JSON.parse(raw) : {};
            }
            else {
                this.cache = {};
                fs_1.default.writeFileSync(this.filePath, JSON.stringify(this.cache));
            }
        }
        catch {
            this.cache = {};
        }
    }
    persist() {
        try {
            fs_1.default.writeFileSync(this.filePath, JSON.stringify(this.cache));
        }
        catch {
            // ignore
        }
    }
    // Very small token overlap score between two strings (0..1)
    similarity(a, b) {
        const ta = new Set(a.split(' '));
        const tb = new Set(b.split(' '));
        let inter = 0;
        for (const t of ta)
            if (tb.has(t))
                inter++;
        const denom = Math.max(1, ta.size + tb.size - inter);
        return inter / denom; // Jaccard
    }
    getThreshold() { return this.minScore; }
    setThreshold(v) { this.minScore = Math.min(1, Math.max(0, v)); }
    suggest(prompt) {
        const p = normalize(prompt);
        let bestKey = '';
        let bestScore = 0;
        for (const key of Object.keys(this.cache)) {
            const s = this.similarity(p, key);
            if (s > bestScore) {
                bestScore = s;
                bestKey = key;
            }
        }
        if (bestKey && bestScore >= this.minScore) {
            return this.cache[bestKey].response;
        }
        return null;
    }
    learn(prompt, desiredResponse) {
        const key = normalize(prompt);
        const prev = this.cache[key];
        this.cache[key] = {
            response: desiredResponse,
            count: (prev?.count || 0) + 1,
            updatedAt: Date.now(),
        };
        this.persist();
    }
    stats() {
        return {
            entries: Object.keys(this.cache).length,
            threshold: this.minScore,
        };
    }
}
exports.SimpleLearner = SimpleLearner;
// Singleton learner used by provider and server
exports.learner = new SimpleLearner();
