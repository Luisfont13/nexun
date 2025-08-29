"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Reconexión = Reconexión;
function Reconexión(bot) {
    bot.chat('Reconectando...');
    bot.connect();
}
