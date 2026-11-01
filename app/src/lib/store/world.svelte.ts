// The shared island's day on this phone (docs/backend.md#shared-world): today's WorldDay (sync/world-day.ts) folded
// from my own changes as I make them, the partner's over the relay (live, or replayed when this phone opens), and the
// sheet's day rows. The island reads it to leave out what's caught or taken and to lay out what's put down, and
// listens for the partner's news to play it (their villager walks over and nets the bug). Kept in localStorage for the
// day, so a reload needs nothing from the relay but what's new (sync/live.ts keeps its `since` beside it).
//   world.attach(relay, me)      the relay in use (the phone's one socket, or the demo's tabs), and who I am
//   world.share(intent)          a change of mine: folded, kept, sent; returns what folding it did
//   world.on(fn)                 the partner's changes (`live`: it just happened: play it)
//   world.day                    today's WorldDay (reactive through `world.rev`)
import { emptyDay, apply, applyRow, rowOf, type Applied, type Claim, type DayEvent, type DayRow, type WorldDay } from '#lib/sync/world-day.ts';
import { tokyoDay, type Intent, type Relayed, type Who } from '#lib/sync/live-protocol.ts';
import type { Live } from '#lib/sync/live.ts';
import { DEMO, LIVE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
import { dayKey, now } from '#lib/time/clock.ts';

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
  /** Wishes on shooting stars, kept past the day they were made in (each brings its fragment the next morning): the
   *  morning (YYYY-MM-DD) → who → how many. */
  #wishes: Record<string, Partial<Record<Who, number>>> | null = null;
  /** Yesterday's watered cells (both people's: tomorrow's hybrid flowers grow from them). */
  #prev: { day: number; watered: string[] } | null = null;
  /** Where my part of the day goes to the sheet (store/actions.ts sendIslandDay: held, one row per person and day). */
  #sink: ((date: string, row: DayRow) => void) | null = null;

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
    // first look today: what this phone kept of it (and of yesterday, its watered flowers)
    const kept = readJson<{ day?: number; events?: DayEvent[] }>(localKV(), this.#key());
    const prev = this.#day?.day === today - 1 ? this.#day : null;
    if (prev) this.#keepPrev(today - 1, Object.keys(prev.watered));
    else if (kept?.day === today - 1 && Array.isArray(kept.events)) {
      const y = emptyDay(today - 1);
      for (const e of kept.events) apply(y, e, this.#me);
      this.#keepPrev(today - 1, Object.keys(y.watered));
    }
    const d = emptyDay(today);
    this.#events = kept?.day === today && Array.isArray(kept.events) ? kept.events : [];
    for (const e of this.#events) apply(d, e, this.#me);
    this.#day = d;
    return d;
  }

  /** Use `relay` (null: none, alone) as `me`; `demo`: the demo's own keys. Replaces an earlier one. */
  attach(relay: Live | null, me: Who | null, demo = false): void {
    if (relay === this.#relay && me === this.#me && demo === this.#demo) return;
    if (this.#writing) this.#flush(); // the record being written is the old one's
    this.#off?.();
    this.#off = null;
    if (demo !== this.#demo || me !== this.#me) {
      this.#day = null;
      this.#wishes = null;
    }
    this.#relay = relay;
    this.#me = me;
    this.#demo = demo;
    if (relay) this.#off = relay.on((m) => this.#heard(m));
    this.rev++;
  }

  #prevKey(): string {
    return this.#demo ? `${DEMO.world}.prev.${this.#me ?? 'A'}` : LIVE.worldPrev;
  }
  #keepPrev(day: number, watered: string[]): void {
    const was = this.#readPrev();
    const all = was?.day === day ? [...new Set([...was.watered, ...watered])] : watered;
    this.#prev = { day, watered: all };
    writeJson(localKV(), this.#prevKey(), this.#prev);
  }
  #readPrev(): { day: number; watered: string[] } | null {
    if (this.#prev) return this.#prev;
    const p = readJson<{ day?: number; watered?: string[] }>(localKV(), this.#prevKey());
    return p && typeof p.day === 'number' && Array.isArray(p.watered) ? (this.#prev = { day: p.day, watered: p.watered }) : null;
  }

  /** Yesterday's watered cells, both people's (`A.0-1`: whose bed and the cell), for today's hybrids. */
  wateredYesterday(): string[] {
    void this.rev;
    const today = this.#today().day, p = this.#readPrev();
    return p?.day === today - 1 ? p.watered : [];
  }

  /** My part of the day goes to the sheet through `fn` (held: store/actions.ts sendIslandDay). */
  set sink(fn: ((date: string, row: DayRow) => void) | null) {
    this.#sink = fn;
  }

  /** The sheet's island days (model/state.ts islandDays, each person's latest by day): today's folded in (what the
   *  relay didn't bring: both apps were closed, an outage), yesterday's watering and wishes kept for today. */
  rows(rows: readonly { at: number; person: Who; data: DayRow & { date: string } }[]): void {
    const d = this.#today(), today = dayKey(now()), yesterday = dayKey(new Date(now().getTime() - 86_400_000));
    const latest = new Map<string, (typeof rows)[number]>();
    for (const r of rows) {
      if (r.data.date !== today && r.data.date !== yesterday) continue;
      const k = `${r.person}|${r.data.date}`, was = latest.get(k);
      if (!was || r.at >= was.at) latest.set(k, r);
    }
    let changed = false;
    for (const r of latest.values()) {
      if (r.data.date === today) {
        const before = JSON.stringify(d);
        applyRow(d, r.data, r.person, Math.min(r.at, this.now()), this.#me);
        changed ||= JSON.stringify(d) !== before;
      } else if (r.data.watered.length) {
        const p = this.#readPrev();
        if (!p || p.day !== d.day - 1 || r.data.watered.some((c) => !p.watered.includes(c))) {
          this.#keepPrev(d.day - 1, r.data.watered);
          changed = true;
        }
      }
      // wishes for the mornings to come (made yesterday evening for this morning, or today for tomorrow's)
      for (const [morning, n] of Object.entries(r.data.wishes)) {
        if (morning < today) continue;
        this.#wishes ??= readJson<Record<string, Partial<Record<Who, number>>>>(localKV(), this.#wishKey()) ?? {};
        const w = (this.#wishes[morning] ??= {});
        if ((w[r.person] ?? 0) < n) {
          w[r.person] = n;
          writeJson(localKV(), this.#wishKey(), this.#wishes);
          changed = true;
        }
      }
    }
    if (changed) this.rev++;
  }

  #wishKey(): string {
    return this.#demo ? `${DEMO.world}.wishes.${this.#me ?? 'A'}` : LIVE.wishes;
  }

  /** How many wishes `who` made for the morning of `date` (stars.ts: one fragment each). */
  wishesOf(who: Who, date: string): number {
    void this.rev;
    this.#wishes ??= readJson<Record<string, Partial<Record<Who, number>>>>(localKV(), this.#wishKey()) ?? {};
    return this.#wishes[date]?.[who] ?? 0;
  }

  /** A wish (mine or the partner's) noted for its morning; mornings gone by are dropped. */
  #noteWish(e: DayEvent): void {
    if (e.kind !== 'world' || e.op !== 'wished') return;
    const today = dayKey(now());
    const all = this.#wishes ?? readJson<Record<string, Partial<Record<Who, number>>>>(localKV(), this.#wishKey()) ?? {};
    const out: Record<string, Partial<Record<Who, number>>> = {};
    for (const [d, w] of Object.entries(all)) if (d >= today) out[d] = w;
    const w = (out[e.id] ??= {});
    w[e.who] = (w[e.who] ?? 0) + 1;
    this.#wishes = out;
    writeJson(localKV(), this.#wishKey(), out);
  }

  #keep(e: DayEvent): void {
    this.#noteWish(e);
    // a villager's walk replaces its person's last (only where it is going counts)
    if (e.kind === 'walk') this.#events = this.#events.filter((x) => !(x.kind === 'walk' && x.who === e.who));
    this.#events.push(e);
    if (this.#events.length > MAX) this.#events.splice(0, this.#events.length - MAX);
    // written once per burst (a replay of the day, a frame's changes), not once per change
    if (this.#writing) return;
    this.#writing = true;
    queueMicrotask(() => this.#flush());
  }
  #writing = false;
  #flush(): void {
    if (!this.#writing) return;
    this.#writing = false;
    if (this.#day) writeJson(localKV(), this.#key(), { day: this.#day.day, events: this.#events });
  }

  #heard(m: Relayed): void {
    if (!isDayEvent(m)) return;
    const { v: _v, ...e } = m;
    const d = this.#today();
    if (m.who === this.#me) {
      // my own, from the relay's replay (a phone that lost its record of the day): folded quietly, nothing to play
      if (e.kind !== 'act' && apply(d, e, this.#me).fresh) {
        this.#keep(e);
        this.rev++;
      }
      return;
    }
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
    const t = this.now();
    // a shake carries when it was shaken (its identity on both phones and in the sheet's row)
    if (i.kind === 'shake') i = { ...i, at: Math.round(t) };
    const e = { ...i, who: me, t } as DayEvent;
    const d = this.#today();
    const a = apply(d, e, this.#me);
    if (e.kind === 'act' || a.fresh) {
      // to the relay first, at once (the partner sees it within its one way); then kept, and the sheet's row (held)
      this.#relay?.send(i);
      if (e.kind !== 'act') {
        this.#keep(e);
        this.rev++;
        // the sheet keeps my part of the day (when the relay has nothing: both apps closed past its day); a walk's row
        // waits for the next change or the hold (where my villager stands is the relay's to carry)
        if (e.kind !== 'catch' && e.kind !== 'walk' && this.#me) this.#sink?.(dayKey(now()), rowOf(d, this.#me));
      }
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
    if (this.#writing) this.#flush();
    this.#off?.();
    this.#off = null;
    this.#relay = null;
    this.#me = null;
    this.#day = null;
    this.#wishes = null;
    this.#prev = null;
    this.#events = [];
    this.#subs.clear();
    this.rev++;
  }
}

/** The island's shared day: one per phone. */
export const world = new SharedWorld();
