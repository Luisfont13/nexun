"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.minar = minar;
// Módulo de minería
function minar(bot, blockName) {
    const block = bot.findBlock({ matching: (b) => b.name === blockName, maxDistance: 32 });
    if (block) {
        // Verificar si el bloque es minable y no está siendo minado
        if (block.diggable && !bot.targetDigBlock) {
            bot.chat(`Minando ${blockName}...`);
            bot.dig(block);
        }
        else {
            bot.chat('No puedo minar ese bloque ahora.');
        }
    }
    else {
        bot.chat('No se encontró el bloque.');
    }
}
