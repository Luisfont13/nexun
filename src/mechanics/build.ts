// Módulo de construcción
export function construir(bot: any, blockName: string, position: any) {
  const item = bot.inventory.items().find((i: any) => i.name.includes(blockName));
  if (item) {
    bot.equip(item, 'hand');
    bot.placeBlock(bot.blockAt(position), bot.entity.position);
    bot.chat(`Colocando ${blockName} en la posición indicada.`);
  } else {
    bot.chat('No tengo el bloque necesario.');
  }
}
