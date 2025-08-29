"use strict";
// Evitar lava a menos que vaya a hacer un Nether portal
// Importar mecánicas externas
// Nueva función de IA: usar el motor AI-Light (controllet) con Llama
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.botApi = void 0;
exports.startBot = startBot;
const llama_bridge_1 = require("./llama_bridge");
const llama_parser_1 = require("./llama_parser");
const lava_1 = require("../mechanics/lava");
const branchMining_1 = require("../mechanics/branchMining");
const chest_1 = require("../mechanics/chest");
const village_1 = require("../mechanics/village");
const rareMining_1 = require("../mechanics/rareMining");
const refuge_1 = require("../mechanics/refuge");
const plantarAuto_1 = require("../mechanics/plantarAuto");
const pescarAuto_1 = require("../mechanics/pescarAuto");
const waterdrop_1 = require("../mechanics/waterdrop");
const puente_1 = require("../mechanics/puente");
// Estructura para añadir más mecánicas automáticamente
const mecanicasExtra = {
    waterdrop: waterdrop_1.hacerWaterDrop,
};
const mathInfo = {
    suma: (a, b) => a + b,
    resta: (a, b) => a - b,
    multiplicar: (a, b) => a * b,
    dividir: (a, b) => a / b,
    plantarArbol: () => 'Para plantar un árbol, coloca un brote en tierra y asegúrate de que haya espacio libre arriba.'
};
// Herramientas y su uso
const herramientas = {
    pico: ['stone_pickaxe', 'iron_pickaxe', 'diamond_pickaxe', 'netherite_pickaxe'],
    hacha: ['stone_axe', 'iron_axe', 'diamond_axe', 'netherite_axe'],
    pala: ['stone_shovel', 'iron_shovel', 'diamond_shovel', 'netherite_shovel'],
    escudo: ['shield']
};
function getBestTool(bot, blockName) {
    for (const tipo in herramientas) {
        if (Object.prototype.hasOwnProperty.call(herramientas, tipo)) {
            for (const tool of herramientas[tipo]) {
                if (bot.inventory.items().find((i) => i.name.includes(tool))) {
                    return tool;
                }
            }
        }
    }
    return null;
}
// Defensa contra mobs hostiles y uso de escudo
function setupCombat(bot) {
    let lastHurt = 0;
    bot.on('entityHurt', (entity) => {
        console.log('[EVENT] entityHurt:', { entity, position: entity.position, health: bot.health, food: bot.food });
        if (entity === bot.entity) {
            const now = Date.now();
            if (now - lastHurt < 1000)
                return; // Ignora golpes repetidos en menos de 1 segundo
            lastHurt = now;
            // Si el atacante es un jugador, devolver el golpe
            const attackers = Object.values(bot.entities).filter((e) => e.type === 'player' && e.position && e.position.distanceTo(bot.entity.position) < 4);
            if (attackers.length > 0) {
                const attacker = attackers[0];
                const name = attacker.username || attacker.name || 'Jugador';
                console.log('[DEFENSA] Atacante detectado:', { name, attackerPos: attacker.position, botPos: bot.entity.position });
                // Si el atacante es el propio bot, ignora la defensa
                if (name === bot.username) {
                    bot.chat('Ignoro defensa: el atacante soy yo mismo.');
                    console.log('[DEFENSA] Ignorado: atacante es el propio bot.');
                    return;
                }
                if (!attacker.position || typeof attacker.position.offset !== 'function' || bot.entity.position.distanceTo(attacker.position) > 4) {
                    bot.chat('Atacante fuera de alcance, olvido la defensa.');
                    console.log('[DEFENSA] Atacante fuera de alcance, defensa ignorada.');
                    return;
                }
                bot.chat(`¡${name} me ha atacado, devuelvo el golpe!`);
                bot.lookAt(attacker.position.offset(0, 1, 0));
                bot.attack(attacker);
                console.log('[DEFENSA] Ataque realizado a', name);
                return;
            }
            // Si el atacante es un mob
            const mobs = Object.values(bot.entities).filter((e) => e.type === 'mob' && e.mobType !== 'Enderman' && e.position.distanceTo(bot.entity.position) < 8);
            if (mobs.length > 0) {
                console.log('[DEFENSA] Mob hostil detectado:', mobs.map((m) => ({ type: m.mobType, pos: m.position })));
                const shield = bot.inventory.items().find((i) => i.name.includes('shield'));
                if (shield)
                    bot.equip(shield, 'off-hand');
                const mob = mobs[0];
                if (mob && mob.position && typeof mob.position.offset === 'function') {
                    bot.lookAt(mob.position.offset(0, 1, 0));
                }
                bot.attack(mob);
                console.log('[DEFENSA] Ataque realizado a mob', mob.mobType);
            }
        }
    });
    bot.on('entityMoved', (entity) => {
        if (entity.name === 'enderman' && bot.entity.position.distanceTo(entity.position) < 8) {
            bot.look(bot.entity.yaw, Math.PI / 2);
        }
    });
}
// Manejo total de inventario
function manejarInventario(bot) {
    bot.on('playerCollect', (collector, collected) => {
        if (collector.username === bot.username) {
            bot.chat(`He recogido: ${collected.displayName}`);
        }
    });
    bot.on('blockBreakProgressEnd', (block) => {
        const tool = getBestTool(bot, block.name);
        if (tool) {
            const item = bot.inventory.items().find((i) => i.name.includes(tool));
            if (item)
                bot.equip(item, 'hand');
        }
    });
}
// Aprendizaje de nuevas funciones por IA
async function aprenderFuncion(prompt) {
    let response = localModel(prompt);
    if (!response) {
        response = await askGeminity(prompt);
        knowledgeNbt[prompt] = response;
        const nbtData = nbt.writeUncompressed({ type: 'compound', name: '', value: knowledgeNbt });
        fs.writeFileSync('knowledge.nbt', nbtData);
    }
    return response;
}
// Integrar todo al iniciar el bot
const mineflayer_1 = require("mineflayer");
const mineflayer_pathfinder_1 = require("mineflayer-pathfinder");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
const nbt = __importStar(require("prismarine-nbt"));
const build_1 = require("../mechanics/build");
// Reconexión automática
let reconnectListenersSet = false;
function autoReconnect(startBotFn) {
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
// Equipar armadura, herramientas y escudo automáticamente
function autoEquip(bot) {
    // Equipar todas las armaduras disponibles en el inventario automáticamente
    const armorTypes = [
        { type: 'helmet', slot: 'head' },
        { type: 'chestplate', slot: 'torso' },
        { type: 'leggings', slot: 'legs' },
        { type: 'boots', slot: 'feet' }
    ];
    for (const { type, slot } of armorTypes) {
        const items = bot.inventory.items().filter((i) => i.name.includes(type));
        for (const item of items) {
            try {
                bot.equip(item, slot);
            }
            catch (e) {
                // Si ya está equipado, ignora el error
            }
        }
    }
    // Equipar todos los escudos disponibles
    const shields = bot.inventory.items().filter((i) => i.name.includes('shield'));
    for (const shield of shields) {
        try {
            bot.equip(shield, 'off-hand');
        }
        catch (e) { }
    }
    // Equipar mejor herramienta
    const tools = ['netherite_pickaxe', 'diamond_pickaxe', 'iron_pickaxe', 'stone_pickaxe', 'netherite_axe', 'diamond_axe', 'iron_axe', 'stone_axe'];
    for (const tool of tools) {
        const item = bot.inventory.items().find((i) => i.name.includes(tool));
        if (item) {
            try {
                bot.equip(item, 'hand');
            }
            catch (e) { }
            break;
        }
    }
}
// Buscar comida y comer si tiene hambre
function buscarYComer(bot) {
    if (typeof bot.food !== 'number' || bot.food === undefined)
        return;
    if (bot.food < 16) {
        if (bot._comiendo) {
            bot.chat('Ya estoy comiendo, espero terminar antes de volver a comer.');
            return;
        }
        const alimentos = [
            'bread', 'apple', 'cooked_beef', 'cooked_porkchop', 'cooked_chicken', 'cooked_mutton', 'cooked_cod', 'cooked_salmon',
            'carrot', 'potato', 'baked_potato', 'beetroot', 'melon_slice', 'pumpkin_pie', 'cookie', 'sweet_berries', 'golden_apple', 'rabbit_stew'
        ];
        const comida = bot.inventory.items().find((i) => alimentos.some(a => i.name.includes(a)));
        if (!comida) {
            bot.chat('No tengo comida comestible, buscaré.');
            (0, collect_1.recolectar)(bot, 'wheat');
            return;
        }
        if (typeof bot.canEat === 'function' && !bot.canEat(comida)) {
            bot.chat('No puedo comer este objeto.');
            return;
        }
        try {
            bot.equip(comida, 'hand');
            bot._comiendo = true;
            Promise.resolve(bot.consume()).then(() => {
                bot._comiendo = false;
                bot.chat('Comí correctamente.');
            }).catch((err) => {
                bot._comiendo = false;
                bot.chat('No pude comer: ' + (err?.message || 'Error desconocido'));
            });
            setTimeout(() => { bot._comiendo = false; }, 2500);
        }
        catch (e) {
            bot._comiendo = false;
            bot.chat('No pude comer automáticamente.');
        }
    }
}
// Crafting automático en mesa de crafteo
function autoCraft(bot, itemName, cantidad) {
    const mcData = require('minecraft-data')(bot.version);
    const recipe = bot.recipesFor(mcData.itemsByName[itemName]?.id, null, 1, bot.inventory);
    if (recipe && recipe.length > 0) {
        const craftingTable = bot.findBlock({ matching: mcData.blocksByName.crafting_table.id, maxDistance: 16 });
        if (craftingTable) {
            bot.craft(recipe[0], cantidad, craftingTable);
            bot.chat(`Crafteando ${cantidad} ${itemName}`);
        }
        else {
            bot.chat('No hay mesa de crafteo cerca.');
        }
    }
    else {
        bot.chat('No sé cómo craftear ese objeto.');
    }
}
// Uso inteligente de camas (solo en Overworld y solo si es de noche)
function usarCama(bot) {
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
    const cama = bot.findBlock({ matching: (b) => b.name.includes('bed'), maxDistance: 16 });
    if (cama) {
        bot.sleep(cama).catch(() => {
            bot.chat('No se pudo dormir, probablemente no es de noche o ya estoy durmiendo.');
        });
        bot.chat('Intentando dormir para saltar la noche.');
    }
    else {
        bot.chat('No hay cama cerca.');
    }
}
// Minar robusto para evitar errores de dig
// Reconocimiento avanzado de bloques
const utils_1 = require("../mechanics/utils");
// Hacer puentes sobre huecos profundos si tiene bloques
dotenv.config();
// Límite de solicitudes a Geminity
let geminityRequests = 0;
const GEMINITY_LIMIT = 5;
// Almacenar conversaciones y aprendizajes
const conversationLog = [];
const knowledgeNbt = {};
// Modelo liviano local
function localModel(prompt) {
    if (/hola|hello|hi/i.test(prompt))
        return '¡Hola! ¿En qué puedo ayudarte en Minecraft?';
    if (/madera|wood/i.test(prompt))
        return 'Puedes encontrar madera en los árboles cercanos.';
    if (/cofre|chest/i.test(prompt))
        return 'Para abrir un cofre, acércate y haz clic derecho.';
    return null;
}
async function askGeminity(prompt) {
    if (geminityRequests >= GEMINITY_LIMIT)
        return 'Límite de solicitudes alcanzado.';
    try {
        const res = await axios_1.default.post('https://geminity.googleapis.com/v1/chat:complete', {
            prompt
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.GEMINITY_API_KEY}`
            }
        });
        geminityRequests++;
        return res.data.choices?.[0]?.text || 'Sin respuesta.';
    }
    catch (e) {
        return 'Error consultando Geminity.';
    }
}
// Variables de backoff y control de reconexión
let reconnectDelay = 20000; // 20 segundos inicial
const reconnectDelayMax = 300000; // 5 minutos máximo
let reconnecting = false;
let botInstance = null;
// Acceso seguro a la instancia actual del bot
function getBotInstance() {
    return botInstance;
}
// --- EXPORTACIÓN API PARA IA ---
const mine_1 = require("../mechanics/mine");
const collect_1 = require("../mechanics/collect");
const pvp_1 = require("../mechanics/pvp");
// autoEquip ya debe estar definida arriba
exports.botApi = {
    mover: (x, y, z) => getBotInstance()?.pathfinder?.setGoal && getBotInstance().pathfinder.setGoal(new mineflayer_pathfinder_1.goals.GoalBlock(x, y, z)),
    minar: (bloque) => mine_1.minar && getBotInstance() && (0, mine_1.minar)(getBotInstance(), bloque),
    recolectar: (objeto) => collect_1.recolectar && getBotInstance() && (0, collect_1.recolectar)(getBotInstance(), objeto),
    atacar: (objetivo) => pvp_1.attackPlayer && getBotInstance() && (0, pvp_1.attackPlayer)(getBotInstance(), objetivo),
    chatear: (mensaje) => global.sendChat && global.sendChat(mensaje),
    equipar: () => autoEquip && getBotInstance() && autoEquip(getBotInstance()),
};
function startBot() {
    // Si ya existe una instancia previa, ciérrala correctamente antes de crear otra
    if (botInstance) {
        try {
            botInstance.removeAllListeners && botInstance.removeAllListeners();
            botInstance.quit && botInstance.quit();
        }
        catch (e) {
            console.error('[BOT] Error al cerrar instancia previa:', e);
        }
        botInstance = null;
    }
    autoReconnect(startBot);
    const configPath = path.join(__dirname, '../../server.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const bot = (0, mineflayer_1.createBot)({
        host: config.host,
        port: config.port,
        username: config.username || 'ProBot',
        version: config.version || false
    });
    botInstance = bot;
    // Propiedad custom para evitar minería concurrente
    bot.estaMinando = false;
    // Listeners de desconexión y reconexión con backoff exponencial
    // Exponer funciones seguras del bot para la IA
    // Definir sendChat global para evitar spam y exponerlo a la IA
    global.sendChat = function sendChat(mensaje) {
        const now = Date.now();
        if (!global.lastChatTime)
            global.lastChatTime = 0;
        if (now - global.lastChatTime < 4000) {
            console.log('[BOT] Mensaje bloqueado por cooldown de chat:', mensaje);
            return;
        }
        botInstance.chat(mensaje);
        global.lastChatTime = now;
    };
    function scheduleReconnect(event, reason) {
        if (reconnecting)
            return;
        reconnecting = true;
        console.error(`[BOT] ${event}. Razón:`, reason, `Reintentando en ${Math.round(reconnectDelay / 1000)}s...`);
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
    });
    bot.loadPlugin(mineflayer_pathfinder_1.pathfinder);
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
        bot.chat('¡Bot listo para recolectar recursos!');
        autoEquip(bot);
        buscarYComer(bot);
        // Autonomía: patrullar y buscar recursos automáticamente
        setInterval(() => {
            if (estaOcupado)
                return;
            estaOcupado = true;
            // Decisiones automáticas coherentes
            buscarYComer(bot); // Comer siempre antes de cualquier acción
            autoEquip(bot);
            const mcData = require('minecraft-data')(bot.version);
            const madera = bot.inventory.items().filter((i) => i.name.includes('log'));
            const piedra = bot.inventory.items().filter((i) => i.name.includes('cobblestone'));
            const palos = bot.inventory.items().filter((i) => i.name.includes('stick'));
            const comida = bot.inventory.items().filter((i) => i.name.includes('apple') || i.name.includes('bread') || i.name.includes('wheat'));
            // Evitar lava si no va a construir portal
            if ((0, lava_1.evitarLava)(bot, mineflayer_pathfinder_1.goals, utils_1.reconocerBloque))
                return;
            // Minar en patrón de rama
            if ((0, branchMining_1.branchMining)(bot))
                return;
            // Buscar cofres y abrirlos
            if ((0, chest_1.buscarCofres)(bot))
                return;
            // Explorar aldeas
            if ((0, village_1.explorarAldea)(bot))
                return;
            // Explorar cuevas y minar minerales raros
            if ((0, rareMining_1.explorarCuevasYMinar)(bot))
                return;
            // Construir refugio si hay mobs cerca
            (0, refuge_1.construirRefugio)(bot);
            // Plantar árboles y cultivos
            (0, plantarAuto_1.plantarAuto)(bot);
            // Pescar si está cerca de agua y tiene caña
            (0, pescarAuto_1.pescarAuto)(bot);
            // Recolectar madera si tiene poca
            if (madera.length < 8) {
                const logIds = [
                    mcData.blocksByName.oak_log?.id,
                    mcData.blocksByName.birch_log?.id,
                    mcData.blocksByName.spruce_log?.id
                ].filter(Boolean);
                const blocks = bot.findBlocks({ matching: logIds, maxDistance: 32, count: 1 });
                if (blocks.length > 0) {
                    bot.chat('Recolectando madera automáticamente...');
                    bot.pathfinder.setGoal(new mineflayer_pathfinder_1.goals.GoalBlock(blocks[0].x, blocks[0].y, blocks[0].z));
                    return;
                }
            }
            // Minar piedra si tiene poca
            if (piedra.length < 16) {
                const stoneId = mcData.blocksByName.stone?.id;
                const stoneBlock = bot.findBlock({ matching: stoneId, maxDistance: 32 });
                if (stoneBlock) {
                    bot.chat('Minando piedra automáticamente...');
                    bot.pathfinder.setGoal(new mineflayer_pathfinder_1.goals.GoalBlock(stoneBlock.position.x, stoneBlock.position.y, stoneBlock.position.z));
                    return;
                }
            }
            // Buscar alimentos si tiene pocos
            if (comida.length < 4) {
                const wheatId = mcData.blocksByName.wheat?.id;
                const wheatBlock = bot.findBlock({ matching: wheatId, maxDistance: 32 });
                if (wheatBlock) {
                    bot.chat('Recolectando trigo automáticamente...');
                    bot.pathfinder.setGoal(new mineflayer_pathfinder_1.goals.GoalBlock(wheatBlock.position.x, wheatBlock.position.y, wheatBlock.position.z));
                    return;
                }
            }
            // Movimiento natural: patrullar con pausas y giros
            if (!bot.pathfinder.isMoving()) {
                (0, puente_1.hacerPuente)(bot);
                const x = bot.entity.position.x + Math.random() * 8 - 4;
                const z = bot.entity.position.z + Math.random() * 8 - 4;
                const y = bot.entity.position.y;
                setTimeout(() => {
                    bot.look(bot.entity.yaw + (Math.random() - 0.5), bot.entity.pitch + (Math.random() - 0.5));
                    bot.chat('Explorando el entorno...');
                    bot.pathfinder.setGoal(new mineflayer_pathfinder_1.goals.GoalBlock(x, y, z));
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
            // Prepararse para combate si detecta mobs hostiles
            const mobs = Object.values(bot.entities).filter((e) => e.type === 'mob' && e.mobType !== 'Enderman' && e.position && e.position.distanceTo(bot.entity.position) < 10);
            if (mobs.length > 0) {
                bot.chat('¡Alerta! Mob hostil detectado, preparándome para combatir.');
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
        if (username === bot.username)
            return;
        const now = Date.now();
        if (now - lastChatTime < chatCooldown) {
            console.log('[BOT] Mensaje bloqueado por cooldown de chat:', message);
            return;
        }
        // PvP contra jugadores
        if (message.startsWith('pvp ') || message.startsWith('ataca ')) {
            const partes = message.split(' ');
            const target = partes[1];
            if (target) {
                (0, pvp_1.attackPlayer)(bot, target);
                bot.chat(`¡Atacando a ${target} en PvP!`);
            }
            else {
                bot.chat('Debes especificar el nombre del jugador.');
            }
            return;
        }
        // Construcción
        if (message.startsWith('construye ')) {
            const [_, blockName, x, y, z] = message.split(' ');
            (0, build_1.construir)(bot, blockName, { x: Number(x), y: Number(y), z: Number(z) });
            return;
        }
        // Minería
        if (message.startsWith('mina ')) {
            if (bot.estaMinando) {
                bot.chat('Ya estoy minando, espera a que termine.');
                return;
            }
            const blockName = message.split(' ')[1];
            bot.estaMinando = true;
            try {
                await (0, mine_1.minar)(bot, blockName);
            }
            catch (e) {
                bot.chat('Error al minar: ' + (e?.message || 'desconocido'));
            }
            bot.estaMinando = false;
            return;
        }
        // Recolección
        if (message.startsWith('recolecta ')) {
            const resourceName = message.split(' ')[1];
            (0, collect_1.recolectar)(bot, resourceName);
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
            (0, waterdrop_1.hacerWaterDrop)(bot);
            return;
        }
        // Mecánicas extra automáticas
        if (message.startsWith('mecanica ')) {
            const [_, nombre, ...args] = message.split(' ');
            if (mecanicasExtra[nombre]) {
                mecanicasExtra[nombre](bot, ...args);
                bot.chat(`Mecánica ${nombre} ejecutada.`);
            }
            else {
                bot.chat('No conozco esa mecánica.');
            }
            return;
        }
        if (message.includes('vem')) {
            const player = bot.players[username];
            if (player && player.entity) {
                bot.chat('¡Voy hacia ti!');
                bot.pathfinder.setGoal(new mineflayer_pathfinder_1.goals.GoalNear(player.entity.position.x, player.entity.position.y, player.entity.position.z, 1));
            }
            return;
        }
        if (message.includes('sigueme')) {
            const player = bot.players[username];
            if (player && player.entity) {
                bot.chat('¡Te sigo!');
                bot.pathfinder.setGoal(new mineflayer_pathfinder_1.goals.GoalFollow(player.entity, 1), true);
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
        if (message.startsWith('!ask ')) {
            const prompt = message.slice(5);
            let response = localModel(prompt);
            if (!response) {
                response = await askGeminity(prompt);
                // Aprendizaje automático: guardar y mejorar con Gemini
                knowledgeNbt[prompt] = response;
                const nbtData = nbt.writeUncompressed({ type: 'compound', name: '', value: knowledgeNbt });
                fs.writeFileSync('knowledge.nbt', nbtData);
            }
            bot.chat(response);
            conversationLog.push({ username, prompt, response });
            fs.writeFileSync('conversation_log.json', JSON.stringify(conversationLog, null, 2));
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
        // Responder SIEMPRE con lenguaje natural si no reconoce el comando
        if (!['vem', 'sigueme', 'plantar arbol', 'equipa', 'come', 'dormir'].includes(message) && !message.startsWith('!math ') && !message.startsWith('!ask ') && !message.startsWith('ataca ') && !message.startsWith('construye ') && !message.startsWith('mina ') && !message.startsWith('recolecta ') && !message.startsWith(' ')) {
            try {
                const respuesta = await (0, llama_bridge_1.hablarEnLenguajeNatural)(message);
                global.sendChat(respuesta);
                lastChatTime = Date.now();
                // Guardar pregunta y respuesta en conversationLog y knowledgeNbt
                conversationLog.push({ username, pregunta: message, respuesta });
                fs.writeFileSync('conversation_log.json', JSON.stringify(conversationLog, null, 2));
                knowledgeNbt[message] = respuesta;
                const nbtData = nbt.writeUncompressed({ type: 'compound', name: '', value: knowledgeNbt });
                fs.writeFileSync('knowledge.nbt', nbtData);
                // Mostrar por consola para comprobar funcionamiento
                console.log('[IA] Pregunta:', message);
                console.log('[IA] Respuesta:', respuesta);
                // Ejecutar parser de instrucciones de Llama si la respuesta es una instrucción válida
                (0, llama_parser_1.parseAndExecuteLlamaInstruction)(respuesta);
            }
            catch (e) {
                global.sendChat('No pude responder en lenguaje natural.');
                console.error('[IA] Error al responder:', e);
            }
            return;
        }
    });
}
