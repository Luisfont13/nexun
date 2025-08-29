"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.branchMining = branchMining;
// Mecánica de minería en patrón de rama
const mine_1 = require("./mine");
function branchMining(bot) {
    const mcData = require('minecraft-data')(bot.version);
    const stoneId = mcData.blocksByName.stone?.id;
    for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
            if (dx === 0 && dz === 0)
                continue;
            const block = bot.blockAt(bot.entity.position.offset(dx, 0, dz));
            if (block && block.type === stoneId && block.diggable) {
                (0, mine_1.minar)(bot, block.name);
                return true;
            }
        }
    }
    return false;
}
