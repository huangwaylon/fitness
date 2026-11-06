// The phone's live client against the relay's real room (relay/src/room.ts RoomCore, in this process as relay/test runs
// it): what the two halves do together over minutes of the test's clock. The room's ghost watch (2026-11-05): a socket
// whose hello said `beat` and that the room heard nothing from for 60 s is let go (4003 `silent`); a phone only hearing
// the partner's news says nothing of its own, so it beats (the heartbeat) whenever it has sent nothing for 20 s.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RoomCore, type Meta } from '../../../../relay/src/room.ts';
import { HB_PING } from '../contract/live-protocol.ts';
import { createLive, type Live, type LiveEnv } from './live.ts';

const KEYS = { KEY_A: 'a1'.repeat(32), KEY_B: 'b2'.repeat(32), KEY_C: 'c3'.repeat(32) };

/** The room's side of one socket. */
class RoomSock {
  meta: Meta | null = null;
  closed = false;
  /** When the runtime last answered its heartbeat (the Worker's auto-response: HB_PING never reaches the room). */
  hb: number | null = null;
  constructor(private toPhone: (d: string) => void, private onClose: (code: number) => void) {}
  send(d: string) {
    if (this.closed) throw new Error('closed');
    setTimeout(() => this.toPhone(d), 1);
  }
  close(code = 1000) {
    if (this.closed) return;
    this.closed = true;
    setTimeout(() => this.onClose(code), 1);
  }
}

let socks: RoomSock[];
let room: RoomCore<RoomSock>;

/** The phone's socket, wired to the room (a millisecond each way). */
class PhoneWS {
  static all: PhoneWS[] = [];
  readyState = 0;
  bufferedAmount = 0;
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: ((e: { code: number }) => void) | null = null;
  onerror: (() => void) | null = null;
  rs: RoomSock;
  sent: string[] = [];
  constructor(public url: string) {
    PhoneWS.all.push(this);
    this.rs = new RoomSock((d) => this.readyState === 1 && this.onmessage?.({ data: d }), (code) => {
      this.readyState = 3;
      this.onclose?.({ code });
    });
    setTimeout(() => {
      socks.push(this.rs);
      room.open(this.rs);
      this.readyState = 1;
      this.onopen?.();
    }, 1);
  }
  send(d: string) {
    this.sent.push(d);
    if (d === HB_PING) {
      this.rs.hb = Date.now();
      return setTimeout(() => this.onmessage?.({ data: '{"v":3,"kind":"hb","t":0}' }), 1);
    }
    setTimeout(() => this.rs.closed || room.message(this.rs, d), 1);
  }
  close() {
    this.readyState = 3;
    if (!this.rs.closed) {
      this.rs.closed = true;
      room.close(this.rs);
    }
  }
}

const env: LiveEnv = { visible: () => true, online: () => true, watch: () => () => {} };
let phones: Live[];

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(Date.UTC(2026, 10, 5, 3));
  socks = [];
  PhoneWS.all = [];
  phones = [];
  room = new RoomCore<RoomSock>({
    sockets: () => socks.filter((s) => !s.closed),
    meta: (s) => s.meta,
    setMeta: (s, m) => void (s.meta = m),
    keys: KEYS,
    now: () => Date.now(),
    save: () => {},
    heardAt: (s) => s.hb
  });
});
afterEach(() => {
  for (const p of phones) p.stop();
  vi.useRealTimers();
});

const phone = (key: string) => {
  const p = createLive({ url: 'wss://relay.test/room', key: () => key, WebSocket: PhoneWS as never, env, outbox: { get: () => [], set: () => {} }, since: { get: () => 0, set: () => {} } });
  phones.push(p);
  p.start();
  return p;
};

describe('the client and the room’s ghost watch', () => {
  it('a phone only hearing the partner’s news for 4 minutes stays connected (it beats); one gone quiet is let go', async () => {
    const a = phone(KEYS.KEY_A), b = phone(KEYS.KEY_B);
    await vi.advanceTimersByTimeAsync(100);
    expect([a.status().connected, b.status().connected]).toEqual([true, true]);
    const aws = PhoneWS.all[0];
    // the partner walks every 5 s; A says nothing of its own; the room's alarm looks every 5 s
    for (let i = 0; i < 48; i++) {
      b.send({ kind: 'walk', to: [100 + i, 200] });
      await vi.advanceTimersByTimeAsync(5000);
      room.sweepSilent();
    }
    expect(a.status()).toMatchObject({ connected: true, peer: true });
    expect(PhoneWS.all).toHaveLength(2);
    expect(aws.sent.filter((d) => d === HB_PING).length).toBeGreaterThanOrEqual(10);
    // A's phone gone without closing (frozen, its socket never closed): let go within a minute, B told
    aws.close = () => {};
    a.stop();
    for (let i = 0; i < 14; i++) {
      await vi.advanceTimersByTimeAsync(5000);
      room.sweepSilent();
    }
    expect(aws.rs.closed).toBe(true);
    expect(b.status().peer).toBe(false);
  });
});

describe('the music stages through the room (docs/sound-sync.md)', () => {
  it('A requests and B hears it; G opening 30 s later gets the record, so it starts 30 s in; A hears its own back', async () => {
    const a = phone(KEYS.KEY_A), b = phone(KEYS.KEY_B);
    await vi.advanceTimersByTimeAsync(100);
    const heard = (p: Live) => {
      const got: { at: number; song?: string; who: string }[] = [];
      p.on((m) => void (m.kind === 'music' && got.push(m)));
      return got;
    };
    const atB = heard(b);
    const at = Math.round(a.serverNow());
    expect(a.send({ kind: 'music', src: 'isl', at, song: 'kk-march', ms: 120_000 })).toBe(true);
    await vi.advanceTimersByTimeAsync(50);
    expect(atB).toEqual([expect.objectContaining({ at, song: 'kk-march', who: 'A' })]);
    expect(a.metrics!().pending).toBe(0); // acked
    await vi.advanceTimersByTimeAsync(30_000);
    const g = phone(KEYS.KEY_C);
    const atG = heard(g);
    await vi.advanceTimersByTimeAsync(100);
    expect(atG).toHaveLength(1);
    expect(Math.round((g.serverNow() - atG[0].at) / 1000)).toBe(30);
    // A reloads: its own record comes back with its hello
    a.stop();
    const a2 = phone(KEYS.KEY_A);
    const atA = heard(a2);
    await vi.advanceTimersByTimeAsync(100);
    expect(atA).toEqual([expect.objectContaining({ at, who: 'A' })]);
  });
});
