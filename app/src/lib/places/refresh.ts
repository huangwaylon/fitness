// 保存した場所's daily details run (.github/workflows/places-details.yml, scripts/places-details.ts daily): which
// places it looks up on Google, a bounded few a day, from the relay's queue (admin places_ids: each live place's last
// look-up, 0 never). First the never looked up (new saves, the newest first, then any older one), then the SLICE
// looked up longest ago, so every place comes round in ~N/SLICE days. A look-up that found nothing (a page gone
// stale) counts as one: it waits its turn, never re-asked daily. CAP bounds a run (Google meets a shared runner IP
// with /sorry).

/** A live place from the relay (admin places_ids): [id, lat, lng, added (s), last look-up (s, 0 never), 1 its details
 *  found no hours, its category, its photos (0 none), its card's openings]. */
export type LiveId = [string, number, number, number, number, (0 | 1)?, string?, number?, number?];

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

/** The categories whose hours matter most (eating and drinking: the no-hours one-off's first). */
const EAT = new Set(['和食・寿司', '麺', '肉', '世界の料理', 'カフェ', '甘いもの', '居酒屋・バー']);

/** The one-off's places (places-details.yml's missing_hours, `daily --missing-hours`): the looked-up whose details
 *  found no hours, the eating and drinking first, each the longest ago looked up first; cap in all. */
export function pickNoHours(live: readonly LiveId[], cap = CAP): LiveId[] {
  const eat = (p: LiveId) => (EAT.has(p[6] ?? '') ? 0 : 1);
  return live.filter((p) => p[4] > 0 && p[5] === 1).sort((a, b) => eat(a) - eat(b) || a[4] - b[4] || byId(a, b)).slice(0, cap);
}

/** The look-ups within this long count as today's (the daily run's guard: one a day, dispatched and backstopped). */
export const DAY_S = 20 * 3600;

/** The daily run's guard (places-details.yml, `due`): skip when the last DAY_S already holds a run's worth of
 *  look-ups — the refresh slice (SLICE, at most the cap and the looked-up), three quarters of it (a few pages fail and aren't stamped). Not "a look-up within 20 h": a night the relay or Google
 *  refused (none, or a few before /sorry), or a short manual run, leaves today's owed and the next trigger runs it;
 *  a full run, or a forced one as big, leaves nothing and the next trigger skips (Google asked once a day). */
export function dueToday(live: readonly LiveId[], nowS: number, o: { cap?: number } = {}): { skip: boolean; ageH: number; recent: number; quota: number } {
  let newest = 0, recent = 0, looked = 0;
  for (const p of live) {
    if (p[4] > 0) looked++;
    if (p[4] > newest) newest = p[4];
    if (p[4] > nowS - DAY_S) recent++;
  }
  const quota = Math.min(o.cap ?? CAP, SLICE, looked);
  return { skip: recent > 0 && recent >= Math.ceil(quota * 0.75), ageH: Math.floor((nowS - newest) / 3600), recent, quota };
}
