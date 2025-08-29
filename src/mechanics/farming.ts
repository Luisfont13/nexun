// Sistema de granjas automáticas y reproducción de animales

export async function crearGranja(bot: any, tipo: string, tamaño: number = 5): Promise<void> {
  const tiposGranja = {
    trigo: { semilla: 'wheat_seeds', cultivo: 'wheat' },
    zanahoria: { semilla: 'carrot', cultivo: 'carrots' },
    papa: { semilla: 'potato', cultivo: 'potatoes' },
    remolacha: { semilla: 'beetroot_seeds', cultivo: 'beetroots' }
  };
  
  if (!tiposGranja[tipo as keyof typeof tiposGranja]) {
    bot.chat(`Tipo de granja no válido. Disponibles: ${Object.keys(tiposGranja).join(', ')}`);
    return;
  }
  
  const granja = tiposGranja[tipo as keyof typeof tiposGranja];
  const startX = Math.floor(bot.entity.position.x);
  const startY = Math.floor(bot.entity.position.y);
  const startZ = Math.floor(bot.entity.position.z);
  
  bot.chat(`Creando granja de ${tipo} de ${tamaño}x${tamaño}.`);
  
  try {
    // Verificar materiales
    const azada = bot.inventory.items().find((i: any) => i.name.includes('hoe'));
    const semillas = bot.inventory.items().find((i: any) => i.name === granja.semilla);
    const agua = bot.inventory.items().find((i: any) => i.name === 'water_bucket');
    
    if (!azada) {
      bot.chat('Necesito una azada para crear la granja.');
      return;
    }
    
    if (!semillas) {
      bot.chat(`Necesito ${granja.semilla} para plantar.`);
      return;
    }
    
    // Preparar terreno
    await bot.equip(azada, 'hand');
    
    for (let x = 0; x < tamaño; x++) {
      for (let z = 0; z < tamaño; z++) {
        const targetX = startX + x;
        const targetZ = startZ + z;
        const targetY = startY;
        
        // Ir a la posición
        const { goals } = require('mineflayer-pathfinder');
        bot.pathfinder.setGoal(new goals.GoalBlock(targetX, targetY, targetZ));
        await esperarLlegada(bot);
        
        // Arar la tierra
        const bloqueTierra = bot.blockAt(new (require('vec3'))(targetX, targetY - 1, targetZ));
        if (bloqueTierra && (bloqueTierra.name === 'dirt' || bloqueTierra.name === 'grass_block')) {
          await bot.dig(bloqueTierra);
          
          // Colocar tierra arada
          const tierraArada = bot.inventory.items().find((i: any) => i.name === 'farmland');
          if (tierraArada) {
            await bot.equip(tierraArada, 'hand');
            await bot.placeBlock(bloqueTierra, new (require('vec3'))(0, 1, 0));
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Plantar semillas
    await bot.equip(semillas, 'hand');
    
    for (let x = 0; x < tamaño; x++) {
      for (let z = 0; z < tamaño; z++) {
        const targetX = startX + x;
        const targetZ = startZ + z;
        const targetY = startY;
        
        const { goals } = require('mineflayer-pathfinder');
        bot.pathfinder.setGoal(new goals.GoalBlock(targetX, targetY, targetZ));
        await esperarLlegada(bot);
        
        // Plantar
        const bloqueArado = bot.blockAt(new (require('vec3'))(targetX, targetY - 1, targetZ));
        if (bloqueArado && bloqueArado.name === 'farmland') {
          await bot.placeBlock(bloqueArado, new (require('vec3'))(0, 1, 0));
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Colocar agua en el centro si es posible
    if (agua && tamaño >= 3) {
      const centroX = startX + Math.floor(tamaño / 2);
      const centroZ = startZ + Math.floor(tamaño / 2);
      
      const { goals } = require('mineflayer-pathfinder');
      bot.pathfinder.setGoal(new goals.GoalBlock(centroX, startY, centroZ));
      await esperarLlegada(bot);
      
      await bot.equip(agua, 'hand');
      const bloqueAgua = bot.blockAt(new (require('vec3'))(centroX, startY - 1, centroZ));
      if (bloqueAgua) {
        await bot.dig(bloqueAgua);
        await bot.placeBlock(bloqueAgua, new (require('vec3'))(0, 1, 0));
      }
    }
    
    bot.chat(`¡Granja de ${tipo} creada exitosamente!`);
    
  } catch (error) {
    bot.chat(`Error creando granja: ${error}`);
  }
}

export async function cosecharGranja(bot: any, x: number, y: number, z: number, tamaño: number = 5): Promise<void> {
  bot.chat(`Cosechando granja en (${x}, ${y}, ${z}).`);
  
  try {
    for (let dx = 0; dx < tamaño; dx++) {
      for (let dz = 0; dz < tamaño; dz++) {
        const targetX = x + dx;
        const targetZ = z + dz;
        
        const { goals } = require('mineflayer-pathfinder');
        bot.pathfinder.setGoal(new goals.GoalBlock(targetX, y, targetZ));
        await esperarLlegada(bot);
        
        const cultivo = bot.blockAt(new (require('vec3'))(targetX, y, targetZ));
        if (cultivo && esCultivoMaduro(cultivo)) {
          await bot.dig(cultivo);
          
          // Replantar automáticamente
          const semilla = obtenerSemilla(cultivo.name);
          if (semilla) {
            const itemSemilla = bot.inventory.items().find((i: any) => i.name === semilla);
            if (itemSemilla) {
              await bot.equip(itemSemilla, 'hand');
              const bloqueArado = bot.blockAt(new (require('vec3'))(targetX, y - 1, targetZ));
              if (bloqueArado && bloqueArado.name === 'farmland') {
                await bot.placeBlock(bloqueArado, new (require('vec3'))(0, 1, 0));
              }
            }
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    bot.chat('¡Cosecha completada y replantada!');
    
  } catch (error) {
    bot.chat(`Error cosechando: ${error}`);
  }
}

export async function reproducirAnimales(bot: any, tipoAnimal: string): Promise<void> {
  const alimentosReproduccion = {
    cow: 'wheat',
    pig: 'carrot',
    sheep: 'wheat',
    chicken: 'wheat_seeds',
    rabbit: 'carrot'
  };
  
  const alimento = alimentosReproduccion[tipoAnimal as keyof typeof alimentosReproduccion];
  if (!alimento) {
    bot.chat(`No sé cómo reproducir ${tipoAnimal}.`);
    return;
  }
  
  const itemAlimento = bot.inventory.items().find((i: any) => i.name === alimento);
  if (!itemAlimento) {
    bot.chat(`Necesito ${alimento} para reproducir ${tipoAnimal}.`);
    return;
  }
  
  // Buscar animales del tipo especificado
  const animales = Object.values(bot.entities).filter((e: any) => 
    e.type === 'mob' && e.mobType === tipoAnimal && 
    bot.entity.position.distanceTo(e.position) < 16
  );
  
  if (animales.length < 2) {
    bot.chat(`Necesito al menos 2 ${tipoAnimal} cerca para reproducir.`);
    return;
  }
  
  bot.chat(`Reproduciendo ${tipoAnimal} con ${alimento}.`);
  
  try {
    await bot.equip(itemAlimento, 'hand');
    
    // Alimentar a los dos primeros animales
    for (let i = 0; i < Math.min(2, animales.length); i++) {
      const animal = animales[i] as any;
      
      const { goals } = require('mineflayer-pathfinder');
      bot.pathfinder.setGoal(new goals.GoalNear(animal.position.x, animal.position.y, animal.position.z, 2));
      await esperarLlegada(bot);
      
      await bot.lookAt(animal.position.offset(0, 1, 0));
      bot.activateEntity(animal);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    bot.chat(`¡${tipoAnimal} alimentados para reproducción!`);
    
  } catch (error) {
    bot.chat(`Error en reproducción: ${error}`);
  }
}

function esCultivoMaduro(bloque: any): boolean {
  const cultivosMaduros = {
    wheat: 7,
    carrots: 7,
    potatoes: 7,
    beetroots: 3
  };
  
  const nombreCultivo = bloque.name;
  const edadMaxima = cultivosMaduros[nombreCultivo as keyof typeof cultivosMaduros];
  
  if (edadMaxima !== undefined) {
    const edad = bloque.metadata || 0;
    return edad >= edadMaxima;
  }
  
  return false;
}

function obtenerSemilla(nombreCultivo: string): string | null {
  const semillas = {
    wheat: 'wheat_seeds',
    carrots: 'carrot',
    potatoes: 'potato',
    beetroots: 'beetroot_seeds'
  };
  
  return semillas[nombreCultivo as keyof typeof semillas] || null;
}

async function esperarLlegada(bot: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout')), 10000);
    
    bot.once('goal_reached', () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}