// A partner on a newer app than mine (2026-11-22): their page's hello said its build, protocol revision and seat tables
// (live-protocol PageVer, the room's `ver`, sync/live.ts LiveStatus.peers). Mine reads what it can of a newer one's
// messages (intentOf `lax`), but a new place, act or seat still shows wrong here until I update; the island says so
// once a session (routes/+page.svelte), and a deploy is taken at the next hide (ui-state/update.ts).
// The seat tables (villager3d/seats3d.json, tent/seats-more.json: the hello's `sv`) are versioned, not a COMPAT bump:
// a seat a phone's tables lack shows its sitter standing at it (tent/seats.ts seatsOf gives none), this banner says
// why, and no page reloads under its player for it (they changed three times on 11-22 alone).
import type { PageVer, Who } from '#lib/contract/live-protocol.ts';

/** Whether `theirs` is a newer app than `mine`: a later protocol revision, or other seat tables on a later build (a
 *  seat my tables don't have shows its sitter standing). Builds compare as their dates (`2026-11-22.ab12cd3`). */
export function newer(mine: PageVer, theirs: PageVer | undefined): boolean {
  if (!theirs) return false;
  if ((theirs.pr ?? 0) > (mine.pr ?? 0)) return true;
  const later = !!theirs.b && !!mine.b && theirs.b.slice(0, 10) > mine.b.slice(0, 10);
  return later && !!theirs.sv && !!mine.sv && theirs.sv !== mine.sv;
}

/** The first of `peers` on a newer app than `mine` (the guest's phone: either member), or null. */
export function newerPeer(mine: PageVer, peers: Partial<Record<Who, PageVer>> | undefined): Who | null {
  for (const w of ['A', 'B', 'G'] as const) if (newer(mine, peers?.[w])) return w;
  return null;
}
