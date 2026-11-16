// What a pocket holds (docs/design.md "The shop", docs/backend.md#events `sell`): a tally key's kinds that sell. The
// critters (fish, bug, sea), the ずかん's beach finds (shell, the pearl among them; fossil; fragment), all counted in the
// day tallies since they first turned up, and the goods: what the island gives that the ずかん has no page for (wood, a
// branch, fruit, a mushroom, a weed, an egg, junk off the line), counted in the same tallies (`goods:<id>`) and never a
// `find`. Never a present's furniture or recipe (they're the ずかん's カタログ, and what one can place is もようがえ's), nor a
// message bottle (NH's: it's read, not kept). Shared by the record, the phones and scripts/shop-prices.ts; pure.

/** The tally kinds a pocket holds (a sell's `species` is `kind:id` of one of them, with a price). */
export const POCKET_KINDS = ['fish', 'bug', 'sea', 'shell', 'fossil', 'fragment', 'goods'] as const;
export type PocketKind = (typeof POCKET_KINDS)[number];

/** The goods: our id → NH's English name (the price list's row, scripts/shop-prices.ts). */
export const GOODS: Readonly<Record<string, string>> = {
  // a tree's wood (shaken out: island/treeShake.ts woodFall) and its branch
  wood: 'wood', softwood: 'softwood', hardwood: 'hardwood', 'tree-branch': 'tree branch',
  // a pulled weed (island/Care.svelte)
  weeds: 'clump of weeds',
  // the goal trees' fruit as picked up before 2026-11-16 (still in pockets, at NH's price: GOAL_GOODS now) and a palm's
  // coconuts
  apple: 'apple', pear: 'pear', peach: 'peach', cherry: 'cherry', coconut: 'coconut',
  // mushroom season's (world/mushrooms.ts), the rare one dug up
  'round-mushroom': 'round mushroom', 'skinny-mushroom': 'skinny mushroom', 'flat-mushroom': 'flat mushroom',
  'elegant-mushroom': 'elegant mushroom', 'rare-mushroom': 'rare mushroom',
  // Bunny Day's eggs (world/eggs.ts): dug up, off a balloon, on the line
  'earth-egg': 'earth egg', 'sky-egg': 'sky egg', 'water-egg': 'water egg',
  // junk off the line (world/critters.ts JUNK)
  boot: 'boot', 'old-tire': 'old tire', 'empty-can': 'empty can',
  // the field's (contract/farm.ts): a harvest's vegetables and the starts (the shop's かう, a dug-up plant)
  tomato: 'tomato', wheat: 'wheat', sugarcane: 'sugarcane', potato: 'potato', carrot: 'carrot', pumpkin: 'orange pumpkin',
  'tomato-start': 'tomato start', 'wheat-start': 'wheat start', 'sugarcane-start': 'sugarcane start', 'potato-start': 'seed potato',
  'carrot-start': 'carrot start', 'pumpkin-start': 'pumpkin start'
};

/** The goal trees' fruit (island/FruitTree.svelte) since 2026-11-16, the user's economy review: goods of their own,
 *  priced here and not by NH's list (scripts/shop-prices.ts never sees them): a met goal's fruit (`goal-<fruit>`) 60
 *  かいがら, and the gold fruit of a day with all four met 150. Their own ids, so the plain fruit picked up before keep
 *  their 5 (a price change never reprices a pocket). Only the tree's owner picks them up (live-protocol.ts pickMaySend):
 *  one of each a day, the day's claim. */
export const GOAL_GOODS: Readonly<Record<string, number>> = {
  'goal-pear': 60, 'goal-peach': 60, 'goal-cherry': 60, 'goal-apple': 60, 'gold-fruit': 150
};

/** Whether `id` is one of the goods (NH's, GOODS, or the goal trees', GOAL_GOODS). */
export const isGoods = (id: string): boolean => Object.hasOwn(GOODS, id) || Object.hasOwn(GOAL_GOODS, id);
