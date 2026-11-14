// うる's picks (shop/Counter.svelte, docs/design.md "The shop"): how many of each pocket key are picked to sell. A row's
// tap takes the whole stack (again: none), − / + one at a time within the stack, a section's 全部 every stack in it
// (again: none). Never more than the pocket holds, never under 0. Pure: each returns new picks. And 全部売る's plan
// (sellAllOf).

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

/** 全部売る's plan: what it sells (`picks`, each stack whole), how many and for how much, and what it keeps and why. */
export interface SellAll { picks: Map<string, number>; n: number; v: number; kept: { k: string; n: number; why: 'start' | 'ask' }[] }

/**
 * 全部売る: every stack of my `pocket` at its `price`, but the starts (苗: held to plant) and one of the vegetable today's
 * open おねがい asks of me (`ask`: its key, or null), so 全部 never breaks the visitor's ask. Nothing else is held back:
 * the pocket is never placed or shown, and selling leaves the ずかん and the museum.
 */
export function sellAllOf(pocket: Iterable<readonly [string, number]>, price: (k: string) => number | undefined, ask: string | null = null): SellAll {
  const out: SellAll = { picks: new Map(), n: 0, v: 0, kept: [] };
  for (const [k, have] of pocket) {
    const p = price(k);
    if (p === undefined || have < 1) continue;
    if (/^goods:[a-z]+-start$/.test(k)) {
      out.kept.push({ k, n: have, why: 'start' });
      continue;
    }
    if (k === ask) out.kept.push({ k, n: 1, why: 'ask' });
    const n = k === ask ? have - 1 : have;
    if (n < 1) continue;
    out.picks.set(k, n);
    out.n += n;
    out.v += n * p;
  }
  return out;
}
