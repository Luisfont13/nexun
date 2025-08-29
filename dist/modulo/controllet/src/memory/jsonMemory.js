"use strict";
// JSON memory store: stores frequent/recurrent interactions in a JSONL file
// Keeps data small and easy to read/append. Designed for low overhead.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonMemoryStore = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class JsonMemoryStore {
    constructor(baseDir = path_1.default.join(process.cwd(), 'data'), fileName = 'sessions.jsonl') {
        this.filePath = path_1.default.join(baseDir, fileName);
        fs_1.default.mkdirSync(path_1.default.dirname(this.filePath), { recursive: true });
        if (!fs_1.default.existsSync(this.filePath))
            fs_1.default.writeFileSync(this.filePath, '');
    }
    append(interaction) {
        const line = JSON.stringify(interaction);
        fs_1.default.appendFileSync(this.filePath, line + '\n');
    }
    readLast(n = 50) {
        try {
            const content = fs_1.default.readFileSync(this.filePath, 'utf-8');
            const lines = content.trim().split(/\n+/).filter(Boolean);
            const last = lines.slice(-n);
            return last.map(l => JSON.parse(l));
        }
        catch {
            return [];
        }
    }
    allCount() {
        try {
            const content = fs_1.default.readFileSync(this.filePath, 'utf-8');
            return content.trim() ? content.trim().split(/\n+/).length : 0;
        }
        catch {
            return 0;
        }
    }
}
exports.JsonMemoryStore = JsonMemoryStore;
