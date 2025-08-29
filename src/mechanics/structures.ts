// Build structures from JSON blueprints
// Blueprint format:
// {
//   name: "casa_basica",
//   origin: { x: 0, y: 0, z: 0 }, // relative origin (0,0,0) reference
//   blocks: [ { dx:0, dy:0, dz:0, name:"oak_planks" }, ... ]
// }

export type BlockPlacement = { dx: number; dy: number; dz: number; name: string };
export type Blueprint = { name: string; origin?: { x: number; y: number; z: number }; blocks: BlockPlacement[] };

export async function construirEstructura(bot: any, basePos: any, plano: Blueprint) {
  const target = (dx: number, dy: number, dz: number) => basePos.offset(dx, dy, dz);
  for (const b of plano.blocks) {
    const item = bot.inventory.items().find((i: any) => i.name.includes(b.name));
    if (!item) continue; // skip if not available
    try {
      await bot.equip(item, 'hand');
      const pos = target(b.dx, b.dy, b.dz);
      const refBlock = bot.blockAt(pos);
      // If spot is empty, place against a nearby face (simple heuristic)
      const support = refBlock || bot.blockAt(pos.offset(0, -1, 0));
      if (support) {
        await bot.placeBlock(support, pos.minus(support.position));
      }
    } catch (e) {
      // swallow to continue
    }
  }
}