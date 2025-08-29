"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.construirRefugio = construirRefugio;
// Mecánica para construir refugio automático
function construirRefugio(bot) {
    const mobs = Object.values(bot.entities).filter((e) => e.type === 'mob' && e.position && e.position.distanceTo(bot.entity.position) < 12);
    if (mobs.length > 2) {
        const block = bot.inventory.items().find((i) => i.name.includes('planks') || i.name.includes('stone'));
        if (block) {
            bot.equip(block, 'hand');
            for (let dx = -1; dx <= 1; dx++) {
                for (let dz = -1; dz <= 1; dz++) {
                    bot.placeBlock(bot.blockAt(bot.entity.position.offset(dx, -1, dz)), bot.entity.position.offset(dx, 0, dz));
                }
            }
            bot.chat('¡Refugio construido para protegerme de mobs!');
        }
    }
}
