// トレイル's start times (docs/hiking.md "Start time", docs/backend.md#events `hike_start`): a hike's start moved off
// its plan's, the plan's stops shifted with it, seen by all three (the guest too: contract/guest.ts). `{slug, hm}`:
// a trail's slug (the guide's, or a registered hike's `u-<id>`) and its start 'H:MM' (0:00–23:59), or null back to
// the plan's. One slot a slug (`hike_start|<slug>`): the latest to arrive wins, as a room's saved slot
// (contract/roomSave.ts); the model the last row of a slug in server order. Pure and dependency-free.
import { only } from './ops.ts';

type Rec = Record<string, unknown>;

const SLUG = /^[a-z0-9][a-z0-9-]{0,47}$/;
const HM = /^(?:[01]?\d|2[0-3]):[0-5]\d$/;

/** A start 'H:MM' (or 'HH:MM'), 0:00–23:59. */
const isHm = (v: unknown): v is string => typeof v === 'string' && HM.test(v);

export interface HikeStartOp { slug: string; hm: string | null }

/** A `hike_start`'s data, its two keys only, each well-formed, or null. */
export function hikeStartOf(d: Rec): HikeStartOp | null {
  if (!only(d, ['slug', 'hm']) || typeof d.slug !== 'string' || !SLUG.test(d.slug)) return null;
  return d.hm === null || isHm(d.hm) ? { slug: d.slug, hm: d.hm } : null;
}

/** Its record slot (contract/record.ts eventSlot): its slug's. */
export const hikeStartSlot = (d: Rec): string | null => (typeof d.slug === 'string' && SLUG.test(d.slug) ? `hike_start|${d.slug}` : null);

/** Each slug's start from the model's rows in server order (the last of a slug wins; a null one, none). */
export function hikeStartsOf(rows: readonly HikeStartOp[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const r of rows) {
    if (r.hm === null) m.delete(r.slug);
    else m.set(r.slug, r.hm);
  }
  return m;
}
