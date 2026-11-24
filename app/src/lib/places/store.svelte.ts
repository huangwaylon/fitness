// 保存した場所's list on this phone (docs/places.md "Data"): the copy (cache.ts) read first, then `GET /places` with the
// phone's key (`?since=` the copy's version: a delta merged by the contract's applyPlaces), the result kept again.
// Read by the map page and by the trail map's layer (each loads on view; refreshed at most once a minute, and on
// coming back online once a view has loaded it). No timer: nothing runs while neither is open. A delta that changes
// nothing keeps the rows (and so the index) as they were. Another person paired on this phone: their copy, read
// afresh. The outcome of the last fetch: ok, offline (unreached), refused
// (no key, not this key's) or failed; never a place's name or position in a log (keyed.ts logs the endpoint and the
// kind only). The search's facets (facets.ts) fetched with the map page's opening (not the trail's layer), the descriptions when asked (wantDescs: the
// sheet's first free-text word); the index rebuilt as each lands.
import { applyPlaces, placesPayloadOf, type Place } from '../contract/places.ts';
import { keyed } from '../keyed.ts';
import { getKey, getStoredMe } from '../sync/storage.ts';
import { relayUrl } from '../sync/transport.ts';
import { readCache, writeCache } from './cache.ts';
import { loadDescs, loadFacets, loadLexicon, type DescTable, type FacetTable } from './facets.ts';
import { buildIndex, withDescs, type Index } from './search.ts';

type Net = 'ok' | 'offline' | 'refused' | 'failed';
const AGAIN_MS = 60_000;
/** The whole fetch's deadline, its body included (keyed's 15 s is the headers'): the payload ~500 KB, ~10 s at
 *  400 kbit/s. */
const BODY_MS = 45_000;
/** The relay's own fetch of the list older than this: the phone asks it to fetch again (POST /places/sync: Google
 *  often refuses the relay's cron, a phone-triggered one runs near the phone), once per opening, quietly. */
const STALE_MS = 2 * 3_600_000;

class Places {
  /** The places, newest first (null: nothing read yet). */
  rows = $state.raw<Place[] | null>(null);
  /** The relay's last good fetch of the list (epoch ms). */
  syncedAt = $state<number | null>(null);
  /** The last fetch's outcome (null: none yet). */
  net = $state<Net | null>(null);
  busy = $state(false);
  /** The adders' names. */
  people = $state.raw<string[]>([]);
  /** The search's facets and descriptions (null: not in, or none). */
  facets = $state.raw<FacetTable | null>(null);
  descs = $state.raw<DescTable | null>(null);
  /** Bumped when the kinds' table and the gazetteer are in (kinds.ts, romaji.ts: the index reads them). */
  lexicon = $state(0);
  private ver = 0;
  /** Whose rows these are (getStoredMe at the read; '' unpaired). */
  private who: string | null = null;
  private read: Promise<void> | null = null;
  private last = 0;
  private ix: { rows: Place[]; f: FacetTable | null; people: string[]; lex: number; dv: number; ix: Index } | null = null;
  /** Bumped when the descriptions land or their fetch fails (the index patched, not rebuilt). */
  private descsVer = $state(0);
  private descsOut = false;
  private descsAt = 0;
  private listening = false;

  /** The search index, built once per list, facets + lexicon (they land together) and people; the descriptions put in
   *  without a rebuild (withDescs: mid-typing, the vocabulary and the areas stay). */
  get index(): Index | null {
    const r = this.rows, f = this.facets, people = this.people, lex = this.lexicon, dv = this.descsVer;
    if (!r) return null;
    const x = this.ix;
    if (x?.rows !== r || x.f !== f || x.people !== people || x.lex !== lex) {
      const ix = buildIndex(r, f, this.descs, people);
      this.ix = { rows: r, f, people, lex, dv, ix: this.descsOut ? withDescs(ix, null) : ix };
    } else if (x.dv !== dv) this.ix = { ...x, dv, ix: withDescs(x.ix, this.descs) };
    return this.ix!.ix;
  }

  /** The descriptions, fetched once (the sheet's first free-text word of 2 characters or more); a failure lets the
   *  search go on without them (its unmatched words let go, as when they're in), tried again after a minute. */
  wantDescs(): void {
    if (this.descs || Date.now() - this.descsAt < AGAIN_MS) return;
    this.descsAt = Date.now();
    void loadDescs().then((d) => {
      if (d) ((this.descs = d), (this.descsOut = false));
      else if (this.descsOut) return;
      else this.descsOut = true;
      this.descsVer++;
    });
  }

  /** The copy on this phone read into the store, no fetch (L2's idle prefetch: the list in before the first open). */
  prime(): Promise<void> {
    this.samePerson();
    return (this.read ??= this.readCopy());
  }

  /** Read the copy (once a person), then fetch unless one did within the minute (`force`: もう一度). `sync` (the map
   *  page's opening): the relay's list over 2 h old asks it to fetch again (POST /places/sync), then the delta. */
  async load(force = false, sync = false): Promise<void> {
    if (!this.listening && typeof window !== 'undefined') {
      this.listening = true;
      addEventListener('online', () => void this.load(true));
    }
    this.samePerson();
    // (the facets and the kinds' table and gazetteer together: one rebuild, not two)
    if (sync && !this.facets && !this.lexicon) void Promise.all([loadFacets(), loadLexicon()]).then(([f, ok]) => {
      if (f) this.facets = f;
      if (ok) this.lexicon++;
    });
    await (this.read ??= this.readCopy());
    if (force || Date.now() - this.last > AGAIN_MS) await this.fetch();
    if (sync && this.net === 'ok' && (this.syncedAt === null || Date.now() - this.syncedAt > STALE_MS)) {
      const r = await keyed(relayUrl('/places/sync'), getKey(), { method: 'POST', cache: 'no-store' }, 60_000);
      if (r.ok) await this.fetch();
    }
  }

  /** Re-paired as someone else since the read: forget the rows (a fetch in flight for the other one is dropped). */
  private samePerson(): void {
    const me = getStoredMe() ?? '';
    if (this.who === null || me === this.who) return;
    ((this.rows = null), (this.syncedAt = null), (this.net = null), (this.ver = 0), (this.last = 0), (this.people = []));
    ((this.read = null), (this.ix = null), (this.busy = false));
  }

  private async readCopy(): Promise<void> {
    const who = (this.who = getStoredMe() ?? '');
    const c = await readCache(who);
    if (c && !this.rows && this.who === who) ((this.rows = c.rows), (this.ver = c.ver), (this.syncedAt = c.syncedAt), (this.people = c.people ?? []));
  }

  private async fetch(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.last = Date.now();
    const who = this.who ?? '';
    const mine = () => this.who === who;
    // (a deadline over the body too: on lie-fi the headers can come and the body never, the refresh held for good)
    const late = new AbortController(), timer = setTimeout(() => late.abort(), BODY_MS);
    try {
      const url = relayUrl('/places') + (this.ver && this.rows ? `?since=${this.ver}` : '');
      const r = await keyed(url, getKey(), { cache: 'no-store', signal: late.signal }, 15_000);
      if (!mine()) return;
      if (!r.ok) return void (this.net = late.signal.aborted || r.why === 'unreached' || r.why === 'timeout' ? 'offline' : r.why === 'refused' || r.why === 'unpaired' ? 'refused' : 'failed');
      const p = placesPayloadOf(await r.res.json().catch(() => null));
      if (!mine()) return;
      if (!p) return void (this.net = late.signal.aborted ? 'offline' : 'failed');
      const same = !p.full && !p.n && !p.gone.length && this.rows;
      if (same && p.ver === this.ver && p.syncedAt === this.syncedAt) return void (this.net = 'ok');
      const rows = same ? this.rows! : applyPlaces(p.full ? [] : (this.rows ?? []), p);
      if (p.people && p.people.join() !== this.people.join()) this.people = p.people;
      ((this.rows = rows), (this.ver = p.ver), (this.syncedAt = p.syncedAt), (this.net = 'ok'));
      void writeCache({ who, ver: p.ver, syncedAt: p.syncedAt, rows, people: this.people });
    } finally {
      clearTimeout(timer);
      if (mine()) this.busy = false;
    }
  }
}

export const places = new Places();
