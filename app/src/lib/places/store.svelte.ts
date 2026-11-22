// 保存した場所's list on this phone (docs/places.md "Data"): the copy (cache.ts) read first, then `GET /places` with the
// phone's key (`?since=` the copy's version: a delta merged by the contract's applyPlaces), the result kept again.
// Read by the map page and by the trail map's layer (each loads on view; refreshed at most once a minute, and on
// coming back online once a view has loaded it). No timer: nothing runs while neither is open. A delta that changes
// nothing keeps the rows (and so the index) as they were. Another person paired on this phone: their copy, read
// afresh (a member's notes never shown to the guest). The outcome of the last fetch: ok, offline (unreached), refused
// (no key, not this key's) or failed; never a place's name or position in a log (keyed.ts logs the endpoint and the
// kind only).
import { applyPlaces, placesPayloadOf, type Place } from '../contract/places.ts';
import { keyed } from '../keyed.ts';
import { getKey, getStoredMe } from '../sync/storage.ts';
import { relayUrl } from '../sync/transport.ts';
import { readCache, writeCache } from './cache.ts';
import { buildIndex, type Index } from './search.ts';

type Net = 'ok' | 'offline' | 'refused' | 'failed';
const AGAIN_MS = 60_000;
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
  private ver = 0;
  /** Whose rows these are (getStoredMe at the read; '' unpaired). */
  private who: string | null = null;
  private read: Promise<void> | null = null;
  private last = 0;
  private ix: { rows: Place[]; ix: Index } | null = null;
  private listening = false;

  /** The search index, built once per list. */
  get index(): Index | null {
    const r = this.rows;
    if (!r) return null;
    if (this.ix?.rows !== r) this.ix = { rows: r, ix: buildIndex(r) };
    return this.ix.ix;
  }

  /** Read the copy (once a person), then fetch unless one did within the minute (`force`: もう一度). `sync` (the map
   *  page's opening): the relay's list over 2 h old asks it to fetch again (POST /places/sync), then the delta. */
  async load(force = false, sync = false): Promise<void> {
    if (!this.listening && typeof window !== 'undefined') {
      this.listening = true;
      addEventListener('online', () => void this.load(true));
    }
    this.samePerson();
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
    ((this.rows = null), (this.syncedAt = null), (this.net = null), (this.ver = 0), (this.last = 0));
    ((this.read = null), (this.ix = null), (this.busy = false));
  }

  private async readCopy(): Promise<void> {
    const who = (this.who = getStoredMe() ?? '');
    const c = await readCache(who);
    if (c && !this.rows && this.who === who) ((this.rows = c.rows), (this.ver = c.ver), (this.syncedAt = c.syncedAt));
  }

  private async fetch(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.last = Date.now();
    const who = this.who ?? '';
    const mine = () => this.who === who;
    try {
      const url = relayUrl('/places') + (this.ver && this.rows ? `?since=${this.ver}` : '');
      const r = await keyed(url, getKey(), { cache: 'no-store' }, 15_000);
      if (!mine()) return;
      if (!r.ok) return void (this.net = r.why === 'unreached' || r.why === 'timeout' ? 'offline' : r.why === 'refused' || r.why === 'unpaired' ? 'refused' : 'failed');
      if (r.res.status === 304) return void (this.net = 'ok');
      const p = placesPayloadOf(await r.res.json().catch(() => null));
      if (!mine()) return;
      if (!p) return void (this.net = 'failed');
      const same = !p.full && !p.n && !p.gone.length && this.rows;
      if (same && p.ver === this.ver && p.syncedAt === this.syncedAt) return void (this.net = 'ok');
      const rows = same ? this.rows! : applyPlaces(p.full ? [] : (this.rows ?? []), p);
      ((this.rows = rows), (this.ver = p.ver), (this.syncedAt = p.syncedAt), (this.net = 'ok'));
      void writeCache({ who, ver: p.ver, syncedAt: p.syncedAt, rows });
    } finally {
      if (mine()) this.busy = false;
    }
  }
}

export const places = new Places();
