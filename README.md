
# Nexun - Bot modular de Minecraft con IA (Llama)

## Requisitos
- Node.js >= 18
- npm
- Minecraft Java Edition (servidor)

## Instalación
1. Instala dependencias:
	```bash
	npm install
	```
2. Configura el archivo `server.json` con los datos de tu servidor Minecraft:
	```json
	{
	  "host": "servidor",
	  "port": 25565,
	  "username": "bot name",
	  "version": false
	}
	```

## Compilar y ejecutar
1. Compila el proyecto:
	```bash
	npm run build
	```
2. Inicia el bot:
	```bash
	npm start
	```
	O en modo desarrollo (hot reload):
	```bash
	npm run dev
	```

## Integración IA
Se esta desarrollando una ia espesifica que pueda responder 
e usar las apis del bot

## Uso
El bot responde a comandos en el chat de Minecraft y puede ejecutar instrucciones estructuradas desde la IA.

## Módulos y mecánicas
El bot es modular, puedes agregar nuevas mecánicas en `src/mechanics/` y exponerlas en el API.

---
Hecho con ❤️ por Luisfont13
