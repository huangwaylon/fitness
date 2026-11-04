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
  // the goal trees' fruit (island/FruitTree.svelte) and a palm's coconuts
  apple: 'apple', pear: 'pear', peach: 'peach', cherry: 'cherry', coconut: 'coconut',
  // mushroom season's (island/mushrooms.ts), the rare one dug up
  'round-mushroom': 'round mushroom', 'skinny-mushroom': 'skinny mushroom', 'flat-mushroom': 'flat mushroom',
  'elegant-mushroom': 'elegant mushroom', 'rare-mushroom': 'rare mushroom',
  // Bunny Day's eggs (island/eggs.ts): dug up, off a balloon, on the line
  'earth-egg': 'earth egg', 'sky-egg': 'sky egg', 'water-egg': 'water egg',
  // junk off the line (island/critters.ts JUNK)
  boot: 'boot', 'old-tire': 'old tire', 'empty-can': 'empty can'
};
