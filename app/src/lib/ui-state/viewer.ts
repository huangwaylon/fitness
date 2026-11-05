// Who holds this phone (docs/design.md "The guest"): a member, or the guest. The guest's phone shows the members'
// island, activity and ベル, but its own villager and name, and none of what only a member does (buying, voiding,
// the harvest, a goal, the island's もようがえ, the sync) nor any からだ figure.
import type { WeekView, Who } from '#lib/types.ts';

/** The guest's phone. */
export const isGuest = (v: Pick<WeekView, 'viewer'> | null | undefined): boolean => v?.viewer === 'G';

/** This phone's own villager: whose it is, its name and its look (the guest's from `guest`). */
export function mine(v: WeekView): { who: Who; villagerName: string; villager: string | null } {
  if (v.viewer === 'G') return { who: 'G', villagerName: v.guest.villagerName, villager: v.guest.villager };
  const p = v.people[v.me];
  return { who: v.me, villagerName: p.villagerName, villager: p.villager };
}

/** A person's villager's name (a member's, or the guest's). */
export const villagerNameOf = (v: Pick<WeekView, 'people' | 'guest'>, w: Who): string => (w === 'G' ? v.guest.villagerName : v.people[w].villagerName);

/** A person's chip colour (yuzu A, mint B, lilac the guest). */
export const tagOf = (w: Who): string => (w === 'A' ? 'var(--c-yuzu)' : w === 'B' ? 'var(--c-mint)' : 'var(--c-lilac)');
