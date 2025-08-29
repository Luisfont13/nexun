"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reconocerBloque = reconocerBloque;
// Utilidad para reconocimiento avanzado de bloques
function reconocerBloque(bot, nombre) {
    const mcData = require('minecraft-data')(bot.version);
    let blockId = mcData.blocksByName[nombre]?.id;
    if (!blockId) {
        for (const key in mcData.blocksByName) {
            if (key.includes(nombre)) {
                blockId = mcData.blocksByName[key].id;
                break;
            }
        }
    }
    if (blockId) {
        return bot.findBlock({ matching: blockId, maxDistance: 32 });
    }
    return null;
}
