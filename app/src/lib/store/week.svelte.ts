// The week store. Paints at once from the backend's rows + events, computing the WeekView in the browser
// (lib/model), and recomputes when they change or the minute ticks. The backend is the live Apps Script sync
// (live.ts) or, with `?demo` (or dev without VITE_GAS_URL), generated rows (demo/backend.ts, loaded only then).
import { untrack } from 'svelte';
import { dev } from '$app/env';
import type { WeekView } from '#lib/types.ts';
import type { EventType } from '#lib/contract/api.ts';
import { buildWeekView } from '#lib/model/week.ts';
import { setLocale } from '#lib/i18n/index.ts';
import { minuteNow } from '#lib/time/clock.ts';
import { DEMO, sessionKV, writeRaw } from '#lib/sync/storage.ts';
import { GAS_CONFIGURED } from '#lib/sync/transport.ts';
import { composeModel, type ComposedModel } from './view.ts';
import { LiveBackend } from './live.ts';
import type { Backend, Host, SendOptions, SendResult } from './backend.ts';
import type { DemoMode } from './demo/backend.ts';

class WeekStore implements Host {
  view = $state<WeekView | null>(null);
  /** The reduced state behind `view` (きろく computes its history from it). Replaced, never mutated. */
  model = $state.raw<ComposedModel | null>(null);
  status = $state<Host['status']>('loading');
  syncing = $state(false);
  offline = $state(false);
  lastSync = $state<Date | null>(null);
  demo = $state<false | DemoMode>(false);

  #backend: Backend | null = null;
  #loadingBackend: Promise<Backend> | null = null;
  #demoMe: 'A' | 'B' = 'A';
  #stopClock: (() => void) | null = null;

  /** Read `?demo` / `?demo=harvest` once; it sticks for the tab session. */
  init(): void {
    const p = new URLSearchParams(location.search);
    const ss = sessionKV();
    if (p.has('demo')) {
      const mode: DemoMode = p.get('demo') === 'harvest' ? 'harvest' : 'plain';
      writeRaw(ss, DEMO.mode, mode);
      writeRaw(ss, DEMO.as, p.get('as') === 'B' ? 'B' : 'A');
      this.demo = mode;
      this.view = null;
    } else {
      const s = ss?.getItem(DEMO.mode);
      if (s === 'plain' || s === 'harvest') this.demo = s;
    }
    if (!this.demo && dev && !import.meta.env.VITE_GAS_URL) {
      console.info('[island] VITE_GAS_URL not set in dev — using fixtures');
      this.demo = 'plain';
    }
    // A build without the Apps Script URL (the Pages site before GAS_URL is set): a friendly screen, not errors.
    if (!this.demo && !GAS_CONFIGURED) this.status = 'unconfigured';
    if (this.demo) this.#demoMe = ss?.getItem(DEMO.as) === 'B' ? 'B' : 'A';
  }

  /** The backend for this tab (the demo's is loaded only in the demo, so live users never download it: round 7 L1). */
  #getBackend(): Backend | Promise<Backend> {
    if (this.#backend) return this.#backend;
    const demo = this.demo;
    if (!demo) return (this.#backend = new LiveBackend(this));
    this.#loadingBackend ??= import('./demo/backend.ts').then(({ DemoBackend }) => (this.#backend ??= new DemoBackend(this, demo, this.#demoMe)));
    return this.#loadingBackend;
  }

  /** Recompute the view from the backend's rows + events (pure; the reduce is reused while they are unchanged). */
  changed(): void {
    const b = this.#backend;
    const cache = b?.cache();
    if (!b || !cache) return;
    const { list, unsent } = b.events();
    const m = composeModel(cache, list, Date.now(), unsent, untrack(() => this.model));
    const v = buildWeekView(m.state, m.me, m.now);
    b.decorate?.(m, v);
    this.model = m;
    this.view = v;
    setLocale(v.locale);
  }

  #start(): void {
    if (this.#stopClock) return;
    // The view depends on the clock (harvest opens Sunday 19:30, "today", the host's line): recompute at each new minute.
    this.#stopClock = $effect.root(() => {
      let first = true;
      $effect(() => {
        minuteNow();
        if (first) first = false;
        else untrack(() => this.changed());
      });
    });
  }

  /** Paint from cache, then flush queued writes and fetch new rows. `background` refreshes respect a 30 s floor. */
  async refresh(opts: { background?: boolean } = {}): Promise<void> {
    if (this.status === 'unconfigured') return;
    const b = await this.#getBackend();
    this.#start();
    await b.refresh(opts);
  }

  /** Drop the cached rows and fetch everything again (しまフォン → 通信; round 9 §2 item 4). */
  async resync(): Promise<void> {
    if (this.status === 'unconfigured') return;
    const b = await this.#getBackend();
    this.#start();
    await b.refresh({ full: true });
  }

  /** Forget the cached state (after pairing as someone else). */
  reset(): void {
    this.#backend?.reset();
    this.view = null;
    this.model = null;
    this.status = 'loading';
  }

  /**
   * Record an action and show it at once (the model applies it like the server will). Live: queued and retried
   * until the server acks; the demo keeps it and never sends it. `holdMs`: an undo window (see SendResult).
   */
  send(type: EventType, data: Record<string, unknown>, opts: SendOptions = {}): SendResult {
    const b = this.#backend ?? (this.demo ? null : (this.#getBackend() as Backend));
    if (!b) return { ok: false }; // the demo is still loading: nothing on screen to act on yet
    return b.send(type, data, opts);
  }
}

export const week = new WeekStore();
