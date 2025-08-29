// Mecánica para hacer water drop perfecto (MLG)
export function hacerWaterDrop(bot: any) {
  const waterBucket = bot.inventory.items().find((i: any) => i.name.includes('water_bucket'));
  if (!waterBucket) {
    bot.chat('No tengo cubo de agua para hacer water drop.');
    return;
  }
  bot.equip(waterBucket, 'hand', () => {
    bot.on('move', () => {
      if (bot.entity.velocity.y < -0.6 && bot.entity.position.y < bot.entity.position.y - 2) {
        bot.activateItem();
        bot.chat('¡Water drop realizado!');
      }
    });
  });
}
