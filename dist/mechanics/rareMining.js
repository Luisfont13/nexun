"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.explorarCuevasYMinar = explorarCuevasYMinar;
// Mecánica para explorar cuevas y minar minerales raros
const mineflayer_pathfinder_1 = require("mineflayer-pathfinder");
const mine_1 = require("./mine");
function explorarCuevasYMinar(bot) {
    const mcData = require('minecraft-data')(bot.version);
    const minerales = ['diamond_ore', 'emerald_ore', 'gold_ore', 'redstone_ore', 'lapis_ore'];
    for (const mineral of minerales) {
        const blockId = mcData.blocksByName[mineral]?.id;
        if (blockId) {
            const block = bot.findBlock({ matching: blockId, maxDistance: 48 });
            if (block) {
                bot.chat(`¡Mineral raro detectado (${mineral}), minando!`);
                bot.pathfinder.setGoal(new mineflayer_pathfinder_1.goals.GoalBlock(block.position.x, block.position.y, block.position.z));
                (0, mine_1.minar)(bot, mineral);
                return true;
            }
        }
    }
    return false;
}
