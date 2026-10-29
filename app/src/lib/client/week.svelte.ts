// Client-side week store. Paints at once from the cached snapshot + queued (unsent) events, computing the WeekView in
// the browser (lib/model), then syncs in the background: flush the write queue, fetch rows `since` the last seen
// server time, recompute. `?demo` (or dev without VITE_GAS_URL) runs the model on generated rows (demoRows.ts);
// `?demo&as=B` plays うめ. The demo's taps are kept in localStorage for the day, shared by both players' tabs.
import { untrack } from 'svelte';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { dev } from '$app/env';
import type { WeekView } from '#lib/types.ts';
import type { EventType } from '#lib/ingest/sheet-api.ts';
import { GAS_CONFIGURED, enqueue, flush, getKey, holdEvent, keyFromHash, loadCache, nextRetryAt, queued, refreshSnapshot, unqueue, type QueuedEvent, type SnapshotCache } from './gas.ts';
import { composeModel, missesLock, notInCache, type ComposedModel } from './view.ts';
import type { PersonId } from '#lib/types.ts';
import { buildWeekView, payoutAsOf } from '#lib/model/week.ts';
import { addDays } from '#lib/scoring/index.ts';
import { setLocale, t } from '#lib/i18n/index.ts';
import { minuteNow } from '#lib/components/motion/clock.ts';
import { toasts } from './toast.svelte.ts';

type DemoMode = false | 'plain' | 'harvest';
const DEMO_EVENTS = 'island.demo.events';

/** Background refreshes (app becoming visible) at most this often. */
const REFRESH_FLOOR_MS = 30_000;
/** After acked writes, re-read the server so its timestamps replace the optimistic ones. */
const RECONCILE_MS = 1500;
/** A banner held open (hover/focus) keeps its action unsent for at most this long (then both end; round 7 M1). */
export const HOLD_MAX_MS = 2 * 60_000;
/** A held edit goes out at least this long before its week's lock (server clock), so it lands in time (M1). */
export const LOCK_MARGIN_MS = 60_000;
/** Closer than this to the lock an edit can't be trusted to land: refused at once, with a message. */
const LOCK_LATE_MS = 5_000;

export interface SendResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
  /** Only with `holdMs`: take the action back while it is still held (returns false once it was sent). */
  undo?: () => boolean;
  /** Only with `holdMs`: keep holding it (`null`: as long as allowed) or send it `ms` from now; returns the ms granted. */
  hold?: (ms: number | null) => number;
}

class WeekStore {
  view = $state<WeekView | null>(null);
  /** The reduced state behind `view` (きろく computes its history from it). Replaced, never mutated. */
  model = $state.raw<ComposedModel | null>(null);
  status = $state<'loading' | 'ready' | 'error' | 'unconfigured'>('loading');
  syncing = $state(false);
  offline = $state(false);
  lastSync = $state<Date | null>(null);
  demo = $state<DemoMode>(false);

  #cache: SnapshotCache | null = null;
  /** Demo: the session's events (never sent, never persisted), applied by the model like the live queue. */
  #demoEvents: QueuedEvent[] = [];
  /** Demo `?demo=harvest`: the harvest overlay over last week, until I drop it in. */
  #demoHarvested = false;
  /** Demo: which player this tab is (`?demo&as=B`). */
  #demoMe: PersonId = 'A';
  /**
   * Events the server acked but the cache hasn't fetched back yet. They stay in the view until the reconcile
   * refresh brings their rows; otherwise any recompute in between (the next tap) would undo them on screen.
   */
  #sent: QueuedEvent[] = [];
  #lastFetch = 0;
  /** Bumped per refresh; a response is applied only if no newer refresh started meanwhile. */
  #refreshSeq = 0;
  #retryTimer: ReturnType<typeof setTimeout> | null = null;
  #reconcileTimer: ReturnType<typeof setTimeout> | null = null;
  #stopClock: (() => void) | null = null;

  /** Read `?demo` / `?demo=harvest` once; it sticks for the tab session. */
  init(): void {
    const p = new URLSearchParams(location.search);
    if (p.has('demo')) {
      const mode: DemoMode = p.get('demo') === 'harvest' ? 'harvest' : 'plain';
      sessionStorage.setItem('demo', mode);
      sessionStorage.setItem('demo-as', p.get('as') === 'B' ? 'B' : 'A');
      this.demo = mode;
      this.view = null;
    } else {
      const s = sessionStorage.getItem('demo');
      if (s === 'plain' || s === 'harvest') this.demo = s;
    }
    if (!this.demo && dev && !import.meta.env.VITE_GAS_URL) {
      console.info('[island] VITE_GAS_URL not set in dev — using fixtures');
      this.demo = 'plain';
    }
    // A build without the Apps Script URL (the Pages site before GAS_URL is set): a friendly screen, not errors.
    if (!this.demo && !GAS_CONFIGURED) this.status = 'unconfigured';
    if (this.demo) this.#demoMe = sessionStorage.getItem('demo-as') === 'B' ? 'B' : 'A';
  }

  /** Recompute the view from the cache + queue (cheap: pure, a few ms). */
  #recompute(): void {
    if (!this.#cache) return;
    if (!this.demo) this.#sent = notInCache(this.#cache, this.#sent);
    const q = this.demo ? [] : queued();
    const m = composeModel(this.#cache, this.demo ? this.#demoEvents : [...this.#sent, ...q], Date.now(), new Set(q.map((e) => e.id)));
    const v = buildWeekView(m.state, m.me, m.now);
    if (this.demo === 'harvest' && !v.harvest) v.harvest = this.#demoHarvest(m, v);
    this.model = m;
    this.view = v;
    setLocale(v.locale);
  }

  /** The demo's taps of today (both players), oldest first. */
  #loadDemoEvents(): QueuedEvent[] {
    try {
      const raw = JSON.parse(localStorage.getItem(DEMO_EVENTS) ?? 'null') as { day: string; events: QueuedEvent[] } | null;
      return raw && raw.day === new Date().toDateString() ? raw.events : [];
    } catch {
      return [];
    }
  }

  #saveDemoEvents(): void {
    try {
      localStorage.setItem(DEMO_EVENTS, JSON.stringify({ day: new Date().toDateString(), events: this.#demoEvents }));
    } catch {
      /* private mode: the demo still works in memory */
    }
  }

  /** `?demo=harvest` shows last week's harvest whatever the day (the model opens it only from Sunday 19:30). */
  #demoHarvest(m: ComposedModel, v: WeekView): WeekView['harvest'] {
    const wk = addDays(v.weekKey, -7);
    const payout = payoutAsOf(m.state, wk, Infinity).payout;
    return { weekKey: wk, payout, rungsReached: [], confirmedBy: this.#demoHarvested ? [v.me] : [] };
  }

  #start(): void {
    if (this.#stopClock) return;
    // The view depends on the clock (harvest opens Sunday 19:30, "today", the host's line): recompute at each new minute.
    this.#stopClock = $effect.root(() => {
      let first = true;
      $effect(() => {
        minuteNow();
        if (first) first = false;
        else untrack(() => this.#recompute());
      });
    });
    if (!this.demo) addEventListener('online', () => void this.refresh());
  }

  /** Paint from cache, then flush queued writes and fetch new rows. `background` refreshes respect a 30 s floor. */
  async refresh(opts: { background?: boolean } = {}): Promise<void> {
    if (this.demo) {
      if (!this.#cache) {
        // Loaded only in the demo, so live users never download the generator (round 7 L1).
        const { demoCache } = await import('./demoRows.ts');
        if (this.#cache) return this.refresh(); // a concurrent call got there first
        this.#cache = demoCache(Date.now(), this.#demoMe);
        this.#demoEvents = this.#loadDemoEvents();
        addEventListener('storage', (e) => {
          if (e.key !== DEMO_EVENTS) return;
          this.#demoEvents = this.#loadDemoEvents();
          this.#recompute();
        });
      }
      this.#recompute();
      this.#start();
      this.status = 'ready';
      this.lastSync = new Date();
      return;
    }
    if (this.status === 'unconfigured') return;
    if (!getKey() || keyFromHash(location.hash)) {
      // Not paired yet, or opened from a `#key=…` link: the pair page takes it from here (and keeps the hash).
      this.status = 'ready';
      await goto(resolve('/pair') + (keyFromHash(location.hash) ? location.hash : ''));
      return;
    }
    this.#start();
    if (!this.#cache) {
      this.#cache = loadCache();
      if (this.#cache) {
        this.#recompute();
        this.status = 'ready';
        this.lastSync = new Date(this.#cache.fetchedAt);
      }
    }
    if (opts.background && Date.now() - this.#lastFetch < REFRESH_FLOOR_MS) return;
    this.#lastFetch = Date.now();
    const seq = ++this.#refreshSeq;
    this.syncing = true;
    await this.#flush(false);
    const r = await refreshSnapshot();
    if (seq !== this.#refreshSeq) return; // a newer refresh owns the view (and `syncing`)
    this.syncing = false;
    if (r.ok) {
      this.#noteRefused(r.cache);
      this.#cache = r.cache;
      this.offline = false;
      this.lastSync = new Date();
      this.status = 'ready';
      this.#recompute();
      return;
    }
    if (r.error === 'unauthorized') {
      this.status = 'ready';
      await goto(resolve('/pair'));
      return;
    }
    if (this.view) this.offline = true;
    else this.status = 'error';
  }

  /** Forget the cached state (after pairing as someone else). */
  reset(): void {
    this.#cache = null;
    this.#sent = [];
    this.view = null;
    this.model = null;
    this.status = 'loading';
    this.#lastFetch = 0;
  }

  /**
   * Queue an event and show it at once (the model applies it like the server will; the demo keeps its events in
   * memory and never sends them). Never fails for network reasons: the queue retries until the server acks.
   * `holdMs`: an undo window. The change shows at once but is not sent before then; `undo()` takes back only this
   * event, not others made in the window (review r2 N4).
   */
  send<T = unknown>(type: EventType, data: Record<string, unknown>, opts: { holdMs?: number; lockAt?: number } = {}): Promise<SendResult<T>> {
    let holdMs = opts.holdMs ?? 0;
    const lockAt = opts.lockAt;
    if (lockAt !== undefined && !this.demo) {
      // An edit of a week that locks: it must reach the server before the lock (round 7 M1). Too close → refused
      // now; close → its undo window shrinks (to none) so it is sent in time.
      const left = lockAt - (this.#cache?.skewMs ?? 0) - Date.now();
      if (left < LOCK_LATE_MS) {
        toasts.show(t('kiroku.lockedNow'), 4000, { reaction: 'sheepishness' });
        return Promise.resolve({ ok: false, status: 409, data: null });
      }
      holdMs = Math.max(0, Math.min(holdMs, left - LOCK_MARGIN_MS));
    }
    const held = holdMs > 0;
    if (this.demo) {
      const now = Date.now();
      const ev: QueuedEvent = { id: `demo-${now.toString(36)}-${this.#demoEvents.length}`, type, data, queuedAt: now, tries: 0, nextAt: now, person: this.#demoMe };
      this.#demoEvents.push(ev);
      this.#saveDemoEvents();
      if (type === 'harvest') this.#demoHarvested = true;
      this.#recompute();
      const undo = () => {
        const i = this.#demoEvents.indexOf(ev);
        if (i < 0) return false;
        this.#demoEvents.splice(i, 1);
        this.#saveDemoEvents();
        this.#recompute();
        return true;
      };
      return Promise.resolve({ ok: true, status: 200, data: null, ...(held ? { undo, hold: (ms: number | null) => ms ?? HOLD_MAX_MS } : {}) });
    }
    const ev = enqueue(type, data, Date.now(), holdMs, lockAt);
    this.#recompute();
    void this.#flush(true);
    const undo = () => {
      const ok = unqueue(ev.id);
      if (ok) this.#recompute();
      return ok;
    };
    /** Hold it (capped at HOLD_MAX_MS, and so that it still lands before its lock); returns the ms granted. */
    const hold = (ms: number | null) => {
      const now = Date.now();
      let until = now + (ms ?? HOLD_MAX_MS);
      if (lockAt !== undefined) until = Math.min(until, lockAt - (this.#cache?.skewMs ?? 0) - LOCK_MARGIN_MS);
      until = Math.max(now, until);
      if (!holdEvent(ev.id, until)) return 0;
      this.#scheduleRetry();
      return until - now;
    };
    return Promise.resolve({ ok: true, status: 200, data: null, ...(held ? { undo, hold } : {}) });
  }

  async #flush(reconcile: boolean): Promise<void> {
    if (this.#retryTimer) clearTimeout(this.#retryTimer);
    this.#retryTimer = null;
    const skew = this.#cache?.skewMs ?? 0;
    const r = await flush(Date.now, (ev, t) => missesLock(ev, t, skew));
    if (r.expired.length) {
      toasts.show(t('kiroku.missedLock'), 5000, { reaction: 'sheepishness' });
      this.#recompute();
    }
    // Only events the server acked stay on screen until the snapshot has them. An event that left the
    // queue because it was undone mid-flush must not come back (review r2 N1).
    const known = new Set(this.#sent.map((e) => e.id));
    this.#sent.push(...r.acked.filter((e) => !known.has(e.id)));
    if (r.dropped.length) {
      toasts.show(t('state.saveFailed'), undefined, { code: 'save-failed', reaction: 'sheepishness' });
      this.#recompute();
    }
    if (r.error === 'unauthorized') {
      await goto(resolve('/pair'));
      return;
    }
    if (r.error) this.offline = true;
    if (r.sent > 0 && reconcile) {
      if (this.#reconcileTimer) clearTimeout(this.#reconcileTimer);
      this.#reconcileTimer = setTimeout(() => void this.refresh(), RECONCILE_MS);
    }
    if (r.remaining > 0) this.#scheduleRetry();
  }

  /**
   * After a fetch: an acked edit whose server row is stamped at or after its lock was refused by the model. Say so
   * (it disappears from the screen with this refresh) instead of letting it vanish silently (round 7 M1).
   */
  #noteRefused(cache: SnapshotCache): void {
    const late = this.#sent.filter((e) => e.lockAt !== undefined);
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

export const week = new WeekStore();
