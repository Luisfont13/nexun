# Backend Python para Meta-Llama 3.1-8B (HuggingFace)

Este backend expone un endpoint HTTP compatible con el motor AI-Light (modulo/controllet) para usar Meta-Llama 3.1-8B vía HuggingFace Transformers.

## Requisitos
- Python 3.9+
- pip install fastapi uvicorn transformers torch
- HuggingFace token (opcional, si el modelo es privado)

## Uso
1. Instala dependencias:
   ```bash
   pip install fastapi uvicorn transformers torch
   ```
2. Ejecuta el servidor:
   ```bash
   uvicorn llama_backend:app --host 0.0.0.0 --port 8000
   ```
3. Configura el bot para usar:
   - AI_PROVIDER=external
   - AI_ENDPOINT=http://localhost:8000/v1/generate

## Endpoint
- POST /v1/generate
  - Body: `{ "prompt": "<texto>", "options": { "maxTokens": 128, "temperature": 0.7 } }`
  - Respuesta: `{ "text": "..." }`

## Notas
- El backend limita la longitud de la respuesta y controla temperatura/top-k según lo que reciba.
- Puedes extenderlo para guardar logs, contexto, etc.

---

# Instrucciones para la IA (Llama)

- Puedes sugerir y ejecutar acciones del bot usando funciones expuestas por el sistema.
- No modifiques partes críticas del bot (conexión, reconexión, seguridad, inventario base).
- Puedes sugerir nuevas mecánicas, estrategias, o mejoras en el comportamiento.
- Si detectas errores o mejoras posibles, sugiere el cambio pero no lo apliques directamente.
- El bot te expondrá funciones como: moverse, minar, recolectar, atacar, chatear, equipar, etc.
- Usa el contexto del juego y del bot para tomar decisiones inteligentes.
- No generes spam ni repitas acciones innecesarias.
- Si tienes dudas, pregunta al usuario o espera instrucciones.

---

# Ejemplo de prompt para Llama

```
[ESTADO]
vida: 18/20
comida: 15/20
inventario: [pico, pan, espada]
posición: x=10, y=64, z=20
jugadores_cerca: [Steve]

[FUNCIONES DISPONIBLES]
- mover(x, y, z)
- minar(bloque)
- recolectar(objeto)
- atacar(objetivo)
- chatear(mensaje)
- equipar(objeto)

[INSTRUCCIÓN]
Busca hierro y come si tienes hambre.
```

La IA debe responder con instrucciones claras y concisas para el bot.
