// The partner's plot waterings heard live (docs/farming.md "Playing"): a plot tap's `act` `water` over the room
// (SceneTaps), shown wet on this phone at once, before the synced field says so (its `water` ops are the record:
// island/farm.ts withLive merges these only into plants not watered yet). This phone's, in memory: never sent or kept.
import { FARM } from '#lib/contract/farm.ts';

/** Each plot heard watered and when (the relay's clock, ms). */
const heard = new Map<string, number>();
const live = $state({ rev: 0 });

/** Plots heard watered at `t`; ones past a growth's length dropped (no plant growing then is still growing now). */
export function heardWater(ps: readonly string[], t: number): void {
  for (const [p, at] of heard) if (at < t - FARM.growMs) heard.delete(p);
  for (const p of ps) heard.set(p, t);
  if (ps.length) live.rev++;
}

/** The plots heard watered (reactive). */
export const liveWater = (): ReadonlyMap<string, number> => (void live.rev, heard);
