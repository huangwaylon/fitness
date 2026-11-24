// 保存した場所's daily details run (.github/workflows/places-details.yml, scripts/places-details.ts daily): which
// places it looks up on Google, a bounded few a day, from the relay's queue (admin places_ids: each live place's last
// look-up, 0 never). First the never looked up (new saves, the newest first, then any older one), then the SLICE
// looked up longest ago, so every place comes round in ~N/SLICE days. A look-up that found nothing (a page gone
// stale) counts as one: it waits its turn, never re-asked daily. CAP bounds a run (Google meets a shared runner IP
// with /sorry).

/** A live place from the relay (admin places_ids): [id, lat, lng, added (s), last look-up (s, 0 never)]. */
export type LiveId = [string, number, number, number, number];

export const SLICE = 48;
export const CAP = 80;

export interface Pick {
  /** never looked up: the newest saves first */
  missing: LiveId[];
  /** the longest ago looked up */
  refresh: LiveId[];
  /** never looked up, over the cap (the next run's) */
  waiting: number;
}

const byId = (a: LiveId, b: LiveId) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);

/** Today's places to look up: missing first, then the refresh slice, CAP in all. */
export function pickDetails(live: readonly LiveId[], o: { cap?: number; slice?: number } = {}): Pick {
  const cap = o.cap ?? CAP, slice = o.slice ?? SLICE;
  const missing = live.filter((p) => !p[4]).sort((a, b) => b[3] - a[3] || byId(a, b));
  const m = missing.slice(0, cap);
  const refresh = live.filter((p) => p[4] > 0).sort((a, b) => a[4] - b[4] || byId(a, b)).slice(0, Math.max(0, Math.min(slice, cap - m.length)));
  return { missing: m, refresh, waiting: missing.length - m.length };
}
