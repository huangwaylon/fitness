import { describe, expect, it } from 'vitest';
import { ACTS, MUSIC_MS_MAX, MUSIC_SKEW_MS, MUSIC_STOP_KEEP_MS, musicAt, musicBeats, musicEnd, musicLive, newerMusic, DROPS, FISH_PHASES, HOWS, MAX_BYTES, SAY_MAX, isAcked, VIA_MAX, cleanSay, WORLD_OPS, claimOf, dayStart, isStored, isWorldPt, otherVersion, parseClient, parseServer, tokyoDay, type Act, type Target, type WorldOp } from './live-protocol.ts';
import { PLAN } from '#lib/world/world.ts';
import { CHUNK, GRID, tileMid, tileX, tileZ } from '#lib/layout/grid.ts';
import { WORLD_X, WORLD_Z, layoutOpOf } from './layout.ts';

const KEY = 'ab'.repeat(32);
/** As the one version speaks (v3: v1 and v2 went on 2026-11-05). */
const j = (o: object) => JSON.stringify({ v: 3, ...o });
/** A v1 phone's message (refused). */
const v1 = (o: object) => JSON.stringify({ v: 1, ...o });

describe('live protocol: client messages', () => {
  it('accepts hello, ping and each intent kind, keeping only known fields', () => {
    expect(parseClient(j({ kind: 'hello', key: KEY, since: 5 }))).toEqual({ v: 3, kind: 'hello', key: KEY, since: 5 });
    expect(parseClient(j({ kind: 'ping', c: 1_790_000_000_000 }))).toEqual({ v: 3, kind: 'ping', c: 1_790_000_000_000 });
    expect(parseClient(j({ kind: 'walk', to: 'shoreC', at: 9, extra: 'x' }))).toEqual({ v: 3, kind: 'walk', to: 'shoreC', at: 9 });
    expect(parseClient(j({ kind: 'walk', to: [120, -4] }))).toEqual({ v: 3, kind: 'walk', to: [120, -4] });
    expect(parseClient(j({ kind: 'act', act: 'weed', id: 'w:3' }))).toEqual({ v: 3, kind: 'act', act: 'weed', id: 'w:3' });
    expect(parseClient(j({ kind: 'catch', what: 'sea-bass' }))).toEqual({ v: 3, kind: 'catch', what: 'sea-bass' });
    expect(parseClient(j({ kind: 'world', op: 'watered', id: 'fl:1:2' }))).toEqual({ v: 3, kind: 'world', op: 'watered', id: 'fl:1:2' });
    expect(parseClient(j({ kind: 'saved', at: 'x' }))).toEqual({ v: 3, kind: 'saved' });
  });

  it('accepts every act, world op and both kinds of walk target', () => {
    for (const act of ACTS as readonly Act[]) expect(parseClient(j({ kind: 'act', act })), act).not.toBeNull();
    for (const op of WORLD_OPS as readonly WorldOp[]) expect(parseClient(j({ kind: 'world', op, id: 'x1' })), op).not.toBeNull();
    for (const to of ['shoreC', [0, 0]] as Target[]) expect(parseClient(j({ kind: 'walk', to }))).not.toBeNull();
  });

  it('strips who and t: the relay stamps those', () => {
    expect(parseClient(j({ kind: 'act', act: 'tap', who: 'B', t: 3 }))).toEqual({ v: 3, kind: 'act', act: 'tap' });
  });

  it('refuses the wrong version, junk, unknown kinds, bad fields and anything too big', () => {
    for (const bad of [
      JSON.stringify({ v: 4, kind: 'ping', c: 1 }),
      // v1 and v2 (gone 2026-11-05)
      JSON.stringify({ v: 1, kind: 'ping', c: 1 }),
      JSON.stringify({ v: 2, kind: 'ping', c: 1 }),
      JSON.stringify({ kind: 'ping', c: 1 }),
      'nope',
      '[1]',
      'null',
      j({ kind: 'teleport' }),
      j({ kind: 'hello', key: 'short' }),
      j({ kind: 'hello', key: KEY.toUpperCase() }),
      j({ kind: 'ping', c: -1 }),
      j({ kind: 'walk', to: [1.5, 2] }),
      j({ kind: 'walk', to: [1, 2, 3] }),
      j({ kind: 'walk', to: 'has space' }),
      j({ kind: 'act', act: 'explode' }),
      j({ kind: 'act', act: 'weed', id: 'x'.repeat(33) }),
      j({ kind: 'emote', emote: 'glee' }),
      j({ kind: 'world', op: 'nuke', id: 'a' }),
      j({ kind: 'world', op: 'dug', id: 'd1' }),
      j({ kind: 'world', op: 'watered' }),
      j({ kind: 'act', act: 'tap', pad: 'x'.repeat(MAX_BYTES) })
    ]) expect(parseClient(bad), bad).toBeNull();
    expect(parseClient(42)).toBeNull();
  });

  it('keeps every intent within the size budget', () => {
    const big = { kind: 'act', act: 'present', id: 'x'.repeat(32), at: 1_790_000_000_000 };
    expect(j(big).length).toBeLessThanOrEqual(100);
    expect(j({ ...big, who: 'A', t: 1_790_000_000_000 }).length).toBeLessThanOrEqual(128);
  });
});

describe('live protocol: relay messages', () => {
  it('accepts welcome, pong, presence and relayed intents', () => {
    expect(parseServer(j({ kind: 'welcome', me: 'A', peer: true, t: 1 }))).toEqual({ v: 3, kind: 'welcome', me: 'A', peer: true, t: 1 });
    // over the room's rate limit (2026-11-05): a numbered intent's `busy`
    expect(parseServer(j({ kind: 'busy', c: 42, t: 1 }))).toEqual({ v: 3, kind: 'busy', c: 42, t: 1 });
    expect(parseServer(j({ kind: 'busy', c: -1, t: 1 }))).toBeNull();
    const rec = { at: '2026-11-01T01:02:03.456Z', rev: 'e1' };
    expect(parseServer(j({ kind: 'welcome', me: 'A', peer: true, t: 1, rec }))).toEqual({ v: 3, kind: 'welcome', me: 'A', peer: true, t: 1, rec });
    expect(parseServer(j({ kind: 'welcome', me: 'A', peer: true, t: 1, rec: { at: 'soon', rev: 'e1' } }))).toEqual({ v: 3, kind: 'welcome', me: 'A', peer: true, t: 1 }); // a bad mark: as without one
    // when each person not here left (2026-11): a bad time left out
    expect(parseServer(j({ kind: 'welcome', me: 'A', peer: false, t: 1, here: [], gone: { A: 5, B: 'x', Z: 3, G: 7 } }))).toEqual({ v: 3, kind: 'welcome', me: 'A', peer: false, t: 1, here: [], gone: { A: 5, G: 7 } });
    expect(parseServer(j({ kind: 'pong', c: 1, t: 2 }))).toEqual({ v: 3, kind: 'pong', c: 1, t: 2 });
    expect(parseServer(j({ kind: 'presence', who: 'B', on: false, t: 3 }))).toEqual({ v: 3, kind: 'presence', who: 'B', on: false, t: 3 });
    expect(parseServer(j({ kind: 'walk', to: [1, 2], who: 'B', t: 4 }))).toEqual({ v: 3, kind: 'walk', to: [1, 2], who: 'B', t: 4 });
    expect(parseServer(j({ kind: 'saved', who: 'A', t: 5 }))).toEqual({ v: 3, kind: 'saved', who: 'A', t: 5 });
  });

  it('accepts a sheet change with its known fields only, and refuses a bad one', () => {
    const n = { what: 'event', who: 'B', at: '2026-11-01T01:02:03.456Z', rev: 'mhf0a1b2' };
    expect(parseServer(j({ kind: 'changed', ...n, t: 6, extra: 1 }))).toEqual({ v: 3, kind: 'changed', ...n, t: 6 });
    expect(parseServer(j({ kind: 'changed', ...n }))).toBeNull();
    expect(parseServer(j({ kind: 'changed', ...n, at: 'yesterday', t: 6 }))).toBeNull();
    expect(parseServer(j({ kind: 'changed', ...n, what: 'resync', t: 6 }))).toBeNull();
    expect(parseServer(j({ kind: 'changed', ...n, rev: undefined, t: 6 }))).toBeNull();
  });

  it('refuses a relayed intent without who or t, and an unknown person', () => {
    expect(parseServer(j({ kind: 'walk', to: 'a', t: 4 }))).toBeNull();
    expect(parseServer(j({ kind: 'walk', to: 'a', who: 'B' }))).toBeNull();
    expect(parseServer(j({ kind: 'walk', to: 'a', who: 'C', t: 4 }))).toBeNull();
    expect(parseServer(j({ kind: 'welcome', me: 'Z', peer: true, t: 1 }))).toBeNull();
    expect(parseServer(j({ kind: 'hello', key: KEY, t: 1 }))).toBeNull();
  });
});

describe('live protocol: world points', () => {
  it('takes a node id or an integer point within the world extent (world/world.ts PLAN lies inside it)', () => {
    expect(WORLD_X[0]).toBeLessThanOrEqual(PLAN.x0);
    expect(WORLD_X[1]).toBeGreaterThanOrEqual(PLAN.x1);
    expect(WORLD_Z[0]).toBeLessThanOrEqual(PLAN.z0);
    expect(WORLD_Z[1]).toBeGreaterThanOrEqual(PLAN.z1);
    const far = [WORLD_X[0], WORLD_Z[1]];
    expect(parseClient(j({ kind: 'walk', to: far, at: 9 }))).toEqual({ v: 3, kind: 'walk', to: far, at: 9 });
    expect(parseClient(j({ kind: 'walk', to: 'bridgeStoneN' }))).toEqual({ v: 3, kind: 'walk', to: 'bridgeStoneN' });
    for (const to of [[WORLD_X[1] + 1, 0], [0, -461], [-231, 0], [0, WORLD_Z[1] + 1], [0.5, 0], [0, 0, 0]]) expect(parseClient(j({ kind: 'walk', to })), String(to)).toBeNull();
    expect(parseServer(j({ kind: 'walk', to: [WORLD_X[1] + 80, 0], who: 'B', t: 4 }))).toBeNull();
    expect(isWorldPt([620, -460])).toBe(true);
  });

  it('tells a version nobody speaks apart from junk', () => {
    expect(otherVersion(JSON.stringify({ v: 4, kind: 'hello' }))).toBe(4);
    expect(otherVersion(JSON.stringify({ v: 0 }))).toBe(0);
    expect(otherVersion(JSON.stringify({ v: 2, kind: 'hello' }))).toBe(2);
    for (const x of [j({ kind: 'x' }), JSON.stringify({ kind: 'ping' }), JSON.stringify({ v: '3' }), 'nope', 'null', '[3]', 3])
      expect(otherVersion(x), String(x)).toBeNull();
  });
});

describe('live protocol: the shared world', () => {
  it('takes a catch with where and how, a pick, a put, a shake and an act at a point', () => {
    expect(parseClient(j({ kind: 'catch', what: 'sea-bass', id: 'fish:12', at: [120, -40], how: 'rod', x: 1 })))
      .toEqual({ v: 3, kind: 'catch', what: 'sea-bass', id: 'fish:12', at: [120, -40], how: 'rod' });
    for (const how of HOWS) expect(parseClient(j({ kind: 'catch', what: 'koi', id: 'a', how })), how).not.toBeNull();
    expect(parseClient(j({ kind: 'pick', id: 's4560', what: 'present:item:froggy-chair', at: [1, 2] })))
      .toEqual({ v: 3, kind: 'pick', id: 's4560', what: 'present:item:froggy-chair', at: [1, 2] });
    expect(parseClient(j({ kind: 'put', id: 'p1', what: 'present', at: [1, 2] }))).toEqual({ v: 3, kind: 'put', id: 'p1', what: 'present', at: [1, 2] });
    for (const drop of DROPS) expect(parseClient(j({ kind: 'shake', tree: 'oak-p1', drop })), drop).toEqual({ v: 3, kind: 'shake', tree: 'oak-p1', drop });
    expect(parseClient(j({ kind: 'act', act: 'bush', id: 'hedge-2', pt: [36, 596] }))).toEqual({ v: 3, kind: 'act', act: 'bush', id: 'hedge-2', pt: [36, 596] });
    expect(parseServer(j({ kind: 'pick', id: 'w1', what: 'weed', who: 'B', t: 9 }))).toEqual({ v: 3, kind: 'pick', id: 'w1', what: 'weed', who: 'B', t: 9 });
  });

  it('refuses bad fields', () => {
    for (const bad of [
      j({ kind: 'catch', what: 'koi', id: 'a', how: 'zap' }),
      j({ kind: 'catch', what: 'koi', id: 'a', at: [9999, 0] }),
      j({ kind: 'pick', id: 'w1' }),
      j({ kind: 'pick', id: 'w1', what: 'Weed' }),
      j({ kind: 'pick', what: 'weed' }),
      j({ kind: 'put', id: 'p1', what: 'present' }),
      j({ kind: 'shake', tree: 'oak-p1', drop: 'fruit' }),
      j({ kind: 'shake', drop: 'nest' })
    ]) expect(parseClient(bad), bad).toBeNull();
  });

  it('names what an intent claims, and what the room keeps', () => {
    expect(claimOf({ kind: 'catch', what: 'koi', id: 'fish:1' })).toBe('catch:fish:1');
    expect(claimOf({ kind: 'catch', what: 'koi' })).toBeNull();
    expect(claimOf({ kind: 'pick', id: 'p1', what: 'present' })).toBe('pick:p1');
    expect(claimOf({ kind: 'put', id: 'p1', what: 'present', at: [0, 0] })).toBe('put:p1');
    expect(claimOf({ kind: 'shake', tree: 't', drop: 'nest' })).toBeNull();
    expect(isStored({ kind: 'walk', to: [1, 2] })).toBe(true);
    expect(isStored({ kind: 'act', act: 'tap' })).toBe(false);
    expect(isStored({ kind: 'catch', what: 'koi' })).toBe(false);
  });

  it('a Tokyo day runs midnight to midnight', () => {
    const d = tokyoDay(Date.UTC(2026, 10, 1, 3));
    expect(dayStart(d)).toBe(Date.UTC(2026, 9, 31, 15));
    expect(tokyoDay(Date.UTC(2026, 9, 31, 15) - 1)).toBe(d - 1);
  });
});

describe('live protocol: the very walk, acks and the day in one replay', () => {
  it('a walk may carry where from, the way (≤ VIA_MAX points), when it set off and how long', () => {
    const w = { kind: 'walk', to: [195, 900], from: [132, 214], via: [[160, 400]], s: 1_793_500_000_000, ms: 2400, f: 'home' };
    expect(parseClient(j(w))).toEqual({ v: 3, ...w });
    expect(parseClient(j({ ...w, f: 'up' }))).toBeNull();
    expect(parseClient(j({ ...w, via: Array.from({ length: VIA_MAX + 1 }, () => [1, 1]) }))).toBeNull();
    expect(parseClient(j({ ...w, ms: 60_001 }))).toBeNull();
    expect(parseClient(j({ ...w, from: [1.5, 2] }))).toBeNull();
    // the longest, sent (with its number) and relayed (with who and t), fits a message
    const far = [WORLD_X[0], WORLD_Z[1]], most = { ...w, to: far, from: far, via: Array.from({ length: VIA_MAX }, () => far), ms: 60_000 };
    expect(j({ ...most, c: 1_793_500_000_123 }).length).toBeLessThanOrEqual(MAX_BYTES);
    expect(parseServer(j({ ...most, who: 'A', t: 1_793_500_000_123 }))).not.toBeNull();
  });
  it('an intent may carry its sequence number c (a positive integer); a hello its build', () => {
    expect(parseClient(j({ kind: 'pick', id: 'a', what: 'weed', c: 7 }))).toEqual({ v: 3, c: 7, kind: 'pick', id: 'a', what: 'weed' });
    expect(parseClient(j({ kind: 'pick', id: 'a', what: 'weed', c: 0 }))).toBeNull();
    expect(parseClient(j({ kind: 'pick', id: 'a', what: 'weed', c: 1.5 }))).toBeNull();
    // (an older phone's batch flag: every replay is batched now, the flag left out)
    expect(parseClient(j({ kind: 'hello', key: KEY, batch: true }))).toEqual({ v: 3, kind: 'hello', key: KEY });
    // the build (2026-11-05): kept when it is one, left out (the hello still taken) when not
    expect(parseClient(j({ kind: 'hello', key: KEY, build: '2026-11-05.ef93d8b' }))).toEqual({ v: 3, kind: 'hello', key: KEY, build: '2026-11-05.ef93d8b' });
    expect(parseClient(j({ kind: 'hello', key: KEY, build: 'a b<script>' }))).toEqual({ v: 3, kind: 'hello', key: KEY });
    expect(parseClient(j({ kind: 'hello', key: KEY, build: 'x'.repeat(40) }))).toEqual({ v: 3, kind: 'hello', key: KEY });
    expect(parseClient(j({ kind: 'act', act: 'wake', id: 'B', at: 1_793_500_000_000 }))).toMatchObject({ act: 'wake', id: 'B' });
    expect(parseClient(j({ kind: 'world', op: 'woke', id: 'gulliver' }))).toMatchObject({ op: 'woke' });
  });
  it('an ack, and a replay up to REPLAY_BYTES (its bad events left out); nothing else that long', () => {
    expect(parseServer(j({ kind: 'ack', c: 3, t: 9, ok: false }))).toEqual({ v: 3, kind: 'ack', c: 3, t: 9, ok: false });
    expect(parseServer(j({ kind: 'ack', c: 3, t: 9 }))).toBeNull();
    const e = { v: 3, kind: 'pick', id: 'p1', what: 'find:shell:cowrie', at: [150, 40], who: 'A', t: 5 };
    const es = Array.from({ length: 120 }, (_, i) => ({ ...e, id: `p${i}` }));
    const raw = j({ kind: 'replay', es: [...es, { kind: 'pick', who: 'C', t: 1 }], t: 10 });
    expect(raw.length).toBeGreaterThan(MAX_BYTES);
    const m = parseServer(raw);
    expect(m?.kind === 'replay' && m.es.length).toBe(120);
    expect(parseServer(j({ kind: 'replay', es: Array.from({ length: 200 }, () => e), t: 10 }))).toBeNull();
    expect(parseServer(j({ kind: 'walk', to: [1, 2], who: 'B', t: 4, pad: 'x'.repeat(300), note: '"kind":"replay"' }))).toBeNull();
  });
});

describe('live protocol: decorations (v2)', () => {
  const T = 1_793_000_000_000;
  const set = { kind: 'decor', id: 'dmh1abc2a', at: T, item: 'stone-lantern', x: 120, z: 480, f: 3, p: T };
  it('takes a set (its whole state) and a removal, known fields only; the room keeps both; nothing claimed', () => {
    expect(parseClient(j({ ...set, c: T, extra: 1 }))).toEqual({ v: 3, c: T, ...set });
    expect(parseClient(j({ kind: 'decor', id: 'dmh1abc2a', at: T, rm: true }))).toEqual({ v: 3, kind: 'decor', id: 'dmh1abc2a', at: T, rm: true });
    expect(parseServer(j({ ...set, who: 'B', t: T + 3 }))).toEqual({ v: 3, ...set, who: 'B', t: T + 3 });
    expect(isStored({ ...set, kind: 'decor' } as never)).toBe(true);
    expect(claimOf({ ...set, kind: 'decor' } as never)).toBeNull();
  });
  it('refuses v1, a bad id, item, spot or facing, a removal with rm other than true', () => {
    for (const bad of [
      v1({ ...set }), j({ ...set, id: 'x1' }), j({ ...set, item: 'Sofa' }), j({ ...set, x: 1.5 }), j({ ...set, z: 99999 }), j({ ...set, f: 4 }),
      j({ ...set, p: undefined }), j({ kind: 'decor', id: 'dmh1abc2a', at: T, rm: 1 }), j({ kind: 'decor', id: 'dmh1abc2a', rm: true })
    ]) expect(parseClient(bad), bad).toBeNull();
  });
  it('fits the size budget numbered and relayed', () => {
    const big = { ...set, id: 'd' + 'z'.repeat(24), item: 'garden-wagon', x: -230, z: -460 };
    expect(j({ ...big, c: 1e15 - 1 }).length).toBeLessThanOrEqual(MAX_BYTES);
    expect(j({ ...big, who: 'B', t: T }).length).toBeLessThanOrEqual(MAX_BYTES);
  });
});

describe('live protocol: the island layout at the grid\'s far end (o, c ops, walks and drags: contract/layout.ts bounds)', () => {
  const T = 1_793_000_000_000;
  // the last land row (the grid's last row is its ring of sea) and its last column
  const c = GRID.cols - 1, r = GRID.rows - 2;
  const [x, z] = tileMid(c, r);
  const lastChunk = `c${Math.ceil(GRID.cols / CHUNK) - 1}x${Math.ceil(GRID.rows / CHUNK) - 1}`;
  it('relays an object, a chunk, a walk and a drag there', () => {
    const o = { kind: 'decor', sc: 'o', id: 'o1abc', at: T, k: 'bench', x: c, z: GRID.rows - 1, f: 0 };
    expect(parseClient(j(o))).toEqual({ v: 3, ...o });
    const ch = { kind: 'decor', sc: 'c', id: lastChunk, at: T, g: '4'.repeat(64) };
    expect(parseClient(j(ch))).toEqual({ v: 3, ...ch });
    const walk = { kind: 'walk', to: [x, z], from: [x, z - 30], via: [[x - 30, z]] };
    expect(parseClient(j(walk))).toEqual({ v: 3, ...walk });
    expect(parseServer(j({ ...walk, who: 'B', t: T }))).not.toBeNull();
    const drag = { kind: 'drag', sc: 'o', id: 'o1abc', x, z, f: 1 };
    expect(parseClient(j(drag))).toEqual({ v: 3, ...drag });
    expect(parseClient(j({ kind: 'act', act: 'cast', pt: [x, z] }))).not.toBeNull();
  });
  it('takes the layout ops the record takes, no more (the same edges as contract/layout.ts layoutOpOf)', () => {
    const o = (x: number, z: number) => ({ sc: 'o', id: 'o1abc', at: T, k: 'bench', x, z, f: 0 });
    const ch = (id: string) => ({ sc: 'c', id, at: T, g: '0'.repeat(64) });
    const ops = [
      o(0, 0), o(GRID.cols - 1, GRID.rows - 1), o(127, 255), o(128, 0), o(0, 256), o(-1, 0), o(0, 155.5),
      ch('c0x0'), ch(lastChunk), ch('c15x31'), ch('c16x0'), ch('c0x32'), ch('c00x1')
    ];
    for (const op of ops) expect(parseClient(j({ kind: 'decor', ...op })) !== null, JSON.stringify(op)).toBe(layoutOpOf(op) !== null);
  });
  it('the world extent holds the grid at its largest and the island plan (world/world.ts PLAN: its depth order to the grid\'s far end)', () => {
    expect(WORLD_X[1]).toBeGreaterThanOrEqual(tileX(128));
    expect(WORLD_Z[1]).toBeGreaterThanOrEqual(tileZ(256));
    expect(PLAN.z1).toBe(tileZ(GRID.rows));
  });
});

describe('live protocol: the tent (v2)', () => {
  const T = 1_793_000_000_000;
  const set = { kind: 'decor', sc: 't', id: 'dmh1abc2a', at: T, item: 'f4041', x: 7, z: 0, f: 1, p: T };
  it('a decor op in the tent keeps its scope; its tiles are the room’s', () => {
    expect(parseClient(j(set))).toEqual({ v: 3, ...set });
    expect(parseServer(j({ ...set, who: 'A', t: T }))).toEqual({ v: 3, ...set, who: 'A', t: T });
    expect(parseClient(j({ kind: 'decor', sc: 't', id: 'dmh1abc2a', at: T, rm: true }))).toEqual({ v: 3, kind: 'decor', sc: 't', id: 'dmh1abc2a', at: T, rm: true });
    for (const bad of [j({ ...set, x: 8 }), j({ ...set, sc: 'x' }), j({ ...set, z: -1 })]) expect(parseClient(bad), bad).toBeNull();
    // a light's switch
    expect(parseClient(j({ ...set, l: 0 }))).toEqual({ v: 3, ...set, l: 0 });
    expect(parseClient(j({ ...set, l: 3 }))).toBeNull();
    // a light's switch alone (2026-11-05): a room's only, nothing else on it
    const lt = { kind: 'decor', sc: 'u', id: 'dmh1abc2a', at: T, lt: 0 };
    expect(parseClient(j(lt))).toEqual({ v: 3, ...lt });
    expect(parseServer(j({ ...lt, who: 'B', t: T }))).toEqual({ v: 3, ...lt, who: 'B', t: T });
    expect(parseClient(j({ ...lt, x: 3, item: 'f4041' }))).toEqual({ v: 3, ...lt });
    for (const bad of [j({ ...lt, lt: 2 }), j({ ...lt, sc: undefined }), j({ ...lt, sc: 'o', id: 'tree1' })]) expect(parseClient(bad), bad).toBeNull();
    // on another piece's surface
    expect(parseClient(j({ ...set, on: 'dmh1table1' }))).toEqual({ v: 3, ...set, on: 'dmh1table1' });
    for (const bad of [j({ ...set, on: 'nope' }), j({ ...set, sc: undefined, on: 'dmh1table1', x: 100, z: 100 })]) expect(parseClient(bad), bad).toBeNull();
  });
  it('a line’s step (`fish`, v3) is presence only: every phase, a world point, never kept, acked or claimed, small; the guest sends it', () => {
    const cast = { kind: 'fish', ph: 'cast', id: 'fresh:clifftop:8639', pt: [375, 1470], from: [380, 1430], s: T };
    expect(parseClient(j(cast))).toEqual({ v: 3, ...cast });
    for (const ph of FISH_PHASES) expect(parseClient(j({ kind: 'fish', ph })), ph).toEqual({ v: 3, kind: 'fish', ph });
    expect(parseClient(j({ ...cast, extra: 1 }))).toEqual({ v: 3, ...cast });
    expect(parseServer(j({ ...cast, who: 'G', t: T }))).toEqual({ v: 3, ...cast, who: 'G', t: T });
    expect(j(cast).length).toBeLessThanOrEqual(120);
    for (const bad of [j({ ...cast, ph: 'gone' }), j({ ...cast, pt: [1.5, 2] }), j({ ...cast, from: [WORLD_X[1] + 1, 0] }), j({ ...cast, id: 'a b' }), j({ ...cast, s: 'x' }), JSON.stringify({ v: 2, ...cast })])
      expect(parseClient(bad), bad).toBeNull();
    expect(isStored(cast as never)).toBe(false);
    expect(isAcked(cast as never)).toBe(false);
    expect(claimOf(cast as never)).toBeNull();
  });

  it('a drag and the villager inside are presence only: never kept, never claimed, small', () => {
    const drag = { kind: 'drag', id: 'dmh1abc2a', x: -12, z: 33, f: 2 };
    expect(parseClient(j(drag))).toEqual({ v: 3, ...drag });
    expect(parseClient(j({ ...drag, it: 'f4041', end: true }))).toEqual({ v: 3, ...drag, it: 'f4041', end: true });
    expect(j(drag).length).toBeLessThanOrEqual(60);
    for (const bad of [j({ ...drag, x: 41 }), j({ ...drag, x: 1.5 }), j({ ...drag, end: 1 }), j({ ...drag, it: 'Bad Item' }), v1({ ...drag })]) expect(parseClient(bad), bad).toBeNull();
    const walk = { kind: 'tent', in: true, from: [-7, 22], via: [[0, 10]], to: [20, -30], s: T, ms: 1800 };
    expect(parseClient(j(walk))).toEqual({ v: 3, ...walk });
    expect(parseServer(j({ kind: 'tent', in: false, who: 'B', t: T }))).toEqual({ v: 3, kind: 'tent', in: false, who: 'B', t: T });
    for (const bad of [j({ ...walk, in: 1 }), j({ ...walk, to: [50, 0] }), j({ ...walk, via: [[0, 99]] })]) expect(parseClient(bad), bad).toBeNull();
    // in the museum (`sc: 'm'`): its points over its own wider extent (a home's room's only within its own)
    const museum = { ...walk, from: [0, 56], via: [[60, 10]], to: [0, -500], sc: 'm' };
    expect(parseClient(j(museum))).toEqual({ v: 3, ...museum });
    expect(parseServer(j({ kind: 'tent', in: true, to: [-250, 80], sc: 'm', who: 'G', t: T }))).toEqual({ v: 3, kind: 'tent', in: true, to: [-250, 80], sc: 'm', who: 'G', t: T });
    for (const bad of [j({ ...museum, to: [600, 0] }), j({ ...museum, sc: 'u' }), j({ ...museum, sc: 'x' })]) expect(parseClient(bad), bad).toBeNull();
    // in the shop (`sc: 's'`): in or out (an older app's, no points), or a walk over its floor; nowhere to sit
    expect(parseClient(j({ kind: 'tent', in: true, sc: 's' }))).toEqual({ v: 3, kind: 'tent', in: true, sc: 's' });
    expect(parseServer(j({ kind: 'tent', in: true, sc: 's', who: 'A', t: T }))).toEqual({ v: 3, kind: 'tent', in: true, sc: 's', who: 'A', t: T });
    const shop = { kind: 'tent', in: true, from: [-20, 38], via: [[-12, 26]], to: [-68, -45], s: T, ms: 2400, sc: 's' };
    expect(parseClient(j(shop))).toEqual({ v: 3, ...shop });
    expect(parseServer(j({ kind: 'tent', in: true, to: [61, 23], sc: 's', who: 'G', t: T }))).toEqual({ v: 3, kind: 'tent', in: true, to: [61, 23], sc: 's', who: 'G', t: T });
    for (const bad of [j({ ...shop, to: [90, 0] }), j({ kind: 'tent', in: true, sc: 's', seat: 'dmh1sofa01', s: T })]) expect(parseClient(bad), bad).toBeNull();
    // sitting or lying on a piece
    const sit = { kind: 'tent', in: true, to: [0, 10], seat: 'dmh1sofa01', n: 1, s: T };
    expect(parseClient(j(sit))).toEqual({ v: 3, ...sit });
    expect(parseClient(j({ ...sit, lie: true }))).toEqual({ v: 3, ...sit, lie: true });
    for (const bad of [j({ ...sit, seat: 'x' }), j({ ...sit, n: 9 }), j({ ...sit, lie: 1 })]) expect(parseClient(bad), bad).toBeNull();
    for (const i of [drag, walk]) {
      expect(isStored(i as never)).toBe(false);
      expect(claimOf(i as never)).toBeNull();
    }
  });
});

describe('live protocol: a phrase (v2 `say`, presence only)', () => {
  it('cleans it: NFC, no controls, newlines or bidi tricks, blanks squeezed, trimmed, at most SAY_MAX', () => {
    expect(cleanSay('  やっほー！ ')).toBe('やっほー！');
    expect(cleanSay('が\nんば\r\nろう\t！')).toBe('が んば ろう ！');
    expect(cleanSay('a\u202Eb\u2066c\u200Bd\u0000e\u0007\uFEFF')).toBe('abcde');
    expect(cleanSay('x    y')).toBe('x y');
    expect(cleanSay('é')).toBe('é');
    expect(cleanSay('ふたりで　ぜんぶ')).toBe('ふたりで　ぜんぶ');
    const family = '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}';
    expect(cleanSay(`${family} やったね`)).toBe(`${family} やったね`);
    expect(cleanSay('あ'.repeat(30))).toBe('あ'.repeat(SAY_MAX));
    expect(Array.from(cleanSay('\u{1F600}'.repeat(30))!)).toHaveLength(SAY_MAX);
    expect(cleanSay('\uD800x')).toBe('x'); // a lone surrogate
    expect(cleanSay('<b>hi</b>')).toBe('<b>hi</b>'); // text: rendered as text
    for (const x of ['', '   ', '\n\u200B', 5, null, {}, 'x'.repeat(2000)]) expect(cleanSay(x)).toBeNull();
  });

  it('a v2 intent, cleaned on the way in and out; never v1; never kept or claimed', () => {
    expect(parseClient(j({ kind: 'say', text: ' がんばろう！\n', at: 4 }))).toEqual({ v: 3, kind: 'say', text: 'がんばろう！' });
    expect(parseClient(v1({ kind: 'say', text: 'hi' }))).toBeNull();
    for (const text of [undefined, '', ' \n ', 3]) expect(parseClient(j({ kind: 'say', text }))).toBeNull();
    expect(parseServer(j({ kind: 'say', text: 'a\u202Eb', who: 'B', t: 9 }))).toEqual({ v: 3, kind: 'say', text: 'ab', who: 'B', t: 9 });
    // where it was said (a home's room; none: the island), additive: kept through the relay, an unknown place refused
    expect(parseClient(j({ kind: 'say', text: 'やっほー！', sc: 'u' }))).toEqual({ v: 3, kind: 'say', text: 'やっほー！', sc: 'u' });
    expect(parseServer(j({ kind: 'say', text: 'hi', sc: 't', who: 'G', t: 9 }))).toEqual({ v: 3, kind: 'say', text: 'hi', sc: 't', who: 'G', t: 9 });
    expect(parseClient(j({ kind: 'say', text: 'みて！', sc: 'm' }))).toEqual({ v: 3, kind: 'say', text: 'みて！', sc: 'm' });
    for (const sc of ['o', 'x', 1, null]) expect(parseClient(j({ kind: 'say', text: 'hi', sc }))).toBeNull();
    expect(isStored({ kind: 'say', text: 'x' })).toBe(false);
    expect(claimOf({ kind: 'say', text: 'x' })).toBeNull();
    // twenty of the widest characters still fit a relayed message
    expect(JSON.stringify({ v: 3, kind: 'say', text: '\u{1F600}'.repeat(SAY_MAX), who: 'A', t: 1_793_527_259_353 }).length).toBeLessThanOrEqual(MAX_BYTES);
  });
});

describe('live protocol: a high-five (v2, the relay only)', () => {
  it('a highfive at a time, numbered and sent with the partner away, never kept in the day; got answers one heard', () => {
    expect(parseClient(j({ kind: 'highfive', at: 1_793_000_000_000, c: 4, x: 1 }))).toEqual({ v: 3, c: 4, kind: 'highfive', at: 1_793_000_000_000 });
    expect(parseServer(j({ kind: 'highfive', at: 5, who: 'B', t: 9 }))).toEqual({ v: 3, kind: 'highfive', at: 5, who: 'B', t: 9 });
    expect(parseClient(j({ kind: 'got', at: 5 }))).toEqual({ v: 3, kind: 'got', at: 5 });
    for (const bad of [v1({ kind: 'highfive', at: 5 }), v1({ kind: 'got', at: 5 }), j({ kind: 'highfive' }), j({ kind: 'highfive', at: -1 }), j({ kind: 'got', at: 'x' })]) expect(parseClient(bad), bad).toBeNull();
    const hf = { kind: 'highfive', at: 5 } as const;
    expect(isAcked(hf)).toBe(true);
    expect(isStored(hf)).toBe(false);
    expect(claimOf(hf)).toBeNull();
    expect(isAcked({ kind: 'say', text: 'x' })).toBe(false);
    expect(isAcked({ kind: 'walk', to: [1, 2] })).toBe(true);
  });
});

describe('live protocol: ききみみ クイズ (`quiz`, presence only)', () => {
  const g = 'k3x9a2';
  const T = 1_793_527_259_353;
  const ops = [
    { kind: 'quiz', g, op: 'open', seed: 4_294_967_295, lv: 3, same: false },
    { kind: 'quiz', g, op: 'join' },
    { kind: 'quiz', g, op: 'leave' },
    { kind: 'quiz', g, op: 'go', at: T },
    { kind: 'quiz', g, op: 'a', i: 7, k: 3, rp: true, s: 1040 },
    { kind: 'quiz', g, op: 'skip', i: 0, at: T },
    { kind: 'quiz', g, op: 'skip', i: 8, at: T },
    { kind: 'quiz', g, op: 'end' }
  ];

  it('each op, its known fields only (another op’s dropped), out through the relay as it came in', () => {
    for (const o of ops) {
      expect(parseClient(j({ ...o, extra: 'x', who: 'B', t: 3 })), o.op).toEqual({ v: 3, ...o });
      expect(parseServer(j({ ...o, who: 'G', t: T })), o.op).toEqual({ v: 3, ...o, who: 'G', t: T });
    }
    expect(parseClient(j({ kind: 'quiz', g, op: 'join', seed: 5, at: T, i: 1 }))).toEqual({ v: 3, kind: 'quiz', g, op: 'join' });
    expect(parseClient(j({ kind: 'quiz', g: 'abcd', op: 'open', seed: 0, lv: 1, same: true }))).toEqual({ v: 3, kind: 'quiz', g: 'abcd', op: 'open', seed: 0, lv: 1, same: true });
    expect(parseClient(j({ kind: 'quiz', g, op: 'a', i: 0, k: 0, rp: false, s: 0 }))).toEqual({ v: 3, kind: 'quiz', g, op: 'a', i: 0, k: 0, rp: false, s: 0 });
  });

  it('levels 1-8 (4 もり, 5 アナウンス, 6 やま, 7 ほし, 8 room for the next: the relay passes them before the phones offer them)', () => {
    for (const lv of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const o = { kind: 'quiz', g, op: 'open', seed: 7, lv, same: false };
      expect(parseClient(j(o)), String(lv)).toEqual({ v: 3, ...o });
      expect(parseServer(j({ ...o, who: 'A', t: T })), String(lv)).toEqual({ v: 3, ...o, who: 'A', t: T });
    }
  });

  it('refuses junk: a bad game id, op or field', () => {
    const [open, , , go, a, skip] = ops;
    const bad = [
      { ...open, g: 'abc' }, { ...open, g: 'abcdefghi' }, { ...open, g: 'ABCD' }, { ...open, g: 'ab-cd' }, { ...open, g: 1234 }, { kind: 'quiz', op: 'join' },
      { ...open, op: 'start' }, { ...open, op: undefined },
      { ...open, seed: -1 }, { ...open, seed: 4_294_967_296 }, { ...open, seed: 1.5 }, { ...open, seed: '1' }, { ...open, lv: 0 }, { ...open, lv: 9 }, { ...open, lv: 1.5 }, { ...open, same: 1 }, { ...open, same: undefined },
      { ...go, at: -1 }, { ...go, at: 'now' }, { ...go, at: undefined },
      { ...a, i: 8 }, { ...a, i: -1 }, { ...a, k: 4 }, { ...a, k: 0.5 }, { ...a, rp: 0 }, { ...a, s: 1041 }, { ...a, s: -1 }, { ...a, s: undefined },
      { ...skip, i: 9 }, { ...skip, i: -1 }, { ...skip, at: undefined }
    ];
    for (const b of bad) expect(parseClient(j(b)), JSON.stringify(b)).toBeNull();
    expect(parseClient(v1(open))).toBeNull();
  });

  it('small: every op ≤ 210 bytes from the phone, ≤ 256 relayed (the guest’s)', () => {
    for (const o of ops) {
      expect(j({ ...o, c: 999_999_999 }).length, o.op).toBeLessThanOrEqual(210);
      expect(JSON.stringify({ v: 3, ...o, who: 'G', t: T }).length, o.op).toBeLessThanOrEqual(MAX_BYTES);
    }
  });

  it('never kept, acked or claimed; the guest sends it', () => {
    for (const o of ops) {
      expect(isStored(o as never), o.op).toBe(false);
      expect(isAcked(o as never), o.op).toBe(false);
      expect(claimOf(o as never), o.op).toBeNull();
    }
  });
});

describe('live protocol: a music stage (`music`, docs/sound-sync.md)', () => {
  const at = 1_793_000_000_000;
  it('a start (song, length, a room stereo its piece) or a stop, acked, never kept in the ring, the guest may send it', () => {
    expect(parseClient(j({ kind: 'music', src: 'isl', at, song: 'kk-chorale', ms: 180_000, c: 3, x: 1 }))).toEqual({ v: 3, c: 3, kind: 'music', src: 'isl', at, song: 'kk-chorale', ms: 180_000 });
    expect(parseClient(j({ kind: 'music', src: 't', at, song: 'kk-aircheck-1', ms: 1, pc: 'd123abc' }))).toEqual({ v: 3, kind: 'music', src: 't', at, song: 'kk-aircheck-1', ms: 1, pc: 'd123abc' });
    expect(parseClient(j({ kind: 'music', src: 'u', at }))).toEqual({ v: 3, kind: 'music', src: 'u', at });
    expect(parseServer(j({ kind: 'music', src: 'isl', at, who: 'G', t: at + 5 }))).toEqual({ v: 3, kind: 'music', src: 'isl', at, who: 'G', t: at + 5 });
    for (const bad of [
      { src: 'x', at }, { src: 'isl' }, { src: 'isl', at: -1 },
      { src: 'isl', at, song: 'kk-chorale' }, { src: 'isl', at, song: 'kk-chorale', ms: 0 }, { src: 'isl', at, song: 'kk-chorale', ms: MUSIC_MS_MAX + 1 },
      { src: 'isl', at, song: 'KK', ms: 5 }, { src: 'isl', at, song: 'a'.repeat(33), ms: 5 }, { src: 'isl', at, ms: 5 },
      { src: 'isl', at, song: 'kk-x', ms: 5, pc: 'd123abc' }, { src: 't', at, song: 'kk-x', ms: 5, pc: 'nope' }
    ]) expect(parseClient(j({ kind: 'music', ...bad })), JSON.stringify(bad)).toBeNull();
    const m = { kind: 'music', src: 'isl', at } as const;
    expect(isAcked(m)).toBe(true);
    expect(isStored(m)).toBe(false);
  });

  it('newerMusic: the later at, a tie by who, the same on every side', () => {
    expect(newerMusic({ at: 2, who: 'A' }, { at: 1, who: 'G' })).toBe(true);
    expect(newerMusic({ at: 1, who: 'G' }, { at: 2, who: 'A' })).toBe(false);
    expect(newerMusic({ at: 1, who: 'B' }, { at: 1, who: 'A' })).toBe(true);
    expect(newerMusic({ at: 1, who: 'A' }, { at: 1, who: 'B' })).toBe(false);
    expect(newerMusic({ at: 1, who: 'A' }, { at: 1, who: 'A' })).toBe(false);
  });

  it('musicLive: a song until its end, a stop for a while', () => {
    expect(musicLive({ at: 0, song: 's', ms: 100 }, 99)).toBe(true);
    expect(musicLive({ at: 0, song: 's', ms: 100 }, 100)).toBe(false);
    expect(musicLive({ at: 0 }, MUSIC_STOP_KEEP_MS - 1)).toBe(true);
    expect(musicLive({ at: 0 }, MUSIC_STOP_KEEP_MS)).toBe(false);
  });

  it('musicEnd, musicBeats, musicAt: the one rule the relay, the demo relay and the phones take a record by', () => {
    expect(musicEnd({ at: 5, song: 's', ms: 100 })).toBe(105);
    expect(musicEnd({ at: 5, song: null, ms: 0 })).toBe(5 + MUSIC_STOP_KEEP_MS);
    const rec = { at: 10, song: 's', ms: 100, who: 'B' as const };
    expect(musicBeats(rec, undefined, 50)).toBe(true);
    expect(musicBeats(rec, { at: 9, who: 'G' }, 50)).toBe(true);
    expect(musicBeats(rec, { at: 10, who: 'A' }, 50)).toBe(true);
    expect(musicBeats(rec, { at: 11, who: 'A' }, 50)).toBe(false);
    expect(musicBeats(rec, undefined, 110)).toBe(false); // over
    expect(musicBeats({ at: 10, who: 'A' }, { at: 9, who: 'B' }, 110)).toBe(true); // a stop, kept a while
    expect(musicAt(1000, 1000 + MUSIC_SKEW_MS)).toBe(1000);
    expect(musicAt(1000, 1001 + MUSIC_SKEW_MS)).toBe(1001 + MUSIC_SKEW_MS);
    expect(musicAt(1001 + MUSIC_SKEW_MS, 0)).toBe(0);
  });
});
