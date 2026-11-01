// Ambient life's clock (docs/backend.md#ambient-life): the relay's time, from the phone's one relay socket (sync/live.ts
// liveRelay: pings estimate the offset), so both phones cut the day into the same slots. Without a relay connection
// the offset is 0 (alone, nobody has to agree).
import { liveRelay } from '#lib/sync/live.ts';

/** The relay's clock minus this device's (ms). */
export const relayOffset = (): number => liveRelay().serverNow() - Date.now();

/** The partner has the island open too (the relay's presence). */
export function partnerHere(): boolean {
  const s = liveRelay().status();
  return s.connected && s.peer;
}
