// Mecánica para buscar y abrir cofres
import { reconocerBloque } from './utils';

export function buscarCofres(bot: any) {
  const chestBlock = reconocerBloque(bot, 'chest');
  if (chestBlock && bot.entity.position.distanceTo(chestBlock.position) < 8) {
    bot.chat('¡Cofre detectado! Abriendo...');
    bot.openChest(chestBlock);
    return true;
  }
  return false;
}
