// The map areas saved on this phone (offline phase B, docs/backend.md "Service worker" › Offline): their state for the
// save buttons (SaveButton.svelte) and せってい's オフラインの地図 (OfflineSection.svelte). A registry in localStorage
// mirrors each area's manifest (save.ts), so an area whose cache Safari evicted is still listed, as gone. One save at a
// time; it goes on while the phone shows anything else in the app (the page's), and a reload resumes it on the next tap.
import type { L } from '#lib/travel/types.ts';
import { DEVICE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
import { overCaps, planTrail, planTrip, TOTAL_CAP_BYTES, type Plan, type Source } from './plan.ts';
import { deleteArea, readManifest, saveArea, type Manifest } from './save.ts';

interface Entry {
  name: L;
  source: Source;
  /** Bytes stored (the estimate until the first tile). */
  bytes: number;
  /** When saved, ms. */
  at: number;
  done: boolean;
  tileVersion: string | null;
}
type AreaState =
  | { k: 'none' }
  | { k: 'saving'; done: number; total: number; bytes: number }
  | { k: 'saved'; bytes: number; at: number; stale: boolean }
  | { k: 'partial'; bytes: number }
  | { k: 'gone' };
/** Why a save didn't start. */
export type Refusal = 'offline' | 'cap' | 'space' | 'limit' | 'busy';

/** An OpenFreeMap area older than this offers 更新 (the week's builds move on; its tiles are kept as they were). */
const STALE_MS = 30 * 24 * 3600_000;

class Areas {
  /** id → the registry's entry. */
  list = $state<Record<string, Entry>>(readJson(localKV(), DEVICE.offlineAreas) ?? {});
  /** Areas whose cache is gone (checked by refresh()). */
  gone = $state<Record<string, true>>({});
  /** The save running. */
  job = $state<{ id: string; done: number; total: number; bytes: number } | null>(null);
  private abort: AbortController | null = null;
  private checked = false;

  private keep(): void {
    writeJson(localKV(), DEVICE.offlineAreas, this.list);
  }

  state(id: string, now = Date.now()): AreaState {
    if (this.job?.id === id) return { k: 'saving', done: this.job.done, total: this.job.total, bytes: this.job.bytes };
    const e = this.list[id];
    if (!e) return { k: 'none' };
    if (this.gone[id]) return { k: 'gone' };
    if (!e.done) return { k: 'partial', bytes: e.bytes };
    return { k: 'saved', bytes: e.bytes, at: e.at, stale: e.source === 'ofm' && now - e.at > STALE_MS };
  }

  /** Bytes of every area kept (a gone one counts nothing). */
  total(): number {
    let n = 0;
    for (const [id, e] of Object.entries(this.list)) if (!this.gone[id]) n += e.bytes;
    return n;
  }

  /** Each listed area's cache still there (and its manifest's numbers): once per page, or when asked. */
  async refresh(force = false): Promise<void> {
    if ((this.checked && !force) || typeof caches === 'undefined') return;
    this.checked = true;
    const gone: Record<string, true> = {};
    for (const id of Object.keys(this.list)) {
      if (this.job?.id === id) continue;
      const m = await readManifest(caches, id).catch(() => null);
      if (!m) gone[id] = true;
      else this.list[id] = { ...this.list[id], bytes: m.bytes, done: m.done, at: m.at };
    }
    this.gone = gone;
    this.keep();
  }

  /** Whether `plan` may start: online, within OpenFreeMap's asks, the 150 MB of all areas and the phone's free space. */
  async refusal(plan: Plan): Promise<Refusal | null> {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'offline';
    if (overCaps(plan)) return 'limit';
    const others = this.total() - (this.gone[plan.id] ? 0 : (this.list[plan.id]?.bytes ?? 0));
    if (others + plan.bytes > TOTAL_CAP_BYTES) return 'cap';
    const est = await navigator.storage?.estimate?.().catch(() => undefined);
    if (est?.quota && est.quota - (est.usage ?? 0) < plan.bytes * 1.2) return 'space';
    return null;
  }

  /** Save (or go on with, or update) an area; null once it ran (done or 一部のみ), else why it didn't start. */
  async save(plan: Plan, name: L): Promise<Refusal | null> {
    if (this.job) return 'busy';
    const why = await this.refusal(plan);
    if (why) return why;
    // the first save asks that the storage be kept (WebKit may evict an origin's caches after weeks unused)
    if (!Object.keys(this.list).length) await navigator.storage?.persist?.().catch(() => false);
    this.abort = new AbortController();
    this.job = { id: plan.id, done: 0, total: plan.tiles.length, bytes: 0 };
    const entry = (m: Pick<Manifest, 'bytes' | 'done' | 'at' | 'tileVersion'>): Entry => ({ name, source: plan.source, bytes: m.bytes, at: m.at, done: m.done, tileVersion: m.tileVersion });
    this.list[plan.id] = entry({ bytes: this.list[plan.id]?.bytes ?? 0, done: false, at: Date.now(), tileVersion: this.list[plan.id]?.tileVersion ?? null });
    delete this.gone[plan.id];
    this.keep();
    try {
      const m = await saveArea(plan, { fetch: (...a) => fetch(...a), caches, controlled: !!navigator.serviceWorker?.controller }, (p) => {
        if (this.job?.id === plan.id) this.job = { id: plan.id, ...p };
      }, this.abort.signal);
      this.list[plan.id] = entry(m);
    } catch {
      // stopped or the TileJSON not had: what's stored stays, 一部のみ
      const m = await readManifest(caches, plan.id).catch(() => null);
      if (m) this.list[plan.id] = entry(m);
      else delete this.list[plan.id];
    } finally {
      this.job = null;
      this.abort = null;
      this.keep();
    }
    return null;
  }

  stop(): void {
    this.abort?.abort();
  }

  async remove(id: string): Promise<void> {
    if (this.job?.id === id) this.stop();
    await deleteArea(caches, id).catch(() => false);
    delete this.list[id];
    delete this.gone[id];
    this.keep();
  }
}

export const areas = new Areas();

/** An area's plan and name, from its id (せってい's もう一度保存 and 更新: the trip's data or the trail's track loaded). */
export async function planOf(id: string): Promise<{ plan: Plan; name: L } | null> {
  if (id.startsWith('trip-')) {
    const { loadTrip, TRIP_IDS } = await import('#lib/travel/trips/index.ts');
    const tid = TRIP_IDS.find((t) => t === id.slice(5));
    if (!tid) return null;
    const trip = await loadTrip(tid);
    return { plan: planTrip(trip), name: trip.title };
  }
  if (id.startsWith('trail-')) {
    const [{ trailOf }, { loadTrack }] = await Promise.all([import('#lib/hiking/trails.ts'), import('#lib/hiking/load.ts')]);
    const t = trailOf(id.slice(6));
    const r = t ? await loadTrack(t.slug) : null;
    return t && r?.k === 'ok' ? { plan: planTrail(t.slug, t.tiles, r.track.pts), name: t.name } : null;
  }
  return null;
}
