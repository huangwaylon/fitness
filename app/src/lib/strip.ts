// The bots' history strip (components/bots/ScanStrip.svelte: 保養所's 直近1時間, ジム's 24 checks, メニュー's 直近8週): a
// row of slots, oldest first, each ok (green), avail (green, full height: a room or a slot open), warn (yellow, capped:
// a part failed, 保留), fail (coral, hatched: all failed), idle (a low sunk bar: ran with nothing to check) or none (a
// low tick: nothing checked then), with its line for a tap and VoiceOver. Pure: the pages make the cells (its/view.ts,
// gym/status.ts), these place them. (The verdict's tone: lib/bots/types.ts BotTone.)
import { ZONE_OFFSET_MS, clockAt } from './contract/tokyo.ts';

export type CellState = 'ok' | 'avail' | 'warn' | 'fail' | 'idle' | 'none';
/** One slot: [start, end) in ms, its state, and its line (a tap names it; its button's label). */
export interface StripCell { start: number; end: number; state: CellState; label: string }
/** A time under the strip, at its cell's index. */
export interface StripTick { i: number; label: string }

/** A bot's strip (components/bots/ScanStrip.svelte): the cells and their ticks, `last` 前回 (the newest
 *  cell with something in it, its time), the states' words (the summary's swatches), its line for VoiceOver, the 成果
 *  term, `next` 次回's label (at the line's end; none while stopped or off), and `empty`, a line in its place when nothing
 *  was ever kept (sunk, or `plain`: a neutral 確認なし). */
export interface CardStrip {
  cells: readonly StripCell[];
  ticks: readonly StripTick[];
  last: StripTick | null;
  words: Partial<Record<CellState, string>>;
  summary: string;
  outcome?: string | null;
  next?: string | null;
  empty?: { text: string } | null;
}

/** A picked cell's index by its start (the card keeps a pick on its slot across reads), or null once it left. */
export const pickIndex = (cells: readonly StripCell[], start: number | null): number | null => {
  const i = start === null ? -1 : cells.findIndex((c) => c.start === start);
  return i < 0 ? null : i;
};

/** its/view.ts's name for contract/tokyo.ts clockAt (kept until that file's rewrite folds it). */
export const hhmm = clockAt;

/** `count` slots of `width` ms on the clock's grid, the last the one holding `now`: their starts, oldest first. */
export function gridStarts(now: number, width: number, count: number): number[] {
  const last = Math.floor(now / width) * width;
  return Array.from({ length: count }, (_, i) => last - (count - 1 - i) * width);
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
    const mark = Math.ceil((c.start + ZONE_OFFSET_MS) / every) * every - ZONE_OFFSET_MS;
    return mark < c.end ? [{ i, label: clockAt(mark) }] : [];
  });
