# CoreBotAI (AI-Light) — Motor de IA ligero

Un motor de IA ultra liviano, sin modelos pesados, con API HTTP minimalista y opción de proveedor local o externo. Diseñado para bajo consumo de RAM, arranque rápido y fácil integración en APIs.

- **Ligero**: sin frameworks pesados ni dependencias grandes.
- **Rápido**: respuestas instantáneas en el modo local.
- **Integrable**: expone una **API HTTP** y también puede usarse como librería.
- **Configurable**: proveedor `local` (reglas + heurísticas) o `external` (endpoint HTTP).

## Índice
- [Arquitectura y archivos](#arquitectura-y-archivos)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Ejecución](#ejecución)
- [API HTTP](#api-http)
- [Uso como librería](#uso-como-librería)
- [Configuración](#configuración)
- [Proveedores](#proveedores)
- [¿Cómo aprende? ¿Dónde se guardan los datos?](#cómo-aprende-dónde-se-guardan-los-datos)
- [Rendimiento y consumo](#rendimiento-y-consumo)
- [Seguridad y privacidad](#seguridad-y-privacidad)
- [Roadmap](#roadmap)
- [Licencia y autor](#licencia-y-autor)
- [luis](#luis.md)
## Arquitectura y archivos
- `src/engine/types.ts`: Tipos comunes (`ModelProvider`, `GenOptions`, etc.).
- `src/engine/providers.local.ts`: Proveedor **local** ultra liviano (reglas + heurística simple).
- `src/engine/providers.external.ts`: Proveedor **external** que envía el prompt a un endpoint HTTP configurable (usa `axios`).
- `src/engine/index.ts`: `AILightEngine` (elige proveedor por opciones o variables de entorno).
- `src/server.ts`: Servidor HTTP minimalista usando `http` de Node.
- `tsconfig.json`: Compilación a `dist` (CommonJS, target ES6).
- `package.json`: Scripts de build/dev y dependencias.

## Requisitos
- Node.js 18+ recomendado.

## Instalación
```bash
npm install
```

## Ejecución
- Desarrollo (TS directo con `ts-node`):
```bash
npm run dev
```
- Producción (transpila a `dist/` y ejecuta Node):
```bash
npm run build
npm start
```
- Variables de entorno útiles:
  - `PORT`: puerto del servidor (default `3000`).
  - `AI_PROVIDER`: `local` | `external` (default `local`).
  - `AI_ENDPOINT`: requerido si usas `external`.
  - `AI_API_KEY`: opcional para `external`.

## API HTTP
- `GET /health`
  - Respuesta: `{"ok": true}`
- `POST /v1/generate`
  - Body (JSON):
    ```json
    {
      "prompt": "Escribe una frase sobre IA ligera"
    }
    ```
  - Respuesta (JSON):
    ```json
    {
      "text": "...",
      "usage": { "tokensIn": 5, "tokensOut": 10 },
      "latencyMs": 3
    }
    ```

Ejemplo con curl:
```bash
curl -X POST http://localhost:3000/v1/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"hola"}'
```

## Uso como librería
```ts
import { AILightEngine } from "./dist/engine"; // tras npm run build

const engine = new AILightEngine({ provider: "local" });
const res = await engine.ask("hola");
console.log(res.text);
```

## Configuración
- **`AI_PROVIDER`**:
  - `local`: respuestas rápidas sin llamadas externas.
  - `external`: delega a un endpoint HTTP propio o de terceros.
- **`AI_ENDPOINT`** (solo `external`): URL del endpoint que acepte `{ prompt, options }` y responda `{ text }`.
- **`AI_API_KEY`** (opcional, `external`): se envía como `Authorization: Bearer <key>`.

## Proveedores
- **Local** (`providers.local.ts`):
  - Reglas simples para saludos y ayuda.
  - Resumen extractivo básico para textos largos.
  - Pequeño generador heurístico (n-gram-ish) para completar texto.
  - Ventajas: arranque instantáneo, cero dependencias pesadas, uso de memoria muy bajo.
  - Limitaciones: no genera texto de gran calidad como un LLM; es determinista y simple.

- **External** (`providers.external.ts`):
  - Envía el prompt a un servicio externo (tu propio modelo/LLM o un proxy).
  - Define `AI_ENDPOINT` y opcional `AI_API_KEY`.
  - Ventajas: mejor calidad si el backend es potente; escalable.
  - Consideraciones: latencia y costo del servicio externo.

## ¿Cómo aprende? ¿Dónde se guardan los datos?
- **Por defecto, el motor NO aprende ni almacena datos.**
  - El proveedor **local** es puramente de reglas/heurísticas: no entrena, no ajusta pesos, no guarda prompts ni respuestas.
  - El proveedor **external** delega la generación: el aprendizaje depende del servicio remoto (no incluido en este repo).
- **Persistencia por defecto**: no se guarda nada en disco ni en memoria prolongada. Solo se procesa la petición en tiempo real.

### ¿Quieres memoria o aprendizaje incremental?
Puedes agregar una capa de "memoria" o almacenamiento simple para mejorar contexto o análisis posterior. Propuesta mínima (opcional):

1) Guardado de interacciones en un archivo JSONL (`data/sessions.jsonl`):
```ts
// Ejemplo conceptual de wrapper (no incluido por defecto)
import fs from "fs";
import path from "path";
import { AILightEngine } from "./engine";

const engine = new AILightEngine({ provider: "local" });
const dataPath = path.join(process.cwd(), "data", "sessions.jsonl");
fs.mkdirSync(path.dirname(dataPath), { recursive: true });

async function askWithLog(prompt: string) {
  const res = await engine.ask(prompt);
  const record = { ts: Date.now(), prompt, text: res.text, usage: {in: res.tokensIn, out: res.tokensOut} };
  fs.appendFileSync(dataPath, JSON.stringify(record) + "\n");
  return res;
}
```

2) Contexto corto a partir del historial reciente:
```ts
// Cargar las últimas N entradas del archivo y concatenarlas al prompt (simple)
function buildContext(prompt: string, history: {prompt: string, text: string}[], maxChars = 800) {
  const recent = history.slice(-5).map(h => `U: ${h.prompt}\nA: ${h.text}`).join("\n\n");
  const ctx = recent.slice(-maxChars);
  return ctx ? `${ctx}\n\nU: ${prompt}` : prompt;
}
```

3) Si necesitas "aprendizaje" real (fine-tuning, embeddings, RAG):
- Integra un backend externo con esas capacidades y úsalo vía `external`.
- O agrega una capa de embeddings local + búsqueda (por ejemplo, una librería de vectores liviana), teniendo en cuenta el coste de memoria.

## Cómo educar a la IA (paso a paso)

Antes de empezar, aclaremos qué significa “educar” en este motor:
- **Ajustar reglas/heurísticas** del proveedor local para respuestas específicas.
- **Añadir memoria ligera** para dar contexto con historial reciente.
- **Aprendizaje real** (fine-tuning/embeddings/RAG) usando un backend externo vía `external`.

### Opción A: Reglas en el proveedor local
Edita `src/engine/providers.local.ts` para añadir reglas de dominio. Por ejemplo, puedes reconocer consultas frecuentes y responder con plantillas o pequeños extractivos. Esto es rápido y determinista.

### Opción B: Memoria ligera con JSONL
Este repo incluye un almacén simple `JsonMemoryStore` (`src/memory/jsonMemory.ts`) que guarda interacciones en `data/sessions.jsonl`. Puedes usarlo para enriquecer el prompt con historial reciente.

```ts
// Ejemplo de uso de memoria + contexto (TypeScript)
import { AILightEngine } from "./dist/engine"; // tras npm run build
import { JsonMemoryStore } from "./src/memory/jsonMemory";

const engine = new AILightEngine({ provider: process.env.AI_PROVIDER ?? "local" });
const memory = new JsonMemoryStore(); // data/sessions.jsonl por defecto

function buildContext(prompt: string, maxChars = 800) {
  const last = memory.readLast(5); // últimas 5 interacciones
  const ctx = last.map(i => `U: ${i.prompt}\nA: ${i.text}`).join("\n\n");
  const clipped = ctx.slice(-maxChars);
  return clipped ? `${clipped}\n\nU: ${prompt}` : prompt;
}

export async function askEducated(prompt: string) {
  const withCtx = buildContext(prompt);
  const res = await engine.ask(withCtx);
  memory.append({
    ts: Date.now(),
    prompt,
    text: res.text,
    tokensIn: res.tokensIn,
    tokensOut: res.tokensOut,
  });
  return res;
}
```

- **Dónde mirar**: `src/memory/jsonMemory.ts` expone `append`, `readLast(n)` y `allCount()`.
- **Ventaja**: no entrena modelos; simplemente conserva contexto útil entre llamadas.

### Opción C: Aprendizaje real (fine-tuning / RAG) con `external`
Para calidad superior, usa un servicio/LLM externo con capacidades de:
- **Fine-tuning** sobre tus datos.
- **Embeddings + búsqueda semántica (RAG)** para recuperar contexto relevante.

Pasos generales:
1. Implementa o contrata un endpoint HTTP que acepte `{ prompt, options }` y responda `{ text }`.
2. Configura variables:
   - `AI_PROVIDER=external`
   - `AI_ENDPOINT=https://tu-endpoint` (y `AI_API_KEY` si aplica)
3. (Opcional) Integra tu pipeline de embeddings/vector DB para armar el contexto antes de llamar al endpoint.

### Buenas prácticas
- **Privacidad**: no guardes datos sensibles si no es necesario; considera anonimizar.
- **Capado de historial**: limita caracteres o entradas al construir contexto.
- **Evaluación**: crea prompts de prueba y compara respuestas antes y después de cambios de “educación”.
- **Versionado**: documenta reglas/memoria activas para reproducibilidad.

## Rendimiento y consumo
- **Memoria**: muy baja en `local` (solo Node + código). Sin modelos grandes en RAM.
- **CPU**: mínimo; reglas y heurísticas simples.
- **Latencia**: milisegundos en `local`; en `external` depende del endpoint.

## Seguridad y privacidad
- **Sin almacenamiento por defecto**: no se guardan prompts ni salidas.
- **Claves**: si usas `AI_API_KEY`, se envía en `Authorization` al endpoint externo.
- Recomendado: manejar `.env` o variables de entorno en el entorno de despliegue.

## Roadmap
- Hooks de memoria opcional (archivo/SQLite).
- Adaptadores de proveedor adicionales (e.g., OpenAI/Local REST backends).
- Métricas/monitorización opcional (prometheus endpoint).

## Licencia y autor
- Licencia: ISC
- Autor: @mc_luis_gamer_YT