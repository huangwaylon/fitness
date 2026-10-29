// Client-side week store. Paints at once from the cached snapshot + queued (unsent) events, computing the WeekView in
// the browser (lib/model), then syncs in the background: flush the write queue, fetch rows `since` the last seen
// server time, recompute. `?demo` (or dev without VITE_GAS_URL) uses fixtures.
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { dev } from '$app/env';
import type { PersonWeekView, WeekView } from '#lib/types.ts';
import type { EventType } from '#lib/ingest/sheet-api.ts';
import { GAS_CONFIGURED, enqueue, flush, getKey, keyFromHash, loadCache, nextRetryAt, queued, refreshSnapshot, type SnapshotCache } from './gas.ts';
import { composeView } from './view.ts';
import { sampleWeek } from './fixtures.ts';
import { setLocale, t } from '#lib/i18n/index.ts';

type DemoMode = false | 'plain' | 'harvest';

/** Background refreshes (app becoming visible) at most this often. */
const REFRESH_FLOOR_MS = 30_000;
/** After acked writes, re-read the server so its timestamps replace the optimistic ones. */
const RECONCILE_MS = 1500;

export interface SendResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
}

class WeekStore {
  view = $state<WeekView | null>(null);
  status = $state<'loading' | 'ready' | 'error' | 'unconfigured'>('loading');
  syncing = $state(false);
  offline = $state(false);
  lastSync = $state<Date | null>(null);
  demo = $state<DemoMode>(false);
  toast = $state<{ text: string; id: number } | null>(null);

  #cache: SnapshotCache | null = null;
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
    this.view = composeView(this.#cache, queued(), Date.now());
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
    this.view = null;
    this.status = 'loading';
    this.#lastFetch = 0;
  }

  /**
   * Queue an event and show it at once (the model applies it like the server will). In demo mode `optimistic` edits
   * the fixture view instead. Never fails for network reasons: the queue retries until the server acks.
   */
  send<T = unknown>(type: EventType, data: Record<string, unknown>, optimistic?: (v: WeekView) => void): Promise<SendResult<T>> {
    if (this.demo) {
      if (optimistic && this.view) optimistic(this.view);
      return Promise.resolve({ ok: true, status: 200, data: null });
    }
    enqueue(type, data);
    this.#recompute();
    void this.#flush(true);
    return Promise.resolve({ ok: true, status: 200, data: null });
  }

  async #flush(reconcile: boolean): Promise<void> {
    if (this.#retryTimer) clearTimeout(this.#retryTimer);
    this.#retryTimer = null;
    const r = await flush();
    if (r.dropped.length) {
      this.showToast(t('state.saveFailed'));
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
    const next = nextRetryAt();
    if (next !== null && r.remaining > 0) {
      this.#retryTimer = setTimeout(() => void this.#flush(true), Math.max(1000, next - Date.now()));
    }
  }

  showToast(text: string, ms = 2600): void {
    if (this.#toastTimer) clearTimeout(this.#toastTimer);
    this.toast = { text, id: Date.now() };
    this.#toastTimer = setTimeout(() => (this.toast = null), ms);
  }
}

export const week = new WeekStore();
