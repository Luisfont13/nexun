"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attackPlayer = attackPlayer;
// Módulo de PvP contra jugadores
function attackPlayer(bot, playerName) {
    const player = bot.players[playerName];
    if (player && player.entity) {
        bot.chat(`Atacando a ${playerName}...`);
        bot.lookAt(player.entity.position.offset(0, 1, 0));
        bot.attack(player.entity);
    }
    else {
        bot.chat('Jugador no encontrado.');
    }
}
