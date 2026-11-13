// The trees' presents (docs/design.md "Shaking a tree"), after NH: each Tokyo day two of the island's oaks and cedars
// hold a piece of furniture, and the first shake of one drops it (once). Ours falls wrapped, as a balloon's present
// does, and opens into the piece where it lies (Finds.svelte: the same present, the same plate). Which trees, and what
// each holds (catalog.ts treeItem), come from the date and the island's seed, so every phone agrees with no messages.
// The palms keep their coconuts and the goal trees their fruit; bamboo doesn't shake. Never Bells: scenery never pays.
// Shared (docs/backend.md#shared-world): the drop is a `put` of the present by its tree's id (`tf:<tree>`, first wins
// at the relay), so it lies on both phones and in the sheet's day row, and opening it is the present's `pick`.
import type { Put } from '#lib/sync/world-day.ts';
import { ISLAND_SEED, dayRand } from '#lib/world/daySeed.ts';
import { sceneryTrees, type ShakeTree } from './treeShake.ts';
import { offBuildingsAt } from '#lib/world/world.ts';

/** How many trees hold a present each day (NH's two). */
export const GIFTS_A_DAY = 2;

/** The trees that may hold one: the scenery's oaks and cedars (NH's hardwoods and cedars), in world.ts's order. */
export const giftTrees = (): readonly string[] => sceneryTrees().filter((t) => t.kind === 'oak' || t.kind === 'cedar').map((t) => t.id);

/** The trees holding a present on `date` (YYYY-MM-DD): GIFTS_A_DAY of GIFT_TREES, seeded. */
export function giftTreesOn(date: string, seed = ISLAND_SEED): string[] {
  const r = dayRand(date, 'tree-gifts', seed), pool = [...giftTrees()], out: string[] = [];
  while (out.length < GIFTS_A_DAY && pool.length) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  return out;
}

const PREFIX = 'tf:';
/** The shared id of `tree`'s present (the day's put). */
export const giftId = (tree: string): string => `${PREFIX}${tree}`;
/** The tree a present fell from, if it's a tree's. */
export const giftTree = (id: string): string | null => (id.startsWith(PREFIX) ? id.slice(PREFIX.length) : null);

/** `tree` still holds its present today: it's one of the day's and nothing has dropped it yet. */
export const holdsGift = (date: string, tree: string, puts: Readonly<Record<string, Put>>, seed = ISLAND_SEED): boolean =>
  !puts[giftId(tree)] && giftTreesOn(date, seed).includes(tree);

/** Where it lands: in front of the trunk on the inner side (a branch lies further in, a nest outside); off a building
 *  beside the tree (world.ts offBuildingsAt: never on its footprint, its steps or behind it). */
export const giftAt = (t: ShakeTree): [number, number] => offBuildingsAt(Math.round(t.x - t.out * 16), Math.round(t.z - 20));
