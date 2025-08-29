
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
	  "host": "127.0.0.1",
	  "port": 25565,
	  "username": "ProBot",
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

## Integración IA Llama (opcional)
Para usar la IA Llama, asegúrate de tener el backend Python corriendo (ver `/modulo/controllet/llama_backend_README.md`).

## Uso
El bot responde a comandos en el chat de Minecraft y puede ejecutar instrucciones estructuradas desde la IA.

## Módulos y mecánicas
El bot es modular, puedes agregar nuevas mecánicas en `src/mechanics/` y exponerlas en el API.

---
Hecho con ❤️ por Luisfont13
