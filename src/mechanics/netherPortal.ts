// Mecánica para construir portal al Nether
import { reconocerBloque } from './utils';

export function construirNetherPortal(bot: any) {
  const obsidian = bot.inventory.items().filter((i: any) => i.name.includes('obsidian'));
  const flintSteel = bot.inventory.items().find((i: any) => i.name.includes('flint_and_steel'));
  if (obsidian.length >= 10 && flintSteel) {
    bot.chat('Construyendo portal al Nether...');
    for (let y = 0; y < 5; y++) {
      bot.equip(obsidian[0], 'hand');
      bot.placeBlock(bot.blockAt(bot.entity.position.offset(1, y - 1, 0)), bot.entity.position.offset(1, y, 0));
      bot.placeBlock(bot.blockAt(bot.entity.position.offset(-1, y - 1, 0)), bot.entity.position.offset(-1, y, 0));
    }
    for (let x = -1; x <= 1; x++) {
      bot.equip(obsidian[0], 'hand');
      bot.placeBlock(bot.blockAt(bot.entity.position.offset(x, -1, 0)), bot.entity.position.offset(x, 0, 0));
      bot.placeBlock(bot.blockAt(bot.entity.position.offset(x, 4, 0)), bot.entity.position.offset(x, 4, 0));
    }
    bot.equip(flintSteel, 'hand');
    bot.activateBlock(bot.blockAt(bot.entity.position.offset(0, 0, 0)));
    bot.chat('Portal al Nether encendido.');
    return true;
  } else {
    bot.chat('No tengo suficientes materiales para el portal.');
    return false;
  }
}
