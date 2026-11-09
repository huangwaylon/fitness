// Ambient life's clock (docs/backend.md#ambient-life): the relay's time, from the phone's one relay socket (sync/live.ts
// liveRelay: pings estimate the offset), so both phones cut the day into the same slots. Without a relay connection
// the offset is 0 (alone, nobody has to agree).
import { liveRelay } from '#lib/sync/live.ts';
import { world } from '#lib/store/world.svelte.ts';
import { dayKey, minuteNow } from '#lib/time/clock.ts';

/** The relay's clock minus this device's (ms). */
export const relayOffset = (): number => liveRelay().serverNow() - Date.now();

/** The island's Tokyo day (YYYY-MM-DD) on its one clock, the relay's (world.now(): a `?date=` preview moved, the pings'
 *  offset added), as the shared day is: the day-seeded finds, gifts, fruit and flowers never on a skewed device's day.
 *  Reactive at each minute (minuteNow). */
export function islandDay(): string {
  minuteNow();
  return dayKey(new Date(world.now()));
}
