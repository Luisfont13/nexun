// Mecánicas avanzadas de combate: arcos, escudos, PVP evasivo

export async function equiparArco(bot: any): Promise<boolean> {
  const arco = bot.inventory.items().find((i: any) => i.name.includes('bow'));
  const flechas = bot.inventory.items().find((i: any) => i.name.includes('arrow'));
  
  if (!arco) {
    bot.chat('No tengo arco disponible.');
    return false;
  }
  
  if (!flechas) {
    bot.chat('No tengo flechas disponibles.');
    return false;
  }
  
  try {
    await bot.equip(arco, 'hand');
    bot.chat('Arco equipado y listo para disparar.');
    return true;
  } catch (e) {
    bot.chat('Error al equipar arco.');
    return false;
  }
}

export async function dispararArco(bot: any, objetivo?: string): Promise<void> {
  const arco = bot.inventory.items().find((i: any) => i.name.includes('bow'));
  const flechas = bot.inventory.items().find((i: any) => i.name.includes('arrow'));
  
  if (!arco || !flechas) {
    bot.chat('Necesito arco y flechas para disparar.');
    return;
  }
  
  try {
    await bot.equip(arco, 'hand');
    
    let target = null;
    if (objetivo) {
      // Buscar jugador específico
      target = bot.players[objetivo]?.entity;
      if (!target) {
        bot.chat(`No encuentro al jugador ${objetivo}.`);
        return;
      }
    } else {
      // Buscar enemigo más cercano
      const enemigos = Object.values(bot.entities).filter((e: any) => 
        (e.type === 'player' && e.username !== bot.username) ||
        (e.type === 'mob' && ['zombie', 'skeleton', 'creeper', 'spider'].includes(e.mobType))
      ).sort((a: any, b: any) => 
        bot.entity.position.distanceTo(a.position) - bot.entity.position.distanceTo(b.position)
      );
      
      target = enemigos[0];
      if (!target) {
        bot.chat('No hay enemigos cerca para disparar.');
        return;
      }
    }
    
    // Apuntar al objetivo
    await bot.lookAt(target.position.offset(0, 1, 0));
    
    // Disparar (activar y desactivar)
    bot.activateItem();
    setTimeout(() => {
      bot.deactivateItem();
      bot.chat(`¡Flecha disparada hacia ${target.username || target.mobType}!`);
    }, 1000); // 1 segundo de carga
    
  } catch (e) {
    bot.chat('Error al disparar arco.');
  }
}

export async function equiparEscudo(bot: any): Promise<boolean> {
  const escudo = bot.inventory.items().find((i: any) => i.name.includes('shield'));
  
  if (!escudo) {
    bot.chat('No tengo escudo disponible.');
    return false;
  }
  
  try {
    await bot.equip(escudo, 'off-hand');
    bot.chat('Escudo equipado en mano secundaria.');
    return true;
  } catch (e) {
    bot.chat('Error al equipar escudo.');
    return false;
  }
}

export function bloquearConEscudo(bot: any, duracion: number = 3000): void {
  const escudo = bot.inventory.items().find((i: any) => i.name.includes('shield'));
  
  if (!escudo) {
    bot.chat('No tengo escudo para bloquear.');
    return;
  }
  
  try {
    bot.equip(escudo, 'off-hand');
    bot.activateItem(); // Activar bloqueo
    bot.chat('¡Bloqueando con escudo!');
    
    setTimeout(() => {
      bot.deactivateItem();
      bot.chat('Bloqueo terminado.');
    }, duracion);
    
  } catch (e) {
    bot.chat('Error al bloquear con escudo.');
  }
}

export async function combateEvasivo(bot: any, enemigo: string): Promise<void> {
  const target = bot.players[enemigo]?.entity;
  if (!target) {
    bot.chat(`No encuentro al jugador ${enemigo}.`);
    return;
  }
  
  bot.chat(`Iniciando combate evasivo contra ${enemigo}.`);
  
  // Equipar mejor arma y escudo
  await equiparEscudo(bot);
  const mejorArma = bot.inventory.items().find((i: any) => 
    i.name.includes('sword') || i.name.includes('axe')
  );
  if (mejorArma) {
    await bot.equip(mejorArma, 'hand');
  }
  
  let combateActivo = true;
  const combateInterval = setInterval(async () => {
    if (!combateActivo || !target) {
      clearInterval(combateInterval);
      return;
    }
    
    const distancia = bot.entity.position.distanceTo(target.position);
    
    if (distancia > 20) {
      bot.chat('Enemigo muy lejos, terminando combate.');
      combateActivo = false;
      return;
    }
    
    if (distancia > 4) {
      // Acercarse
      bot.pathfinder.setGoal(new (require('mineflayer-pathfinder').goals.GoalNear)(
        target.position.x, target.position.y, target.position.z, 2
      ));
    } else if (distancia < 2) {
      // Retroceder y bloquear
      const escapeDx = bot.entity.position.x - target.position.x;
      const escapeDz = bot.entity.position.z - target.position.z;
      const escapeX = bot.entity.position.x + escapeDx * 2;
      const escapeZ = bot.entity.position.z + escapeDz * 2;
      
      bot.pathfinder.setGoal(new (require('mineflayer-pathfinder').goals.GoalBlock)(
        Math.floor(escapeX), bot.entity.position.y, Math.floor(escapeZ)
      ));
      
      bloquearConEscudo(bot, 1000);
    } else {
      // Distancia perfecta para atacar
      await bot.lookAt(target.position.offset(0, 1, 0));
      bot.attack(target);
    }
    
  }, 500);
  
  // Terminar combate después de 30 segundos
  setTimeout(() => {
    combateActivo = false;
    bot.chat('Combate evasivo terminado.');
  }, 30000);
}

export function escaparDePeligro(bot: any): void {
  const enemigos = Object.values(bot.entities).filter((e: any) => 
    ((e.type === 'player' && e.username !== bot.username) ||
     (e.type === 'mob' && ['zombie', 'skeleton', 'creeper', 'spider', 'enderman'].includes(e.mobType))) &&
    bot.entity.position.distanceTo(e.position) < 10
  );
  
  if (enemigos.length === 0) {
    bot.chat('No hay peligros cerca.');
    return;
  }
  
  bot.chat(`¡Escapando de ${enemigos.length} enemigo(s)!`);
  
  // Calcular dirección de escape (opuesta a los enemigos)
  let escapeX = 0;
  let escapeZ = 0;
  
  enemigos.forEach((enemigo: any) => {
    const dx = bot.entity.position.x - enemigo.position.x;
    const dz = bot.entity.position.z - enemigo.position.z;
    escapeX += dx;
    escapeZ += dz;
  });
  
  // Normalizar y amplificar
  const magnitude = Math.sqrt(escapeX * escapeX + escapeZ * escapeZ);
  if (magnitude > 0) {
    escapeX = (escapeX / magnitude) * 20;
    escapeZ = (escapeZ / magnitude) * 20;
  }
  
  const targetX = Math.floor(bot.entity.position.x + escapeX);
  const targetZ = Math.floor(bot.entity.position.z + escapeZ);
  
  // Equipar escudo mientras escapa
  equiparEscudo(bot);
  
  bot.pathfinder.setGoal(new (require('mineflayer-pathfinder').goals.GoalBlock)(
    targetX, bot.entity.position.y, targetZ
  ));
  
  bot.chat(`Escapando hacia (${targetX}, ${targetZ}).`);
}