// Ambient life's clock (docs/backend.md#ambient-life): the relay's time, from the phone's one relay socket (sync/live.ts
// liveRelay: pings estimate the offset), so both phones cut the day into the same slots. Without a relay connection
// the offset is 0 (alone, nobody has to agree).
import { liveRelay } from '#lib/sync/live.ts';

/** The relay's clock minus this device's (ms). */
export const relayOffset = (): number => liveRelay().serverNow() - Date.now();

/** `who` has the island open (the relay's presence: on the guest's phone, each member). */
export function personHere(who: 'A' | 'B' | 'G'): boolean {
  const s = liveRelay().status();
  return s.connected && s.here.includes(who);
}
