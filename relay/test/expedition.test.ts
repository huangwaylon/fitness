import { beforeEach, describe, expect, it } from 'vitest';
import { parseFromRoom, type FromRoom } from '../../app/src/lib/components/forest/wire.ts';
import { FCLOSE, FOREST_HELLO_MS, ForestCore, type FMeta, type ForestIO } from '../src/expedition.ts';

const KEY_A = 'a1'.repeat(16), KEY_B = 'b2'.repeat(16), KEY_C = 'c3'.repeat(16);

class FakeSock {
  sent: FromRoom[] = [];
  closed: { code?: number } | null = null;
  meta: FMeta | null = null;
  send(d: string) {
    if (this.closed) throw new Error('closed');
    const m = parseFromRoom(d);
    if (!m) throw new Error(`bad from room: ${d}`);
    this.sent.push(m);
  }
  close(code?: number) {
    this.closed = { code };
  }
  kinds() {
    return this.sent.map((m) => m.k);
  }
}

let now = 1_000_000;
let socks: FakeSock[];
let core: ForestCore<FakeSock>;
const io = (): ForestIO<FakeSock> => ({
  sockets: () => socks.filter((s) => !s.closed),
  meta: (s) => s.meta,
  setMeta: (s, m) => void (s.meta = m),
  keys: { KEY_A, KEY_B, KEY_C },
  now: () => now
});
const join = (key: string) => {
  const s = new FakeSock();
  socks.push(s);
  core.open(s);
  core.message(s, JSON.stringify({ k: 'hello', key, v: 1 }));
  return s;
};
const say = (s: FakeSock, m: object) => core.message(s, JSON.stringify(m));

beforeEach(() => {
  socks = [];
  now = 1_000_000;
  core = new ForestCore(io());
});

describe('the forest room', () => {
  it('welcomes a person by key, tells the others, and closes a bad key or a first message that isn’t hello', () => {
    const a = join(KEY_A);
    expect(a.sent[0]).toMatchObject({ k: 'welcome', me: 'A', here: ['A'], host: null, t: now });
    const b = join(KEY_B);
    expect(b.sent[0]).toMatchObject({ k: 'welcome', me: 'B', here: ['A', 'B'] });
    expect(a.sent.at(-1)).toEqual({ k: 'here', who: 'B', on: true });
    const x = join('ff'.repeat(16));
    expect(x.closed?.code).toBe(FCLOSE.key);
    const y = new FakeSock();
    socks.push(y);
    core.open(y);
    say(y, { k: 'ping', c: 1 });
    expect(y.closed?.code).toBe(FCLOSE.hello);
  });
  it('relays a message to the others stamped with its sender, never letting one speak for another', () => {
    const a = join(KEY_A), b = join(KEY_B), g = join(KEY_C);
    say(b, { k: 'p', who: 'A', x: 1, z: 2, f: 0, v: 0, st: 'ok', top: false, n: 0, run: false });
    expect(a.sent.at(-1)).toMatchObject({ k: 'p', who: 'B', from: 'B', x: 1 });
    expect(g.sent.at(-1)).toMatchObject({ k: 'p', who: 'B' });
    expect(b.kinds()).not.toContain('p');
    say(g, { k: 'revive', who: 'A', by: 'B' });
    expect(a.sent.at(-1)).toMatchObject({ k: 'revive', who: 'A', by: 'G', from: 'G' });
  });
  it('lets only the round’s host send the bears and the world’s answers; a handover only once the host is gone', () => {
    const a = join(KEY_A), b = join(KEY_B);
    say(a, { k: 'start', t0: now + 3000, seed: 1, players: ['A', 'B'], bears: 1, host: 'A' });
    expect(b.sent.at(-1)).toMatchObject({ k: 'start', from: 'A' });
    const bear = { k: 'bear', b: [{ x: 0, z: 0, f: 0, v: 0, st: 'wander' }], t: 1 };
    say(b, bear);
    expect(a.kinds()).not.toContain('bear');
    say(a, bear);
    expect(b.sent.at(-1)).toMatchObject({ k: 'bear', from: 'A' });
    // B can't take over while A is here; once A's socket closes it can
    say(b, { k: 'host', who: 'B' });
    expect(a.kinds()).not.toContain('host');
    a.closed = { code: 1000 };
    core.close(a);
    say(b, { k: 'host', who: 'B' });
    const a2 = join(KEY_A);
    expect(a2.sent[0]).toMatchObject({ k: 'welcome', host: 'B' });
    say(a2, bear);
    expect(b.sent.filter((m) => m.k === 'bear')).toHaveLength(1);
  });
  it('answers a ping with its clock; tells the others when someone’s last socket goes', () => {
    const a = join(KEY_A), b = join(KEY_B);
    now += 5;
    say(a, { k: 'ping', c: 7 });
    expect(a.sent.at(-1)).toEqual({ k: 'pong', c: 7, t: now });
    b.closed = { code: 1000 };
    core.close(b);
    expect(a.sent.at(-1)).toEqual({ k: 'here', who: 'B', on: false });
  });
  it('replaces a person’s older socket with the newer', () => {
    const a1 = join(KEY_A);
    const a2 = join(KEY_A);
    expect(a1.closed?.code).toBe(FCLOSE.replaced);
    expect(a2.sent[0]).toMatchObject({ k: 'welcome', me: 'A', here: ['A'] });
  });
  it('rate-limits the position stream apart from the rest, and drops what isn’t a game message', () => {
    const a = join(KEY_A), b = join(KEY_B);
    const p = { k: 'p', who: 'A', x: 0, z: 0, f: 0, v: 0, st: 'ok', top: false, n: 0, run: false };
    for (let i = 0; i < 60; i++) say(a, p);
    say(a, { k: 'pick', who: 'A', id: 3 });
    expect(b.sent.filter((m) => m.k === 'p')).toHaveLength(40);
    expect(b.sent.at(-1)).toMatchObject({ k: 'pick', id: 3 });
    const before = b.sent.length;
    say(a, { k: 'walk', x: 1 });
    say(a, { k: 'p', x: Number.NaN });
    core.message(a, '{"k":"p","x":' + '1'.repeat(3000) + '}');
    expect(b.sent.length).toBe(before);
  });
  it('closes a socket that never said hello', () => {
    const s = new FakeSock();
    socks.push(s);
    core.open(s);
    expect(core.sweep()).toBe(now + FOREST_HELLO_MS);
    now += FOREST_HELLO_MS;
    core.sweep();
    expect(s.closed?.code).toBe(FCLOSE.hello);
  });
});
