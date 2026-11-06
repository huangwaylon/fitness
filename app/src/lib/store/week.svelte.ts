// The week store. Paints at once from the backend's rows + events, computing the WeekView in the browser
// (lib/model), and recomputes when they change or the minute ticks. The backend is the live sync with the relay's
// record (live.ts) or, with `?demo` (or dev without VITE_RECORD_URL), generated rows (demo/backend.ts, loaded only then).
import { untrack } from 'svelte';
import { dev } from '$app/env';
import type { WeekView, Who } from '#lib/types.ts';
import type { EventType } from '#lib/contract/api.ts';
import { guestMayWrite } from '#lib/contract/guest.ts';
import { buildWeekView } from '#lib/model/week.ts';
import { setLocale } from '#lib/i18n/index.ts';
import { minuteNow } from '#lib/time/clock.ts';
import { setWeddingSource } from '#lib/time/holidays.ts';
import { wedBookOf, wedDate } from '#lib/contract/wedding.ts';
import { DEMO, DEVICE, getStoredMe, localKV, readJson, sessionKV, writeJson, writeRaw } from '#lib/sync/storage.ts';
import { RECORD_CONFIGURED } from '#lib/sync/transport.ts';
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

  /** This phone is the guest's (docs/design.md "The guest"): paired with KEY_C, or the demo's `as=G`. */
  get guest(): boolean {
    return this.view ? this.view.viewer === 'G' : this.demo ? this.#demoMe === 'G' : getStoredMe() === 'G';
  }

  #backend: Backend | null = null;
  #loadingBackend: Promise<Backend> | null = null;
  #demoMe: Who = 'A';
  #stopClock: (() => void) | null = null;

  /** Read `?demo` / `?demo=harvest` once; it sticks for the tab session. */
  init(): void {
    const p = new URLSearchParams(location.search);
    const ss = sessionKV();
    if (p.has('demo')) {
      const mode: DemoMode = p.get('demo') === 'harvest' ? 'harvest' : 'plain';
      writeRaw(ss, DEMO.mode, mode);
      // `as=B`: うめ's phone; `as=G`: the guest's (docs/design.md "The guest")
      writeRaw(ss, DEMO.as, p.get('as') === 'B' ? 'B' : p.get('as') === 'G' ? 'G' : 'A');
      writeRaw(ss, DEMO.weeks, p.get('weeks') ?? '');
      writeRaw(ss, DEMO.health, p.get('health') ?? '');
      this.demo = mode;
      this.view = null;
    } else {
      const s = ss?.getItem(DEMO.mode);
      if (s === 'plain' || s === 'harvest') this.demo = s;
    }
    if (!this.demo && dev && !import.meta.env.VITE_RECORD_URL) {
      console.info('[island] VITE_RECORD_URL not set in dev — using fixtures');
      this.demo = 'plain';
    }
    // A build without the record's URL (VITE_LIVE_URL and VITE_RECORD_URL both emptied): a friendly screen, not errors.
    if (!this.demo && !RECORD_CONFIGURED) this.status = 'unconfigured';
    if (this.demo) {
      const as = ss?.getItem(DEMO.as);
      this.#demoMe = as === 'B' ? 'B' : as === 'G' ? 'G' : 'A';
    }
  }

  /** The backend for this tab (the demo's is loaded only in the demo, so live users never download it). */
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
    const m = composeModel(cache, b.events(), b.now?.() ?? Date.now(), untrack(() => this.model));
    const v = buildWeekView(m.state, m.me, m.now);
    b.decorate?.(m, v);
    this.model = m;
    this.view = v;
    setLocale(v.locale);
    if (readJson(localKV(), DEVICE.locale) !== v.locale) writeJson(localKV(), DEVICE.locale, v.locale);
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
  /** Several events at once (a burst: the editor's save), as `send` each but one queue write and one recompute. */
  sendMany(type: EventType, datas: readonly Record<string, unknown>[]): void {
    const ok = this.guest ? datas.filter((d) => guestMayWrite(type, d)) : datas;
    const b = this.#backend ?? (this.demo ? null : (this.#getBackend() as Backend));
    if (!b || !ok.length) return;
    if (b.sendMany) b.sendMany(ok.map((data) => ({ type, data })));
    else for (const data of ok) b.send(type, data, {});
  }

  send(type: EventType, data: Record<string, unknown>, opts: SendOptions = {}): SendResult {
    // the guest's phone sends only what the record takes from it (its finds, tallies, the tent, its look): the rest
    // would be refused `forbidden` (contract/guest.ts), so it never leaves the phone or shows
    if (this.guest && !guestMayWrite(type, data)) return { ok: false };
    const b = this.#backend ?? (this.demo ? null : (this.#getBackend() as Backend));
    if (!b) return { ok: false }; // the demo is still loading: nothing on screen to act on yet
    return b.send(type, data, opts);
  }
}

export const week = new WeekStore();

// the wedding day: the board's `date` setting in the model's rows (the guest's too), read wherever the island, its
// music and the board ask (time/holidays.ts weddingDate; 2027-10-08 until the record has one)
setWeddingSource(() => {
  const rows = week.model?.state.wedding;
  return rows ? wedDate(wedBookOf(rows)) : '';
});
