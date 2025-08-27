// Mecánica para explorar aldeas
import { goals } from 'mineflayer-pathfinder';
import { reconocerBloque } from './utils';

export function explorarAldea(bot: any) {
  const villagerBlock = reconocerBloque(bot, 'villager');
  if (villagerBlock) {
    bot.chat('Aldea detectada, explorando...');
    bot.pathfinder.setGoal(new goals.GoalBlock(villagerBlock.position.x, villagerBlock.position.y, villagerBlock.position.z));
    return true;
  }
  return false;
}
