// Utilidad para reconocimiento avanzado de bloques
export function reconocerBloque(bot: any, nombre: string): any {
  const mcData = require('minecraft-data')(bot.version);
  let blockId = mcData.blocksByName[nombre]?.id;
  if (!blockId) {
    for (const key in mcData.blocksByName) {
      if (key.includes(nombre)) {
        blockId = mcData.blocksByName[key].id;
        break;
      }
    }
  }
  if (blockId) {
    return bot.findBlock({ matching: blockId, maxDistance: 32 });
  }
  return null;
}
