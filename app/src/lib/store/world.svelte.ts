// The shared island's day on this phone (docs/backend.md#shared-world): today's WorldDay (sync/world-day.ts) folded
// from my own changes as I make them, the partner's over the relay (live, or replayed when this phone opens), and the
// sheet's day rows. The island reads it to leave out what's caught or taken and to lay out what's put down, and
// listens for the partner's news to play it (their villager walks over and nets the bug). Kept in localStorage for the
// day, so a reload needs nothing from the relay but what's new (sync/live.ts keeps its `since` beside it).
//   world.attach(relay, me)      the relay in use (the phone's one socket, or the demo's tabs), and who I am
//   world.share(intent)          a change of mine: folded, kept, sent; returns what folding it did
//   world.on(fn)                 the partner's changes (`live`: it just happened: play it)
//   world.tell(i) / world.hear(fn)   presence only (a line's step, `fish`): sent now, kept nowhere; the others', live;
//                                and the music stages (`music`: the room's records, mine too; sound/stage.svelte.ts)
//   world.onAck(fn)              each numbered intent of mine the room answered (a music stage's clamp)
//   world.onHere(fn)             who else is here now, and each change
//   world.day                    today's WorldDay (reactive through `world.rev`)
import { emptyDay, apply, applyRow, rowOf, type Applied, type Claim, type DayEvent, type DayRow, type WorldDay } from '#lib/sync/world-day.ts';
import { claimOf, tokyoDay, type Intent, type Relayed, type Who } from '#lib/contract/live-protocol.ts';
import type { Live } from '#lib/sync/live.ts';
import { DEMO, LIVE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
import { dayKey, now } from '#lib/time/clock.ts';
import { caught } from '#lib/quiet.ts';

/** A partner's change this recent is played as it happens (their villager walks over and does it); older (a
 *  replay when this phone opens) it only changes the island. */
const LIVE_MS = 12_000;
/** Kept for a day: at most this many changes. */
const MAX = 600;
/** A batch of mine goes to the relay at most this many a second (its bucket: relay/src/room.ts BURST 20, PER_SEC 20,
 *  over it `busy` and backoffs), the rest of the room's traffic (a walk, a catch) under it still. */
const DRIP = 15;

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

/** A sheet's island row (model/state.ts islandDays). */
type RecordRow = { at: number; person: Who; data: DayRow & { date: string } };

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
  /** The day the record's rows were last folded in from a fetch of this session (`rows`, `current`): my row is sent
   *  only after that (health A8, 2026-11-08: the record replaces a day's row whole, so a row rebuilt before the
   *  record's was read would erase claims a row of mine from another device or an earlier session holds). */
  #recordDay: string | null = null;
  /** My row changed before then: it goes once they are. */
  #rowWaits = false;
  /** The rows of that fold: the relay's midnight folds them again for its new day (the same record, read this session). */
  #recordRows: readonly RecordRow[] | null = null;

  /** The island's clock on the relay's (a `?date=` preview moves it; the relay's offset from the pings). */
  now(): number {
    const r = this.#relay;
    return now().getTime() + (r ? r.serverNow() - Date.now() : 0);
  }
  /** The Tokyo date (YYYY-MM-DD) on the island's clock (`by` ms on): the relay's, as its day is, never the device's. */
  #date(by = 0): string {
    return dayKey(new Date(this.now() + by));
  }
  /** The relay's own clock (a walk's `s`: never a `?date=` preview's). */
  serverNow(): number {
    return this.#relay?.serverNow() ?? Date.now();
  }

  /** Today's day (a new Tokyo day starts empty). */
  get day(): WorldDay {
    void this.rev;
    return this.#today();
  }

  get me(): Who | null {
    return this.#me;
  }
  /** The demo's own keys in use (store/actions.ts keeps its claims beside them). */
  get demo(): boolean {
    return this.#demo;
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
      this.#drip = []; // (another person's: never sent as this one)
    }
    this.#relay = relay;
    this.#me = me;
    this.#demo = demo;
    if (relay) {
      const off = [relay.on((m) => this.#heard(m)), relay.onStatus((st) => this.#here(st.connected ? (st.here ?? []) : [])), relay.onAck?.((i, ok, t) => this.#acked(i, ok, t)) ?? (() => {})];
      this.#off = () => off.forEach((f) => f());
    } else this.#here([]);
    this.rev++;
  }

  #hearSubs = new Set<(m: Relayed) => void>();
  #hereSubs = new Set<(here: readonly Who[]) => void>();
  #hereNow: readonly Who[] = [];
  #here(here: readonly Who[]): void {
    if (here.join() === this.#hereNow.join()) return;
    this.#hereNow = here;
    for (const f of this.#hereSubs) f(here);
  }
  /** A presence-only intent of mine (a line's step): to whoever is here now, kept nowhere; a music stage's record (the
   *  room keeps it). */
  tell(i: Extract<Intent, { kind: 'fish' | 'music' }>): boolean {
    return this.#relay?.send(i) ?? false;
  }
  /** The others' presence-only intents (a line's step), live; the music stages' records (mine too). */
  hear(fn: (m: Relayed) => void): () => void {
    this.#hearSubs.add(fn);
    return () => void this.#hearSubs.delete(fn);
  }
  /** Who else is here (called at once, then at each change; nobody while there's no relay). */
  onHere(fn: (here: readonly Who[]) => void): () => void {
    this.#hereSubs.add(fn);
    fn(this.#hereNow);
    return () => void this.#hereSubs.delete(fn);
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
  /** A race of mine lost (the relay heard the partner's claim first: their claim key, who, and whether it just
   *  happened): store/actions.ts lostRace takes back what my claim put in my pocket. */
  lost: ((claim: string, who: Who, live: boolean, kind: DayEvent['kind']) => void) | null = null;

  /** My part of today for the record (held: store/actions.ts sendIslandDay), once its rows are in (#recordDay). */
  #sendRow(): void {
    if (!this.#me || !this.#sink) return;
    const today = this.#date();
    if (this.#recordDay !== today) {
      this.#rowWaits = true;
      // the record read this session, before the relay's midnight: its new day is folded from the same rows (a phone's
      // own midnight, ahead or behind, never decides it)
      if (this.#recordRows) this.rows(this.#recordRows, true);
      return;
    }
    this.#rowWaits = false;
    this.#sink(today, rowOf(this.#today(), this.#me));
  }

  /** The sheet's island days (model/state.ts islandDays, each person's latest by day): today's folded in (what the
   *  relay didn't bring: both apps were closed, an outage), yesterday's watering and wishes kept for today. `current`:
   *  the rows are the record's as fetched this session (week.current), so my row may go now (#sendRow). */
  rows(rows: readonly RecordRow[], current = true): void {
    const d = this.#today(), today = this.#date(), yesterday = this.#date(-86_400_000);
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
    if (current) {
      // the session's first look at the record: my row goes if it holds what the record's copy lacks (a change made
      // before the record came, the app closed since: #rowWaits didn't survive the reload)
      const first = this.#recordDay !== today, me = this.#me;
      this.#recordDay = today;
      this.#recordRows = rows;
      if (this.#rowWaits || (first && me && rowLacks(latest.get(`${me}|${today}`)?.data, rowOf(d, me)))) this.#sendRow();
    }
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
    const today = this.#date();
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

  /** My own wishes heard back from the relay this session, by morning (see #heard). */
  #ownWishes: Record<string, number> = {};
  #heard(m: Relayed): void {
    if (m.kind === 'fish' || m.kind === 'music') {
      if (m.who !== this.#me || m.kind === 'music') for (const f of this.#hearSubs) f(m);
      return;
    }
    if (!isDayEvent(m)) return;
    const { v: _v, ...e } = m;
    const d = this.#today();
    if (m.who === this.#me) {
      // my own, from the relay's replay (a phone that lost its record of the day): folded quietly, nothing to play. A
      // wish is known by when, and the relay's stamp isn't the time I kept it with: only the ones beyond those I have
      // for that morning count (a phone that lost its record gets them back, one that has them doesn't count twice)
      if (e.kind === 'world' && e.op === 'wished') {
        const seen = (this.#ownWishes[e.id] = (this.#ownWishes[e.id] ?? 0) + 1);
        if (seen <= (d.wishes[e.id]?.[m.who] ?? 0)) return;
      }
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
    const k = a.beat && a.beat.who === this.#me ? claimOf(e) : null;
    if (k) {
      try {
        this.lost?.(k, e.who, n.live, e.kind);
      } catch (err) {
        caught(err, 'world');
      }
    }
    for (const f of this.#subs) {
      try {
        f(n);
      } catch (err) {
        caught(err, 'world');
      }
    }
  }

  #ackSubs = new Set<(i: Intent, ok: boolean, t: number) => void>();
  /** Each numbered intent of mine the room answered: whether it took it, its stamp. */
  onAck(fn: (i: Intent, ok: boolean, t: number) => void): () => void {
    this.#ackSubs.add(fn);
    return () => void this.#ackSubs.delete(fn);
  }
  #acked(i: Intent, ok: boolean, t: number): void {
    if (!ok) this.#refused(i);
    for (const f of this.#ackSubs) f(i, ok, t);
  }

  /**
   * The room refused a claim of mine (its `ack` said `ok: false`): someone's reached it first, and this phone never
   * heard theirs (the room's day ring past it, a replay missed). Still mine here, it's lost as a race heard would be
   * (store/actions.ts lostRace takes the catch back): the winner, unknown, is taken to be the partner (the guest's
   * phone: A), as the record's day rows will say or correct; kept, so a reload keeps it theirs.
   */
  #refused(i: Intent): void {
    if (i.kind === 'shake') return this.#unshake(i);
    if (i.kind !== 'catch' && i.kind !== 'pick') return;
    const me = this.#me, k = claimOf(i);
    if (!me || !k) return;
    const d = this.#today(), mine = d.claims[k];
    if (!mine || mine.who !== me) return; // its winner heard already (the race's `beat`)
    const who: Who = me === 'A' ? 'B' : 'A';
    const { v: _v, c: _c, ...rest } = i as Intent & { v?: number; c?: number };
    const e = { ...rest, who, t: mine.t } as DayEvent;
    apply(d, e, me);
    this.#keep(e);
    this.rev++;
    try {
      this.lost?.(k, who, false, i.kind);
    } catch (err) {
      caught(err, 'world');
    }
  }

  /** A shake of mine the room refused (a nest too soon after the tree's last: room.ts NEST_GAP_MS): taken back, off the
   *  day, its kept events and my day row (re-sent without it), so its nest never reaches the partner through the record
   *  as a wasp nobody can claim. */
  #unshake(i: Extract<Intent, { kind: 'shake' }>): void {
    const me = this.#me;
    if (!me || i.at === undefined) return;
    const d = this.#today(), mine = (s: { tree: string; who: Who; t: number }) => s.tree === i.tree && s.who === me && s.t === i.at;
    const n = d.shakes.length;
    d.shakes = d.shakes.filter((s) => !mine(s));
    if (d.shakes.length === n) return;
    this.#events = this.#events.filter((e) => !(e.kind === 'shake' && mine({ tree: e.tree, who: e.who, t: e.at ?? e.t })));
    this.#writing = true;
    queueMicrotask(() => this.#flush());
    this.rev++;
    this.#sendRow();
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
    // the record's day row says the partner has it (a catch or a pick-up of theirs the relay hasn't brought: made
    // offline, or the relay lost its day): theirs, as if the relay had said so (apply lets the relay's own verdict
    // override a row, not my new try)
    const k = claimOf(e);
    if (k && d.claims[k]?.what === 'row' && d.claims[k].who !== me) return { fresh: false, beat: null };
    // a walk I make now is my villager's newest, whatever the clock says of the last one (a `?date=` preview against
    // the relay's stamps)
    if (e.kind === 'walk') delete d.walks[me];
    const a = apply(d, e, this.#me);
    if (e.kind === 'act' || a.fresh) {
      // to the relay first, at once (the partner sees it within its one way); then kept, and the sheet's row (held)
      this.#relay?.send(i);
      if (e.kind !== 'act') {
        this.#keep(e);
        this.rev++;
        // the sheet keeps my part of the day (when the relay has nothing: both apps closed past its day; a catch made
        // offline, which the partner mustn't catch again); a walk's row waits for the next change or the hold (where my
        // villager stands is the relay's to carry)
        if (e.kind !== 'walk') this.#sendRow();
      }
    }
    return a;
  }

  /** Several shared-world changes of mine at once (a plot tap's 3 × 3, the 畑 sheet's 水やり), each folded and kept as
   *  `share`'s, with one `rev` and one row for them all; to the relay DRIP a second, while the day and I are the same.
   *  How many were new. */
  shareMany(list: readonly Extract<Shared, { kind: 'world' }>[]): number {
    const me = this.#me ?? 'A', t = this.now(), d = this.#today();
    const out: Shared[] = [];
    for (const i of list) {
      const e = { ...i, who: me, t } as DayEvent;
      if (!apply(d, e, this.#me).fresh) continue;
      this.#keep(e);
      out.push(i);
    }
    if (!out.length) return 0;
    this.rev++;
    this.#sendRow();
    if (this.#dripDay !== d.day) this.#drip = [];
    this.#dripDay = d.day;
    this.#drip.push(...out);
    if (!this.#dripping) this.#dripOn();
    return out.length;
  }
  #drip: Shared[] = [];
  /** The day the drip's changes are of: past it they're dropped (the relay would count them on its new day). */
  #dripDay = 0;
  #dripping: ReturnType<typeof setTimeout> | null = null;
  #dripOn(): void {
    if (tokyoDay(this.now()) !== this.#dripDay) this.#drip = [];
    for (const i of this.#drip.splice(0, DRIP)) this.#relay?.send(i);
    this.#dripping = this.#drip.length ? setTimeout(() => this.#dripOn(), 1000) : null;
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
    this.#recordDay = null;
    this.#rowWaits = false;
    this.#recordRows = null;
    this.#events = [];
    this.#drip = [];
    if (this.#dripping) clearTimeout(this.#dripping);
    this.#dripping = null;
    this.#subs.clear();
    this.#hearSubs.clear();
    this.#ackSubs.clear();
    this.#hereSubs.clear();
    this.#hereNow = [];
    this.rev++;
  }
}

/** Whether `mine` holds something the record's row `rec` hasn't (a claim, a put, a shake, a watering, a wish). */
function rowLacks(rec: DayRow | undefined, mine: DayRow): boolean {
  const taken = new Set(rec?.taken), puts = new Set(rec?.puts.map((p) => p[0])), watered = new Set(rec?.watered);
  const shakes = new Set(rec?.shakes.map((s) => `${s[0]}|${s[2]}`));
  return (
    mine.taken.some((x) => !taken.has(x)) ||
    mine.puts.some((p) => !puts.has(p[0])) ||
    mine.shakes.some((s) => !shakes.has(`${s[0]}|${s[2]}`)) ||
    mine.watered.some((x) => !watered.has(x)) ||
    Object.entries(mine.wishes).some(([day, n]) => (rec?.wishes[day] ?? 0) < n)
  );
}

/** The island's shared day: one per phone. */
export const world = new SharedWorld();

/** A change's time (an op's `at`): the relay's own clock (never a `?date=` preview's: an op stamped in a preview's
 *  future would beat every later real change), never twice the same (after `last`, the sender's previous), after the
 *  op it replaces (`after`). */
export const opClock = (last: number, after = 0): number => Math.max(Math.round(world.serverNow()), last + 1, after + 1);
