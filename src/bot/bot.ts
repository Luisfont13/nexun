// Evitar lava a menos que vaya a hacer un Nether portal
// Importar mecánicas externas
// Nueva función de IA: usar el motor AI-Light (controllet) con Llama

import { hablarEnLenguajeNaturalLocal } from '../ai/local_nlp';
import { TaskManager } from './taskManager';


import { evitarLava } from '../mechanics/lava';
import { branchMining } from '../mechanics/branchMining';
import { buscarCofres } from '../mechanics/chest';
import { explorarAldea } from '../mechanics/village';
import { construirNetherPortal } from '../mechanics/netherPortal';
import { explorarCuevasYMinar } from '../mechanics/rareMining';
import { construirRefugio } from '../mechanics/refuge';
import { plantarAuto } from '../mechanics/plantarAuto';
import { pescarAuto } from '../mechanics/pescarAuto';
import { hacerWaterDrop } from '../mechanics/waterdrop';
import { hacerPuente } from '../mechanics/puente';
import { equiparArco, dispararArco, equiparEscudo, bloquearConEscudo, combateEvasivo, escaparDePeligro } from '../mechanics/combat';
import { construirDesdeBlueprint, listarBlueprints, mostrarInfoBlueprint } from '../mechanics/blueprint';
import { crearGranja, cosecharGranja, reproducirAnimales } from '../mechanics/farming';
import { compartirItem, mostrarInventario, buscarItem, recogerItemsCerca, organizarInventario } from '../mechanics/sharing';

// Estructura para añadir más mecánicas automáticamente
const mecanicasExtra: { [key: string]: (bot: any, ...args: any[]) => void } = {
  waterdrop: hacerWaterDrop,
};

interface MathInfo {
  [key: string]: ((a: number, b: number) => number) | (() => string);
}
const mathInfo: MathInfo = {
  suma: (a: number, b: number) => a + b,
  resta: (a: number, b: number) => a - b,
  multiplicar: (a: number, b: number) => a * b,
  dividir: (a: number, b: number) => a / b,
  plantarArbol: () => 'Para plantar un árbol, coloca un brote en tierra y asegúrate de que haya espacio libre arriba.'
};

// Herramientas y su uso
const herramientas: { [key: string]: string[] } = {
  pico: ['stone_pickaxe', 'iron_pickaxe', 'diamond_pickaxe', 'netherite_pickaxe'],
  hacha: ['stone_axe', 'iron_axe', 'diamond_axe', 'netherite_axe'],
  pala: ['stone_shovel', 'iron_shovel', 'diamond_shovel', 'netherite_shovel'],
  escudo: ['shield']
};

function getBestTool(bot: any, blockName: string): string | null {
  for (const tipo in herramientas) {
    if (Object.prototype.hasOwnProperty.call(herramientas, tipo)) {
      for (const tool of herramientas[tipo]) {
        if (bot.inventory.items().find((i: any) => i.name.includes(tool))) {
          return tool;
        }
      }
    }
  }
  return null;
}

// Defensa contra mobs hostiles y uso de escudo
function setupCombat(bot: any) {
  let lastHurt = 0;
  bot.on('entityHurt', (entity: any) => {
    console.log('[EVENT] entityHurt:', { entity, position: entity.position, health: bot.health, food: bot.food });
    if (entity === bot.entity) {
      const now = Date.now();
      if (now - lastHurt < 1000) return; // Ignora golpes repetidos en menos de 1 segundo
      lastHurt = now;
      // Si el atacante es un jugador, devolver el golpe
      const attackers = Object.values(bot.entities).filter((e: any) => e.type === 'player' && e.position && e.position.distanceTo(bot.entity.position) < 4);
      if (attackers.length > 0) {
        const attacker = attackers[0] as any;
        const name = attacker.username || attacker.name || 'Jugador';
        console.log('[DEFENSA] Atacante detectado:', { name, attackerPos: attacker.position, botPos: bot.entity.position });
        // Si el atacante es el propio bot, ignora la defensa
        if (name === bot.username) {
          // Silenciar chat para evitar spam
          console.log('[DEFENSA] Ignorado: atacante es el propio bot.');
          return;
        }
        if (!attacker.position || typeof attacker.position.offset !== 'function' || bot.entity.position.distanceTo(attacker.position) > 4) {
          // Silenciar chat para evitar spam
          console.log('[DEFENSA] Atacante fuera de alcance, defensa ignorada.');
          return;
        }
        // Mensaje esencial reducido
        bot.chat(`Recibí daño. Defendiéndome.`);
        autoEquip(bot, true); // Equipar para combate
        bot.lookAt(attacker.position.offset(0, 1, 0));
        bot.attack(attacker);
        console.log('[DEFENSA] Ataque realizado a', name);
        return;
      }
      // Si el atacante es un mob
      const mobs = Object.values(bot.entities).filter((e: any) => e.type === 'mob' && e.mobType !== 'Enderman' && e.position.distanceTo(bot.entity.position) < 8);
      if (mobs.length > 0) {
  console.log('[DEFENSA] Mob hostil detectado:', mobs.map((m: any) => ({ type: m.mobType, pos: m.position })));
        autoEquip(bot, true); // Equipar para combate
        const mob: any = mobs[0];
        if (mob && mob.position && typeof mob.position.offset === 'function') {
          bot.lookAt(mob.position.offset(0, 1, 0));
        }
        bot.attack(mob);
        console.log('[DEFENSA] Ataque realizado a mob', mob.mobType);
      }
    }
  });
  bot.on('entityMoved', (entity: any) => {
    if (entity.name === 'enderman' && bot.entity.position.distanceTo(entity.position) < 8) {
      bot.look(bot.entity.yaw, Math.PI / 2);
    }
  });
}
// Manejo total de inventario
function manejarInventario(bot: any) {
  bot.on('playerCollect', (collector: any, collected: any) => {
    if (collector.username === bot.username) {
      bot.chat(`He recogido: ${collected.displayName}`);
    }
  });
  bot.on('blockBreakProgressEnd', (block: any) => {
    const tool = getBestTool(bot, block.name);
    if (tool) {
      const item = bot.inventory.items().find((i: any) => i.name.includes(tool));
      if (item) bot.equip(item, 'hand');
    }
  });
}
// Aprendizaje de nuevas funciones por IA
async function aprenderFuncion(prompt: string): Promise<string> {
  let response = localModel(prompt);
  if (!response) {
    response = await askGeminity(prompt);
    knowledgeNbt[prompt] = response;
    const nbtData = nbt.writeUncompressed({ type: 'compound', name: '', value: knowledgeNbt });
    fs.writeFileSync('knowledge.nbt', nbtData);
  }
  return response!;
}
// Integrar todo al iniciar el bot
import { createBot } from 'mineflayer';
import { pathfinder, Movements, goals } from 'mineflayer-pathfinder';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import axios from 'axios';
import * as nbt from 'prismarine-nbt';
import { construir } from '../mechanics/build';
// Reconexión automática
let reconnectListenersSet = false;
function autoReconnect(startBotFn: () => void) {
  if (!reconnectListenersSet) {
    process.setMaxListeners(20);
    process.on('uncaughtException', (err) => {
      console.error('Error fatal, reiniciando bot:', err);
      setTimeout(() => startBotFn(), 5000);
    });
    process.on('unhandledRejection', (err) => {
      console.error('Error no manejado, reiniciando bot:', err);
      setTimeout(() => startBotFn(), 5000);
    });
    process.on('exit', (code) => {
      console.error('Bot abandonó la partida (exit code:', code, '), reiniciando...');
      setTimeout(() => startBotFn(), 5000);
    });
    reconnectListenersSet = true;
  }
}

let estaOcupado = false;
let accionRealizada = false;
// Equipar armadura, herramientas y escudo automáticamente (versión robusta)
function autoEquip(bot: any, combateMode: boolean = false) {
  // Equipar todas las armaduras disponibles en el inventario automáticamente
  const armorTypes = [
    { type: 'helmet', slot: 'head' },
    { type: 'chestplate', slot: 'torso' },
    { type: 'leggings', slot: 'legs' },
    { type: 'boots', slot: 'feet' }
  ];
  
  // Priorizar armadura de mejor material
  const armorPriority = ['netherite', 'diamond', 'iron', 'chainmail', 'leather'];
  
  for (const { type, slot } of armorTypes) {
    let equipped = false;
    for (const material of armorPriority) {
      const item = bot.inventory.items().find((i: any) => i.name.includes(`${material}_${type}`));
      if (item && !equipped) {
        try {
          bot.equip(item, slot);
          equipped = true;
        } catch (e) {
          // Si ya está equipado, ignora el error
        }
      }
    }
  }
  
  // Equipar escudo (prioridad en modo combate)
  const shields = bot.inventory.items().filter((i: any) => i.name.includes('shield'));
  if (shields.length > 0) {
    try {
      bot.equip(shields[0], 'off-hand');
    } catch (e) {}
  }
  
  // Equipar mejor arma en modo combate, herramienta en modo normal
  if (combateMode) {
    const weapons = ['netherite_sword', 'diamond_sword', 'iron_sword', 'stone_sword', 'wooden_sword', 'netherite_axe', 'diamond_axe', 'iron_axe'];
    for (const weapon of weapons) {
      const item = bot.inventory.items().find((i: any) => i.name.includes(weapon));
      if (item) {
        try {
          bot.equip(item, 'hand');
        } catch (e) {}
        break;
      }
    }
  } else {
    // Equipar mejor herramienta
    const tools = ['netherite_pickaxe', 'diamond_pickaxe', 'iron_pickaxe', 'stone_pickaxe', 'netherite_axe', 'diamond_axe', 'iron_axe', 'stone_axe'];
    for (const tool of tools) {
      const item = bot.inventory.items().find((i: any) => i.name.includes(tool));
      if (item) {
        try {
          bot.equip(item, 'hand');
        } catch (e) {}
        break;
      }
    }
  }
}

// Buscar comida y comer si tiene hambre
function buscarYComer(bot: any) {
  if (typeof bot.food !== 'number' || bot.food === undefined) return;
  if (bot.food < 16) {
    if (bot._comiendo) return; // sin spam
    const alimentos = [
      'bread', 'apple', 'cooked_beef', 'cooked_porkchop', 'cooked_chicken', 'cooked_mutton', 'cooked_cod', 'cooked_salmon',
      'carrot', 'potato', 'baked_potato', 'beetroot', 'melon_slice', 'pumpkin_pie', 'cookie', 'sweet_berries', 'golden_apple', 'rabbit_stew'
    ];
    const comida = bot.inventory.items().find((i: any) => alimentos.some(a => i.name.includes(a)));
    if (!comida) {
      // Mensaje mínimo
      global.sendChat && global.sendChat('Buscando comida...');
      recolectar(bot, 'wheat');
      return;
    }
    try {
      bot.equip(comida, 'hand');
      bot._comiendo = true;
      Promise.resolve(bot.consume()).finally(() => { bot._comiendo = false; });
      setTimeout(() => { bot._comiendo = false; }, 2500);
    } catch (e) {
      bot._comiendo = false;
      console.log('[COMER] Fallo al comer', e);
    }
  }
}

// Crafting automático en mesa de crafteo
function autoCraft(bot: any, itemName: string, cantidad: number) {
  const mcData = require('minecraft-data')(bot.version);
  const recipe = bot.recipesFor(mcData.itemsByName[itemName]?.id, null, 1, bot.inventory);
  if (recipe && recipe.length > 0) {
    const craftingTable = bot.findBlock({ matching: mcData.blocksByName.crafting_table.id, maxDistance: 16 });
    if (craftingTable) {
      bot.craft(recipe[0], cantidad, craftingTable);
      bot.chat(`Crafteando ${cantidad} ${itemName}`);
    } else {
      bot.chat('No hay mesa de crafteo cerca.');
    }
  } else {
    bot.chat('No sé cómo craftear ese objeto.');
  }
}

// Uso inteligente de camas (solo en Overworld y solo si es de noche)
function usarCama(bot: any) {
  // Mejor detección de noche: Minecraft noche es entre 12541 y 23458 (ticks)
  if (bot.game.dimension !== 'overworld') {
    bot.chat('Solo se puede dormir en el Overworld.');
    return;
  }
  if (!bot.time || typeof bot.time.timeOfDay !== 'number') {
    bot.chat('No se puede determinar la hora.');
    return;
  }
  // Noche: entre 12541 y 23458 ticks
  const isNight = bot.time.timeOfDay >= 12541 && bot.time.timeOfDay <= 23458;
  if (!isNight) {
    bot.chat('No se puede dormir ahora. Solo de noche.');
    return;
  }
  if (bot.isSleeping) {
    bot.chat('Ya estoy durmiendo.');
    return;
  }
  const cama = bot.findBlock({ matching: (b: any) => b.name.includes('bed'), maxDistance: 16 });
  if (cama) {
    bot.sleep(cama).catch(() => {
      bot.chat('No se pudo dormir, probablemente no es de noche o ya estoy durmiendo.');
    });
    bot.chat('Intentando dormir para saltar la noche.');
  } else {
    bot.chat('No hay cama cerca.');
  }
}
import { minar as minarOriginal } from '../mechanics/mine';

// Minar robusto para evitar errores de dig
// Reconocimiento avanzado de bloques
import { reconocerBloque } from '../mechanics/utils';

// Hacer puentes sobre huecos profundos si tiene bloques
dotenv.config();

// Límite de solicitudes a Geminity
let geminityRequests = 0;
const GEMINITY_LIMIT = 5;

// Almacenar conversaciones y aprendizajes
const conversationLog: any[] = [];
const knowledgeNbt: any = {};

// Modelo liviano local
function localModel(prompt: string): string | null {
  if (/hola|hello|hi/i.test(prompt)) return '¡Hola! ¿En qué puedo ayudarte en Minecraft?';
  if (/madera|wood/i.test(prompt)) return 'Puedes encontrar madera en los árboles cercanos.';
  if (/cofre|chest/i.test(prompt)) return 'Para abrir un cofre, acércate y haz clic derecho.';
  return null;
}

async function askGeminity(prompt: string): Promise<string> {
  if (geminityRequests >= GEMINITY_LIMIT) return 'Límite de solicitudes alcanzado.';
  try {
    const res = await axios.post('https://geminity.googleapis.com/v1/chat:complete', {
      prompt
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.GEMINITY_API_KEY}`
      }
    });
    geminityRequests++;
    return res.data.choices?.[0]?.text || 'Sin respuesta.';
  } catch (e) {
    return 'Error consultando Geminity.';
  }
}



// Variables de backoff y control de reconexión
let reconnectDelay = 20000; // 20 segundos inicial
const reconnectDelayMax = 300000; // 5 minutos máximo
let reconnecting = false;


let botInstance: any = null;
let taskManager: TaskManager = new TaskManager();

// Acceso seguro a la instancia actual del bot
function getBotInstance() {
  return botInstance;
}

// --- EXPORTACIÓN API PARA IA ---
import { minar } from '../mechanics/mine';
import { recolectar } from '../mechanics/collect';
import { attackPlayer } from '../mechanics/pvp';
// autoEquip ya debe estar definida arriba

export const botApi = {
  mover: (x: number, y: number, z: number) => getBotInstance()?.pathfinder?.setGoal && getBotInstance().pathfinder.setGoal(new goals.GoalBlock(x, y, z)),
  minar: (bloque: string) => minar && getBotInstance() && minar(getBotInstance(), bloque),
  recolectar: (objeto: string) => recolectar && getBotInstance() && recolectar(getBotInstance(), objeto),
  atacar: (objetivo: string) => attackPlayer && getBotInstance() && attackPlayer(getBotInstance(), objetivo),
  chatear: (mensaje: string) => global.sendChat && global.sendChat(mensaje),
  equipar: () => autoEquip && getBotInstance() && autoEquip(getBotInstance()),
};

export function startBot() {
  // Si ya existe una instancia previa, ciérrala correctamente antes de crear otra
  if (botInstance) {
    try {
      botInstance.removeAllListeners && botInstance.removeAllListeners();
      botInstance.quit && botInstance.quit();
    } catch (e) {
      console.error('[BOT] Error al cerrar instancia previa:', e);
    }
    botInstance = null;
  }
  autoReconnect(startBot);
  const configPath = path.join(__dirname, '../../server.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  const bot = createBot({
    host: config.host,
    port: config.port,
    username: config.username || 'ProBot',
    version: config.version || false
  });
  botInstance = bot;
  // Propiedad custom para evitar minería concurrente
  (bot as any).estaMinando = false;

  // Listeners de desconexión y reconexión con backoff exponencial

  // Exponer funciones seguras del bot para la IA
  // Definir sendChat global para evitar spam y exponerlo a la IA
  global.sendChat = function sendChat(mensaje: string) {
    const now = Date.now();
    if (!global.lastChatTime) global.lastChatTime = 0;
    if (now - global.lastChatTime < 4000) {
      console.log('[BOT] Mensaje bloqueado por cooldown de chat:', mensaje);
      return;
    }
    botInstance.chat(mensaje);
    global.lastChatTime = now;
  };

  function scheduleReconnect(event: string, reason: any) {
    if (reconnecting) return;
    reconnecting = true;
    
    // Detener TaskManager al desconectar
    taskManager.stop();
    
    console.error(`[BOT] ${event}. Razón:`, reason, `Reintentando en ${Math.round(reconnectDelay/1000)}s...`);
    setTimeout(() => {
      reconnectDelay = Math.min(Math.floor(reconnectDelay * 1.7), reconnectDelayMax);
      reconnecting = false;
      startBot();
    }, reconnectDelay);
  }
  bot.on('end', (reason) => scheduleReconnect('Desconectado (end)', reason));
  bot.on('kicked', (reason) => scheduleReconnect('Kickeado del servidor', reason));
  bot.on('error', (err) => scheduleReconnect('Error fatal', err));

  // Al conectar exitosamente, reiniciar el backoff

  bot.once('spawn', () => {
    reconnectDelay = 20000;
    reconnecting = false;
    
    // Inicializar TaskManager
    taskManager.start();
    bot.chat('¡Bot conectado! TaskManager iniciado. Usa "ayuda" para ver comandos.');
  });

  bot.loadPlugin(pathfinder);

  setupCombat(bot);
  manejarInventario(bot);
  // Comer automáticamente al recibir daño, recolectar o terminar acción
  bot.on('entityHurt', () => buscarYComer(bot));
  bot.on('playerCollect', () => buscarYComer(bot));
  bot.on('blockBreakProgressEnd', () => buscarYComer(bot));

  bot.once('spawn', () => {
    // Reiniciar el backoff al conectar
    reconnectDelay = 5000;
    // Asegurar valores válidos para health y food
    const health = typeof bot.health === 'number' ? bot.health : 'N/A';
    const food = typeof bot.food === 'number' ? bot.food : 'N/A';
    console.log('[BOT] Estado inicial:', {
      username: bot.username,
      health,
      food,
      position: bot.entity.position,
      inventory: bot.inventory.items().map(i => i.name)
    });
    console.log('Bot conectado y listo.');
    // Mensaje inicial mínimo para evitar spam
    global.sendChat && global.sendChat('Listo.');
    autoEquip(bot);
    buscarYComer(bot);
    // Autonomía: patrullar y buscar recursos automáticamente (mensajes reducidos)
    setInterval(() => {
      if (estaOcupado) return;
      estaOcupado = true;
      // Decisiones automáticas coherentes
      buscarYComer(bot); // Comer siempre antes de cualquier acción
      autoEquip(bot);
      const mcData = require('minecraft-data')(bot.version);
      const madera = bot.inventory.items().filter((i: any) => i.name.includes('log'));
      const piedra = bot.inventory.items().filter((i: any) => i.name.includes('cobblestone'));
      const palos = bot.inventory.items().filter((i: any) => i.name.includes('stick'));
      const comida = bot.inventory.items().filter((i: any) => i.name.includes('apple') || i.name.includes('bread') || i.name.includes('wheat'));

      // Evitar lava si no va a construir portal
      if (evitarLava(bot, goals, reconocerBloque)) return;

      // Minar en patrón de rama
      if (branchMining(bot)) return;

      // Buscar cofres y abrirlos
      if (buscarCofres(bot)) return;

      // Explorar aldeas
      if (explorarAldea(bot)) return;

      // Explorar cuevas y minar minerales raros
      if (explorarCuevasYMinar(bot)) return;

      // Construir refugio si hay mobs cerca
      construirRefugio(bot);

      // Plantar árboles y cultivos
      plantarAuto(bot);

      // Pescar si está cerca de agua y tiene caña
      pescarAuto(bot);

      // Recolectar madera si tiene poca
      if (madera.length < 8) {
        const logIds = [
          mcData.blocksByName.oak_log?.id,
          mcData.blocksByName.birch_log?.id,
          mcData.blocksByName.spruce_log?.id
        ].filter(Boolean);
        const blocks = bot.findBlocks({ matching: logIds, maxDistance: 32, count: 1 });
        if (blocks.length > 0) {
          bot.pathfinder.setGoal(new goals.GoalBlock(blocks[0].x, blocks[0].y, blocks[0].z));
          return;
        }
      }
      // Minar piedra si tiene poca
      if (piedra.length < 16) {
        const stoneId = mcData.blocksByName.stone?.id;
        const stoneBlock = bot.findBlock({ matching: stoneId, maxDistance: 32 });
        if (stoneBlock) {
          bot.pathfinder.setGoal(new goals.GoalBlock(stoneBlock.position.x, stoneBlock.position.y, stoneBlock.position.z));
          return;
        }
      }
      // Buscar alimentos si tiene pocos
      if (comida.length < 4) {
        const wheatId = mcData.blocksByName.wheat?.id;
        const wheatBlock = bot.findBlock({ matching: wheatId, maxDistance: 32 });
        if (wheatBlock) {
          bot.pathfinder.setGoal(new goals.GoalBlock(wheatBlock.position.x, wheatBlock.position.y, wheatBlock.position.z));
          return;
        }
      }
      // Movimiento natural: patrullar con pausas y giros (sin chat)
      if (!bot.pathfinder.isMoving()) {
        hacerPuente(bot);
        const x = bot.entity.position.x + Math.random() * 8 - 4;
        const z = bot.entity.position.z + Math.random() * 8 - 4;
        const y = bot.entity.position.y;
        setTimeout(() => {
          bot.look(bot.entity.yaw + (Math.random() - 0.5), bot.entity.pitch + (Math.random() - 0.5));
          bot.pathfinder.setGoal(new goals.GoalBlock(x, y, z));
        }, Math.random() * 5000 + 2000);
      }
      // Dormir si es de noche
      if (bot.time && bot.time.day >= 13000 && bot.game.dimension === 'overworld') {
        usarCama(bot);
      }
      // Craftear herramientas básicas
      if (madera.length > 8 && piedra.length > 16 && palos.length < 4) {
        autoCraft(bot, 'stick', 4);
      }
      if (piedra.length > 16 && palos.length > 2) {
        autoCraft(bot, 'stone_pickaxe', 1);
      }
      // Prepararse para combate si detecta mobs hostiles (sin avisos de chat)
      const mobs = Object.values(bot.entities).filter((e: any) => e.type === 'mob' && e.mobType !== 'Enderman' && e.position && e.position.distanceTo(bot.entity.position) < 10);
      if (mobs.length > 0) {
        autoEquip(bot);
      }
      estaOcupado = false;
    }, 30000);
  });

  bot.on('entitySwingArm', (entity) => {
    if (entity.name === 'villager') {
      bot.chat('¡Interacción con aldeano!');
    }
  });

  bot.on('blockUpdate', (oldBlock, newBlock) => {
    if (newBlock.name === 'chest') {
      bot.chat('¡Cofre detectado!');
    }
  });

  // Cooldown global para evitar spam de chat
  let lastChatTime = 0;
  const chatCooldown = 4000; // 4 segundos entre mensajes

  bot.on('chat', async (username, message) => {
    if (username === bot.username) return;
    const now = Date.now();
    if (now - lastChatTime < chatCooldown) {
      console.log('[BOT] Mensaje bloqueado por cooldown de chat:', message);
      return;
    }
    
    // === COMANDOS DEL TASK MANAGER ===
    if (message === 'tareas') {
      const running = taskManager.isRunning() ? 1 : 0;
      const queued = taskManager.size() - running;
      bot.chat(`Tareas: ${running} ejecutándose, ${queued} en cola.`);
      return;
    }
    
    if (message === 'cancelar tareas') {
      taskManager.cancelAll();
      bot.chat('Todas las tareas canceladas.');
      return;
    }
    
    // === COMANDOS DE CONSTRUCCIÓN DESDE BLUEPRINTS ===
    if (message.startsWith('construye ')) {
      const partes = message.split(' ');
      const blueprintName = partes[1];
      const x = partes[2] ? Number(partes[2]) : undefined;
      const y = partes[3] ? Number(partes[3]) : undefined;
      const z = partes[4] ? Number(partes[4]) : undefined;
      
      taskManager.add({
        id: `construir_${blueprintName}_${Date.now()}`,
        run: () => construirDesdeBlueprint(bot, blueprintName, x, y, z),
        priority: 2
      });
      
      bot.chat(`Construcción de '${blueprintName}' añadida a la cola.`);
      return;
    }
    
    if (message === 'blueprints') {
      const blueprints = listarBlueprints();
      if (blueprints.length > 0) {
        bot.chat(`Blueprints disponibles: ${blueprints.join(', ')}`);
      } else {
        bot.chat('No hay blueprints disponibles.');
      }
      return;
    }
    
    if (message.startsWith('info ')) {
      const blueprintName = message.split(' ')[1];
      const info = mostrarInfoBlueprint(blueprintName);
      bot.chat(info);
      return;
    }
    
    // === COMANDOS DE COMPARTIR ===
    if (message.startsWith('dame ')) {
      const partes = message.split(' ');
      const item = partes[1];
      const cantidad = partes[2] ? Number(partes[2]) : 1;
      
      taskManager.add({
        id: `compartir_${item}_${Date.now()}`,
        run: () => compartirItem(bot, username, item, cantidad),
        priority: 1
      });
      
      return;
    }
    
    if (message === 'inventario') {
      const inventario = mostrarInventario(bot);
      bot.chat(inventario);
      return;
    }
    
    if (message.startsWith('tienes ')) {
      const item = message.split(' ')[1];
      const resultado = buscarItem(bot, item);
      bot.chat(resultado);
      return;
    }
    
    // === COMANDOS DE COMBATE AVANZADO ===
    if (message === 'equipar arco') {
      taskManager.add({
        id: `equipar_arco_${Date.now()}`,
        run: async () => { await equiparArco(bot); },
        priority: 3
      });
      return;
    }
    
    if (message.startsWith('disparar ')) {
      const objetivo = message.split(' ')[1];
      taskManager.add({
        id: `disparar_${objetivo}_${Date.now()}`,
        run: () => dispararArco(bot, objetivo),
        priority: 3
      });
      return;
    }
    
    if (message === 'disparar') {
      taskManager.add({
        id: `disparar_${Date.now()}`,
        run: () => dispararArco(bot),
        priority: 3
      });
      return;
    }
    
    if (message === 'equipar escudo') {
      taskManager.add({
        id: `equipar_escudo_${Date.now()}`,
        run: async () => { await equiparEscudo(bot); },
        priority: 3
      });
      return;
    }
    
    if (message.startsWith('bloquear ')) {
      const duracion = Number(message.split(' ')[1]) * 1000 || 3000;
      bloquearConEscudo(bot, duracion);
      return;
    }
    
    if (message === 'bloquear') {
      bloquearConEscudo(bot);
      return;
    }
    
    if (message.startsWith('combate ')) {
      const enemigo = message.split(' ')[1];
      taskManager.add({
        id: `combate_${enemigo}_${Date.now()}`,
        run: () => combateEvasivo(bot, enemigo),
        priority: 5
      });
      return;
    }
    
    if (message === 'escapar') {
      escaparDePeligro(bot);
      return;
    }
    
    // === COMANDOS DE GRANJAS ===
    if (message.startsWith('crear granja ')) {
      const partes = message.split(' ');
      const tipo = partes[2];
      const tamaño = partes[3] ? Number(partes[3]) : 5;
      
      taskManager.add({
        id: `granja_${tipo}_${Date.now()}`,
        run: () => crearGranja(bot, tipo, tamaño),
        priority: 1
      });
      
      bot.chat(`Creación de granja de ${tipo} añadida a la cola.`);
      return;
    }
    
    if (message.startsWith('cosechar ')) {
      const partes = message.split(' ');
      const x = Number(partes[1]);
      const y = Number(partes[2]);
      const z = Number(partes[3]);
      const tamaño = partes[4] ? Number(partes[4]) : 5;
      
      taskManager.add({
        id: `cosechar_${Date.now()}`,
        run: () => cosecharGranja(bot, x, y, z, tamaño),
        priority: 1
      });
      
      bot.chat('Cosecha añadida a la cola.');
      return;
    }
    
    if (message.startsWith('reproducir ')) {
      const animal = message.split(' ')[1];
      taskManager.add({
        id: `reproducir_${animal}_${Date.now()}`,
        run: () => reproducirAnimales(bot, animal),
        priority: 1
      });
      
      bot.chat(`Reproducción de ${animal} añadida a la cola.`);
      return;
    }
    
    // === COMANDOS DE UTILIDAD ===
    if (message === 'recoger items') {
      taskManager.add({
        id: `recoger_items_${Date.now()}`,
        run: () => recogerItemsCerca(bot),
        priority: 1
      });
      return;
    }
    
    if (message === 'organizar') {
      organizarInventario(bot);
      return;
    }
    
    // === COMANDO DE AYUDA ===
    if (message === 'ayuda' || message === 'help' || message === 'comandos') {
      const ayuda = `
=== COMANDOS DISPONIBLES ===
TAREAS:
- tareas: Ver estado de la cola
- cancelar tareas: Cancelar todas las tareas

CONSTRUCCIÓN:
- construye <blueprint> [x] [y] [z]: Construir desde blueprint
- construir <bloque> <x> <y> <z>: Colocar bloque individual
- blueprints: Listar blueprints disponibles
- info <blueprint>: Ver info de blueprint

COMBATE:
- pvp/ataca <jugador>: Atacar jugador
- equipar arco: Equipar arco
- disparar [jugador]: Disparar arco
- equipar escudo: Equipar escudo
- bloquear [segundos]: Bloquear con escudo
- combate <jugador>: Combate evasivo
- escapar: Escapar de peligros

RECURSOS:
- mina <bloque>: Minar bloque
- recolecta <recurso>: Recolectar recurso
- dame <item> [cantidad]: Compartir item
- inventario: Ver mi inventario
- tienes <item>: Buscar item
- recoger items: Recoger items cercanos
- organizar: Organizar inventario

GRANJAS:
- crear granja <tipo> [tamaño]: Crear granja
- cosechar <x> <y> <z> [tamaño]: Cosechar granja
- reproducir <animal>: Reproducir animales

BÁSICOS:
- equipa: Auto-equipar
- come: Comer si tengo hambre
- dormir: Dormir en cama
- vem: Ir hacia ti
- sigueme: Seguirte
      `;
      bot.chat(ayuda);
      return;
    }
    // PvP contra jugadores (integrado con TaskManager)
    if (message.startsWith('pvp ') || message.startsWith('ataca ')) {
      const partes = message.split(' ');
      const target = partes[1];
      if (target) {
        taskManager.add({
          id: `pvp_${target}_${Date.now()}`,
          run: () => {
            autoEquip(bot, true); // Equipar para combate
            attackPlayer(bot, target);
            bot.chat(`¡Atacando a ${target} en PvP!`);
          },
          priority: 5
        });
      } else {
        bot.chat('Debes especificar el nombre del jugador.');
      }
      return;
    }
    
    // Minería (integrada con TaskManager)
    if (message.startsWith('mina ')) {
      const blockName = message.split(' ')[1];
      taskManager.add({
        id: `minar_${blockName}_${Date.now()}`,
        run: async () => {
          try {
            await minar(bot, blockName);
          } catch (e) {
            bot.chat('Error al minar: ' + (e?.message || 'desconocido'));
          }
        },
        priority: 2
      });
      bot.chat(`Minería de ${blockName} añadida a la cola.`);
      return;
    }
    
    // Recolección (integrada con TaskManager)
    if (message.startsWith('recolecta ')) {
      const resourceName = message.split(' ')[1];
      taskManager.add({
        id: `recolectar_${resourceName}_${Date.now()}`,
        run: () => recolectar(bot, resourceName),
        priority: 1
      });
      bot.chat(`Recolección de ${resourceName} añadida a la cola.`);
      return;
    }
    
    // Construcción de bloques individuales (integrada con TaskManager)
    if (message.startsWith('construir ')) {
      const [_, blockName, x, y, z] = message.split(' ');
      if (blockName && x && y && z) {
        taskManager.add({
          id: `construir_bloque_${blockName}_${Date.now()}`,
          run: () => construir(bot, blockName, { x: Number(x), y: Number(y), z: Number(z) }),
          priority: 2
        });
        bot.chat(`Construcción de ${blockName} en (${x}, ${y}, ${z}) añadida a la cola.`);
      } else {
        bot.chat('Uso: construir <bloque> <x> <y> <z>');
      }
      return;
    }
    // Equipar automáticamente
    if (message === 'equipa') {
      autoEquip(bot);
      bot.chat('Equipamiento automático realizado.');
      return;
    }
    // Comer si tiene hambre
    if (message === 'come') {
      buscarYComer(bot);
      return;
    }
    // Craftear
    if (message.startsWith('craftea ')) {
      const [_, itemName, cantidad] = message.split(' ');
      autoCraft(bot, itemName, Number(cantidad) || 1);
      return;
    }
    // Dormir
    if (message === 'dormir') {
      usarCama(bot);
      return;
    }
    // Water drop perfecto
    if (message === 'waterdrop') {
      hacerWaterDrop(bot);
      return;
    }
    // Mecánicas extra automáticas
    if (message.startsWith('mecanica ')) {
      const [_, nombre, ...args] = message.split(' ');
      if (mecanicasExtra[nombre]) {
        mecanicasExtra[nombre](bot, ...args);
        bot.chat(`Mecánica ${nombre} ejecutada.`);
      } else {
        bot.chat('No conozco esa mecánica.');
      }
      return;
    }
    if (message.includes('vem')) {
      const player = bot.players[username];
      if (player && player.entity) {
        bot.chat('¡Voy hacia ti!');
        bot.pathfinder.setGoal(new goals.GoalNear(player.entity.position.x, player.entity.position.y, player.entity.position.z, 1));
      }
      return;
    }
    if (message.includes('sigueme')) {
      const player = bot.players[username];
      if (player && player.entity) {
        bot.chat('¡Te sigo!');
        bot.pathfinder.setGoal(new goals.GoalFollow(player.entity, 1), true);
      }
      return;
    }
    if (message.startsWith('!math ')) {
      // ...existing code...
      return;
    }
    if (message === 'plantar arbol') {
      // ...existing code...
      return;
    }
    // Respuesta local por lenguaje natural sin servicios externos
    const comandosExcluidos = [
      'vem', 'sigueme', 'plantar arbol', 'equipa', 'come', 'dormir', 'waterdrop',
      'tareas', 'cancelar tareas', 'blueprints', 'inventario', 'organizar',
      'equipar arco', 'equipar escudo', 'disparar', 'bloquear', 'escapar',
      'recoger items', 'ayuda', 'help', 'comandos'
    ];
    const comandosConParametros = [
      '!math ', 'ataca ', 'pvp ', 'construye ', 'construir ', 'mina ', 'recolecta ',
      'dame ', 'tienes ', 'info ', 'disparar ', 'bloquear ', 'combate ',
      'crear granja ', 'cosechar ', 'reproducir ', 'craftea ', 'mecanica '
    ];
    
    const esComandoConocido = comandosExcluidos.includes(message) || 
                             comandosConParametros.some(cmd => message.startsWith(cmd)) ||
                             message.startsWith(' ');
    
    if (!esComandoConocido) {
      const respuesta = hablarEnLenguajeNaturalLocal(message);
      global.sendChat(respuesta);
      lastChatTime = Date.now();
      // Guardado ligero en JSON (sin NBT) para evitar I/O pesado continuo
      conversationLog.push({ username, pregunta: message, respuesta, t: Date.now() });
      try { fs.writeFileSync('conversation_log.json', JSON.stringify(conversationLog.slice(-200), null, 2)); } catch {}
      return;
    }
  });
}
