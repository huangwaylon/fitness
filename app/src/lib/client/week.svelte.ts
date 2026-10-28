// Client-side week store: loads GET /api/week, applies optimistic mutations, re-fetches after
// mutations and when the app becomes visible. Falls back to fixtures with `?demo` (or in dev
// when the API isn't there yet).
import { goto } from '$app/navigation';
import { dev } from '$app/env';
import type { PersonWeekView, WeekView } from '#lib/types.ts';
import { getJSON, postJSON, type ApiResult } from './api.ts';
import { sampleWeek } from './fixtures.ts';
import { setLocale, t } from '#lib/i18n/index.ts';

export type PendingSpend = WeekView['jar']['pendingSpends'][number];

type DemoMode = false | 'plain' | 'harvest';

class WeekStore {
  view = $state<WeekView | null>(null);
  status = $state<'loading' | 'ready' | 'error'>('loading');
  syncing = $state(false);
  offline = $state(false);
  lastSync = $state<Date | null>(null);
  demo = $state<DemoMode>(false);
  toast = $state<{ text: string; id: number } | null>(null);

  #refreshTimer: ReturnType<typeof setTimeout> | null = null;
  #toastTimer: ReturnType<typeof setTimeout> | null = null;

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
  }

  get me(): PersonWeekView | null {
    return this.view ? this.view.people[this.view.me] : null;
  }
  get partner(): PersonWeekView | null {
    return this.view ? this.view.people[this.view.partner] : null;
  }

  async refresh(): Promise<void> {
    if (this.demo) {
      if (!this.view) this.view = sampleWeek({ harvest: this.demo === 'harvest' });
      this.status = 'ready';
      this.lastSync = new Date();
      setLocale(this.view.locale);
      return;
    }
    this.syncing = true;
    const r = await getJSON<WeekView>('/api/week');
    this.syncing = false;
    if (r.status === 401) {
      this.status = 'ready';
      await goto('/pair');
      return;
    }
    if (r.ok && r.data) {
      this.view = r.data;
      this.status = 'ready';
      this.offline = false;
      this.lastSync = new Date();
      setLocale(r.data.locale);
      return;
    }
    if (dev && !this.view && (r.offline || r.status === 404 || r.status >= 500)) {
      console.info('[island] /api/week unavailable in dev — using fixtures');
      this.demo = 'plain';
      return this.refresh();
    }
    if (this.view) this.offline = true;
    else this.status = 'error';
  }

  /** Debounced reconcile after a burst of mutations. */
  scheduleRefresh(ms = 400): void {
    if (this.#refreshTimer) clearTimeout(this.#refreshTimer);
    this.#refreshTimer = setTimeout(() => this.refresh(), ms);
  }

  /**
   * POST a mutation. `optimistic` edits the view immediately; on failure the previous view is
   * restored. 409s are left to the caller (e.g. cozy_limit) without a generic toast.
   */
  async mutate<T = unknown>(path: string, body?: unknown, optimistic?: (v: WeekView) => void): Promise<ApiResult<T>> {
    const before = this.view ? ($state.snapshot(this.view) as WeekView) : null;
    if (optimistic && this.view) optimistic(this.view);
    if (this.demo) return { ok: true, status: 200, data: null };
    const r = await postJSON<T>(path, body);
    if (r.status === 401) {
      await goto('/pair');
      return r;
    }
    if (!r.ok) {
      if (before) this.view = before;
      if (r.status !== 409) this.showToast(t('state.saveFailed'));
      return r;
    }
    this.scheduleRefresh();
    return r;
  }

  showToast(text: string, ms = 2600): void {
    if (this.#toastTimer) clearTimeout(this.#toastTimer);
    this.toast = { text, id: Date.now() };
    this.#toastTimer = setTimeout(() => (this.toast = null), ms);
  }
}

export const week = new WeekStore();
