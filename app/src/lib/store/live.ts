// The live backend: paints from the IndexedDB cache + the write queue, then syncs in the background (flush the
// queue, fetch rows `since` the last seen server time), with undo windows.
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import type { EventType } from '#lib/contract/api.ts';
import { t } from '#lib/i18n/index.ts';
import { toasts } from '#lib/ui-state/toast.svelte.ts';
import { getKey, onStorageProblem, type StorageProblem } from '#lib/sync/storage.ts';
import { ackedEvents, enqueue, flush, holdEvent, keepAcked, nextRetryAt, queued, retryNow, unqueue, type QueuedEvent } from '#lib/sync/queue.ts';
import { loadCache, refreshSnapshot, type SnapshotCache } from '#lib/sync/cache.ts';
import { keyFromHash } from '#lib/sync/pairing.ts';
import { pendingAcked } from './view.ts';
import { HOLD_MAX_MS, type Backend, type Host, type SendOptions, type SendResult } from './backend.ts';

/** Background refreshes (app becoming visible) at most this often. */
const REFRESH_FLOOR_MS = 30_000;
/** After acked writes, re-read the server so its timestamps replace the optimistic ones. */
const RECONCILE_MS = 1500;

export class LiveBackend implements Backend {
  #host: Host;
  #cache: SnapshotCache | null = null;
  #lastFetch = 0;
  /** Bumped per refresh; a response is applied only if no newer refresh started meanwhile. */
  #refreshSeq = 0;
  #retryTimer: ReturnType<typeof setTimeout> | null = null;
  #reconcileTimer: ReturnType<typeof setTimeout> | null = null;
  #started = false;
  /** Storage problems already shown this session. */
  #told = new Set<StorageProblem>();

  constructor(host: Host) {
    this.#host = host;
  }

  cache(): SnapshotCache | null {
    return this.#cache;
  }

  /**
   * The queue, after the events the server acked but the cache hasn't fetched back yet (persisted: queue.ts
   * `ackedEvents()`). Those stay in the view until a refresh brings their rows, so neither the next tap's recompute
   * nor a cold open before the first fetch undoes them on screen; a fetch that already has them drops them here.
   */
  events(): QueuedEvent[] {
    let sent = ackedEvents();
    if (this.#cache && sent.length) {
      const still = pendingAcked(this.#cache, sent);
      if (still.length !== sent.length) keepAcked(still);
      sent = still;
    }
    return [...sent, ...queued()];
  }

  #start(): void {
    if (this.#started) return;
    this.#started = true;
    // back online: also what backed off while offline goes now (refresh → retryNow)
    addEventListener('online', () => void this.refresh({}));
    // Full storage or private mode: the app works from memory, but say so once.
    onStorageProblem((p) => {
      if (this.#told.has(p)) return;
      this.#told.add(p);
      toasts.show(t(p === 'full' ? 'state.storageFull' : 'state.storageUnavailable'), 8000, { reaction: 'sheepishness' });
    });
  }

  async refresh(opts: { background?: boolean; fresh?: boolean }): Promise<void> {
    const h = this.#host;
    if (!getKey() || keyFromHash(location.hash)) {
      // Not paired yet, or opened from a `#key=…` link: the pair page takes it from here (and keeps the hash).
      h.status = 'ready';
      // replaceState: the `/#key=…` entry must not stay in back/forward history
      await goto(resolve('/pair') + (keyFromHash(location.hash) ? location.hash : ''), { replaceState: true });
      return;
    }
    this.#start();
    if (!this.#cache) {
      const c = await loadCache();
      if (c && !this.#cache) {
        this.#cache = c;
        h.changed();
        h.status = 'ready';
        h.lastSync = new Date(c.fetchedAt);
      }
    }
    if (opts.background && Date.now() - this.#lastFetch < REFRESH_FLOOR_MS) return;
    this.#lastFetch = Date.now();
    if (!opts.background) retryNow(); // asked for (sync, reconnect, after an ack): don't sit out a backoff
    const seq = ++this.#refreshSeq;
    h.syncing = true;
    let r: Awaited<ReturnType<typeof refreshSnapshot>>;
    try {
      await this.#flush(false);
      r = await refreshSnapshot(Date.now, opts.fresh);
    } catch (e) {
      // never leave the pill spinning and the sync buttons disabled
      console.warn('refresh failed', e);
      r = { ok: false, error: 'unavailable' };
    } finally {
      if (seq === this.#refreshSeq) h.syncing = false; // else a newer refresh owns `syncing`
    }
    if (seq !== this.#refreshSeq) return; // a newer refresh owns the view
    if (r.ok) {
      this.#cache = r.cache;
      h.offline = false;
      h.lastSync = new Date();
      h.status = 'ready';
      h.changed();
      return;
    }
    if (r.error === 'unauthorized') {
      h.status = 'ready';
      await goto(resolve('/pair'));
      return;
    }
    if (this.#cache) h.offline = true;
    else h.status = 'error';
  }

  reset(): void {
    this.#cache = null;
    keepAcked([]);
    this.#lastFetch = 0;
  }

  /**
   * Queue an event; the store shows it at once. Never fails for network reasons: the queue retries until the
   * server acks. `holdMs`: an undo window; `undo()` takes back only this event, not others made in the window.
   */
  send(type: EventType, data: Record<string, unknown>, opts: SendOptions): SendResult {
    const holdMs = opts.holdMs ?? 0;
    const ev = enqueue(type, data, Date.now(), holdMs);
    this.#host.changed();
    void this.#flush(true);
    if (holdMs <= 0) return { ok: true };
    const undo = () => {
      const ok = unqueue(ev.id);
      if (ok) this.#host.changed();
      return ok;
    };
    /** Hold it (capped at HOLD_MAX_MS); returns the ms granted. */
    const hold = (ms: number | null) => {
      const now = Date.now();
      const until = now + Math.max(0, ms ?? HOLD_MAX_MS);
      if (!holdEvent(ev.id, until)) return 0;
      this.#scheduleRetry();
      return until - now;
    };
    return { ok: true, undo, hold };
  }

  async #flush(reconcile: boolean): Promise<void> {
    if (this.#retryTimer) clearTimeout(this.#retryTimer);
    this.#retryTimer = null;
    const r = await flush(Date.now);
    // Only events the server acked stay on screen until the snapshot has them (flush keeps them: ackedEvents()). An
    // event that left the queue because it was undone mid-flush must not come back.
    if (r.dropped.length) {
      // a refused ずかん find (an older deployment of the script) is scenery: it goes quietly
      if (r.dropped.some((e) => e.type !== 'find')) toasts.show(t('state.saveFailed'), undefined, { code: 'save-failed', reaction: 'sheepishness' });
      this.#host.changed();
    }
    if (r.error === 'unauthorized') {
      await goto(resolve('/pair'));
      return;
    }
    if (r.error) this.#host.offline = true;
    if (r.sent > 0 && reconcile) {
      if (this.#reconcileTimer) clearTimeout(this.#reconcileTimer);
      // fresh: a fetch that started before the ack may not have the rows yet
      this.#reconcileTimer = setTimeout(() => void this.refresh({ fresh: true }), RECONCILE_MS);
    }
    if (r.remaining > 0) this.#scheduleRetry();
  }

  /** Wake the queue when its next event is due (a backoff, or the end of an undo window). */
  #scheduleRetry(): void {
    if (this.#retryTimer) clearTimeout(this.#retryTimer);
    this.#retryTimer = null;
    const next = nextRetryAt();
    if (next === null) return;
    this.#retryTimer = setTimeout(() => void this.#flush(true), Math.max(250, next - Date.now()));
  }
}
