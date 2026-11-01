// The shared island's day on this phone (docs/backend.md#shared-world): today's WorldDay (sync/world-day.ts) folded
// from my own changes as I make them, the partner's over the relay (live, or replayed when this phone opens), and the
// sheet's day rows. The island reads it to leave out what's caught or taken and to lay out what's put down, and
// listens for the partner's news to play it (their villager walks over and nets the bug). Kept in localStorage for the
// day, so a reload needs nothing from the relay but what's new (sync/live.ts keeps its `since` beside it).
//   world.attach(relay, me)      the relay in use (the phone's one socket, or the demo's tabs), and who I am
//   world.share(intent)          a change of mine: folded, kept, sent; returns what folding it did
//   world.on(fn)                 the partner's changes (`live`: it just happened: play it)
//   world.day                    today's WorldDay (reactive through `world.rev`)
import { emptyDay, apply, type Applied, type Claim, type DayEvent, type WorldDay } from '#lib/sync/world-day.ts';
import { tokyoDay, type Intent, type Relayed, type Who } from '#lib/sync/live-protocol.ts';
import type { Live } from '#lib/sync/live.ts';
import { DEMO, LIVE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
import { now } from '#lib/time/clock.ts';

/** A partner's change this recent is played as it happens (their villager walks over and does it); older (a
 *  replay when this phone opens) it only changes the island. */
const LIVE_MS = 12_000;
/** Kept for a day: at most this many changes. */
const MAX = 600;

interface WorldNews {
  e: DayEvent;
  /** It happened just now: play it. */
  live: boolean;
  /** My own claim of the same thing it overrides (the relay heard theirs first), if any. */
  beat: Claim | null;
}

type Shared = Extract<Intent, { kind: DayEvent['kind'] }>;
const KINDS = new Set<string>(['catch', 'pick', 'put', 'shake', 'world', 'walk', 'act']);
const isDayEvent = (m: Relayed): m is Relayed & DayEvent => KINDS.has(m.kind);

class SharedWorld {
  /** Bumped at every change (read it to re-derive from `day`). */
  rev = $state(0);
  #day: WorldDay | null = null;
  #events: DayEvent[] = [];
  #relay: Live | null = null;
  #off: (() => void) | null = null;
  #me: Who | null = null;
  #demo = false;
  #subs = new Set<(n: WorldNews) => void>();

  /** The island's clock on the relay's (a `?date=` preview moves it; the relay's offset from the pings). */
  now(): number {
    const r = this.#relay;
    return now().getTime() + (r ? r.serverNow() - Date.now() : 0);
  }

  /** Today's day (a new Tokyo day starts empty). */
  get day(): WorldDay {
    void this.rev;
    return this.#today();
  }

  get me(): Who | null {
    return this.#me;
  }

  #key(): string {
    // the demo's two players are two tabs of one browser: one record each
    return this.#demo ? `${DEMO.world}.${this.#me ?? 'A'}` : LIVE.world;
  }

  #today(): WorldDay {
    const today = tokyoDay(this.now());
    if (this.#day?.day === today) return this.#day;
    // first look today: what this phone kept of it
    const kept = readJson<{ day?: number; events?: DayEvent[] }>(localKV(), this.#key());
    const d = emptyDay(today);
    this.#events = kept?.day === today && Array.isArray(kept.events) ? kept.events : [];
    for (const e of this.#events) apply(d, e, this.#me);
    this.#day = d;
    return d;
  }

  /** Use `relay` (null: none, alone) as `me`; `demo`: the demo's own keys. Replaces an earlier one. */
  attach(relay: Live | null, me: Who | null, demo = false): void {
    if (relay === this.#relay && me === this.#me && demo === this.#demo) return;
    this.#off?.();
    this.#off = null;
    if (demo !== this.#demo || me !== this.#me) this.#day = null;
    this.#relay = relay;
    this.#me = me;
    this.#demo = demo;
    if (relay) this.#off = relay.on((m) => this.#heard(m));
    this.rev++;
  }

  #keep(e: DayEvent): void {
    this.#events = [...this.#events, e].slice(-MAX);
    writeJson(localKV(), this.#key(), { day: this.#day!.day, events: this.#events });
  }

  #heard(m: Relayed): void {
    if (!isDayEvent(m) || m.who === this.#me) return;
    const { v: _v, ...e } = m;
    const d = this.#today();
    const a: Applied = apply(d, e, this.#me);
    // an act is only played; anything else that changed nothing (a replay of what I have) is news to nobody
    if (e.kind !== 'act') {
      if (!a.fresh) return;
      this.#keep(e);
      this.rev++;
    }
    const n: WorldNews = { e, live: this.now() - e.t < LIVE_MS, beat: a.beat };
    for (const f of this.#subs) {
      try {
        f(n);
      } catch (err) {
        console.error('world:', err);
      }
    }
  }

  /** A change of mine: folded into the day (first wins: a thing the partner already has stays theirs, `fresh` false),
   *  kept, and sent (the relay keeps it for the partner, or tells them now). */
  share(i: Shared): Applied {
    const me = this.#me ?? 'A';
    const e = { ...i, who: me, t: this.now() } as DayEvent;
    const d = this.#today();
    const a = apply(d, e, this.#me);
    if (e.kind === 'act' || a.fresh) {
      if (e.kind !== 'act') {
        this.#keep(e);
        this.rev++;
      }
      this.#relay?.send(i);
    }
    return a;
  }

  /** The partner's changes as they arrive (and the day's when this phone opens: not `live`). */
  on(fn: (n: WorldNews) => void): () => void {
    this.#subs.add(fn);
    return () => void this.#subs.delete(fn);
  }

  /** Forget the day (tests). */
  reset(): void {
    this.#off?.();
    this.#off = null;
    this.#relay = null;
    this.#me = null;
    this.#day = null;
    this.#events = [];
    this.#subs.clear();
    this.rev++;
  }
}

/** The island's shared day: one per phone. */
export const world = new SharedWorld();
