
export function evitarLava(bot: any, goals: any, reconocerBloque: any) {
const lavaBlock = reconocerBloque(bot, 'lava');
  if (lavaBlock && bot.entity.position.distanceTo(lavaBlock.position) < 4) {
    bot.chat('¡Lava detectada! Evitando zona peligrosa.');
    // Retroceder o moverse lateralmente
    const x = bot.entity.position.x + (Math.random() > 0.5 ? 4 : -4);
    const z = bot.entity.position.z + (Math.random() > 0.5 ? 4 : -4);
    bot.pathfinder.setGoal(new goals.GoalBlock(x, bot.entity.position.y, z));
    return true;
  }
}