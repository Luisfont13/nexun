"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.construir = construir;
// Módulo de construcción
function construir(bot, blockName, position) {
    const item = bot.inventory.items().find((i) => i.name.includes(blockName));
    if (item) {
        bot.equip(item, 'hand');
        bot.placeBlock(bot.blockAt(position), bot.entity.position);
        bot.chat(`Colocando ${blockName} en la posición indicada.`);
    }
    else {
        bot.chat('No tengo el bloque necesario.');
    }
}
