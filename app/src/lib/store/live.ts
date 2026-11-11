// The live backend: paints from the IndexedDB cache + the write queue, then syncs in the background (flush the
// queue, fetch rows `since` the last seen server time), with undo windows.
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import type { EventRow, EventType } from '#lib/contract/api.ts';
import { t } from '#lib/i18n/index.ts';
import { toasts } from '#lib/ui-state/toast.svelte.ts';
import { getKey, getStoredMe, onStorageProblem, type StorageProblem } from '#lib/sync/storage.ts';
import { ackedEvents, enqueue, enqueueAll, flush, holdEvent, keepAcked, nextRetryAt, queued, releaseHeld, replaceHeld, retryNow, unpark, unqueue, type QueuedEvent } from '#lib/sync/queue.ts';
import { addOwnRows, loadCache, refreshSnapshot, type SnapshotCache } from '#lib/sync/cache.ts';
import { keyFromHash } from '#lib/sync/pairing.ts';
import { LIVE_URL, liveRelay, type Live, type SheetChange } from '#lib/sync/live.ts';
import type { RecordMark } from '#lib/contract/live-protocol.ts';
import { log, persistLog, sessionId } from '#lib/sync/log.ts';
import { pendingAcked } from './view.ts';
import { world } from './world.svelte.ts';
import { HOLD_MAX_MS, type Backend, type Host, type SendOptions, type SendResult } from './backend.ts';
import { persistOnce, storageDaily } from '#lib/sync/persist.ts';
import { quiet } from '#lib/quiet.ts';

/** Background refreshes (app becoming visible) at most this often. */
const REFRESH_FLOOR_MS = 30_000;
/** Back on screen or the socket back: the write queue's backoff is cut short at most this often (a head the record
 *  keeps failing never retries faster). */
const KICK_FLOOR_MS = 30_000;
/** After acked writes the record stored no row for (a duplicate), re-read so server rows replace the optimistic ones. */
const RECONCILE_MS = 1500;
/** A send within this of the last flush's start waits for one trailing flush, which takes everything gathered meanwhile
 *  (review 5: an editor burst went as one request per op, past the record's 120 a minute for a person, then backed off
 *  `busy`). The first send after a quiet spell goes at once. */
const SEND_PACE_MS = 600;
/** Sheet changes arriving together (a burst of pushes) make one refresh. */
const PUSH_GATHER_MS = 300;
/** My own other device's events while the socket is up (the Mac's /editor: a write every ~13 s, each a push here, 126
 *  fetches in 28 min; its layout ops come live through the room anyway): one trailing fetch this long after the last,
 *  at most MINE_MAX_MS after the first. The welcome and the 15-minute check converge the rest. */
const MINE_WAIT_MS = 30_000;
const MINE_MAX_MS = 120_000;
/** How long opening waits for the relay's welcome (its `rec`) before fetching anyway. */
const WELCOME_WAIT_MS = 2000;
/** A cache fetched longer ago than this is fetched again on opening, whatever the welcome says. */
const CURRENT_MAX_MS = 15 * 60_000;

/** A record mark's identity. */
const markOf = (r: RecordMark): string => `${r.rev}|${r.at}`;

export class LiveBackend implements Backend {
  #host: Host;
  #cache: SnapshotCache | null = null;
  #lastFetch = 0;
  /** Bumped per refresh; a response is applied only if no newer refresh started meanwhile. */
  #refreshSeq = 0;
  #retryTimer: ReturnType<typeof setTimeout> | null = null;
  #reconcileTimer: ReturnType<typeof setTimeout> | null = null;
  #pushTimer: ReturnType<typeof setTimeout> | null = null;
  /** My other device's events waiting (MINE_WAIT_MS), and when the first of them came. */
  #mineTimer: ReturnType<typeof setTimeout> | null = null;
  #mineFirst = 0;
  /** When the last flush started (SEND_PACE_MS), and the trailing flush armed meanwhile. */
  #flushedAt = -Infinity;
  #paceTimer: ReturnType<typeof setTimeout> | null = null;
  /** The relay socket (docs/backend.md#push): the record's changes in, `saved` nudges out. */
  #live: Live | null = null;
  /** The record's push (`changed`) reached this phone this session, so it covers events too: no `saved` nudges. */
  #pushWorks = false;
  #started = false;
  /** The first refresh of this session (the app opening) has run. */
  #opened = false;
  /** Storage problems already shown this session. */
  #told = new Set<StorageProblem>();
  /** A fetch of the record is under way (#fetch); a welcome meanwhile is looked at again once it's done. */
  #fetching = false;
  #recheck = false;
  /** The welcome's record mark last fetched for (`rev|at`): one fetch per mark, so a mark the cache never reaches (the
   *  guest's snapshot leaves out rows it may not read) can't fetch at every reconnect. */
  #fetchedFor = '';

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
    // hidden (the phone locked, another app) or left: the day rows still held go now, in a request that outlives the page
    addEventListener('pagehide', () => this.#hidden());
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && this.#hidden());
    // The relay: while the app is on screen, a change to the record (the partner's tap, a Shortcut's upload) is fetched
    // at once instead of on the next open. Polling stays as it was, so a relay outage only loses the immediacy.
    if (LIVE_URL) {
      this.#live = liveRelay();
      this.#live.onChange((c) => this.#sheetChanged(c));
      // each welcome (a reconnect: back from the background, the relay restarted) says the record's last change: what
      // was written while the socket was down is fetched now, not at the next open (docs/backend.md#live-sync)
      let up = false;
      this.#live.onStatus((s) => {
        if (s.connected && !up) {
          this.#kick();
          this.#welcomed();
        }
        up = s.connected;
      });
      // the shared island hears the partner even while another tab of the app is on screen (docs/backend.md#shared-world)
      world.attach(this.#live, getStoredMe());
      this.#live.start();
    }
    // Full storage or private mode: the app works from memory, but say so once.
    onStorageProblem((p) => {
      if (this.#told.has(p)) return;
      this.#told.add(p);
      log('storage.fail', { store: 'ls', kind: p }, 2);
      toasts.show(t(p === 'full' ? 'state.storageFull' : 'state.storageUnavailable'), 8000, { reaction: 'sheepishness' });
    });
  }

  async refresh(opts: { background?: boolean; fresh?: boolean; unpark?: boolean }): Promise<void> {
    const h = this.#host;
    if (!getKey() || keyFromHash(location.hash)) {
      // Not paired yet, or opened from a `#key=…` link: the pair page takes it from here (and keeps the hash).
      h.status = 'ready';
      // replaceState: the `/#key=…` entry must not stay in back/forward history
      await goto(resolve('/pair') + (keyFromHash(location.hash) ? location.hash : ''), { replaceState: true });
      return;
    }
    this.#start();
    if (opts.unpark) unpark();
    if (opts.background) this.#kick();
    if (!this.#cache) {
      const c = await loadCache();
      if (c && !this.#cache) {
        this.#cache = c;
        h.changed();
        h.status = 'ready';
        h.lastSync = new Date(c.fetchedAt);
      }
    }
    // (within the floor, unless the welcome already says the cache is behind)
    if (opts.background && Date.now() - this.#lastFetch < REFRESH_FLOOR_MS && !this.#behind()) return;
    // opening the app, or coming back to it: no fetch when the relay's welcome says the cache has the record's last
    // change (docs/backend.md#the-record "Push-driven"); a sync tap, a push or a retry always fetches
    const opening = !this.#opened;
    this.#opened = true;
    if ((opening || opts.background) && !opts.fresh && (await this.#current())) {
      this.#lastFetch = Date.now();
      await this.#flush(true);
      h.current = true;
      h.status = 'ready';
      return;
    }
    this.#lastFetch = Date.now();
    if (!opts.background) retryNow(); // asked for (sync, reconnect, after an ack): don't sit out a backoff
    const seq = ++this.#refreshSeq;
    h.syncing = true;
    let r: Awaited<ReturnType<typeof refreshSnapshot>>;
    const rec = this.#live?.status().rec;
    this.#fetching = true;
    // a gathered push or welcome waiting: this fetch brings what it would (`fresh`: not one already in flight)
    const gathered = !!this.#pushTimer || !!this.#mineTimer;
    if (this.#pushTimer) clearTimeout(this.#pushTimer);
    if (this.#mineTimer) clearTimeout(this.#mineTimer);
    this.#pushTimer = this.#mineTimer = null;
    try {
      await this.#flush(false);
      r = await refreshSnapshot(Date.now, opts.fresh || gathered);
    } catch (e) {
      // never leave the pill spinning and the sync buttons disabled
      console.warn('refresh failed', e);
      r = { ok: false, error: 'unavailable' };
    } finally {
      if (seq === this.#refreshSeq) h.syncing = false; // else a newer refresh owns `syncing`
      this.#fetching = false;
    }
    if (r.ok && rec) this.#fetchedFor = markOf(rec);
    if (this.#recheck) {
      this.#recheck = false;
      queueMicrotask(() => this.#welcomed());
    }
    if (seq !== this.#refreshSeq) return; // a newer refresh owns the view
    if (r.ok) {
      this.#cache = r.cache;
      h.offline = false;
      h.current = true;
      h.lastSync = new Date();
      persistOnce().catch(() => {});
      void quiet(storageDaily(), 'storage.daily');
      h.status = 'ready';
      h.changed();
      return;
    }
    if (r.error === 'unauthorized') {
      h.status = 'ready';
      log('auth.lost', { from: 'refresh' }, 2);
      persistLog();
      await goto(resolve('/pair'));
      return;
    }
    // offline is the phone's (a train, a lift): info; anything else a warning
    log('sync.fail', { err: r.error, cached: !!this.#cache }, r.error === 'offline' ? 1 : 2);
    if (this.#cache) h.offline = true;
    else h.status = 'error';
  }

  reset(): void {
    this.#cache = null;
    this.#host.current = false;
    this.#opened = false;
    keepAcked([]);
    this.#lastFetch = 0;
    this.#pushWorks = false;
    this.#fetchedFor = '';
    if (this.#mineTimer) clearTimeout(this.#mineTimer);
    this.#mineTimer = null;
    // paired as someone else: the socket speaks for the old key
    if (this.#live) {
      this.#live.stop();
      this.#live.start();
    }
  }

  /**
   * The relay says the record changed: refresh now (gathered, `fresh` so a fetch already in flight is followed by one
   * more). Skipped when the cache already holds it, and for this page's own events (the ack's rows are in the cache:
   * flush); my other devices' (their `sid`) are fetched, while the socket is up once they pause (MINE_WAIT_MS). A
   * relay from before `sid`: all of mine skipped, as then.
   */
  #sheetChanged(c: SheetChange): void {
    if (c.at) this.#pushWorks = true;
    else if (this.#pushWorks) return; // a nudge, and the push already brings events
    const cache = this.#cache;
    const mine = !!c.at && !!cache && c.who === cache.me && c.what === 'event';
    if (mine && (!c.sid || c.sid === sessionId())) return;
    if (c.at && cache && c.rev === cache.rev && cache.since !== null && c.at <= cache.since) return;
    if (this.#pushTimer) return;
    if (mine && this.#live?.status().connected) return this.#mineLater();
    this.#pushTimer = setTimeout(() => {
      this.#pushTimer = null;
      void this.refresh({ fresh: true });
    }, PUSH_GATHER_MS);
  }

  /** My other device's event: one trailing fetch MINE_WAIT_MS after the last of a run, by MINE_MAX_MS after its first
   *  (a fetch meanwhile takes them: refresh). */
  #mineLater(): void {
    const now = Date.now();
    if (this.#mineTimer) clearTimeout(this.#mineTimer);
    else this.#mineFirst = now;
    this.#mineTimer = setTimeout(() => {
      this.#mineTimer = null;
      void this.refresh({ fresh: true });
    }, Math.max(0, Math.min(MINE_WAIT_MS, this.#mineFirst + MINE_MAX_MS - now)));
  }

  /** Whether the welcome's record mark is past the cache (false without a welcome, a mark or a cache). */
  #behind(rec: RecordMark | undefined = this.#live?.status().rec): boolean {
    const c = this.#cache;
    return !!rec && !!c && !(c.rev === rec.rev && c.since !== null && rec.at <= c.since);
  }

  /** A welcome: when its record mark is past the cache, fetch (gathered, as a push), once per mark. The opening's
   *  refresh compares the first welcome itself (#current); a fetch under way looks again when it's done. */
  #welcomed(): void {
    const rec = this.#live?.status().rec;
    if (!this.#opened || !rec || !this.#behind(rec) || markOf(rec) === this.#fetchedFor) return;
    if (this.#waiting) return;
    if (this.#fetching) {
      this.#recheck = true;
      return;
    }
    this.#fetchedFor = markOf(rec);
    if (this.#pushTimer) return;
    this.#pushTimer = setTimeout(() => {
      this.#pushTimer = null;
      void this.refresh({ fresh: true });
    }, PUSH_GATHER_MS);
  }
  /** The opening's refresh is waiting for the first welcome (#current). */
  #waiting = false;

  /**
   * Whether the cache already has the record's last change, as the relay's welcome tells it (waited for up to
   * WELCOME_WAIT_MS): the same revision, its `at` not after the cache's `since`, and the cache fetched within
   * CURRENT_MAX_MS (a notice the room missed can't hide a change for longer). False without a socket.
   */
  async #current(): Promise<boolean> {
    const live = this.#live, c0 = this.#cache;
    if (!live || !c0 || Date.now() - c0.fetchedAt > CURRENT_MAX_MS) return false;
    if (!live.status().connected) {
      this.#waiting = true;
      await new Promise<void>((done) => {
        let off: () => void = () => {};
        const timer = setTimeout(() => (off(), done()), WELCOME_WAIT_MS);
        off = live.onStatus((s) => {
          if (!s.connected) return;
          clearTimeout(timer);
          queueMicrotask(() => off());
          done();
        });
      });
      this.#waiting = false;
    }
    const rec = live.status().rec, c = this.#cache;
    return !!rec && !!c && c.rev === rec.rev && c.since !== null && rec.at <= c.since;
  }

  /**
   * Queue an event; the store shows it at once. Never fails for network reasons: the queue retries until the
   * server acks. `holdMs`: an undo window; `undo()` takes back only this event, not others made in the window.
   */
  send(type: EventType, data: Record<string, unknown>, opts: SendOptions): SendResult {
    const holdMs = opts.holdMs ?? 0;
    const ev = enqueue(type, data, Date.now(), holdMs, opts.group);
    this.#host.changed();
    this.#paced();
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
    const replace = (data: Record<string, unknown>, ms: number) => {
      const now = Date.now();
      if (!replaceHeld(ev.id, data, now, now + Math.max(0, ms))) return false;
      this.#host.changed();
      this.#scheduleRetry();
      return true;
    };
    return { ok: true, undo, hold, replace };
  }

  sendMany(events: readonly { type: EventType; data: Record<string, unknown> }[], group?: string): void {
    if (!enqueueAll(events, Date.now(), group).length) return;
    this.#host.changed();
    this.#paced();
  }

  /** A flush now, or (within SEND_PACE_MS of the last one's start) one trailing flush when the pace allows. */
  #paced(): void {
    const wait = this.#flushedAt + SEND_PACE_MS - Date.now();
    if (wait <= 0) return void this.#flush(true);
    this.#paceTimer ??= setTimeout(() => {
      this.#paceTimer = null;
      void this.#flush(true);
    }, wait);
  }

  async #flush(reconcile: boolean): Promise<void> {
    if (this.#retryTimer) clearTimeout(this.#retryTimer);
    this.#retryTimer = null;
    // (only a flush with something to send paces: a refresh's over an empty queue sends nothing)
    if (queued().length) this.#flushedAt = Date.now();
    // (paced: a batch short of full ends it; what came meanwhile waits for the next, SEND_PACE_MS on: #scheduleRetry)
    const r = await flush(Date.now, { paced: true });
    // Only events the server acked stay on screen until the snapshot has them (flush keeps them: ackedEvents()). An
    // event that left the queue because it was undone mid-flush must not come back.
    if (r.dropped.length) {
      // (a ききみみ game's row refused, by a relay from before it: kept on this phone for きろく, no toast; docs/kikimimi.md "Storage";
      // a buy of a piece I have already, my other phone's: nothing lost, no toast)
      if (r.dropped.some((ev) => ev.type !== 'listen' && !(ev.type === 'buy' && ev.detail === 'owned'))) toasts.show(t('state.saveFailed'), undefined, { code: 'save-failed', reaction: 'sheepishness' });
      this.#host.changed();
    }
    if (r.error === 'unauthorized') {
      log('auth.lost', { from: 'flush' }, 2);
      persistLog();
      await goto(resolve('/pair'));
      return;
    }
    if (r.error) this.#host.offline = true;
    // what the record stored is in the cache at once, as its rows (its `at`): no re-read for those
    const cache = this.#cache;
    if (r.stored.length && cache) {
      const c = addOwnRows(r.stored.map(({ ev, at }): EventRow => [at, cache.me, ev.id, ev.type, JSON.stringify(ev.data)]));
      if (c) {
        this.#cache = c;
        this.#host.changed();
      }
    }
    // the partner's phone fetches now (until the record's push is seen to work)
    if (r.sent > 0 && !this.#pushWorks) this.#live?.send({ kind: 'saved' });
    if (r.sent > r.stored.length && reconcile) {
      if (this.#reconcileTimer) clearTimeout(this.#reconcileTimer);
      // fresh: a fetch that started before the ack may not have the rows yet
      this.#reconcileTimer = setTimeout(() => void this.refresh({ fresh: true }), RECONCILE_MS);
    }
    if (r.remaining > 0) this.#scheduleRetry();
  }

  /** The page is being hidden: the held tally and island rows go (queue.ts releaseHeld), and what waits for the pace's
   *  trailing flush (a look changed just before the phone locked), keepalive. */
  #hidden(): void {
    const paced = this.#paceTimer !== null;
    if (paced) clearTimeout(this.#paceTimer!);
    this.#paceTimer = null;
    if (!releaseHeld() && !paced) return;
    void flush(Date.now, { keepalive: true });
  }

  #kickedAt = -Infinity;
  /** Back on screen or reconnected (iOS often skips `online` after a suspend): what backed off goes now, not after up
   *  to 5 minutes with the network up. At most once per KICK_FLOOR_MS. */
  #kick(): void {
    const now = Date.now();
    if (now - this.#kickedAt < KICK_FLOOR_MS || !queued().some((x) => x.tries > 0 && !x.parked && x.nextAt > now)) return;
    this.#kickedAt = now;
    retryNow(now);
    void this.#flush(true);
  }

  /** Wake the queue when its next event is due (a backoff, or the end of an undo window). */
  #scheduleRetry(): void {
    if (this.#retryTimer) clearTimeout(this.#retryTimer);
    this.#retryTimer = null;
    const next = nextRetryAt();
    if (next === null) return;
    const now = Date.now();
    this.#retryTimer = setTimeout(() => void this.#flush(true), Math.max(250, next - now, this.#flushedAt + SEND_PACE_MS - now));
  }
}
