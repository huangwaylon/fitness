// The island room's logic, free of the Workers runtime so it is unit-testable: sockets, their attachments, the clock
// and storage come in through RoomIO. The Durable Object (index.ts) is a thin adapter over this.
import { CLOSE, HB_PING, HB_PONG, HIGHFIVE_HOLD_MS, LIVE_V, LIVE_VS, MAX_BYTES, NEST_GAP_MS, REPLAY_BYTES, claimOf, guestMaySend, isStored, scopeMaySend, otherVersion, parseClient, tokyoDay, type Gone, type LiveV, type Notice, type RecordMark, type Relayed, type ServerMsg, type Who, type Wx } from '../../app/src/lib/contract/live-protocol.ts';
import { keyOwner, type Keys } from './auth.ts';
import { Bucket } from './bucket.ts';
import { served } from './weather.ts';

/** A socket's attachment (survives hibernation): who it is once its hello was accepted, when it opened, and the protocol
 *  version it spoke in its hello. */
export interface Meta {
  who: Who | null;
  opened: number;
  v?: LiveV;
  /** The socket's own id (made at open, 2026-11-05): a walk's order is its socket's (admit). */
  sk?: string;
}

export interface Sock {
  send(data: string): void;
  close(code?: number, reason?: string): void;
}

export interface RoomIO<S extends Sock> {
  /** Every open socket the room holds (after a hibernation too). */
  sockets(): S[];
  meta(s: S): Meta | null;
  setMeta(s: S, m: Meta): void;
  keys: Keys;
  now(): number;
  /** Persist the day's world (fire and forget). */
  save(ring: Kept[]): void;
  /** Persist the record's last change (`notify`), for the welcomes (fire and forget). */
  saveRec?(rec: RecordMark): void;
  /** The same, of the last change the guest hears of (no member's ingest: guestNotice). */
  saveRecG?(rec: RecordMark): void;
  /** Persist the high-fives held for a partner who was away (fire and forget). */
  hold?(held: Held): void;
  /** Persist when each person's phone last left (fire and forget). */
  saveGone?(gone: Gone): void;
  /** Persist the day's claims and nests (fire and forget): they outlive the ring's trimming and a restart. */
  saveDay?(d: DayIndex): void;
  /** A hello was welcomed: whose, in which version, from which build (absent before 2026-11-05). The room logs it
   *  (`ws.hello`) and fetches the real weather then, when it's due (weather.ts). */
  onHello?(who: Who, v: LiveV, build?: string): void;
}

/** The high-fives held for people while they were away, one per (sender, recipient) pair (`<from>><to>`, e.g. `G>A`):
 *  the last one only, a newer one of the pair replacing it; when it was tapped (`at`, its identity) and when the room
 *  heard it (`t`). */
export type Held = Partial<Record<string, { from: Who; to: Who; at: number; t: number }>>;

/** The day's claims (who made each, its stamp and sequence number: a resend of it is acked again) and each tree's
 *  last nest, kept apart from the ring so that trimming the ring, and a restart after it, never lets a claim be made
 *  twice. `day`: the Tokyo day they are of (another day's are let go). */
export interface DayIndex {
  day: number;
  claims: [key: string, who: Who, t: number, c: number | null][];
  nests: [tree: string, t: number][];
}

/** A change as the room keeps it: relayed, with its sender's sequence number (`c`: a resend is known again) and the
 *  socket it came on (`sk`: a walk's numbers are compared on one socket only). Neither goes out again. */
export type Kept = Relayed & { c?: number; sk?: string };

/** A socket must say hello within this long: one round trip and the phone's onopen (at boot a 1.5 s long task; a 3–5 s
 *  round trip on a poor line). 3 s locked such a phone out (2026-11-05: 3.2 s RTT, every hello closed 4003); MAX_PENDING
 *  keeps the silent sockets few however long this is. */
export const HELLO_MS = 12_000;
/** The day's world kept for a phone that opens later (docs/backend.md#shared-world): today's (Tokyo) changes, the
 *  last RING_MAX, and each person's last walk (never trimmed, carried into each new day). */
export const RING_MAX = 400;
/** Per connection: a burst of 20, 20 a second after that. */
const BURST = 20;
const PER_SEC = 20;
/** At most this many sockets waiting for their hello: a new one lets the oldest go. Welcomed sockets have no cap of
 *  their own and never count here: a person's hello replaces their earlier socket, so there are at most three. */
export const MAX_PENDING = 4;
/** How many acked-but-not-kept intents the room remembers for resends (room.ts acked). */
const ACKED_MAX = 64;
/** A person's phrases (`say`) at most one this often (ms): a newer one within it goes nowhere (the phone waits 1.5 s). */
const SAY_GAP_MS = 1000;
/** A walk from another socket of the same person than the one kept (another device, or the same after a reconnect)
 *  is refused only when it set off (`s`, the relay's clock as the phone has it) this much before the kept one: a stale
 *  resend, never a phone's clock a little off. */
const WALK_SKEW_MS = 5000;

export class RoomCore<S extends Sock> {
  private readonly buckets = new WeakMap<S, Bucket>();
  private lastT = 0;

  /** Today's claims (live-protocol claimOf: first wins) and each tree's last nest, from the ring. */
  private claims = new Map<string, { who: Who; t: number; c?: number }>();
  private nests = new Map<string, number>();
  private day = -1;
  /** The numbered intents the room acked but doesn't keep (a high-five), the last ACKED_MAX: `<who>:<c>` → the intent
   *  and its stamp, so a resend after a reconnect is acked again, not delivered twice. In memory (a wake forgets it). */
  private acked = new Map<string, { same: string; t: number }>();
  /** When each person's last phrase went out (presence only: not kept). */
  private said = new Map<Who, number>();

  /** When each person's last socket closed (the room's clock), until they're back: the welcome's `gone`, for one gone
   *  quiet inside a room to come out of it on every phone at the same time (app store/where.svelte.ts). */
  private gone: Gone;

  /** Tokyo's real sky by the hour (weather.ts), sent after each welcome and to everyone when it changes. */
  private wx: Wx | null;

  constructor(private readonly io: RoomIO<S>, private ring: Kept[] = [], private rec: RecordMark | null = null, private held: Held = {}, gone: Gone = {}, wx: Wx | null = null, private kept: DayIndex | null = null, private recG: RecordMark | null = null) {
    this.wx = wx;
    this.held = { ...held };
    this.gone = { ...gone };
    for (const e of ring) this.lastT = Math.max(this.lastT, e.t);
    this.fresh();
  }

  /** The relay's clock, strictly increasing so a `since` never skips or repeats an event. */
  private stamp(): number {
    this.lastT = Math.max(this.io.now(), this.lastT + 1);
    return this.lastT;
  }

  private authed(who?: Who): S[] {
    return this.io.sockets().filter((s) => {
      const m = this.io.meta(s);
      return m?.who != null && (who === undefined || m.who === who);
    });
  }

  /** The sockets of everyone but `who`. */
  private others(who: Who): S[] {
    return this.authed().filter((s) => this.io.meta(s)?.who !== who);
  }

  /** Who else is here, as `me`'s phone hears it. */
  private hereFor(me: Who): Who[] {
    const out = new Set<Who>();
    for (const s of this.authed()) {
      const w = this.io.meta(s)!.who!;
      if (w !== me) out.add(w);
    }
    return [...out].sort();
  }

  private send(s: S, m: ServerMsg): void {
    try {
      s.send(JSON.stringify({ ...m, v: LIVE_V }));
    } catch {
      /* closing: its close handler tidies up */
    }
  }

  private shut(s: S, code: number, reason: string): void {
    try {
      s.close(code, reason);
    } catch {
      /* already closed */
    }
  }

  /** A new socket, accepted but not yet authenticated. */
  open(s: S): void {
    this.io.setMeta(s, { who: null, opened: this.io.now(), sk: `${this.io.now().toString(36)}${Math.random().toString(36).slice(2, 8)}` });
  }

  message(s: S, raw: unknown): void {
    // the heartbeat: answered as the runtime's auto-response answers it (index.ts), before anything else (a room
    // awake, or a test's): any socket, no bucket
    if (raw === HB_PING) {
      try {
        s.send(HB_PONG);
      } catch {
        /* closing */
      }
      return;
    }
    const now = this.io.now();
    const meta = this.io.meta(s);
    // a socket let go (swept, or making room) before its hello: whatever it says now goes nowhere
    if (!meta || (!meta.who && meta.opened === 0)) return;
    const msg = parseClient(raw);
    // the bucket: a ping and a got never wait on it (the clock, a held high-five let go); over it, a welcomed phone's
    // numbered intent hears `busy {c}` (resend it later), anything else is dropped
    if (!(meta.who && (msg?.kind === 'ping' || msg?.kind === 'got'))) {
      let b = this.buckets.get(s);
      if (!b) this.buckets.set(s, (b = new Bucket(BURST, PER_SEC, now)));
      if (!b.take(now)) {
        const c = meta.who && msg && 'c' in msg ? msg.c : undefined;
        if (c !== undefined) this.send(s, { v: LIVE_V, kind: 'busy', c, t: now });
        return;
      }
    }
    if (!msg) {
      const v = otherVersion(raw);
      if (v !== null) this.shut(s, CLOSE.version, versionReason(v));
      else if (!meta.who) this.shut(s, CLOSE.unauthorized, 'hello first');
      else {
        // a malformed intent from a known person: dropped, but a numbered one is refused by its ack, so the phone
        // lets it go (unacked, it was resent on every reconnect until the day turned)
        const c = seqOf(raw);
        if (c !== null) this.ack(s, c, this.stamp(), false);
      }
      return;
    }
    if (msg.kind === 'hello') return this.hello(s, meta, msg.key, msg.since, msg.v, msg.build);
    if (!meta.who) return this.shut(s, CLOSE.unauthorized, 'hello first');
    if (msg.kind === 'ping') return this.send(s, { v: LIVE_V, kind: 'pong', c: msg.c, t: now });
    const who = meta.who;
    if (msg.kind === 'got') {
      // a high-five held for me reached my phone
      for (const [k, h] of Object.entries(this.held)) if (h?.to === who && h.at === msg.at) this.unhold(k);
      return;
    }
    const { v: _v, c, ...intent } = msg;
    // the guest's phone may only walk, act, claim, say, high-five and arrange the tent (docs/backend.md#the-guest)
    if (who === 'G' && !guestMaySend(intent)) return c !== undefined ? this.ack(s, c, this.stamp(), false) : undefined;
    // a scoped decor op: the outdoors the members', a home's look and room its owner's (contract/layout.ts)
    if (intent.kind === 'decor' && !scopeMaySend(who, intent.sc, intent.id)) return c !== undefined ? this.ack(s, c, this.stamp(), false) : undefined;
    const stored = isStored(intent);
    if (stored && c !== undefined) {
      // a resend (after a reconnect) of one the room has, the same intent with the same number: acked again, not
      // relayed twice
      const same = JSON.stringify(intent);
      const had = this.fresh().find((e) => e.who === who && e.c === c && JSON.stringify(bare(e)) === same);
      if (had) return this.ack(s, c, had.t, true);
      // or of a claim of mine trimmed from the ring since
      const k = claimOf(intent);
      const mine = k ? this.claims.get(k) : undefined;
      if (mine && mine.who === who && mine.c === c) return this.ack(s, c, mine.t, true);
    }
    if (!stored && c !== undefined) {
      const was = this.acked.get(`${who}:${c}`);
      if (was && was.same === JSON.stringify(intent)) return this.ack(s, c, was.t, true);
    }
    if (intent.kind === 'say') {
      // presence only, gently limited (the room's bucket is for bursts of world taps)
      if (now - (this.said.get(who) ?? -Infinity) < SAY_GAP_MS) return;
      this.said.set(who, now);
    }
    const out: Relayed = { ...intent, v: LIVE_V, who, t: this.stamp() };
    // the shared world: a claim already made today, a second nest within the hour, or a walk older than the one kept
    // goes nowhere
    if (stored && !this.admit(out, c, meta.sk)) return c !== undefined ? this.ack(s, c, out.t, false) : undefined;
    // a high-five goes to whose villager was tapped (`to`), else the partner (member to member)
    const to = out.kind === 'highfive' ? (out.to ?? (who === 'G' ? null : other(who))) : null;
    if (out.kind === 'highfive' && (!to || to === who)) return c !== undefined ? this.ack(s, c, out.t, false) : undefined;
    // to the others first, then kept: a message sent after a storage write waits for it (the output gate)
    let heard = false;
    for (const p of this.others(who)) {
      if (to && this.io.meta(p)?.who !== to) continue;
      this.send(p, out);
      heard = true;
    }
    // a high-five with nobody there to hear it: held for them, the last one only
    if (to && !heard) {
      this.held = { ...this.held, [`${who}>${to}`]: { from: who, to, at: (out as { at: number }).at, t: out.t } };
      this.io.hold?.(this.held);
    }
    if (stored) this.keep({ ...out, ...(c !== undefined ? { c } : {}), ...(out.kind === 'walk' && meta.sk ? { sk: meta.sk } : {}) });
    else if (c !== undefined) {
      this.acked.set(`${who}:${c}`, { same: JSON.stringify(intent), t: out.t });
      if (this.acked.size > ACKED_MAX) this.acked.delete(this.acked.keys().next().value!);
    }
    if (c !== undefined) this.ack(s, c, out.t, true);
  }

  private ack(s: S, c: number, t: number, ok: boolean): void {
    this.send(s, { v: LIVE_V, kind: 'ack', c, t, ok });
  }

  private hello(s: S, meta: Meta, key: string, since: number | undefined, v: LiveV, build?: string): void {
    const who = keyOwner(key, this.io.keys);
    if (!who) return this.shut(s, CLOSE.unauthorized, 'unknown key');
    // a repeated hello: nothing changes
    if (meta.who) return;
    const was = this.authed(who);
    for (const old of was) {
      // drop it from the room first, so its close doesn't announce me gone
      this.io.setMeta(old, { who: null, opened: this.io.meta(old)?.opened ?? 0 });
      this.shut(old, CLOSE.replaced, 'replaced');
    }
    this.io.setMeta(s, { ...meta, who, v });
    const t = this.io.now();
    // `peer`: a member's partner is here; the guest's, either member. `here`: everyone else who is
    const here = this.hereFor(who);
    const peer = who === 'G' ? here.some((w) => w !== 'G') : here.includes(other(who));
    // `gone`: when those not here left, and my own last socket
    const gone: Gone = {};
    for (const w of ['A', 'B', 'G'] as const) if (this.gone[w] !== undefined && !here.includes(w)) gone[w] = this.gone[w];
    if (this.gone[who] !== undefined) this.setGone(who, undefined);
    // `hb`: this room answers the heartbeat (HB_PING) without waking (2026-11-05)
    const rec = who === 'G' ? this.recG : this.rec;
    this.send(s, { v: LIVE_V, kind: 'welcome', me: who, peer, t, ...(rec ? { rec } : {}), here, ...(Object.keys(gone).length ? { gone } : {}), hb: true });
    // the real sky, when the room has one that still serves
    const wx = served(this.wx, t);
    if (wx) this.send(s, { v: LIVE_V, kind: 'wx', ...wx, t });
    if (since !== undefined) {
      // the day in as few `replay` messages as fit (mine too: a phone that lost its own record gets it back)
      const day = this.fresh().filter((e) => e.t > since);
      for (const es of chunks(day.map(strip))) this.send(s, { v: LIVE_V, kind: 'replay', es, t });
    }
    // the high-fives held for me while I was away, one from each (a day old: let go); each goes once my phone says `got`
    for (const [k, h] of Object.entries(this.held)) {
      if (!h || h.to !== who) continue;
      if (t - h.t > HIGHFIVE_HOLD_MS) this.unhold(k);
      else this.send(s, { v: LIVE_V, kind: 'highfive', at: h.at, who: h.from, t: h.t, to: who });
    }
    if (!was.length) for (const p of this.others(who)) this.send(p, { v: LIVE_V, kind: 'presence', who, on: true, t });
    this.io.onHello?.(who, v, build);
  }

  /** The real sky was fetched (weather.ts): kept for the welcomes, and when it changed (`send`) every phone hears it.
   *  Returns how many did. */
  setWx(wx: Wx | null, send: boolean): number {
    this.wx = wx;
    const t = this.io.now();
    const w = send ? served(wx, t) : null;
    if (!w) return 0;
    const to = this.authed();
    for (const s of to) this.send(s, { v: LIVE_V, kind: 'wx', ...w, t });
    return to.length;
  }

  private setGone(who: Who, t: number | undefined): void {
    const { [who]: _was, ...rest } = this.gone;
    this.gone = t === undefined ? rest : { ...rest, [who]: t };
    this.io.saveGone?.(this.gone);
  }

  private unhold(pair: string): void {
    const { [pair]: _gone, ...rest } = this.held;
    this.held = rest;
    this.io.hold?.(this.held);
  }

  /** The record changed (its RPC after a write, or a signed /notify): every connected phone hears it, the writer's own
   *  too, but the guest only what it may see of (guestNotice; `guest`: the record's word on it). Returns how many. */
  notify(n: Notice, guest?: boolean): number {
    const forG = this.guestNotice(n, guest);
    if (!this.rec || n.at > this.rec.at || n.rev !== this.rec.rev) {
      this.rec = { at: n.at, rev: n.rev };
      this.io.saveRec?.(this.rec);
    }
    if (forG && (!this.recG || n.at > this.recG.at || n.rev !== this.recG.rev)) {
      this.recG = { at: n.at, rev: n.rev };
      this.io.saveRecG?.(this.recG);
    }
    const to = this.authed().filter((s) => forG || this.io.meta(s)?.who !== 'G');
    const m: ServerMsg = { v: LIVE_V, kind: 'changed', what: n.what, who: n.who, at: n.at, rev: n.rev, t: this.io.now() };
    for (const s of to) this.send(s, m);
    return to.length;
  }

  /** Whether the guest hears of this change: an event's, a member's ingest that brought activity rows (the record says
   *  so: `guest`; the guest's snapshot holds them, so it reaches the mark), or a new epoch (its cache refetched). Never
   *  an ingest of からだ rows alone: when one ran is the member's (docs/backend.md#the-guest), and the guest's
   *  snapshot, which holds none of them, could never reach its mark. (A signed /notify's ingest, and an admin load at
   *  the same epoch, told as an ingest: the guest has them at its next poll.) */
  private guestNotice(n: Notice, guest?: boolean): boolean {
    const was = this.recG ?? this.rec;
    return n.what !== 'ingest' || guest === true || (was !== null && n.rev !== was.rev);
  }

  /** A socket closed (or errored). Its person's partner hears they left, unless another socket of theirs is open. */
  close(s: S): void {
    const who = this.io.meta(s)?.who;
    if (!who) return;
    this.io.setMeta(s, { who: null, opened: 0 });
    if (this.authed(who).some((x) => x !== s)) return;
    const t = this.io.now();
    this.setGone(who, t);
    for (const p of this.others(who)) if (p !== s) this.send(p, { v: LIVE_V, kind: 'presence', who, on: false, t });
  }

  /** Close sockets that never said hello. Returns when to sweep next, or null when none is waiting. */
  sweep(): number | null {
    const now = this.io.now();
    let next: number | null = null;
    for (const s of this.io.sockets()) {
      const m = this.io.meta(s);
      if (!m || m.who) continue;
      if (m.opened === 0) continue; // already let go
      const due = m.opened + HELLO_MS;
      if (due <= now) {
        this.io.setMeta(s, { who: null, opened: 0 });
        this.shut(s, CLOSE.timeout, 'no hello');
      } else next = next === null ? due : Math.min(next, due);
    }
    return next;
  }

  /** Room for one more socket: the silent ones past their time swept out, then the oldest still waiting for a hello
   *  let go until fewer than MAX_PENDING wait (so a few silent sockets can never keep a phone out). Returns how many
   *  were let go to make room. */
  makeRoom(): number {
    this.sweep();
    const waiting = this.io.sockets().filter((s) => {
      const m = this.io.meta(s);
      return m && !m.who && m.opened !== 0;
    }).sort((x, y) => this.io.meta(x)!.opened - this.io.meta(y)!.opened);
    let n = 0;
    while (waiting.length - n >= MAX_PENDING) {
      const s = waiting[n++];
      this.io.setMeta(s, { who: null, opened: 0 });
      this.shut(s, CLOSE.timeout, 'no hello');
    }
    return n;
  }

  /** Today's world (a new Tokyo day starts empty but for each person's last walk: where their villager stands, however
   *  long their phone is gone, stamped into today so a phone opening asks for it): the ring, its claims and nests
   *  rebuilt when the day turns. */
  private fresh(): Kept[] {
    const today = tokyoDay(this.io.now());
    if (today === this.day) return this.ring;
    this.day = today;
    const ring = this.ring.filter((e) => tokyoDay(e.t) === today);
    const walked = new Set(ring.filter((e) => e.kind === 'walk').map((e) => e.who));
    const carried = this.ring.filter((e) => e.kind === 'walk' && !walked.has(e.who) && tokyoDay(e.t) !== today).map((e) => ({ ...e, t: this.stamp() }));
    this.ring = [...ring, ...carried];
    if (carried.length) this.io.save(this.ring);
    this.claims.clear();
    this.nests.clear();
    for (const e of this.ring) this.index(e);
    // and those the ring no longer holds (kept apart: saveDay), when they are today's
    if (this.kept?.day === today) {
      for (const [k, who, t, c] of this.kept.claims) if (!this.claims.has(k)) this.claims.set(k, c === null ? { who, t } : { who, t, c });
      for (const [tree, t] of this.kept.nests) this.nests.set(tree, Math.max(this.nests.get(tree) ?? 0, t));
    }
    this.kept = null;
    return this.ring;
  }

  /** Take a kept change into the day's claims and nests; true when they changed. */
  private index(e: Kept): boolean {
    const c = claimOf(e);
    if (c && !this.claims.has(c)) {
      this.claims.set(c, e.c === undefined ? { who: e.who, t: e.t } : { who: e.who, t: e.t, c: e.c });
      return true;
    }
    if (e.kind === 'shake' && e.drop === 'nest' && e.t > (this.nests.get(e.tree) ?? 0)) {
      this.nests.set(e.tree, e.t);
      return true;
    }
    return false;
  }

  /** The day's claims and nests as saveDay keeps them. */
  private dayIndex(): DayIndex {
    return {
      day: this.day,
      claims: [...this.claims].map(([k, x]) => [k, x.who, x.t, x.c ?? null]),
      nests: [...this.nests]
    };
  }

  /** Whether the day's world takes a change: false when it refuses it (claimed already, a nest too soon, a walk sent
   *  before the one it holds: a late resend). A walk's number (`seq`, the phone's clock) is compared with the kept
   *  walk's only when both came on the same socket (`sk`): another device's clock, or the same phone's after a reload,
   *  numbers its own way, and a newer socket's first walk is taken; across sockets a walk that set off WALK_SKEW_MS
   *  before the kept one is a stale resend. (A socket from before `sk` compares as before.) */
  private admit(e: Relayed, seq?: number, sk?: string): boolean {
    this.fresh();
    const c = claimOf(e);
    if (c && this.claims.has(c)) return false;
    if (e.kind === 'shake' && e.drop === 'nest' && e.t - (this.nests.get(e.tree) ?? -Infinity) < NEST_GAP_MS) return false;
    if (e.kind === 'walk' && seq !== undefined) {
      const last = this.ring.find((x) => x.kind === 'walk' && x.who === e.who);
      if (last?.kind === 'walk') {
        const same = !sk || last.sk === sk;
        if (same && last.c !== undefined && last.c > seq) return false;
        if (!same && e.s !== undefined && last.s !== undefined && e.s + WALK_SKEW_MS < last.s) return false;
      }
    }
    return true;
  }

  /** Keep a change the world took (admit) in the day's world. A walk replaces its person's last one; past RING_MAX the
   *  oldest change that claims nothing and isn't a walk goes (else the oldest that isn't a walk: its claim stays in
   *  the day's claims, saveDay). */
  private keep(e: Kept): void {
    const ring = this.fresh();
    const rest = e.kind === 'walk' ? ring.filter((x) => !(x.kind === 'walk' && x.who === e.who)) : ring;
    const next = [...rest, e];
    while (next.length > RING_MAX) {
      const i = next.findIndex((x) => x.kind !== 'walk' && !claimOf(x));
      next.splice(i >= 0 ? i : Math.max(0, next.findIndex((x) => x.kind !== 'walk')), 1);
    }
    this.ring = next;
    if (this.index(e)) this.io.saveDay?.(this.dayIndex());
    this.io.save(this.ring);
  }
}

/** The sequence number `c` of a message the protocol couldn't read (a whole number, as live-protocol's isSeq), or null. */
function seqOf(raw: unknown): number | null {
  if (typeof raw !== 'string' || raw.length > MAX_BYTES) return null;
  let o: unknown;
  try {
    o = JSON.parse(raw);
  } catch {
    return null;
  }
  const c = o !== null && typeof o === 'object' ? (o as { c?: unknown; kind?: unknown }).c : undefined;
  const kind = (o as { kind?: unknown } | null)?.kind;
  return kind !== 'ping' && kind !== 'hello' && Number.isInteger(c) && (c as number) > 0 && (c as number) < 1e15 ? (c as number) : null;
}

/** A kept change's intent alone (as its sender sent it). */
const bare = ({ c: _c, sk: _sk, v: _v, who: _w, t: _t, ...i }: Kept): Omit<Kept, 'c' | 'sk' | 'v' | 'who' | 't'> => i;

/** A kept change as sent: without its sender's sequence number and socket. */
const strip = ({ c: _c, sk: _sk, ...e }: Kept): Relayed => e;

/** The day's changes in runs whose `replay` message stays within REPLAY_BYTES. */
function chunks(es: Relayed[]): Relayed[][] {
  const out: Relayed[][] = [];
  let run: Relayed[] = [], size = 0;
  const room = REPLAY_BYTES - 80; // the message around them
  for (const e of es) {
    const n = JSON.stringify(e).length + 1;
    if (run.length && size + n > room) {
      out.push(run);
      run = [];
      size = 0;
    }
    run.push(e);
    size += n;
  }
  if (run.length) out.push(run);
  return out;
}

/** A member's partner (the guest has none: it sees both). */
const other = (w: Who): Who => (w === 'A' ? 'B' : 'A');

/** The close reason for a phone speaking a version the relay doesn't (≤ 123 bytes: the browser console and the logs). */
const versionReason = (v: number): string => `protocol version ${String(v).slice(0, 12)} unsupported (relay speaks ${LIVE_VS.join(', ')})`;
