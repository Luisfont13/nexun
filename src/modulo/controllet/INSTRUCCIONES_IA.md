// Instrucciones para exponer funciones del bot a la IA (Llama)

# Exposición de funciones del bot

Para que Llama pueda controlar el bot y sugerir/mejorar mecánicas, expón funciones clave del bot en un objeto accesible desde el motor IA-light. Ejemplo:

```ts
// En bot.ts o un archivo de interfaz:
export const botApi = {
  mover: (x, y, z) => bot.pathfinder.setGoal(new goals.GoalBlock(x, y, z)),
  minar: (bloque) => minar(bot, bloque),
  recolectar: (objeto) => recolectar(bot, objeto),
  atacar: (objetivo) => attackPlayer(bot, objetivo),
  chatear: (mensaje) => sendChat(mensaje),
  equipar: (objeto) => autoEquip(bot, objeto),
  // ...agrega más funciones según sea necesario
};
```

# Reglas para la IA (Llama)
- Solo puede llamar a funciones expuestas en `botApi`.
- No debe modificar la lógica de conexión, reconexión, inventario base ni seguridad.
- Puede sugerir nuevas mecánicas, estrategias o mejoras, pero no modificar código crítico.
- Si detecta errores, debe sugerir el cambio, no aplicarlo directamente.
- Debe evitar spam y acciones repetitivas.

# Ejemplo de uso desde el motor IA

Cuando Llama genere una instrucción, el sistema puede mapearla a una función de `botApi`:

```ts
// Ejemplo de ejecución segura
if (instruccion === 'mover') botApi.mover(10, 64, 20);
if (instruccion === 'comer') botApi.chatear('Voy a comer');
```

# Mejoras
- Puedes agregar un parser para que Llama devuelva instrucciones estructuradas (JSON o comandos).
- Puedes registrar logs de las acciones sugeridas por la IA para revisión.
