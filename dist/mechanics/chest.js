"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buscarCofres = buscarCofres;
// Mecánica para buscar y abrir cofres
const utils_1 = require("./utils");
function buscarCofres(bot) {
    const chestBlock = (0, utils_1.reconocerBloque)(bot, 'chest');
    if (chestBlock && bot.entity.position.distanceTo(chestBlock.position) < 8) {
        bot.chat('¡Cofre detectado! Abriendo...');
        bot.openChest(chestBlock);
        return true;
    }
    return false;
}
