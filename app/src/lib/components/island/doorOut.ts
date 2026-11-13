// Out of a building's door (docs/design.md "Buildings"): the room's ‹ しまへ (the tent, a home, the museum, the shop).
// My villager stands just out of its door, facing out (buildings.ts outOf), on this phone (the island puts it there as
// it opens: ui.outAt) and on every other at once: the put is my villager's newest walk in the shared day, sent now
// (the island's own link tells nothing until its socket's welcome, and keeps it as where my villager is).
import { site } from './site.svelte.ts';
import { outOf } from '../../world/buildings.ts';
import { walkOf } from './villagerSync.ts';
import type { BuildingId } from '../../world/world.ts';
import { ui } from '#lib/ui-state/ui.svelte.ts';
import { world as shared } from '#lib/store/world.svelte.ts';
import type { Who } from '#lib/types.ts';

export function leaveBy(id: BuildingId, who: Who): void {
  site.sync();
  const out = outOf(id, who);
  ui.outAt = out;
  ui.islandZ ??= out.at[1] - 120;
  shared.share(walkOf({ id: 'mine', from: out.at, pts: [], ms: 0, face: out.face }, shared.serverNow()));
}
