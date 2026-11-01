import { describe, expect, it } from 'vitest';
import { ACTS, DROPS, HOWS, MAX_BYTES, WORLD_OPS, WORLD_X, WORLD_Z, claimOf, dayStart, isStored, isWorldPt, otherVersion, parseClient, parseServer, tokyoDay, type Act, type Target, type WorldOp } from './live-protocol.ts';
import { PLAN } from '#lib/components/island/world.ts';

const KEY = 'ab'.repeat(32);
const j = (o: object) => JSON.stringify({ v: 1, ...o });
/** As the current version speaks (the relay answers each phone in its own). */
const j2 = (o: object) => JSON.stringify({ v: 2, ...o });

describe('live protocol: client messages', () => {
  it('accepts hello, ping and each intent kind, keeping only known fields', () => {
    expect(parseClient(j({ kind: 'hello', key: KEY, since: 5 }))).toEqual({ v: 1, kind: 'hello', key: KEY, since: 5 });
    expect(parseClient(j({ kind: 'ping', c: 1_790_000_000_000 }))).toEqual({ v: 1, kind: 'ping', c: 1_790_000_000_000 });
    expect(parseClient(j({ kind: 'walk', to: 'shoreC', at: 9, extra: 'x' }))).toEqual({ v: 1, kind: 'walk', to: 'shoreC', at: 9 });
    expect(parseClient(j({ kind: 'walk', to: [120, -4] }))).toEqual({ v: 1, kind: 'walk', to: [120, -4] });
    expect(parseClient(j({ kind: 'act', act: 'weed', id: 'w:3' }))).toEqual({ v: 1, kind: 'act', act: 'weed', id: 'w:3' });
    expect(parseClient(j({ kind: 'catch', what: 'sea-bass' }))).toEqual({ v: 1, kind: 'catch', what: 'sea-bass' });
    expect(parseClient(j({ kind: 'emote', emote: 'mark-note' }))).toEqual({ v: 1, kind: 'emote', emote: 'mark-note' });
    expect(parseClient(j({ kind: 'world', op: 'fruit-collected', id: 'tree-2.1' }))).toEqual({ v: 1, kind: 'world', op: 'fruit-collected', id: 'tree-2.1' });
    expect(parseClient(j({ kind: 'saved', at: 'x' }))).toEqual({ v: 1, kind: 'saved' });
    // v2 (the rolling-log world) too, its version kept: the relay answers each phone in its own
    expect(parseClient(j2({ kind: 'walk', to: [195, 900] }))).toEqual({ v: 2, kind: 'walk', to: [195, 900] });
  });

  it('accepts every act, world op and both kinds of walk target', () => {
    for (const act of ACTS as readonly Act[]) expect(parseClient(j({ kind: 'act', act })), act).not.toBeNull();
    for (const op of WORLD_OPS as readonly WorldOp[]) expect(parseClient(j({ kind: 'world', op, id: 'x1' })), op).not.toBeNull();
    for (const to of ['shoreC', [0, 0]] as Target[]) expect(parseClient(j({ kind: 'walk', to }))).not.toBeNull();
  });

  it('strips who and t: the relay stamps those', () => {
    expect(parseClient(j({ kind: 'emote', emote: 'glee', who: 'B', t: 3 }))).toEqual({ v: 1, kind: 'emote', emote: 'glee' });
  });

  it('refuses the wrong version, junk, unknown kinds, bad fields and anything too big', () => {
    for (const bad of [
      JSON.stringify({ v: 3, kind: 'ping', c: 1 }),
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
      j({ kind: 'emote', emote: 'Glee!' }),
      j({ kind: 'world', op: 'nuke', id: 'a' }),
      j({ kind: 'world', op: 'dug' }),
      j({ kind: 'emote', emote: 'glee', pad: 'x'.repeat(MAX_BYTES) })
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
    expect(parseServer(j2({ kind: 'welcome', me: 'A', peer: true, t: 1 }))).toEqual({ v: 2, kind: 'welcome', me: 'A', peer: true, t: 1 });
    expect(parseServer(j2({ kind: 'pong', c: 1, t: 2 }))).toEqual({ v: 2, kind: 'pong', c: 1, t: 2 });
    expect(parseServer(j2({ kind: 'presence', who: 'B', on: false, t: 3 }))).toEqual({ v: 2, kind: 'presence', who: 'B', on: false, t: 3 });
    expect(parseServer(j2({ kind: 'walk', to: [1, 2], who: 'B', t: 4 }))).toEqual({ v: 2, kind: 'walk', to: [1, 2], who: 'B', t: 4 });
    expect(parseServer(j2({ kind: 'saved', who: 'A', t: 5 }))).toEqual({ v: 2, kind: 'saved', who: 'A', t: 5 });
  });

  it('accepts a sheet change with its known fields only, and refuses a bad one', () => {
    const n = { what: 'event', who: 'B', at: '2026-11-01T01:02:03.456Z', rev: 'mhf0a1b2' };
    expect(parseServer(j2({ kind: 'changed', ...n, t: 6, extra: 1 }))).toEqual({ v: 2, kind: 'changed', ...n, t: 6 });
    expect(parseServer(j2({ kind: 'changed', ...n }))).toBeNull();
    expect(parseServer(j2({ kind: 'changed', ...n, at: 'yesterday', t: 6 }))).toBeNull();
    expect(parseServer(j2({ kind: 'changed', ...n, what: 'resync', t: 6 }))).toBeNull();
    expect(parseServer(j2({ kind: 'changed', ...n, rev: undefined, t: 6 }))).toBeNull();
  });

  it('refuses a relayed intent without who or t, and an unknown person', () => {
    expect(parseServer(j2({ kind: 'walk', to: 'a', t: 4 }))).toBeNull();
    expect(parseServer(j2({ kind: 'walk', to: 'a', who: 'B' }))).toBeNull();
    expect(parseServer(j2({ kind: 'walk', to: 'a', who: 'C', t: 4 }))).toBeNull();
    expect(parseServer(j2({ kind: 'welcome', me: 'Z', peer: true, t: 1 }))).toBeNull();
    expect(parseServer(j2({ kind: 'hello', key: KEY, t: 1 }))).toBeNull();
  });
});

describe('live protocol: v2 world points', () => {
  it('takes a node id or an integer point within the world plan (island/world.ts PLAN)', () => {
    expect([WORLD_X, WORLD_Z]).toEqual([[PLAN.x0, PLAN.x1], [PLAN.z0, PLAN.z1]]);
    expect(parseClient(j2({ kind: 'walk', to: [-230, 2500], at: 9 }))).toEqual({ v: 2, kind: 'walk', to: [-230, 2500], at: 9 });
    expect(parseClient(j2({ kind: 'walk', to: 'bridgeStoneN' }))).toEqual({ v: 2, kind: 'walk', to: 'bridgeStoneN' });
    for (const to of [[621, 0], [0, -401], [-231, 0], [0, 2501], [0.5, 0], [0, 0, 0]]) expect(parseClient(j2({ kind: 'walk', to })), String(to)).toBeNull();
    expect(parseServer(j2({ kind: 'walk', to: [700, 0], who: 'B', t: 4 }))).toBeNull();
    // v1 keeps its stage units
    expect(parseClient(j({ kind: 'walk', to: [5000, -4000] }))).toEqual({ v: 1, kind: 'walk', to: [5000, -4000] });
    expect(isWorldPt([620, -400])).toBe(true);
  });

  it('tells a version nobody speaks apart from junk', () => {
    expect(otherVersion(JSON.stringify({ v: 3, kind: 'hello' }))).toBe(3);
    expect(otherVersion(JSON.stringify({ v: 0 }))).toBe(0);
    for (const x of [j({ kind: 'x' }), j2({ kind: 'x' }), JSON.stringify({ kind: 'ping' }), JSON.stringify({ v: '3' }), 'nope', 'null', '[3]', 3])
      expect(otherVersion(x), String(x)).toBeNull();
  });
});

describe('live protocol: the shared world (v2)', () => {
  it('takes a catch with where and how, a pick, a put, a shake and an act at a point', () => {
    expect(parseClient(j2({ kind: 'catch', what: 'sea-bass', id: 'fish:12', at: [120, -40], how: 'rod', x: 1 })))
      .toEqual({ v: 2, kind: 'catch', what: 'sea-bass', id: 'fish:12', at: [120, -40], how: 'rod' });
    for (const how of HOWS) expect(parseClient(j2({ kind: 'catch', what: 'koi', id: 'a', how })), how).not.toBeNull();
    expect(parseClient(j2({ kind: 'pick', id: 's4560', what: 'present:item:froggy-chair', at: [1, 2] })))
      .toEqual({ v: 2, kind: 'pick', id: 's4560', what: 'present:item:froggy-chair', at: [1, 2] });
    expect(parseClient(j2({ kind: 'put', id: 'p1', what: 'present', at: [1, 2] }))).toEqual({ v: 2, kind: 'put', id: 'p1', what: 'present', at: [1, 2] });
    for (const drop of DROPS) expect(parseClient(j2({ kind: 'shake', tree: 'oak-p1', drop })), drop).toEqual({ v: 2, kind: 'shake', tree: 'oak-p1', drop });
    expect(parseClient(j2({ kind: 'act', act: 'bush', id: 'hedge-2', pt: [36, 596] }))).toEqual({ v: 2, kind: 'act', act: 'bush', id: 'hedge-2', pt: [36, 596] });
    expect(parseServer(j2({ kind: 'pick', id: 'w1', what: 'weed', who: 'B', t: 9 }))).toEqual({ v: 2, kind: 'pick', id: 'w1', what: 'weed', who: 'B', t: 9 });
  });

  it('refuses them in v1, and bad fields', () => {
    for (const bad of [
      j({ kind: 'pick', id: 'w1', what: 'weed' }),
      j({ kind: 'put', id: 'p1', what: 'present', at: [1, 2] }),
      j({ kind: 'shake', tree: 'oak-p1', drop: 'nest' }),
      j({ kind: 'catch', what: 'koi', id: 'a', how: 'rod' }),
      j({ kind: 'act', act: 'bush', pt: [1, 2] }),
      j2({ kind: 'catch', what: 'koi', id: 'a', how: 'zap' }),
      j2({ kind: 'catch', what: 'koi', id: 'a', at: [9999, 0] }),
      j2({ kind: 'pick', id: 'w1' }),
      j2({ kind: 'pick', id: 'w1', what: 'Weed' }),
      j2({ kind: 'pick', what: 'weed' }),
      j2({ kind: 'put', id: 'p1', what: 'present' }),
      j2({ kind: 'shake', tree: 'oak-p1', drop: 'fruit' }),
      j2({ kind: 'shake', drop: 'nest' })
    ]) expect(parseClient(bad), bad).toBeNull();
  });

  it('names what an intent claims, and what the room keeps', () => {
    expect(claimOf({ kind: 'catch', what: 'koi', id: 'fish:1' })).toBe('catch:fish:1');
    expect(claimOf({ kind: 'catch', what: 'koi' })).toBeNull();
    expect(claimOf({ kind: 'pick', id: 'p1', what: 'present' })).toBe('pick:p1');
    expect(claimOf({ kind: 'put', id: 'p1', what: 'present', at: [0, 0] })).toBe('put:p1');
    expect(claimOf({ kind: 'shake', tree: 't', drop: 'nest' })).toBeNull();
    expect(isStored({ kind: 'walk', to: [1, 2] })).toBe(true);
    expect(isStored({ kind: 'emote', emote: 'glee' })).toBe(false);
    expect(isStored({ kind: 'catch', what: 'koi' })).toBe(false);
  });

  it('a Tokyo day runs midnight to midnight', () => {
    const d = tokyoDay(Date.UTC(2026, 10, 1, 3));
    expect(dayStart(d)).toBe(Date.UTC(2026, 9, 31, 15));
    expect(tokyoDay(Date.UTC(2026, 9, 31, 15) - 1)).toBe(d - 1);
  });
});
