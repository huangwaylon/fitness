// トレイル's registered hikes on this phone (docs/hiking.md "Data" › Registered hikes): the record's `hike` rows folded
// by its rules (contract/hike.ts hikeBookOf, hikesOf) as the guide's trails (lib/hiking/user.ts hikeTrail), their tracks
// read off the raw `hike_trk` rows when first asked (hikeTrackOf), and my changes, each a `hike` event sent at once
// (queued offline), then its track's `hike_trk` once. Anyone changes any (the guest too). A removal is held for its
// 取り消す (a removal is final on the record). The YAMAP link's import is the relay's `POST /hiking` (YAMAP sends no
// CORS for our origin): the hike's fields and its track to preview, nothing written.
//   hikes.trails / trail(slug) / view(id) / byRef(ref)    the hikes as trails, one, its record, a YAMAP one by its ref
//   hikes.save(fields, track, id?) / removeHeld(id, ms)    a hike saved (new or edited), one removed
//   hikes.start(slug) / setStart(slug, hm | null)         a trail's start time moved (anyone's: `hike_start`), or back
//   importYamap(text, signal)                             a pasted link read on the relay
import { hikeBookOf, hikeClean, hikeOpOf, hikeTrackOf, hikeTrkOf, hikesOf, newHikeId, type HikeEntry, type HikeView } from '#lib/contract/hike.ts';
import type { TrackFile } from '#lib/contract/hikeTrack.ts';
import { yamapCanon, yamapLink, type HikeImportError, type YamapMeta } from '#lib/contract/yamap.ts';
import type { EventRow } from '#lib/contract/api.ts';
import { hikeStartOf, hikeStartsOf, type HikeStartOp } from '#lib/contract/hikeStart.ts';
import { foldOnce } from '#lib/contract/book.ts';
import { hikeTrail, userIdOf } from '#lib/hiking/user.ts';
import type { Trail } from '#lib/hiking/types.ts';
import { keyed } from '#lib/keyed.ts';
import type { SendResult } from '#lib/store/backend.ts';
import { week } from '#lib/store/week.svelte.ts';
import { opClock } from '#lib/store/world.svelte.ts';
import { relayUrl } from '#lib/sync/transport.ts';
import { getKey } from '#lib/sync/storage.ts';

const EMPTY: readonly HikeEntry[] = [];
const NO_TRK: readonly EventRow[] = [];
const NO_STARTS: readonly HikeStartOp[] = [];
const startsOf = foldOnce(hikeStartsOf);

/** A hike's fields as the form edits them (contract/hike.ts's `hike` less its id and time). */
export type HikeFields = Omit<HikeView, 'id' | 'at' | 'who'>;
/** Why a save didn't happen: the phone not paired yet, a hike the record won't take, a track it won't take (sent, the
 *  record would drop it: the hike saved without it), or the send refused. */
export type SaveWhy = 'ready' | 'hike' | 'track' | 'send';

class Hikes {
  #last = 0;
  /** Each hike's track once read (a track is sent once and never replaced: one found stays). */
  #tracks = new Map<string, TrackFile>();
  /** Each hike's trail, by its op's time and whether its track was in. */
  #trails = new Map<string, { key: string; trail: Trail }>();

  get #book() {
    return hikeBookOf(week.model?.state.hike ?? EMPTY);
  }
  get views(): HikeView[] {
    return hikesOf(this.#book);
  }
  /** Whether this phone can write yet (the week's view says who I am). */
  get ready(): boolean {
    return !!week.view?.viewer;
  }

  /** A hike's track, or null (none, or not in yet). */
  track(id: string): TrackFile | null {
    let t = this.#tracks.get(id) ?? null;
    if (!t && (t = hikeTrackOf(week.model?.state.hikeTrk ?? NO_TRK, id))) this.#tracks.set(id, t);
    return t;
  }
  /** The hikes as trails, by date (the latest first). */
  get trails(): Trail[] {
    return this.views.map((v) => {
      const track = this.track(v.id), key = `${v.at}|${v.who}|${!!track}`;
      const held = this.#trails.get(v.id);
      if (held?.key === key) return held.trail;
      const trail = hikeTrail(v, track);
      this.#trails.set(v.id, { key, trail });
      return trail;
    });
  }
  trail(slug: string | null | undefined): Trail | null {
    const id = userIdOf(slug);
    return id ? (this.trails.find((t) => t.user!.id === id) ?? null) : null;
  }
  view(id: string): HikeView | null {
    return this.views.find((v) => v.id === id) ?? null;
  }
  /** The standing hike imported from this YAMAP activity or model course (its `ref`), if any: no second one. */
  byRef(ref: string): HikeView | null {
    return this.views.find((v) => v.ref === ref) ?? null;
  }

  /** A change's time: the relay's clock, never twice the same, after the op it replaces. */
  #now(id?: string): number {
    this.#last = opClock(this.#last, id ? (this.#book.rows.get(`hike|${id}`)?.op.at ?? 0) : 0);
    return this.#last;
  }

  /** A hike saved: a new one (and its track, sent once after it, checked first as the record checks it), or `id`'s
   *  fields replaced. Its id, or why not (nothing sent). */
  save(f: HikeFields, track: TrackFile | null, id?: string): { id: string } | { why: SaveWhy } {
    if (!this.ready) return { why: 'ready' };
    if (id && !this.view(id)) return { why: 'hike' };
    const at = this.#now(id), hid = id ?? newHikeId(at);
    const data = hikeClean({ ...f, id: hid, at });
    if (!hikeOpOf(data)) return { why: 'hike' };
    const trk = track && !id ? { id: hid, ...track } : null;
    if (trk && !hikeTrkOf(trk)) return { why: 'track' };
    if (!week.send('hike', data).ok) return { why: 'send' };
    if (trk) week.send('hike_trk', trk);
    return { id: hid };
  }
  /** A trail's start time in force ('H:MM'), or null: its plan's own (or none). */
  start(slug: string): string | null {
    return startsOf(week.model?.state.hikeStarts ?? NO_STARTS).get(slug) ?? null;
  }
  /** A trail's start moved to `hm` ('H:MM'), or null back to its plan's: false when not sent. */
  setStart(slug: string, hm: string | null): boolean {
    const d = { slug, hm };
    return this.ready && !!hikeStartOf(d) && week.send('hike_start', d).ok;
  }
  /** A hike gone, sent after `holdMs` (the banner's 取り消す takes it back meanwhile). */
  removeHeld(id: string, holdMs: number): SendResult {
    if (!this.view(id) || !this.ready) return { ok: false };
    return week.send('hike', { id, at: this.#now(id), rm: true }, holdMs > 0 ? { holdMs } : {});
  }
}

/** トレイル's registered hikes: one per phone. */
export const hikes = new Hikes();

/** A YAMAP import's outcome: the relay's error, or `offline` (no answer from the relay at all). */
export type ImportError = HikeImportError | 'offline';
export type Imported = { ok: true; meta: YamapMeta; track: TrackFile | null } | { ok: false; error: ImportError };

const ERRORS: readonly HikeImportError[] = ['unauthorized', 'bad_request', 'bad_link', 'not_found', 'too_large', 'capped', 'timeout', 'upstream'];

/** What the relay is sent for a pasted text: its YAMAP link as the canonical URL, else the text (the relay says why). */
const canonOf = (text: string): string => {
  const l = yamapLink(text);
  return l ? yamapCanon(l) : text.trim().slice(0, 600);
};

/** The relay's read of a pasted YAMAP link (share text and all: the relay finds the link); never throws. */
export async function importYamap(text: string, signal?: AbortSignal): Promise<Imported> {
  const r = await keyed(relayUrl('/hiking'), getKey(), {
    // (the link alone when found: a share sheet's text can run past the relay's 2 KB body)
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: canonOf(text) }),
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15_000)]) : AbortSignal.timeout(15_000)
  });
  if (!r.ok && !r.res) return { ok: false, error: r.why === 'timeout' ? 'timeout' : r.why === 'unpaired' ? 'unauthorized' : 'offline' };
  const j = (await r.res!.json().catch(() => null)) as { ok?: unknown; meta?: YamapMeta; track?: TrackFile | null; error?: unknown } | null;
  if (r.ok && j?.ok === true && j.meta && typeof j.meta.name === 'string') return { ok: true, meta: j.meta, track: j.track ?? null };
  return { ok: false, error: ERRORS.includes(j?.error as HikeImportError) ? (j!.error as HikeImportError) : 'upstream' };
}
