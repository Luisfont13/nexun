// Módulo de recolección de recursos
export function recolectar(bot: any, resourceName: string) {
  const block = bot.findBlock({ matching: (b: any) => b.name.includes(resourceName), maxDistance: 32 });
  if (block) {
    bot.chat(`Recolectando ${resourceName}...`);
    bot.dig(block);
  } else {
    bot.chat('No se encontró el recurso.');
  }
}
