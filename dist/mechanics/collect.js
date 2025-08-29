"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recolectar = recolectar;
// Módulo de recolección de recursos
function recolectar(bot, resourceName) {
    const block = bot.findBlock({ matching: (b) => b.name.includes(resourceName), maxDistance: 32 });
    if (block) {
        bot.chat(`Recolectando ${resourceName}...`);
        bot.dig(block);
    }
    else {
        bot.chat('No se encontró el recurso.');
    }
}
