// The island room's logic, free of the Workers runtime so it is unit-testable: sockets, their attachments, the clock
// and storage come in through RoomIO. The Durable Object (index.ts) is a thin adapter over this.
import { CLOSE, HIGHFIVE_HOLD_MS, LIVE_V, LIVE_VS, NEST_GAP_MS, REPLAY_BYTES, claimOf, guestMaySend, isStored, scopeMaySend, otherVersion, parseClient, sameWalk, tokyoDay, type Gone, type LiveV, type Notice, type RecordMark, type Relayed, type ServerMsg, type Who, type Wx } from '../../app/src/lib/contract/live-protocol.ts';
import { keyOwner, type Keys } from './auth.ts';
import { Bucket } from './bucket.ts';
import { served } from './weather.ts';

/** A socket's attachment (survives hibernation): who it is once its hello was accepted, when it opened, and the protocol
 *  version it spoke in its hello (absent: 1, a socket from before v2). */
export interface Meta {
  who: Who | null;
  opened: number;
  v?: LiveV;
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
  /** Persist the high-fives held for a partner who was away (fire and forget). */
  hold?(held: Held): void;
  /** Persist when each person's phone last left (fire and forget). */
  saveGone?(gone: Gone): void;
  /** A hello was welcomed: whose, in which version, from which build (absent before 2026-11-05). The room logs it
   *  (`ws.hello`) and fetches the real weather then, when it's due (weather.ts). */
  onHello?(who: Who, v: LiveV, build?: string): void;
}

/** The high-fives held for people while they were away, one per (sender, recipient) pair (`<from>><to>`, e.g. `G>A`):
 *  the last one only, a newer one of the pair replacing it; when it was tapped (`at`, its identity) and when the room
 *  heard it (`t`). */
export type Held = Partial<Record<string, { from: Who; to: Who; at: number; t: number }>>;

/** The held high-fives as kept (before the guest, one per recipient: `{B: {from, at, t}}`), as pairs. */
function heldOf(raw: unknown): Held {
  const out: Held = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [k, h] of Object.entries(raw as Record<string, { from?: Who; to?: Who; at: number; t: number }>)) {
    if (!h || typeof h !== 'object' || !h.from) continue;
    const to = h.to ?? (k as Who);
    out[`${h.from}>${to}`] = { from: h.from, to, at: h.at, t: h.t };
  }
  return out;
}

/** A change as the room keeps it: relayed, with its sender's sequence number (`c`: a resend is known again). */
export type Kept = Relayed & { c?: number };

/** A socket must say hello within this long. */
export const HELLO_MS = 10_000;
/** The day's world kept for a phone that opens later (docs/backend.md#shared-world): today's (Tokyo) changes, the
 *  last RING_MAX, and each person's last walk (never trimmed, carried into each new day). */
export const RING_MAX = 400;
/** Per connection: a burst of 20, 20 a second after that. */
const BURST = 20;
const PER_SEC = 20;
/** At most this many sockets at once (two people, a few tabs, room to reconnect). */
export const MAX_SOCKETS = 8;
/** A person's phrases (`say`) at most one this often (ms): a newer one within it goes nowhere (the phone waits 1.5 s). */
const SAY_GAP_MS = 1000;

export class RoomCore<S extends Sock> {
  private readonly buckets = new WeakMap<S, Bucket>();
  private lastT = 0;

  /** Today's claims (live-protocol claimOf: first wins) and each tree's last nest, from the ring. */
  private claims = new Set<string>();
  private nests = new Map<string, number>();
  private day = -1;
  /** When each person's last phrase went out (presence only: not kept). */
  private said = new Map<Who, number>();

  /** When each person's last socket closed (the room's clock), until they're back: the welcome's `gone`, for one gone
   *  quiet inside a room to come out of it on every phone at the same time (app store/where.svelte.ts). */
  private gone: Gone;

  /** Tokyo's real sky by the hour (weather.ts), sent after each welcome and to everyone when it changes. */
  private wx: Wx | null;

  constructor(private readonly io: RoomIO<S>, private ring: Kept[] = [], private rec: RecordMark | null = null, private held: Held = {}, gone: Gone = {}, wx: Wx | null = null) {
    this.wx = wx;
    this.held = heldOf(held);
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

  /** The version a socket speaks (its hello's). */
  private vOf(s: S): LiveV {
    return this.io.meta(s)?.v ?? 1;
  }

  /** The sockets of everyone but `who` that may hear of them: a phone before v3 never hears of the guest. */
  private others(who: Who): S[] {
    return this.authed().filter((s) => {
      const w = this.io.meta(s)?.who;
      return w !== who && (who !== 'G' || this.vOf(s) >= 3);
    });
  }

  /** Who else is here, as a phone of `me` in version `v` knows them (the guest only from v3). */
  private hereFor(me: Who, v: LiveV): Who[] {
    const out = new Set<Who>();
    for (const s of this.authed()) {
      const w = this.io.meta(s)!.who!;
      if (w !== me && (w !== 'G' || v >= 3)) out.add(w);
    }
    return [...out].sort();
  }

  /** Send in the socket's own version (a v1 phone keeps its push and presence). */
  private send(s: S, m: ServerMsg): void {
    try {
      s.send(JSON.stringify({ ...m, v: this.vOf(s) }));
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
    this.io.setMeta(s, { who: null, opened: this.io.now() });
  }

  message(s: S, raw: unknown): void {
    const now = this.io.now();
    let b = this.buckets.get(s);
    if (!b) this.buckets.set(s, (b = new Bucket(BURST, PER_SEC, now)));
    if (!b.take(now)) return;
    const meta = this.io.meta(s);
    if (!meta) return;
    const msg = parseClient(raw);
    if (!msg) {
      const v = otherVersion(raw);
      if (v !== null) this.shut(s, CLOSE.version, versionReason(v));
      else if (!meta.who) this.shut(s, CLOSE.unauthorized, 'hello first');
      return; // a malformed intent from a known person: dropped
    }
    if (msg.kind === 'hello') return this.hello(s, meta, msg.key, msg.since, msg.v, msg.batch === true, msg.build);
    if (!meta.who) return this.shut(s, CLOSE.unauthorized, 'hello first');
    // a socket keeps its hello's version: a phone switching mid-socket is confused, not upgraded
    if (msg.v !== this.vOf(s)) return this.shut(s, CLOSE.version, `version ${msg.v} after a hello in ${this.vOf(s)}`);
    if (msg.kind === 'ping') return this.send(s, { v: LIVE_V, kind: 'pong', c: msg.c, t: now });
    const who = meta.who;
    if (msg.kind === 'got') {
      // a high-five held for me reached my phone
      for (const [k, h] of Object.entries(this.held)) if (h?.to === who && h.at === msg.at) this.unhold(k);
      return;
    }
    const { v, c, ...intent } = msg;
    // the guest's phone may only walk, act, claim, say, high-five and arrange the tent (docs/backend.md#the-guest)
    if (who === 'G' && !guestMaySend(intent)) return c !== undefined ? this.ack(s, c, this.stamp(), false) : undefined;
    // a scoped decor op: the outdoors the members', a home's look and room its owner's (contract/layout.ts)
    if (intent.kind === 'decor' && !scopeMaySend(who, intent.sc, intent.id)) return c !== undefined ? this.ack(s, c, this.stamp(), false) : undefined;
    const stored = (v >= 2 && isStored(intent)) || (v === 1 && intent.kind === 'world');
    if (stored && c !== undefined) {
      // a resend (after a reconnect) of one the room has, the same intent with the same number: acked again, not
      // relayed twice
      const same = JSON.stringify(intent);
      const had = this.fresh().find((e) => e.who === who && e.c === c && JSON.stringify(bare(e)) === same);
      if (had) return this.ack(s, c, had.t, true);
    }
    if (intent.kind === 'say') {
      // presence only, gently limited (the room's bucket is for bursts of world taps)
      if (now - (this.said.get(who) ?? -Infinity) < SAY_GAP_MS) return;
      this.said.set(who, now);
    }
    const out: Relayed = { ...intent, v, who, t: this.stamp() };
    // the shared world (v2): a claim already made today, a second nest within the hour, or a walk older than the one
    // kept goes nowhere
    if (v >= 2 && stored && !this.admit(out, c)) return c !== undefined ? this.ack(s, c, out.t, false) : undefined;
    // a high-five goes to whose villager was tapped (`to`, v3), else the partner (member to member)
    const to = out.kind === 'highfive' ? (out.to ?? (who === 'G' ? null : other(who))) : null;
    if (out.kind === 'highfive' && (!to || to === who)) return c !== undefined ? this.ack(s, c, out.t, false) : undefined;
    // to the others first, then kept: a message sent after a storage write waits for it (the output gate)
    // a walk's target means another thing in v1 (stage units) than since v2 (world units): only between those that
    // agree; a phrase and a high-five (v2) only to a phone that speaks them
    let heard = false;
    for (const p of this.others(who)) {
      if (to && this.io.meta(p)?.who !== to) continue;
      if ((out.kind !== 'walk' && out.kind !== 'say' && out.kind !== 'highfive') || sameWalk(this.vOf(p), v)) {
        this.send(p, out);
        heard = true;
      }
    }
    // a high-five with nobody there to hear it (or only an older phone): held for them, the last one only
    if (to && !heard) {
      this.held = { ...this.held, [`${who}>${to}`]: { from: who, to, at: (out as { at: number }).at, t: out.t } };
      this.io.hold?.(this.held);
    }
    if (stored) this.keep(c !== undefined ? { ...out, c } : out);
    if (c !== undefined) this.ack(s, c, out.t, true);
  }

  private ack(s: S, c: number, t: number, ok: boolean): void {
    this.send(s, { v: LIVE_V, kind: 'ack', c, t, ok });
  }

  private hello(s: S, meta: Meta, key: string, since: number | undefined, v: LiveV, batch = false, build?: string): void {
    const who = keyOwner(key, this.io.keys);
    if (!who) return this.shut(s, CLOSE.unauthorized, 'unknown key');
    // the guest came with v3 (docs/backend.md#the-guest): an older version can't tell it from a member
    if (who === 'G' && v < 3) return this.shut(s, CLOSE.version, `the guest speaks ${LIVE_V}`);
    if (meta.who) {
      // a repeated hello: nothing changes, unless it speaks another version
      if (v !== this.vOf(s)) this.shut(s, CLOSE.version, `version ${v} after a hello in ${this.vOf(s)}`);
      return;
    }
    const was = this.authed(who);
    for (const old of was) {
      // drop it from the room first, so its close doesn't announce me gone
      this.io.setMeta(old, { who: null, opened: this.io.meta(old)?.opened ?? 0 });
      this.shut(old, CLOSE.replaced, 'replaced');
    }
    this.io.setMeta(s, { ...meta, who, v });
    const t = this.io.now();
    // `peer`: a member's partner is here; the guest's, either member. `here` (v3): everyone else who is
    const here = this.hereFor(who, v);
    const peer = who === 'G' ? here.some((w) => w !== 'G') : here.includes(other(who));
    // `gone` (v3): when those not here left, and my own last socket (the guest's only to a phone that knows of it)
    const gone: Gone = {};
    for (const w of ['A', 'B', 'G'] as const) if (this.gone[w] !== undefined && !here.includes(w)) gone[w] = this.gone[w];
    if (this.gone[who] !== undefined) this.setGone(who, undefined);
    this.send(s, { v: LIVE_V, kind: 'welcome', me: who, peer, t, ...(this.rec ? { rec: this.rec } : {}), ...(v >= 3 ? { here, ...(Object.keys(gone).length ? { gone } : {}) } : {}) });
    // the real sky (v3: an older phone has the seeded weather), when the room has one that still serves
    const wx = v >= 3 ? served(this.wx, t) : null;
    if (wx) this.send(s, { v: LIVE_V, kind: 'wx', ...wx, t });
    if (since !== undefined) {
      const day = this.fresh().filter((e) => e.t > since && (e.kind !== 'walk' || sameWalk(e.v, v)) && (v >= 3 || e.who !== 'G'));
      // batch: the day in as few `replay` messages as fit (mine too: a phone that lost its own record gets it back);
      // else one message each, the partner's only (a phone from before the batch)
      if (batch) for (const es of chunks(day.map(strip))) this.send(s, { v: LIVE_V, kind: 'replay', es, t });
      else for (const e of day) if (e.who !== who) this.send(s, strip(e));
    }
    // the high-fives held for me while I was away, one from each (a day old: let go); each goes once my phone says `got`
    for (const [k, h] of Object.entries(this.held)) {
      if (!h || h.to !== who) continue;
      if (t - h.t > HIGHFIVE_HOLD_MS) this.unhold(k);
      else if (v >= 2 && (v >= 3 || h.from !== 'G')) this.send(s, { v: LIVE_V, kind: 'highfive', at: h.at, who: h.from, t: h.t, ...(v >= 3 ? { to: who } : {}) });
    }
    if (!was.length) for (const p of this.others(who)) this.send(p, { v: LIVE_V, kind: 'presence', who, on: true, t });
    this.io.onHello?.(who, v, build);
  }

  /** The real sky was fetched (weather.ts): kept for the welcomes, and when it changed (`send`) every v3 phone hears
   *  it. Returns how many did. */
  setWx(wx: Wx | null, send: boolean): number {
    this.wx = wx;
    const t = this.io.now();
    const w = send ? served(wx, t) : null;
    if (!w) return 0;
    const to = this.authed().filter((s) => this.vOf(s) >= 3);
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

  /** The record changed (its RPC after a write, or a signed /notify): every connected phone hears it, the writer's own too. Returns how many. */
  notify(n: Notice): number {
    if (!this.rec || n.at > this.rec.at || n.rev !== this.rec.rev) {
      this.rec = { at: n.at, rev: n.rev };
      this.io.saveRec?.(this.rec);
    }
    // (the guest's own write reaches only the phones that know of the guest: v3)
    const to = this.authed().filter((s) => n.who !== 'G' || this.vOf(s) >= 3);
    const m: ServerMsg = { v: LIVE_V, kind: 'changed', what: n.what, who: n.who, at: n.at, rev: n.rev, t: this.io.now() };
    for (const s of to) this.send(s, m);
    return to.length;
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

  /** Whether another socket may join (after sweeping out the silent ones). */
  roomFor(): boolean {
    this.sweep();
    return this.io.sockets().filter((s) => this.io.meta(s)?.opened !== 0).length < MAX_SOCKETS;
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
    return this.ring;
  }

  private index(e: Relayed): void {
    const c = claimOf(e);
    if (c) this.claims.add(c);
    if (e.kind === 'shake' && e.drop === 'nest') this.nests.set(e.tree, Math.max(this.nests.get(e.tree) ?? 0, e.t));
  }

  /** Whether the day's world takes a change: false when it refuses it (claimed already, a nest too soon, a walk sent
   *  before the one it holds: a late resend). */
  private admit(e: Relayed, seq?: number): boolean {
    this.fresh();
    const c = claimOf(e);
    if (c && this.claims.has(c)) return false;
    if (e.kind === 'shake' && e.drop === 'nest' && e.t - (this.nests.get(e.tree) ?? -Infinity) < NEST_GAP_MS) return false;
    if (e.kind === 'walk' && seq !== undefined) {
      const last = this.ring.find((x) => x.kind === 'walk' && x.who === e.who);
      if (last?.c !== undefined && last.c > seq) return false;
    }
    return true;
  }

  /** Keep a change the world took (admit) in the day's world. A walk replaces its person's last one; past RING_MAX the
   *  oldest change that isn't a walk goes. */
  private keep(e: Kept): void {
    const ring = this.fresh();
    const rest = e.kind === 'walk' ? ring.filter((x) => !(x.kind === 'walk' && x.who === e.who)) : ring;
    const next = [...rest, e];
    while (next.length > RING_MAX) next.splice(Math.max(0, next.findIndex((x) => x.kind !== 'walk')), 1);
    this.ring = next;
    this.index(e);
    this.io.save(this.ring);
  }
}

/** A kept change's intent alone (as its sender sent it). */
const bare = ({ c: _c, v: _v, who: _w, t: _t, ...i }: Kept): Omit<Kept, 'c' | 'v' | 'who' | 't'> => i;

/** A kept change as sent: without its sender's sequence number. */
const strip = ({ c: _c, ...e }: Kept): Relayed => e;

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
