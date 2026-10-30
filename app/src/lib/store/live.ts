// The live backend: paints from the IndexedDB cache + the write queue, then syncs in the background (flush the
// queue, fetch rows `since` the last seen server time). Undo windows and week locks: round 7 M1/M2.
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import type { EventType } from '#lib/contract/api.ts';
import { t } from '#lib/i18n/index.ts';
import { toasts } from '#lib/ui-state/toast.svelte.ts';
import { getKey, onStorageProblem, type StorageProblem } from '#lib/sync/storage.ts';
import { ackedEvents, enqueue, flush, holdEvent, keepAcked, nextRetryAt, queued, unqueue, type QueuedEvent } from '#lib/sync/queue.ts';
import { loadCache, refreshSnapshot, type SnapshotCache } from '#lib/sync/cache.ts';
import { keyFromHash } from '#lib/sync/pairing.ts';
import { missesLock, pendingAcked } from './view.ts';
import { HOLD_MAX_MS, type Backend, type Host, type SendOptions, type SendResult } from './backend.ts';

/** Background refreshes (app becoming visible) at most this often. */
const REFRESH_FLOOR_MS = 30_000;
/** After acked writes, re-read the server so its timestamps replace the optimistic ones. */
const RECONCILE_MS = 1500;
/** A held edit goes out at least this long before its week's lock (server clock), so it lands in time (M1). */
export const LOCK_MARGIN_MS = 60_000;
/** Closer than this to the lock an edit can't be trusted to land: refused at once, with a message. */
const LOCK_LATE_MS = 5_000;

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
  events(): { list: QueuedEvent[]; unsent: Set<string> } {
    let sent = ackedEvents();
    if (this.#cache && sent.length) {
      const still = pendingAcked(this.#cache, sent);
      if (still.length !== sent.length) keepAcked(still);
      sent = still;
    }
    const q = queued();
    return { list: [...sent, ...q], unsent: new Set(q.map((e) => e.id)) };
  }

  #start(): void {
    if (this.#started) return;
    this.#started = true;
    addEventListener('online', () => void this.refresh({}));
    // Full storage or private mode: the app works from memory, but say so once (round 9 §2 item 2).
    onStorageProblem((p) => {
      if (this.#told.has(p)) return;
      this.#told.add(p);
      toasts.show(t(p === 'full' ? 'state.storageFull' : 'state.storageUnavailable'), 8000, { reaction: 'sheepishness' });
    });
  }

  async refresh(opts: { background?: boolean }): Promise<void> {
    const h = this.#host;
    if (!getKey() || keyFromHash(location.hash)) {
      // Not paired yet, or opened from a `#key=…` link: the pair page takes it from here (and keeps the hash).
      h.status = 'ready';
      await goto(resolve('/pair') + (keyFromHash(location.hash) ? location.hash : ''));
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
    const seq = ++this.#refreshSeq;
    h.syncing = true;
    let r: Awaited<ReturnType<typeof refreshSnapshot>>;
    try {
      await this.#flush(false);
      r = await refreshSnapshot();
    } catch (e) {
      // never leave the pill spinning and the sync buttons disabled (round 16 H2)
      console.warn('refresh failed', e);
      r = { ok: false, error: 'unavailable' };
    } finally {
      if (seq === this.#refreshSeq) h.syncing = false; // else a newer refresh owns `syncing`
    }
    if (seq !== this.#refreshSeq) return; // a newer refresh owns the view
    if (r.ok) {
      this.#noteRefused(r.cache);
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
   * server acks. `holdMs`: an undo window; `undo()` takes back only this event, not others made in the window
   * (review r2 N4).
   */
  send(type: EventType, data: Record<string, unknown>, opts: SendOptions): SendResult {
    let holdMs = opts.holdMs ?? 0;
    const lockAt = opts.lockAt;
    const skew = () => this.#cache?.skewMs ?? 0;
    if (lockAt !== undefined) {
      // An edit of a week that locks: it must reach the server before the lock (round 7 M1). Too close → refused
      // now; close → its undo window shrinks (to none) so it is sent in time.
      const left = lockAt - skew() - Date.now();
      if (left < LOCK_LATE_MS) {
        toasts.show(t('kiroku.lockedNow'), 4000, { reaction: 'sheepishness' });
        return { ok: false };
      }
      holdMs = Math.max(0, Math.min(holdMs, left - LOCK_MARGIN_MS));
    }
    const ev = enqueue(type, data, Date.now(), holdMs, lockAt);
    this.#host.changed();
    void this.#flush(true);
    if (holdMs <= 0) return { ok: true };
    const undo = () => {
      const ok = unqueue(ev.id);
      if (ok) this.#host.changed();
      return ok;
    };
    /** Hold it (capped at HOLD_MAX_MS, and so that it still lands before its lock); returns the ms granted. */
    const hold = (ms: number | null) => {
      const now = Date.now();
      let until = now + (ms ?? HOLD_MAX_MS);
      if (lockAt !== undefined) until = Math.min(until, lockAt - skew() - LOCK_MARGIN_MS);
      until = Math.max(now, until);
      if (!holdEvent(ev.id, until)) return 0;
      this.#scheduleRetry();
      return until - now;
    };
    return { ok: true, undo, hold };
  }

  async #flush(reconcile: boolean): Promise<void> {
    if (this.#retryTimer) clearTimeout(this.#retryTimer);
    this.#retryTimer = null;
    const skew = this.#cache?.skewMs ?? 0;
    const r = await flush(Date.now, (ev, now) => missesLock(ev, now, skew));
    if (r.expired.length) {
      toasts.show(t('kiroku.missedLock'), 5000, { reaction: 'sheepishness' });
      this.#host.changed();
    }
    // Only events the server acked stay on screen until the snapshot has them (flush keeps them: ackedEvents()). An
    // event that left the queue because it was undone mid-flush must not come back (review r2 N1).
    if (r.dropped.length) {
      toasts.show(t('state.saveFailed'), undefined, { code: 'save-failed', reaction: 'sheepishness' });
      this.#host.changed();
    }
    if (r.error === 'unauthorized') {
      await goto(resolve('/pair'));
      return;
    }
    if (r.error) this.#host.offline = true;
    if (r.sent > 0 && reconcile) {
      if (this.#reconcileTimer) clearTimeout(this.#reconcileTimer);
      this.#reconcileTimer = setTimeout(() => void this.refresh({}), RECONCILE_MS);
    }
    if (r.remaining > 0) this.#scheduleRetry();
  }

  /**
   * After a fetch: an acked edit whose server row is stamped at or after its lock was refused by the model. Say so
   * (it disappears from the screen with this refresh) instead of letting it vanish silently (round 7 M1).
   */
  #noteRefused(cache: SnapshotCache): void {
    const late = ackedEvents().filter((e) => e.lockAt !== undefined);
    if (!late.length) return;
    const atOf = new Map(cache.rows.events.map((r) => [String(r[2]), Date.parse(String(r[0]))]));
    if (late.some((e) => (atOf.get(e.id) ?? -Infinity) >= e.lockAt!)) toasts.show(t('kiroku.missedLock'), 5000, { reaction: 'sheepishness' });
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
