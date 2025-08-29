"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plantarAuto = plantarAuto;
// Mecánica para plantar árboles y cultivos
function plantarAuto(bot) {
    const sapling = bot.inventory.items().find((i) => i.name.includes('sapling'));
    if (sapling) {
        bot.equip(sapling, 'hand');
        bot.placeBlock(bot.blockAt(bot.entity.position.offset(1, -1, 0)), bot.entity.position.offset(1, 0, 0));
        bot.chat('Plantando árbol para autoabastecimiento.');
    }
    const seeds = bot.inventory.items().find((i) => i.name.includes('seeds'));
    if (seeds) {
        bot.equip(seeds, 'hand');
        bot.placeBlock(bot.blockAt(bot.entity.position.offset(-1, -1, 0)), bot.entity.position.offset(-1, 0, 0));
        bot.chat('Plantando cultivo para autoabastecimiento.');
    }
}
