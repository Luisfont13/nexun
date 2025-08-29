// Módulo de PvP contra jugadores
export function attackPlayer(bot: any, playerName: string) {
  const player = bot.players[playerName];
  if (player && player.entity) {
    bot.chat(`Atacando a ${playerName}...`);
    bot.lookAt(player.entity.position.offset(0, 1, 0));
    bot.attack(player.entity);
  } else {
    bot.chat('Jugador no encontrado.');
  }
}
