"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hacerWaterDrop = hacerWaterDrop;
// Mecánica para hacer water drop perfecto (MLG)
function hacerWaterDrop(bot) {
    const waterBucket = bot.inventory.items().find((i) => i.name.includes('water_bucket'));
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
