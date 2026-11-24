// 保存した場所's daily details run (.github/workflows/places-details.yml, scripts/places-details.ts daily): which
// places it looks up on Google, a bounded few a day, from the relay's queue (admin places_ids: each live place's last
// look-up, 0 never). First the never looked up (new saves, the newest first, then any older one), then the SLICE
// looked up longest ago, so every place comes round in ~N/SLICE days. A look-up that found nothing (a page gone
// stale) counts as one: it waits its turn, never re-asked daily. CAP bounds a run (Google meets a shared runner IP
// with /sorry).

/** A live place from the relay (admin places_ids): [id, lat, lng, added (s), last look-up (s, 0 never), 1 its details
 *  found no hours, its category]. */
export type LiveId = [string, number, number, number, number, (0 | 1)?, string?];

export const SLICE = 48;
export const CAP = 80;
/** A redo (review 11-24 T8, temporary: delete once no place is looked up before it): every place looked up before
 *  REDO_BEFORE (epoch s; the 11-23 seed ran on 勤労感謝の日 and before the parser read each day's weekday and
 *  special days) is refreshed REDO_CAP a run, oldest first, instead of the SLICE; then the queue as before. */
export const REDO_BEFORE = 1_795_510_320, REDO_CAP = 280;

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
export function pickDetails(live: readonly LiveId[], o: { cap?: number; slice?: number; redoBefore?: number } = {}): Pick {
  // (the redo: the daily run's, o.redoBefore = REDO_BEFORE; a cap under REDO_CAP raised to it)
  const redo = !!o.redoBefore && live.some((p) => p[4] > 0 && p[4] < o.redoBefore!);
  const cap = redo ? Math.max(o.cap ?? 0, REDO_CAP) : o.cap ?? CAP, slice = redo ? cap : o.slice ?? SLICE;
  const missing = live.filter((p) => !p[4]).sort((a, b) => b[3] - a[3] || byId(a, b));
  const m = missing.slice(0, cap);
  const refresh = live.filter((p) => p[4] > 0).sort((a, b) => a[4] - b[4] || byId(a, b)).slice(0, Math.max(0, Math.min(slice, cap - m.length)));
  return { missing: m, refresh, waiting: missing.length - m.length };
}

/** The categories whose hours matter most (eating and drinking: the no-hours one-off's first). */
const EAT = new Set(['和食・寿司', '麺', '肉', '世界の料理', 'カフェ', '甘いもの', '居酒屋・バー']);

/** The one-off's places (places-details.yml's missing_hours, `daily --missing-hours`): the looked-up whose details
 *  found no hours, the eating and drinking first, each the longest ago looked up first; cap in all. */
export function pickNoHours(live: readonly LiveId[], cap = CAP): LiveId[] {
  const eat = (p: LiveId) => (EAT.has(p[6] ?? '') ? 0 : 1);
  return live.filter((p) => p[4] > 0 && p[5] === 1).sort((a, b) => eat(a) - eat(b) || a[4] - b[4] || byId(a, b)).slice(0, cap);
}
