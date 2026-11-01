// The island room's logic, free of the Workers runtime so it is unit-testable: sockets, their attachments, the clock
// and storage come in through RoomIO. The Durable Object (index.ts) is a thin adapter over this.
import { CLOSE, LIVE_V, MAX_BYTES, parseClient, type Relayed, type ServerMsg, type Who } from '../../app/src/lib/sync/live-protocol.ts';
import { keyOwner, type Keys } from './auth.ts';
import { Bucket } from './bucket.ts';

/** A socket's attachment (survives hibernation): who it is once its hello was accepted, and when it opened. */
export interface Meta {
  who: Who | null;
  opened: number;
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
  /** Persist the world-event ring (fire and forget). */
  save(ring: Relayed[]): void;
}

/** A socket must say hello within this long. */
export const HELLO_MS = 10_000;
/** World events kept for a reconnecting phone: the last RING_MAX, none older than RING_AGE_MS. */
export const RING_MAX = 50;
export const RING_AGE_MS = 6 * 3600_000;
/** Per connection: a burst of 20, 20 a second after that. */
export const BURST = 20;
export const PER_SEC = 20;
/** At most this many sockets at once (two people, a few tabs, room to reconnect). */
export const MAX_SOCKETS = 8;

export class RoomCore<S extends Sock> {
  private readonly buckets = new WeakMap<S, Bucket>();
  private lastT = 0;

  constructor(private readonly io: RoomIO<S>, private ring: Relayed[] = []) {
    for (const e of ring) this.lastT = Math.max(this.lastT, e.t);
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

  private send(s: S, m: ServerMsg): void {
    try {
      s.send(JSON.stringify(m));
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
      if (!meta.who) this.shut(s, CLOSE.unauthorized, 'hello first');
      else if (otherVersion(raw)) this.shut(s, CLOSE.version, 'version');
      return; // a malformed intent from a known person: dropped
    }
    if (msg.kind === 'hello') return this.hello(s, meta, msg.key, msg.since);
    if (!meta.who) return this.shut(s, CLOSE.unauthorized, 'hello first');
    if (msg.kind === 'ping') return this.send(s, { v: LIVE_V, kind: 'pong', c: msg.c, t: now });
    const { v: _v, ...intent } = msg;
    const out: Relayed = { ...intent, v: LIVE_V, who: meta.who, t: this.stamp() };
    if (out.kind === 'world') this.remember(out);
    for (const p of this.authed(other(meta.who))) this.send(p, out);
  }

  private hello(s: S, meta: Meta, key: string, since?: number): void {
    const who = keyOwner(key, this.io.keys);
    if (!who) return this.shut(s, CLOSE.unauthorized, 'unknown key');
    if (meta.who) return; // a repeated hello: nothing changes
    const was = this.authed(who);
    for (const old of was) {
      // drop it from the room first, so its close doesn't announce me gone
      this.io.setMeta(old, { who: null, opened: this.io.meta(old)?.opened ?? 0 });
      this.shut(old, CLOSE.replaced, 'replaced');
    }
    this.io.setMeta(s, { ...meta, who });
    const peers = this.authed(other(who));
    const t = this.io.now();
    this.send(s, { v: LIVE_V, kind: 'welcome', me: who, peer: peers.length > 0, t });
    if (since !== undefined) {
      for (const e of this.fresh()) if (e.t > since && e.who !== who) this.send(s, e);
    }
    if (!was.length) for (const p of peers) this.send(p, { v: LIVE_V, kind: 'presence', who, on: true, t });
  }

  /** A socket closed (or errored). Its person's partner hears they left, unless another socket of theirs is open. */
  close(s: S): void {
    const who = this.io.meta(s)?.who;
    if (!who) return;
    this.io.setMeta(s, { who: null, opened: 0 });
    if (this.authed(who).some((x) => x !== s)) return;
    const t = this.io.now();
    for (const p of this.authed(other(who))) if (p !== s) this.send(p, { v: LIVE_V, kind: 'presence', who, on: false, t });
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

  private fresh(): Relayed[] {
    const cutoff = this.io.now() - RING_AGE_MS;
    return this.ring.filter((e) => e.t >= cutoff);
  }

  private remember(e: Relayed): void {
    this.ring = [...this.fresh(), e].slice(-RING_MAX);
    this.io.save(this.ring);
  }
}

const other = (w: Who): Who => (w === 'A' ? 'B' : 'A');

/** A message from a client speaking another protocol version (it should reload, not keep sending). */
function otherVersion(raw: unknown): boolean {
  if (typeof raw !== 'string' || raw.length > MAX_BYTES) return false;
  try {
    const o = JSON.parse(raw) as { v?: unknown } | null;
    return typeof o?.v === 'number' && o.v !== LIVE_V;
  } catch {
    return false;
  }
}
