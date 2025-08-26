"use strict";
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
exports.startBot = startBot;
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
    bot.on('entityHurt', (entity) => {
        if (entity === bot.entity) {
            const mobs = Object.values(bot.entities).filter((e) => e.type === 'mob' && e.mobType !== 'Enderman' && e.position.distanceTo(bot.entity.position) < 8);
            if (mobs.length > 0) {
                const shield = bot.inventory.items().find((i) => i.name.includes('shield'));
                if (shield)
                    bot.equip(shield, 'off-hand');
                const mob = mobs[0];
                if (mob && mob.position && typeof mob.position.offset === 'function') {
                    bot.lookAt(mob.position.offset(0, 1, 0));
                }
                bot.attack(mob);
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
function startBot() {
    const configPath = path.join(__dirname, '../../server.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const bot = (0, mineflayer_1.createBot)({
        host: config.host,
        port: config.port,
        username: config.username || 'ProBot',
        version: config.version || false
    });
    bot.loadPlugin(mineflayer_pathfinder_1.pathfinder);
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
            bot.pathfinder.setGoal(new mineflayer_pathfinder_1.goals.GoalBlock(blocks[0].x, blocks[0].y, blocks[0].z));
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
        if (username === bot.username)
            return;
        if (message === 'vem') {
            const player = bot.players[username];
            if (player && player.entity) {
                bot.chat('¡Voy hacia ti!');
                bot.pathfinder.setGoal(new mineflayer_pathfinder_1.goals.GoalNear(player.entity.position.x, player.entity.position.y, player.entity.position.z, 1));
            }
            return;
        }
        if (message === 'sigueme') {
            const player = bot.players[username];
            if (player && player.entity) {
                bot.chat('¡Te sigo!');
                bot.pathfinder.setGoal(new mineflayer_pathfinder_1.goals.GoalFollow(player.entity, 1), true);
            }
            return;
        }
        if (message.startsWith('!math ')) {
            // Ejemplo: !math suma 2 3
            const [op, a, b] = message.slice(6).split(' ');
            if (op in mathInfo) {
                const fn = mathInfo[op];
                if (typeof fn === 'function' && fn.length === 2) {
                    bot.chat('Resultado: ' + fn(Number(a), Number(b)));
                }
                else {
                    bot.chat('Operación no reconocida. Usa suma, resta, multiplicar, dividir.');
                }
            }
            else {
                bot.chat('Operación no reconocida. Usa suma, resta, multiplicar, dividir.');
            }
            return;
        }
        if (message === 'plantar arbol') {
            const plantar = mathInfo['plantarArbol'];
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
