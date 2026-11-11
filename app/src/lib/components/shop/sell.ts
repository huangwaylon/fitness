// うる's picks (shop/Counter.svelte, docs/design.md "The shop"): how many of each pocket key are picked to sell. A row's
// tap takes the whole stack (again: none), − / + one at a time within the stack, a section's 全部 every stack in it
// (again: none). Never more than the pocket holds, never under 0. Pure: each returns new picks.

/** `kind:id` → how many picked (0 or absent: none). */
export type Picks = Readonly<Record<string, number>>;
/** A stack in the pocket: its key and how many I have. */
interface Stack { k: string; n: number }

/** A row's tap: the whole stack, or none when it's all picked already. */
export function toggleStack(picks: Picks, { k, n }: Stack): Picks {
  return { ...picks, [k]: (picks[k] ?? 0) >= n ? 0 : n };
}

/** − / +: one less or more, held inside 0..the stack. */
export function step(picks: Picks, { k, n }: Stack, by: 1 | -1): Picks {
  return { ...picks, [k]: Math.max(0, Math.min(n, (picks[k] ?? 0) + by)) };
}

/** Whether every stack of a section is picked whole. */
export const allPicked = (picks: Picks, rows: readonly Stack[]): boolean => rows.length > 0 && rows.every(({ k, n }) => (picks[k] ?? 0) >= n);

/** A section's 全部: every stack in it whole, or none of them when they all are already. */
export function toggleSection(picks: Picks, rows: readonly Stack[]): Picks {
  const on = !allPicked(picks, rows);
  return { ...picks, ...Object.fromEntries(rows.map(({ k, n }) => [k, on ? n : 0])) };
}
