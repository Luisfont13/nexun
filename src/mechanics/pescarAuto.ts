// Mecánica para pescar automáticamente
import { reconocerBloque } from './utils';

export function pescarAuto(bot: any) {
  const rod = bot.inventory.items().find((i: any) => i.name.includes('fishing_rod'));
  if (rod) {
    const waterBlock = reconocerBloque(bot, 'water');
    if (waterBlock && bot.entity.position.distanceTo(waterBlock.position) < 6) {
      bot.equip(rod, 'hand');
      bot.activateItem();
      bot.chat('¡Pescando automáticamente!');
    }
  }
}
