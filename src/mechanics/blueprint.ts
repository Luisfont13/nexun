// Sistema de construcción desde blueprints JSON

import * as fs from 'fs';
import * as path from 'path';

interface BlueprintBlock {
  dx: number;
  dy: number;
  dz: number;
  name: string;
}

interface Blueprint {
  name: string;
  origin: { x: number; y: number; z: number };
  blocks: BlueprintBlock[];
}

export async function construirDesdeBlueprint(bot: any, blueprintName: string, x?: number, y?: number, z?: number): Promise<void> {
  try {
    // Cargar blueprint
    const blueprintPath = path.join(process.cwd(), 'data', 'blueprints', `${blueprintName}.json`);
    
    if (!fs.existsSync(blueprintPath)) {
      bot.chat(`Blueprint '${blueprintName}' no encontrado.`);
      return;
    }
    
    const blueprintData: Blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf8'));
    
    // Usar posición actual del bot si no se especifica
    const startX = x ?? Math.floor(bot.entity.position.x);
    const startY = y ?? Math.floor(bot.entity.position.y);
    const startZ = z ?? Math.floor(bot.entity.position.z);
    
    bot.chat(`Iniciando construcción de '${blueprintName}' en (${startX}, ${startY}, ${startZ}).`);
    
    // Verificar materiales necesarios
    const materialesNecesarios = contarMateriales(blueprintData.blocks);
    const materialesDisponibles = contarInventario(bot);
    
    let faltanMateriales = false;
    for (const [material, cantidad] of Object.entries(materialesNecesarios)) {
      const disponible = materialesDisponibles[material] || 0;
      if (disponible < cantidad) {
        bot.chat(`Faltan ${cantidad - disponible} ${material}.`);
        faltanMateriales = true;
      }
    }
    
    if (faltanMateriales) {
      bot.chat('No tengo suficientes materiales para construir.');
      return;
    }
    
    // Construir bloque por bloque
    for (let i = 0; i < blueprintData.blocks.length; i++) {
      const block = blueprintData.blocks[i];
      const targetX = startX + block.dx;
      const targetY = startY + block.dy;
      const targetZ = startZ + block.dz;
      
      await colocarBloque(bot, block.name, targetX, targetY, targetZ);
      
      // Pequeña pausa entre bloques
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Progreso cada 10 bloques
      if ((i + 1) % 10 === 0) {
        bot.chat(`Progreso: ${i + 1}/${blueprintData.blocks.length} bloques colocados.`);
      }
    }
    
    bot.chat(`¡Construcción de '${blueprintName}' completada!`);
    
  } catch (error) {
    bot.chat(`Error al construir desde blueprint: ${error}`);
  }
}

function contarMateriales(blocks: BlueprintBlock[]): { [key: string]: number } {
  const materiales: { [key: string]: number } = {};
  
  blocks.forEach(block => {
    materiales[block.name] = (materiales[block.name] || 0) + 1;
  });
  
  return materiales;
}

function contarInventario(bot: any): { [key: string]: number } {
  const inventario: { [key: string]: number } = {};
  
  bot.inventory.items().forEach((item: any) => {
    inventario[item.name] = (inventario[item.name] || 0) + item.count;
  });
  
  return inventario;
}

async function colocarBloque(bot: any, blockName: string, x: number, y: number, z: number): Promise<void> {
  try {
    // Buscar el bloque en el inventario
    const item = bot.inventory.items().find((i: any) => i.name === blockName);
    if (!item) {
      throw new Error(`No tengo ${blockName} en el inventario.`);
    }
    
    // Equipar el bloque
    await bot.equip(item, 'hand');
    
    // Ir a la posición
    const { goals } = require('mineflayer-pathfinder');
    bot.pathfinder.setGoal(new goals.GoalNear(x, y, z, 4));
    
    // Esperar a llegar
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout al ir a posición')), 10000);
      
      bot.once('goal_reached', () => {
        clearTimeout(timeout);
        resolve(null);
      });
    });
    
    // Encontrar bloque de referencia para colocar
    const referenceBlock = bot.blockAt(new (require('vec3'))(x, y - 1, z)) || 
                          bot.blockAt(new (require('vec3'))(x + 1, y, z)) ||
                          bot.blockAt(new (require('vec3'))(x - 1, y, z)) ||
                          bot.blockAt(new (require('vec3'))(x, y, z + 1)) ||
                          bot.blockAt(new (require('vec3'))(x, y, z - 1));
    
    if (!referenceBlock) {
      throw new Error(`No hay bloque de referencia para colocar en (${x}, ${y}, ${z}).`);
    }
    
    // Colocar el bloque
    const targetPosition = new (require('vec3'))(x, y, z);
    await bot.placeBlock(referenceBlock, targetPosition.minus(referenceBlock.position));
    
  } catch (error) {
    console.log(`Error colocando bloque ${blockName} en (${x}, ${y}, ${z}):`, error);
    throw error;
  }
}

export function listarBlueprints(): string[] {
  try {
    const blueprintsDir = path.join(process.cwd(), 'data', 'blueprints');
    if (!fs.existsSync(blueprintsDir)) {
      return [];
    }
    
    return fs.readdirSync(blueprintsDir)
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
  } catch (error) {
    console.log('Error listando blueprints:', error);
    return [];
  }
}

export function mostrarInfoBlueprint(blueprintName: string): string {
  try {
    const blueprintPath = path.join(process.cwd(), 'data', 'blueprints', `${blueprintName}.json`);
    
    if (!fs.existsSync(blueprintPath)) {
      return `Blueprint '${blueprintName}' no encontrado.`;
    }
    
    const blueprintData: Blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf8'));
    const materiales = contarMateriales(blueprintData.blocks);
    
    let info = `Blueprint: ${blueprintData.name}\n`;
    info += `Bloques totales: ${blueprintData.blocks.length}\n`;
    info += `Materiales necesarios:\n`;
    
    for (const [material, cantidad] of Object.entries(materiales)) {
      info += `- ${material}: ${cantidad}\n`;
    }
    
    return info;
  } catch (error) {
    return `Error al leer blueprint: ${error}`;
  }
}