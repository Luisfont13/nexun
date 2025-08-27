// Mecánica para hacer puentes sobre huecos profundos
export function hacerPuente(bot: any) {
  const forward = bot.entity.position.offset(0, -1, 2);
  const blockBelow = bot.blockAt(forward);
  if (!blockBelow || blockBelow.name === 'air') {
    const bloques = bot.inventory.items().filter((i: any) => i.name.includes('planks') || i.name.includes('stone') || i.name.includes('dirt'));
    if (bloques.length > 0) {
      bot.equip(bloques[0], 'hand');
      bot.placeBlock(bot.blockAt(bot.entity.position.offset(0, -1, 1)), bot.entity.position.offset(0, 0, 2));
      bot.chat('Colocando bloque para hacer puente.');
    } else {
      bot.chat('No tengo bloques para hacer puente.');
    }
  }
}
