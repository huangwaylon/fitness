// 聞けたセリフ (docs/english.md "聞けたセリフ"): every line caught in 聞き取りチャレンジ (catch.ts), kept as it was caught
// (the line itself, so the shelf plays offline and never changes under a content edit) with how: the day, at 0.75× or
// not, tiles given. Each comes back STEPS days after it was last met (3, 7, then 21), at most PER_DAY a day, at full
// speed with no text. A return caught first try at full speed with no tile given is 聞けた: its step moves on (past the
// last: it stays on the shelf, never back) and the line joins the count, which only ever grows. Any other return: back
// in STEPS[0] days, nothing taken away, nothing said. Per player, on this phone (`island.english.caught`); pure but for
// the store.
import { DEVICE } from '#lib/sync/storage.ts';
import { perPlayer } from './per-player.ts';
import { clean, type How } from './catch.ts';
import { addDays, daysBetween } from '#lib/time/dates.ts';
import type { CatchLine } from './types.ts';
import type { LocalDate, Who } from '#lib/types.ts';

/** Days after a line was last met before it comes back, by its step; past the last: never again. */
export const STEPS = [3, 7, 21] as const;
/** Lines back a day, at most. */
export const PER_DAY = 3;

/** A clip's line: `clip/q`. */
export type Key = `${string}/${string}`;

/** A catch as kept: the day, 1 at SLOW, the tiles given. */
export interface Met {
  d: LocalDate;
  slow?: 1;
  h?: number;
}

export interface Shelved {
  video: string;
  title: string;
  line: CatchLine;
  /** The first catch (in a lesson). */
  first: Met;
  /** The latest (a return), when it's been back. */
  last?: Met;
  /** Its place in STEPS (STEPS.length: done). */
  step: number;
  /** The first return that was 聞けた (it's counted from then on). */
  heard?: LocalDate;
}

export interface Shelf {
  lines: Record<Key, Shelved>;
  /** Today's returns so far. */
  day?: [LocalDate, number];
}

export const EMPTY: Shelf = { lines: {} };

const metOf = (d: LocalDate, h: How): Met => ({ d, ...(h.slow && { slow: 1 as const }), ...(h.hints && { h: h.hints }) });

/** `shelf` with a line caught in a lesson (one already on it: as it was). */
export function shelved(shelf: Shelf, key: Key, e: Pick<Shelved, 'video' | 'title' | 'line'>, today: LocalDate, h: How): Shelf {
  if (shelf.lines[key]) return shelf;
  return { ...shelf, lines: { ...shelf.lines, [key]: { ...e, first: metOf(today, h), step: 0 } } };
}

/** The day a line was last met. */
const lastDay = (e: Shelved): LocalDate => e.last?.d ?? e.first.d;

/** Days from the last meeting till it comes back (null: done). */
const waitOf = (e: Shelved): number | null => (e.step >= STEPS.length ? null : STEPS[e.step]);

/** The day it's back next (null: done). */
export function backOn(e: Shelved): LocalDate | null {
  const wait = waitOf(e);
  return wait === null ? null : addDays(lastDay(e), wait);
}

/** The lines back today, the longest overdue first (the key breaks ties), PER_DAY less today's so far at most. */
export function dueOf(shelf: Shelf, today: LocalDate): Key[] {
  const left = PER_DAY - (shelf.day?.[0] === today ? shelf.day[1] : 0);
  if (left <= 0) return [];
  return (Object.entries(shelf.lines) as [Key, Shelved][])
    .flatMap(([k, e]) => {
      const wait = waitOf(e);
      const over = wait === null ? -1 : daysBetween(lastDay(e), today) - wait;
      return over >= 0 ? [{ k, over }] : [];
    })
    .sort((a, b) => b.over - a.over || (a.k < b.k ? -1 : 1))
    .slice(0, left)
    .map((x) => x.k);
}

/** `shelf` with a return of `key` today: 聞けた (clean) a step on and counted; else back to the first step. */
export function returned(shelf: Shelf, key: Key, today: LocalDate, h: How): Shelf {
  const e = shelf.lines[key];
  if (!e) return shelf;
  const ok = clean(h);
  const next: Shelved = { ...e, last: metOf(today, h), step: ok ? e.step + 1 : 0, ...(ok && !e.heard && { heard: today }) };
  const n = shelf.day?.[0] === today ? shelf.day[1] : 0;
  return { lines: { ...shelf.lines, [key]: next }, day: [today, n + 1] };
}

/** Lines heard: a return caught first try at full speed with no tile given, ever (only grows). */
export const heardCount = (shelf: Shelf): number => Object.values(shelf.lines).filter((e) => e.heard).length;

/** The shelf's cards: the latest met first. */
export const cardsOf = (shelf: Shelf): [Key, Shelved][] =>
  (Object.entries(shelf.lines) as [Key, Shelved][]).sort(([ka, a], [kb, b]) => (lastDay(b) > lastDay(a) ? 1 : lastDay(b) < lastDay(a) ? -1 : ka < kb ? -1 : 1));

const store = perPlayer<Shelf>(DEVICE.englishCaught);
export function shelfOf(who: Who): Shelf {
  const s = store.get(who);
  return s && s.lines && typeof s.lines === 'object' ? s : EMPTY;
}
export const saveShelf = (who: Who, s: Shelf): void => store.set(who, s);
