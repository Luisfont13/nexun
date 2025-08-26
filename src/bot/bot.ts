// Utilidades matemáticas y de siembra
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
  bot.on('entityHurt', (entity: any) => {
    if (entity === bot.entity) {
      const mobs = Object.values(bot.entities).filter((e: any) => e.type === 'mob' && e.mobType !== 'Enderman' && e.position.distanceTo(bot.entity.position) < 8);
      if (mobs.length > 0) {
        const shield = bot.inventory.items().find((i: any) => i.name.includes('shield'));
        if (shield) bot.equip(shield, 'off-hand');
        const mob: any = mobs[0];
        if (mob && mob.position && typeof mob.position.offset === 'function') {
          bot.lookAt(mob.position.offset(0, 1, 0));
        }
        bot.attack(mob);
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

export function startBot() {
  const configPath = path.join(__dirname, '../../server.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  const bot = createBot({
    host: config.host,
    port: config.port,
    username: config.username || 'ProBot',
    version: config.version || false
  });

  bot.loadPlugin(pathfinder);

  setupCombat(bot);
  manejarInventario(bot);

  bot.once('spawn', () => {
    console.log('Bot conectado y listo.');
    bot.chat('¡Bot listo para recolectar recursos!');
    // Buscar y recolectar recursos cercanos (madera)
    const mcData = require('minecraft-data')(bot.version);
    const logIds = [
      mcData.blocksByName.oak_log?.id,
      mcData.blocksByName.birch_log?.id,
      mcData.blocksByName.spruce_log?.id
    ].filter(Boolean);
    const blocks = bot.findBlocks({ matching: logIds, maxDistance: 32, count: 1 });
    if (blocks.length > 0) {
      bot.chat('Recolectando madera...');
      bot.pathfinder.setGoal(new goals.GoalBlock(blocks[0].x, blocks[0].y, blocks[0].z));
    }
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

  bot.on('chat', async (username, message) => {
    if (username === bot.username) return;
    if (message === 'vem') {
      const player = bot.players[username];
      if (player && player.entity) {
        bot.chat('¡Voy hacia ti!');
        bot.pathfinder.setGoal(new goals.GoalNear(player.entity.position.x, player.entity.position.y, player.entity.position.z, 1));
      }
      return;
    }
    if (message === 'sigueme') {
      const player = bot.players[username];
      if (player && player.entity) {
        bot.chat('¡Te sigo!');
        bot.pathfinder.setGoal(new goals.GoalFollow(player.entity, 1), true);
      }
      return;
    }
    if (message.startsWith('!math ')) {
      // Ejemplo: !math suma 2 3
      const [op, a, b] = message.slice(6).split(' ');
      if (op in mathInfo) {
        const fn = mathInfo[op];
        if (typeof fn === 'function' && fn.length === 2) {
          bot.chat('Resultado: ' + (fn as (a: number, b: number) => number)(Number(a), Number(b)));
        } else {
          bot.chat('Operación no reconocida. Usa suma, resta, multiplicar, dividir.');
        }
      } else {
        bot.chat('Operación no reconocida. Usa suma, resta, multiplicar, dividir.');
      }
      return;
    }
    if (message === 'plantar arbol') {
      const plantar = mathInfo['plantarArbol'] as () => string;
      bot.chat(plantar());
      return;
    }
    if (message.startsWith('!ask ')) {
      const prompt = message.slice(5);
      let response = localModel(prompt);
      if (!response) {
        response = await askGeminity(prompt);
      }
      bot.chat(response);
      conversationLog.push({ username, prompt, response });
      // Guardar en JSON
      fs.writeFileSync('conversation_log.json', JSON.stringify(conversationLog, null, 2));
      // Guardar en NBT
      // Guardar conversationLog como lista de strings en NBT (solo si hay elementos)
      if (conversationLog.length > 0) {
        const nbtData = nbt.writeUncompressed({
          type: 'compound',
          name: '',
          value: {
            conversationLog: {
              type: 'list',
              value: {
                type: 'string',
                value: conversationLog.map(e => JSON.stringify(e))
              }
            }
          }
        });
        fs.writeFileSync('knowledge.nbt', nbtData);
      }
      return;
    }
    // Aprender nuevas funciones si no reconoce el comando
    if (!['vem', 'sigueme', 'plantar arbol'].includes(message) && !message.startsWith('!math ') && !message.startsWith('!ask ')) {
      const learned = await aprenderFuncion(message);
      bot.chat('Aprendido: ' + learned);
    }
  });
}
