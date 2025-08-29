"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pescarAuto = pescarAuto;
// Mecánica para pescar automáticamente
const utils_1 = require("./utils");
function pescarAuto(bot) {
    const rod = bot.inventory.items().find((i) => i.name.includes('fishing_rod'));
    if (rod) {
        const waterBlock = (0, utils_1.reconocerBloque)(bot, 'water');
        if (waterBlock && bot.entity.position.distanceTo(waterBlock.position) < 6) {
            bot.equip(rod, 'hand');
            bot.activateItem();
            bot.chat('¡Pescando automáticamente!');
        }
    }
}
