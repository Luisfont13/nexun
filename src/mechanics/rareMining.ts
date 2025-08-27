// Mecánica para explorar cuevas y minar minerales raros
import { goals } from 'mineflayer-pathfinder';
import { minar } from './mine';

export function explorarCuevasYMinar(bot: any) {
  const mcData = require('minecraft-data')(bot.version);
  const minerales = ['diamond_ore', 'emerald_ore', 'gold_ore', 'redstone_ore', 'lapis_ore'];
  for (const mineral of minerales) {
    const blockId = mcData.blocksByName[mineral]?.id;
    if (blockId) {
      const block = bot.findBlock({ matching: blockId, maxDistance: 48 });
      if (block) {
        bot.chat(`¡Mineral raro detectado (${mineral}), minando!`);
        bot.pathfinder.setGoal(new goals.GoalBlock(block.position.x, block.position.y, block.position.z));
        minar(bot, mineral);
        return true;
      }
    }
  }
  return false;
}
