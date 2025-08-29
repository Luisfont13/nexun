"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.explorarAldea = explorarAldea;
// Mecánica para explorar aldeas
const mineflayer_pathfinder_1 = require("mineflayer-pathfinder");
const utils_1 = require("./utils");
function explorarAldea(bot) {
    const villagerBlock = (0, utils_1.reconocerBloque)(bot, 'villager');
    if (villagerBlock) {
        bot.chat('Aldea detectada, explorando...');
        bot.pathfinder.setGoal(new mineflayer_pathfinder_1.goals.GoalBlock(villagerBlock.position.x, villagerBlock.position.y, villagerBlock.position.z));
        return true;
    }
    return false;
}
