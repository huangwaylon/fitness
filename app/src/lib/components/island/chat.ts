// Villager chats (docs/design.md "Villager chats"): what my villager says when I tap them, after NH's personalities.
// Pure: a pick of an i18n key (and its params) from the pools in ja.json / en.json, `chat.<mood>.<n>`, now and then a
// line about the day (the hour and today's goals: never ベル), a sleepy one at night. Kid-friendly and short.
import type { Personality } from '#lib/villagers/species.ts';

/** A villager's NH personality, or a special character's own flavour. */
export type Mood = Personality | 'special';

/** Lines per personality (chat.<mood>.0 …). */
export const LINES: Record<Mood, number> = {
  lazy: 12, peppy: 12, smug: 12, cranky: 12, normal: 12, jock: 12, snooty: 12, sisterly: 12, special: 10
};

export interface ChatCtx {
  /** Tokyo hour. */
  hour: number;
  /** Today's goals met, 0–4. */
  met: number;
  /** The villager was asleep (a tap wakes them). */
  asleep: boolean;
}

export interface Line { key: string; params?: Record<string, string | number> }

/** Lines with a second page (`<key>.more`): NH villagers often go on a little. */
export const FOLLOW_UPS: ReadonlySet<string> = new Set([
  'chat.lazy.0', 'chat.lazy.5', 'chat.peppy.0', 'chat.peppy.4', 'chat.smug.3', 'chat.smug.6', 'chat.cranky.2', 'chat.cranky.5',
  'chat.normal.1', 'chat.normal.4', 'chat.jock.1', 'chat.jock.7', 'chat.snooty.1', 'chat.snooty.5', 'chat.sisterly.1',
  'chat.sisterly.3', 'chat.special.0', 'chat.day.any.0'
]);
/** The pages of a line: its own, then its follow-up if it has one (i18n keys). */
export const pagesOf = (l: Line): string[] => (FOLLOW_UPS.has(l.key) ? [l.key, `${l.key}.more`] : [l.key]);

/** How often a tap asks about the day instead of a personality line. */
const DAY_ODDS = 0.3;

/** The day's lines for this moment: the morning, the evening and night, the goals so far. */
function dayLines({ hour, met }: ChatCtx): Line[] {
  const out: Line[] = [{ key: 'chat.day.any.0' }, { key: 'chat.day.any.1' }];
  if (hour >= 5 && hour < 10) out.push(...[0, 1, 2].map((i) => ({ key: `chat.day.morning.${i}` })));
  if (hour >= 19 || hour < 5) out.push(...[0, 1, 2].map((i) => ({ key: `chat.day.night.${i}` })));
  if (met >= 4) out.push({ key: 'chat.day.allMet' }, { key: 'chat.day.allMet' });
  else if (met > 0) out.push({ key: 'chat.day.someMet', params: { n: met } });
  else if (hour >= 12) out.push({ key: 'chat.day.noneYet' });
  return out;
}

/** A line for `mood` at this moment: a sleepy one if just woken, else 3 in 10 about the day, else the personality's;
 *  never the same key twice in a row (`last`). `r` is a uniform [0, 1) source. */
export function chatLine(mood: Mood, ctx: ChatCtx, r: () => number, last?: string): Line {
  const pool: Line[] = ctx.asleep
    ? [0, 1, 2].map((i) => ({ key: `chat.asleep.${i}` }))
    : r() < DAY_ODDS ? dayLines(ctx) : Array.from({ length: LINES[mood] }, (_, i) => ({ key: `chat.${mood}.${i}` }));
  const fresh = pool.filter((l) => l.key !== last);
  const from = fresh.length ? fresh : pool;
  return from[Math.floor(r() * from.length)];
}

/** A roster entry's mood: its personality, or `special` for the special characters. */
export const moodOf = (e: { special: boolean; personality: Personality | null } | undefined): Mood =>
  !e || e.special || !e.personality ? (e?.special ? 'special' : 'normal') : e.personality;
