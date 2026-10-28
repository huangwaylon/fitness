import { STRENGTH } from '#lib/config/rules.ts';
import type { Visit } from '#lib/types.ts';
import { parseInstant, toLocalDate } from '#lib/scoring/dates.ts';

export interface PresenceRow { id: number; placeKey: string; event: 'arrive' | 'leave'; at: string }
export interface PlaceRow { key: string; autoStrength: boolean }

/**
 * Pair arrive→leave events into visits (dwell ≥ STRENGTH.minVisitMin). `confirmations` keyed by arrive id.
 * Per place, events are sorted by time; each leave closes the most recent open arrive. A second arrive before a
 * leave replaces the first (a stale arrive with a lost leave must not inflate dwell). Unmatched leaves are dropped.
 */
export function deriveVisits(
  events: PresenceRow[],
  places: PlaceRow[],
  confirmations: Map<number, boolean>
): (Visit & { arriveEventId: number })[] {
  const auto = new Map(places.map((p) => [p.key, p.autoStrength]));
  const byPlace = new Map<string, (PresenceRow & { ms: number })[]>();
  for (const e of events) {
    if (!byPlace.has(e.placeKey)) byPlace.set(e.placeKey, []);
    byPlace.get(e.placeKey)!.push({ ...e, ms: parseInstant(e.at) });
  }

  const out: (Visit & { arriveEventId: number; ms: number })[] = [];
  for (const [placeKey, list] of byPlace) {
    list.sort((x, y) => x.ms - y.ms || x.id - y.id);
    let open: (PresenceRow & { ms: number }) | null = null;
    for (const e of list) {
      if (e.event === 'arrive') {
        open = e;
        continue;
      }
      if (!open) continue;
      const dwellMin = Math.floor((e.ms - open.ms) / 60000);
      if (dwellMin >= STRENGTH.minVisitMin) {
        out.push({
          placeKey,
          date: toLocalDate(open.at),
          arriveAt: open.at,
          leaveAt: e.at,
          dwellMin,
          autoStrength: auto.get(placeKey) ?? false,
          confirmed: confirmations.get(open.id) ?? null,
          arriveEventId: open.id,
          ms: open.ms
        });
      }
      open = null;
    }
  }
  out.sort((x, y) => x.ms - y.ms || x.arriveEventId - y.arriveEventId);
  return out.map(({ ms: _ms, ...v }) => v);
}
