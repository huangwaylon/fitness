// The demo backend (`?demo`, `?demo=harvest`, `?demo&as=B`): generated rows (rows.ts) and the session's taps, run
// through the same model as the live app. Nothing is sent. Its taps are kept under `island-demo.*` for the day,
// shared by both players' tabs; it never touches the live key, queue or cache. Loaded only in the demo.
import type { EventType } from '#lib/contract/api.ts';
import type { PersonId, WeekView } from '#lib/types.ts';
import { addDays } from '#lib/time/dates.ts';
import { harvestOf } from '#lib/model/week.ts';
import { weekBells } from '#lib/model/bells.ts';
import { DEMO, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
import type { QueuedEvent } from '#lib/sync/queue.ts';
import type { SnapshotCache } from '#lib/sync/cache.ts';
import { HOLD_MAX_MS, type Backend, type Host, type SendOptions, type SendResult } from '../backend.ts';
import type { ComposedModel } from '../view.ts';
import { demoCache } from './rows.ts';

export type DemoMode = 'plain' | 'harvest';

export class DemoBackend implements Backend {
  #host: Host;
  #mode: DemoMode;
  #me: PersonId;
  #cache: SnapshotCache | null = null;
  /** The session's events (never sent), applied by the model like the live queue. */
  #events: QueuedEvent[] = [];
  /** `?demo=harvest`: the harvest overlay over last week, until I drop it in. */
  #harvested = false;

  constructor(host: Host, mode: DemoMode, me: PersonId) {
    this.#host = host;
    this.#mode = mode;
    this.#me = me;
  }

  cache(): SnapshotCache | null {
    return this.#cache;
  }

  events(): { list: QueuedEvent[]; unsent: Set<string> } {
    return { list: this.#events, unsent: new Set() };
  }

  async refresh(): Promise<void> {
    if (!this.#cache) {
      this.#cache = demoCache(Date.now(), this.#me);
      this.#events = this.#load();
      globalThis.window?.addEventListener('storage', (e) => {
        if (e.key !== DEMO.events) return;
        this.#events = this.#load();
        this.#host.changed();
      });
    }
    this.#host.changed();
    this.#host.status = 'ready';
    this.#host.lastSync = new Date();
  }

  reset(): void {}

  send(type: EventType, data: Record<string, unknown>, opts: SendOptions): SendResult {
    const now = Date.now();
    const ev: QueuedEvent = { id: `demo-${now.toString(36)}-${this.#events.length}`, type, data, queuedAt: now, tries: 0, nextAt: now, person: this.#me };
    this.#events.push(ev);
    this.#save();
    if (type === 'harvest') this.#harvested = true;
    this.#host.changed();
    if (!(opts.holdMs && opts.holdMs > 0)) return { ok: true };
    const undo = () => {
      const i = this.#events.indexOf(ev);
      if (i < 0) return false;
      this.#events.splice(i, 1);
      this.#save();
      this.#host.changed();
      return true;
    };
    return { ok: true, undo, hold: (ms) => ms ?? HOLD_MAX_MS };
  }

  /** `?demo=harvest` shows last week's harvest whatever the day (the model opens it only from Sunday 19:30). */
  decorate(m: ComposedModel, v: WeekView): void {
    if (this.#mode !== 'harvest' || v.harvest) return;
    const wk = addDays(v.weekKey, -7);
    v.harvest = harvestOf(weekBells(m.state, wk, m.now), this.#harvested ? [v.me] : []);
  }

  /** The demo's taps of today (both players), oldest first. */
  #load(): QueuedEvent[] {
    const raw = readJson<{ day: string; events: QueuedEvent[] }>(localKV(), DEMO.events);
    return raw && raw.day === new Date().toDateString() && Array.isArray(raw.events) ? raw.events : [];
  }

  #save(): void {
    writeJson(localKV(), DEMO.events, { day: new Date().toDateString(), events: this.#events }); // full: it still works in memory
  }
}
