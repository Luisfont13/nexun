"use strict";
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.NeuralNet = void 0;
// Red neuronal avanzada para el bot
const tf = __importStar(require("@tensorflow/tfjs"));
class NeuralNet {
    constructor() {
        this.model = tf.sequential();
        this.model.add(tf.layers.dense({ units: 32, activation: 'relu', inputShape: [10] }));
        this.model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
        this.model.add(tf.layers.dense({ units: 4, activation: 'softmax' }));
        this.model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy', metrics: ['accuracy'] });
    }
    async train(x, y) {
        await this.model.fit(tf.tensor2d(x), tf.tensor2d(y), { epochs: 10 });
    }
    predict(input) {
        const output = this.model.predict(tf.tensor2d([input]));
        return Array.from(output.dataSync());
    }
}
exports.NeuralNet = NeuralNet;
