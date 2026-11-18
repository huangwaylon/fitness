// フレーズの復習 (docs/english.md "Phrase review"): home's short look back at 使えるフレーズ met before, never scored.
// The phrases are the `use` of the questions in my finished plays (the `listen` rows with `f`, mine whole) and the ones
// フレーズ's ☆ saved; each comes back 1, 3, 7, 14, then every 30 days after it was last met, saved or shown. 覚えた moves it a step on, もう一回 back to the
// first (tomorrow); at most PER_DAY a day, 今日はスキップ ends today's. Per player, on this phone; pure but for the store.
import type { EventRow } from '#lib/contract/api.ts';
import { listenOf } from '#lib/contract/listen.ts';
import { listensOf } from './listens.ts';
import { DEVICE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
import { daysBetween } from '#lib/time/dates.ts';
import type { LocalDate, Who } from '#lib/types.ts';

/** Days from the last meeting before a phrase is due, by its step (the last repeats). */
export const STEPS = [1, 3, 7, 14, 30] as const;
/** Phrases a day, at most. */
export const PER_DAY = 3;
/** Phrases' schedules kept a player (the longest unseen go). */
const KEEP = 3000;

/** A question of a clip: `clip/id`. */
export type Key = `${string}/${string}`;
export interface Mine {
  /** Each phrase shown: the day, its step. */
  s: Record<Key, [LocalDate, number]>;
  /** Each phrase フレーズ's ☆ saved: the day (never pruned, but its question or clip retired: PhraseReview; un-☆ takes it out, its `s` as it was). */
  k?: Record<Key, LocalDate>;
  /** Today's count shown (PER_DAY: skipped). */
  day?: [LocalDate, number];
}

/** The day each question was last met in a finished play of mine. */
export function metOf(rows: readonly EventRow[], me: Who): Map<Key, LocalDate> {
  const out = new Map<Key, LocalDate>();
  for (const row of listensOf(rows, me, listenOf)) {
    if (row.f !== 1) continue;
    for (const [id] of row.r) {
      const k: Key = `${row.u}/${id}`;
      if ((out.get(k) ?? '') < row.d) out.set(k, row.d);
    }
  }
  return out;
}

/** The phrases due today (met or saved; counted from the latest of the day met, saved or shown), in the order shown:
 *  those shown before (the longest overdue first), then the never shown (the latest met or saved first: yesterday's
 *  clip before an old backlog); the key breaks ties. */
export function dueOf(met: ReadonlyMap<Key, LocalDate>, mine: Mine, today: LocalDate): Key[] {
  const due: { k: Key; over: number; shown: boolean; base: LocalDate }[] = [];
  for (const k of new Set([...met.keys(), ...(Object.keys(mine.k ?? {}) as Key[])])) {
    const s = mine.s[k];
    const base = [met.get(k), mine.k?.[k], s?.[0]].reduce<LocalDate>((a, b) => (b && b > a ? b : a), '' as LocalDate);
    const over = daysBetween(base, today) - STEPS[Math.min(s?.[1] ?? 0, STEPS.length - 1)];
    if (over >= 0 && base <= today) due.push({ k, over, shown: !!s, base });
  }
  return due
    .sort((a, b) => +b.shown - +a.shown || (a.shown ? b.over - a.over : a.base < b.base ? 1 : a.base > b.base ? -1 : 0) || (a.k < b.k ? -1 : 1))
    .map((x) => x.k);
}

/** How many more phrases today. */
export const leftToday = (mine: Mine, today: LocalDate): number => PER_DAY - (mine.day?.[0] === today ? mine.day[1] : 0);

/** `mine` with `k` shown today: 覚えた a step on (`kept`), もう一回 back to the first. */
export function rated(mine: Mine, k: Key, today: LocalDate, kept: boolean): Mine {
  const step = kept ? Math.min((mine.s[k]?.[1] ?? 0) + 1, STEPS.length - 1) : 0;
  const s: Mine['s'] = { ...mine.s, [k]: [today, step] };
  const keys = Object.keys(s) as Key[];
  if (keys.length > KEEP) for (const x of keys.sort((a, b) => (s[a][0] < s[b][0] ? -1 : 1)).slice(0, keys.length - KEEP)) delete s[x];
  return { ...mine, s, day: [today, PER_DAY - leftToday(mine, today) + 1] };
}

/** `mine` with `k` saved today (フレーズ's ☆): its days counted from today (a phrase never met nor shown: tomorrow). */
export const saved = (mine: Mine, k: Key, today: LocalDate): Mine => ({ ...mine, k: { ...mine.k, [k]: today } });

/** `mine` with `k` no longer saved (its schedule from plays and showings as it was). */
export function unsaved(mine: Mine, k: Key): Mine {
  const rest = { ...mine.k };
  delete rest[k];
  return { ...mine, k: rest };
}

/** `mine` with today's phrases skipped (they wait for tomorrow, their steps as they were). */
export const skipped = (mine: Mine, today: LocalDate): Mine => ({ ...mine, day: [today, PER_DAY] });

const read = (): Record<string, Mine> => readJson<Record<string, Mine>>(localKV(), DEVICE.englishPhrases) ?? {};
export function mineOf(who: Who): Mine {
  const m = read()[who];
  return m && m.s && typeof m.s === 'object' ? m : { s: {} };
}
export const saveMine = (who: Who, mine: Mine): void => void writeJson(localKV(), DEVICE.englishPhrases, { ...read(), [who]: mine });
