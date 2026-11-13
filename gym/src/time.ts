// Tokyo time, as the bot reads and saves it. A day is 'YYYY-MM-DD' and a clock time 'HH:MM': both compare as text.
// An instant is ms since the epoch, saved as ISO with +09:00 ('2026-11-12T11:30:00+09:00'). The shared ones are the
// app's contract's (app/src/lib/gym/contract.ts), so both sides count days alike.
import { JST_MS } from '../../app/src/lib/gym/contract.ts';

export { addDays, at, clockFrom, clockOf, dayOf, minutesOf, weekday, type Clock, type Day } from '../../app/src/lib/gym/contract.ts';

/** An instant as ISO in Tokyo time, to the second. */
export const isoJst = (ms: number): string => `${new Date(ms + JST_MS).toISOString().slice(0, 19)}+09:00`;
