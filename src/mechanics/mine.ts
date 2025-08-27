// Módulo de minería
export function minar(bot: any, blockName: string) {
  const block = bot.findBlock({ matching: (b: any) => b.name === blockName, maxDistance: 32 });
  if (block) {
    // Verificar si el bloque es minable y no está siendo minado
    if (block.diggable && !bot.targetDigBlock) {
      bot.chat(`Minando ${blockName}...`);
      bot.dig(block);
    } else {
      bot.chat('No puedo minar ese bloque ahora.');
    }
  } else {
    bot.chat('No se encontró el bloque.');
  }
}
