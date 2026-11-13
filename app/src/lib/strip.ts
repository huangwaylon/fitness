// The bots' status strip (components/bots/StatusStrip.svelte: 保養所's 直近1時間, ジム's 直近12時間): a row of slots, oldest first, each
// ok (green), avail (yellow: a room or a slot open), fail (red, hatched) or none (outlined: nothing checked then), with
// its line for a tap and VoiceOver. Pure: the pages make the cells (its/view.ts, gym/status.ts), these place them.

export type CellState = 'ok' | 'avail' | 'fail' | 'none';
/** One slot: [start, end) in ms, its state, and its line (a tap names it; its button's label). */
export interface StripCell { start: number; end: number; state: CellState; label: string }
/** A time under the strip, at its cell's index. */
export interface StripTick { i: number; label: string }

/** Tokyo is UTC+9, whole hours: its quarter hours and its 3-hour marks are UTC's. */
const TOKYO_MS = 9 * 3600_000;
/** 15:32, Tokyo. */
export const hhmm = (ms: number): string => new Date(ms + TOKYO_MS).toISOString().slice(11, 16);

/** `count` slots of `width` ms on the clock's grid, the last the one holding `now`: their starts, oldest first. */
export function gridStarts(now: number, width: number, count: number): number[] {
  const last = Math.floor(now / width) * width;
  return Array.from({ length: count }, (_, i) => last - (count - 1 - i) * width);
}

/** `items` into the grid's slots (each slot's, in their order); one outside it is left out. */
export function bucket<T>(items: readonly T[], at: (x: T) => number, first: number, width: number, count: number): T[][] {
  const out = Array.from({ length: count }, () => [] as T[]);
  for (const x of items) {
    const i = Math.floor((at(x) - first) / width);
    if (i >= 0 && i < count) out[i].push(x);
  }
  return out;
}

/**
 * Checks a fixed interval apart (each a little early or late: the gym bot's ±15 %) into `count` slots of `width` ms
 * ending at `now`, newest last: each check takes the slot after the one before it, and a gap of n intervals leaves
 * n − 1 slots empty (the bot stopped, backed off, or nothing was kept) — so a check's jitter never leaves a false gap
 * or a double, as a grid on the clock would. The newest is in the last slot until the next is half an interval late;
 * one within half an interval of the next (a 🔎 tap beside an alarm) shares its slot. `items` newest first (the
 * Worker's order); a slot's items oldest first. A slot's [start, end) is nominal: `now` less whole widths.
 */
export function chain<T>(items: readonly T[], at: (x: T) => number, now: number, width: number, count: number): { start: number; end: number; items: T[] }[] {
  const slots = Array.from({ length: count }, (_, i) => ({ start: now - (count - i) * width, end: now - (count - 1 - i) * width, items: [] as T[] }));
  let slot = count - 1;
  let prev: number | null = null;
  for (const x of items) {
    const t = at(x);
    if (t > now) continue;
    slot -= prev === null ? Math.max(0, Math.round((now - t) / width) - 1) : Math.round((prev - t) / width);
    if (slot < 0) break;
    slots[slot].items.unshift(x);
    prev = t;
  }
  return slots;
}

/** A tick at each cell holding a multiple of `every` ms on Tokyo's clock (quarter hours, 3-hour marks), its time. */
export const stripTicks = (cells: readonly StripCell[], every: number): StripTick[] =>
  cells.flatMap((c, i) => {
    const mark = Math.ceil((c.start + TOKYO_MS) / every) * every - TOKYO_MS;
    return mark < c.end ? [{ i, label: hhmm(mark) }] : [];
  });
