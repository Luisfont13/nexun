// Sistema para compartir items con otros jugadores

export function compartirItem(bot: any, jugador: string, item: string, cantidad: number = 1): void {
  const player = bot.players[jugador];
  if (!player || !player.entity) {
    bot.chat(`Jugador ${jugador} no encontrado.`);
    return;
  }
  
  // Buscar el item en el inventario
  const itemEnInventario = bot.inventory.items().find((i: any) => 
    i.name.includes(item.toLowerCase()) || i.displayName.toLowerCase().includes(item.toLowerCase())
  );
  
  if (!itemEnInventario) {
    bot.chat(`No tengo ${item} para compartir.`);
    return;
  }
  
  const cantidadDisponible = itemEnInventario.count;
  const cantidadACompartir = Math.min(cantidad, cantidadDisponible);
  
  if (cantidadACompartir <= 0) {
    bot.chat(`No tengo suficiente ${item} para compartir.`);
    return;
  }
  
  bot.chat(`Compartiendo ${cantidadACompartir} ${itemEnInventario.displayName} con ${jugador}.`);
  
  try {
    // Ir hacia el jugador
    const { goals } = require('mineflayer-pathfinder');
    bot.pathfinder.setGoal(new goals.GoalNear(
      player.entity.position.x, 
      player.entity.position.y, 
      player.entity.position.z, 
      2
    ));
    
    // Esperar a llegar y luego tirar el item
    bot.once('goal_reached', async () => {
      try {
        await bot.equip(itemEnInventario, 'hand');
        
        // Si es menos de la cantidad total, necesitamos dividir el stack
        if (cantidadACompartir < cantidadDisponible) {
          // Tirar la cantidad específica
          await bot.tossStack(itemEnInventario, cantidadACompartir);
        } else {
          // Tirar todo el stack
          await bot.toss(itemEnInventario.type, null, cantidadACompartir);
        }
        
        bot.chat(`¡${cantidadACompartir} ${itemEnInventario.displayName} compartido con ${jugador}!`);
        
      } catch (error) {
        bot.chat(`Error al compartir item: ${error}`);
      }
    });
    
  } catch (error) {
    bot.chat(`Error al ir hacia ${jugador}: ${error}`);
  }
}

export function mostrarInventario(bot: any): string {
  const items = bot.inventory.items();
  
  if (items.length === 0) {
    return 'Mi inventario está vacío.';
  }
  
  const itemsAgrupados: { [key: string]: number } = {};
  
  items.forEach((item: any) => {
    const nombre = item.displayName || item.name;
    itemsAgrupados[nombre] = (itemsAgrupados[nombre] || 0) + item.count;
  });
  
  let inventario = 'Mi inventario:\n';
  for (const [nombre, cantidad] of Object.entries(itemsAgrupados)) {
    inventario += `- ${nombre}: ${cantidad}\n`;
  }
  
  return inventario;
}

export function buscarItem(bot: any, itemBuscado: string): string {
  const items = bot.inventory.items();
  const itemsEncontrados = items.filter((item: any) => 
    item.name.toLowerCase().includes(itemBuscado.toLowerCase()) ||
    item.displayName.toLowerCase().includes(itemBuscado.toLowerCase())
  );
  
  if (itemsEncontrados.length === 0) {
    return `No tengo ${itemBuscado} en mi inventario.`;
  }
  
  const totalCantidad = itemsEncontrados.reduce((total: number, item: any) => total + item.count, 0);
  const nombreItem = itemsEncontrados[0].displayName || itemsEncontrados[0].name;
  
  return `Tengo ${totalCantidad} ${nombreItem}.`;
}

export async function recogerItemsCerca(bot: any, radio: number = 10): Promise<void> {
  const items = Object.values(bot.entities).filter((entity: any) => 
    entity.name === 'item' && 
    bot.entity.position.distanceTo(entity.position) <= radio
  );
  
  if (items.length === 0) {
    bot.chat('No hay items cerca para recoger.');
    return;
  }
  
  bot.chat(`Recogiendo ${items.length} item(s) cercano(s).`);
  
  for (const item of items) {
    try {
      const { goals } = require('mineflayer-pathfinder');
      bot.pathfinder.setGoal(new goals.GoalNear(
        (item as any).position.x, 
        (item as any).position.y, 
        (item as any).position.z, 
        1
      ));
      
      // Esperar a llegar al item
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);
        
        bot.once('goal_reached', () => {
          clearTimeout(timeout);
          resolve(null);
        });
      });
      
      // Pequeña pausa para que el item se recoja automáticamente
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`Error recogiendo item: ${error}`);
    }
  }
  
  bot.chat('¡Items recogidos!');
}

export function organizarInventario(bot: any): void {
  const items = bot.inventory.items();
  
  // Agrupar items similares
  const itemsAgrupados: { [key: string]: any[] } = {};
  
  items.forEach(item => {
    const key = item.name;
    if (!itemsAgrupados[key]) {
      itemsAgrupados[key] = [];
    }
    itemsAgrupados[key].push(item);
  });
  
  let itemsOrganizados = 0;
  
  // Intentar combinar stacks del mismo tipo
  for (const [nombre, itemsDelTipo] of Object.entries(itemsAgrupados)) {
    if (itemsDelTipo.length > 1) {
      // Hay múltiples stacks del mismo item
      itemsOrganizados += itemsDelTipo.length - 1;
    }
  }
  
  if (itemsOrganizados > 0) {
    bot.chat(`Inventario organizado. ${itemsOrganizados} stacks combinados.`);
  } else {
    bot.chat('El inventario ya está organizado.');
  }
}

export async function intercambiarConJugador(bot: any, jugador: string, itemDar: string, itemRecibir: string): Promise<void> {
  const player = bot.players[jugador];
  if (!player || !player.entity) {
    bot.chat(`Jugador ${jugador} no encontrado.`);
    return;
  }
  
  const itemParaDar = bot.inventory.items().find((i: any) => 
    i.name.includes(itemDar.toLowerCase()) || i.displayName.toLowerCase().includes(itemDar.toLowerCase())
  );
  
  if (!itemParaDar) {
    bot.chat(`No tengo ${itemDar} para intercambiar.`);
    return;
  }
  
  bot.chat(`Propongo intercambio con ${jugador}: mi ${itemParaDar.displayName} por tu ${itemRecibir}.`);
  bot.chat(`${jugador}, di "acepto intercambio" si estás de acuerdo.`);
  
  // Esperar respuesta del jugador (esto sería manejado por el sistema de chat)
  // Por ahora, simplemente tiramos el item como muestra de buena fe
  try {
    const { goals } = require('mineflayer-pathfinder');
    bot.pathfinder.setGoal(new goals.GoalNear(
      player.entity.position.x, 
      player.entity.position.y, 
      player.entity.position.z, 
      2
    ));
    
    bot.once('goal_reached', async () => {
      bot.chat(`Aquí tienes tu ${itemParaDar.displayName}, ${jugador}. Espero mi ${itemRecibir}.`);
      await bot.toss(itemParaDar.type, null, 1);
    });
    
  } catch (error) {
    bot.chat(`Error en intercambio: ${error}`);
  }
}