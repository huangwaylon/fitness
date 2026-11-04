// くまのもり's room (docs/backend.md "The forest room"): the forest round's relay between the players' phones, its own
// Durable Object (`ExpeditionRoom`, one room `forest`) behind the Worker's /expedition, apart from the island room.
// It keeps nothing: it checks who's who (the person keys, as the island room), stamps each message with its sender
// (`from`, and `who` on what speaks for its sender), lets only the round's host send the bears and the world's events,
// rate-limits the position stream apart from the rest, and answers pings with its clock. The bears themselves run on
// the host's phone (app forest/sim.ts); a host that goes quiet hands over to the next (`host`).
import { FOREST_MAX, HOST_KINDS, SENDER_KINDS, STREAM_KINDS, parseToRoom, type FromRoom } from '../../app/src/lib/components/forest/wire.ts';
import type { Who } from '../../app/src/lib/sync/live-protocol.ts';
import { keyOwner, type Keys } from './auth.ts';
import { Bucket } from './bucket.ts';
import type { Sock } from './room.ts';

export interface FMeta {
  who: Who | null;
  opened: number;
}

export interface ForestIO<S extends Sock> {
  sockets(): S[];
  meta(s: S): FMeta | null;
  setMeta(s: S, m: FMeta): void;
  keys: Keys;
  now(): number;
}

/** Close codes: a bad key, replaced by the same person's newer socket, no hello in time, room full. */
export const FCLOSE = { key: 4001, replaced: 4002, hello: 4003, full: 4004 } as const;
export const FOREST_HELLO_MS = 10_000;
export const FOREST_SOCKETS = 8;

export class ForestCore<S extends Sock> {
  private readonly stream = new WeakMap<S, Bucket>();
  private readonly rest = new WeakMap<S, Bucket>();
  /** The round's host (its `start`, or a `host` handover); kept in memory: a hibernation between rounds forgets it. */
  private host: Who | null = null;

  constructor(private readonly io: ForestIO<S>) {}

  roomFor(): boolean {
    return this.io.sockets().length <= FOREST_SOCKETS;
  }

  open(s: S): void {
    this.io.setMeta(s, { who: null, opened: this.io.now() });
  }

  private whoOf(s: S): Who | null {
    return this.io.meta(s)?.who ?? null;
  }
  private authed(): S[] {
    return this.io.sockets().filter((s) => this.whoOf(s));
  }
  private here(): Who[] {
    return [...new Set(this.authed().map((s) => this.whoOf(s)!))].sort();
  }
  private send(s: S, m: FromRoom) {
    try {
      s.send(JSON.stringify(m));
    } catch {
      /* gone */
    }
  }
  private toOthers(from: S, m: FromRoom) {
    for (const s of this.authed()) if (s !== from) this.send(s, m);
  }

  message(s: S, raw: string | null): void {
    if (raw === null || raw.length > FOREST_MAX) return;
    const m = parseToRoom(raw);
    if (!m) return;
    const who = this.whoOf(s);
    if (!who) {
      if (m.k !== 'hello') return s.close(FCLOSE.hello, 'hello first');
      const me = keyOwner(m.key, this.io.keys);
      if (!me) return s.close(FCLOSE.key, 'bad key');
      // one socket a person: a newer one replaces the older
      for (const o of this.authed()) if (this.whoOf(o) === me) o.close(FCLOSE.replaced, 'replaced');
      this.io.setMeta(s, { who: me, opened: this.io.meta(s)?.opened ?? this.io.now() });
      this.send(s, { k: 'welcome', me, here: this.here(), host: this.host, t: this.io.now() });
      this.toOthers(s, { k: 'here', who: me, on: true });
      return;
    }
    if (m.k === 'hello') return;
    if (m.k === 'ping') return this.send(s, { k: 'pong', c: m.c, t: this.io.now() });
    const now = this.io.now();
    const fast = STREAM_KINDS.has(m.k);
    const bucket = (fast ? this.stream : this.rest).get(s) ?? new Bucket(fast ? 40 : 30, fast ? 40 : 30, now);
    (fast ? this.stream : this.rest).set(s, bucket);
    if (!bucket.take(now)) return;
    // the host's own: the bears and the world's answers; a start makes its sender the host, a handover only when the
    // host is gone (its socket closed)
    if (m.k === 'start') this.host = who;
    else if (m.k === 'host') {
      if (this.host && this.host !== who && this.here().includes(this.host)) return;
      this.host = who;
    } else if (HOST_KINDS.has(m.k) && this.host !== who) return;
    const out = { ...m, from: who } as FromRoom & Record<string, unknown>;
    if (SENDER_KINDS.has(m.k)) out.who = who;
    if (m.k === 'revive') out.by = who;
    this.toOthers(s, out as FromRoom);
  }

  close(s: S): void {
    const who = this.whoOf(s);
    this.io.setMeta(s, { who: null, opened: this.io.meta(s)?.opened ?? 0 });
    if (!who || this.authed().some((o) => o !== s && this.whoOf(o) === who)) return;
    for (const o of this.authed()) if (o !== s) this.send(o, { k: 'here', who, on: false });
  }

  /** Sockets that never said hello in time are closed; the next sweep's time, or null when none wait. */
  sweep(): number | null {
    const now = this.io.now();
    let next: number | null = null;
    for (const s of this.io.sockets()) {
      const m = this.io.meta(s);
      if (m?.who) continue;
      const due = (m?.opened ?? 0) + FOREST_HELLO_MS;
      if (due <= now) s.close(FCLOSE.hello, 'no hello');
      else next = Math.min(next ?? Infinity, due);
    }
    return next;
  }
}

