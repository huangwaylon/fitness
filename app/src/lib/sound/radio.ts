// The radio jingle that opens しずえ's island broadcast (docs/design.md#cues): the day's first open plays it in place of
// the PA chime. NH's announcement jingle changes with the time of day (morning 05–11, noon 11–17, evening 17–05), one of
// six each, and a holiday has its own all its Tokyo date. Pure: the variant is the day's seed, so both phones agree.
import { dayKey, jst } from '#lib/time/clock.ts';
import { holidayOn, type Holiday } from '#lib/time/holidays.ts';
import { seeded } from '#lib/random.ts';
import { RADIO_VARIANTS, type RadioHoliday, type RadioJingle, type RadioSlot } from './ids.ts';

/** The holidays' own jingles (Festivale's is NH's carnival one). */
const HOLIDAY_JINGLE: Record<Holiday, RadioHoliday> = {
  'bunny-day': 'bunny-day', halloween: 'halloween', 'turkey-day': 'turkey-day', 'toy-day': 'toy-day', countdown: 'countdown', festivale: 'carnival'
};

/** The time of day at a Tokyo hour. */
export const radioSlot = (hour: number): RadioSlot => (hour >= 5 && hour < 11 ? 'morning' : hour >= 11 && hour < 17 ? 'noon' : 'evening');

/** The jingle at a moment: the holiday's on its date, else the slot's, its variant by the date. */
export function radioJingleAt(d: Date): RadioJingle {
  const date = dayKey(d);
  const h = holidayOn(date);
  if (h) return `radio-${HOLIDAY_JINGLE[h]}`;
  const n = RADIO_VARIANTS[Math.floor(seeded(`radio:${date}`)() * RADIO_VARIANTS.length)];
  return `radio-${radioSlot(jst(d).hour)}-${n}`;
}
