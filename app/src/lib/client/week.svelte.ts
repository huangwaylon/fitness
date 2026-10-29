// Client-side week store. Paints at once from the cached snapshot + queued (unsent) events, computing the WeekView in
// the browser (lib/model), then syncs in the background: flush the write queue, fetch rows `since` the last seen
// server time, recompute. `?demo` (or dev without VITE_GAS_URL) uses fixtures.
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { dev } from '$app/env';
import type { PersonWeekView, WeekView } from '#lib/types.ts';
import type { EventType } from '#lib/ingest/sheet-api.ts';
import { GAS_CONFIGURED, enqueue, flush, getKey, holdEvent, keyFromHash, loadCache, nextRetryAt, queued, refreshSnapshot, unqueue, type QueuedEvent, type SnapshotCache } from './gas.ts';
import { composeView, notInCache } from './view.ts';
import { sampleWeek } from './fixtures.ts';
import { setLocale, t } from '#lib/i18n/index.ts';

type DemoMode = false | 'plain' | 'harvest';

/** Background refreshes (app becoming visible) at most this often. */
const REFRESH_FLOOR_MS = 30_000;
/** After acked writes, re-read the server so its timestamps replace the optimistic ones. */
const RECONCILE_MS = 1500;
/** A banner held open (hover/focus) keeps its action unsent for at most this long. */
const HOLD_MAX_MS = 10 * 60_000;

export interface SendResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
  /** Only with `holdMs`: take the action back while it is still held (returns false once it was sent). */
  undo?: () => boolean;
  /** Only with `holdMs`: keep holding it (`null`: until called again) or send it `ms` from now. */
  hold?: (ms: number | null) => void;
}

export interface Toast {
  text: string;
  id: number;
  /** A button on the banner, e.g. 取り消す (undo). */
  action?: { label: string; run: () => void };
  /** Official reaction icon on the banner (`reactions/<id>`). */
  reaction?: string;
  /** What happened, for code that reacts to a banner (never match on the translated text; review P9). */
  code?: 'save-failed';
  /** The banner was paused (`null`) or resumed with `ms` left: keep the action's undo window in step. */
  hold?: (ms: number | null) => void;
}

class WeekStore {
  view = $state<WeekView | null>(null);
  status = $state<'loading' | 'ready' | 'error' | 'unconfigured'>('loading');
  syncing = $state(false);
  offline = $state(false);
  lastSync = $state<Date | null>(null);
  demo = $state<DemoMode>(false);
  toast = $state<Toast | null>(null);

  #cache: SnapshotCache | null = null;
  /**
   * Events the server acked but the cache hasn't fetched back yet. They stay in the view until the reconcile
   * refresh brings their rows; otherwise any recompute in between (the next tap) would undo them on screen.
   */
  #sent: QueuedEvent[] = [];
  #lastFetch = 0;
  /** Bumped per refresh; a response is applied only if no newer refresh started meanwhile. */
  #refreshSeq = 0;
  #toastTimer: ReturnType<typeof setTimeout> | null = null;
  #retryTimer: ReturnType<typeof setTimeout> | null = null;
  #reconcileTimer: ReturnType<typeof setTimeout> | null = null;
  #clock: ReturnType<typeof setInterval> | null = null;

  /** Read `?demo` / `?demo=harvest` once; it sticks for the tab session. */
  init(): void {
    const p = new URLSearchParams(location.search);
    if (p.has('demo')) {
      const mode: DemoMode = p.get('demo') === 'harvest' ? 'harvest' : 'plain';
      sessionStorage.setItem('demo', mode);
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
  }

  get me(): PersonWeekView | null {
    return this.view ? this.view.people[this.view.me] : null;
  }
  get partner(): PersonWeekView | null {
    return this.view ? this.view.people[this.view.partner] : null;
  }

  /** Recompute the view from the cache + queue (cheap: pure, a few ms). */
  #recompute(): void {
    if (!this.#cache) return;
    this.#sent = notInCache(this.#cache, this.#sent);
    this.view = composeView(this.#cache, [...this.#sent, ...queued()], Date.now());
    setLocale(this.view.locale);
  }

  #start(): void {
    if (this.#clock) return;
    // The view depends on the clock (harvest opens Sunday 19:30, "today", the host's line).
    this.#clock = setInterval(() => this.#recompute(), 60_000);
    addEventListener('online', () => void this.refresh());
  }

  /** Paint from cache, then flush queued writes and fetch new rows. `background` refreshes respect a 30 s floor. */
  async refresh(opts: { background?: boolean } = {}): Promise<void> {
    if (this.demo) {
      if (!this.view) this.view = sampleWeek({ harvest: this.demo === 'harvest' });
      this.status = 'ready';
      this.lastSync = new Date();
      setLocale(this.view.locale);
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
    this.status = 'loading';
    this.#lastFetch = 0;
  }

  /**
   * Queue an event and show it at once (the model applies it like the server will). In demo mode `optimistic` edits
   * the fixture view instead. Never fails for network reasons: the queue retries until the server acks.
   * `holdMs`: an undo window. The change shows at once but is not sent before then; `undo()` takes it back.
   * `revert` (demo): the inverse of `optimistic`, so an undo takes back only this action, not others made in the
   * window (review r2 N4).
   */
  send<T = unknown>(type: EventType, data: Record<string, unknown>, optimistic?: (v: WeekView) => void, opts: { holdMs?: number; revert?: (v: WeekView) => void } = {}): Promise<SendResult<T>> {
    const held = (opts.holdMs ?? 0) > 0;
    if (this.demo) {
      if (optimistic && this.view) optimistic(this.view);
      let undone = false;
      const undo = () => {
        if (undone || !opts.revert || !this.view) return false;
        undone = true;
        opts.revert(this.view);
        return true;
      };
      return Promise.resolve({ ok: true, status: 200, data: null, ...(held ? { undo, hold: () => {} } : {}) });
    }
    const ev = enqueue(type, data, Date.now(), opts.holdMs ?? 0);
    this.#recompute();
    void this.#flush(true);
    const undo = () => {
      const ok = unqueue(ev.id);
      if (ok) this.#recompute();
      return ok;
    };
    const hold = (ms: number | null) => {
      if (!holdEvent(ev.id, ms === null ? Date.now() + HOLD_MAX_MS : Date.now() + ms)) return;
      if (ms !== null) this.#scheduleRetry();
    };
    return Promise.resolve({ ok: true, status: 200, data: null, ...(held ? { undo, hold } : {}) });
  }

  async #flush(reconcile: boolean): Promise<void> {
    if (this.#retryTimer) clearTimeout(this.#retryTimer);
    this.#retryTimer = null;
    const r = await flush();
    // Only events the server acked stay on screen until the snapshot has them. An event that left the
    // queue because it was undone mid-flush must not come back (review r2 N1).
    const known = new Set(this.#sent.map((e) => e.id));
    this.#sent.push(...r.acked.filter((e) => !known.has(e.id)));
    if (r.dropped.length) {
      this.showToast(t('state.saveFailed'), undefined, { code: 'save-failed', reaction: 'sheepishness' });
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

  /** Wake the queue when its next event is due (a backoff, or the end of an undo window). */
  #scheduleRetry(): void {
    if (this.#retryTimer) clearTimeout(this.#retryTimer);
    this.#retryTimer = null;
    const next = nextRetryAt();
    if (next === null) return;
    this.#retryTimer = setTimeout(() => void this.#flush(true), Math.max(250, next - Date.now()));
  }

  showToast(text: string, ms = 2600, opts: Pick<Toast, 'action' | 'reaction' | 'code' | 'hold'> = {}): void {
    if (this.#toastPaused) this.toast?.hold?.(0); // its banner is gone, so its undo is too: send it
    const toast: Toast = { text, id: Date.now(), ...opts };
    this.toast = toast;
    this.#toastPaused = false;
    this.#armToast(toast, ms);
  }

  #toastPaused = false;
  #toastEndsAt = 0;
  #armToast(toast: Toast, ms: number): void {
    if (this.#toastTimer) clearTimeout(this.#toastTimer);
    this.#toastEndsAt = Date.now() + ms;
    this.#toastTimer = setTimeout(() => this.toast?.id === toast.id && (this.toast = null), ms);
  }

  /**
   * Hold the banner while it is hovered or focused (WCAG 2.2.1, review r2 N7): its undo stays available as long
   * as the person is on it. With an undo it also holds back the send (the undo window is the banner's life).
   */
  pauseToast(): void {
    if (!this.toast || this.#toastPaused) return;
    this.#toastPaused = true;
    if (this.#toastTimer) clearTimeout(this.#toastTimer);
    this.#toastTimer = null;
    this.toast.hold?.(null);
  }

  /** Resume after hover/focus leaves: at least 2 s more, so it never vanishes the moment you look away. */
  resumeToast(): void {
    const toast = this.toast;
    if (!toast || !this.#toastPaused) return;
    this.#toastPaused = false;
    const ms = Math.max(2000, this.#toastEndsAt - Date.now());
    toast.hold?.(ms);
    this.#armToast(toast, ms);
  }

  dismissToast(): void {
    if (this.#toastTimer) clearTimeout(this.#toastTimer);
    if (this.#toastPaused) this.toast?.hold?.(0); // dismissed while held: it's accepted, send it now
    this.#toastPaused = false;
    this.toast = null;
  }
}

export const week = new WeekStore();
