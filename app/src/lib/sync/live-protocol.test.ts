import { describe, expect, it } from 'vitest';
import { ACTS, DROPS, HOWS, MAX_BYTES, SAY_MAX, isAcked, VIA_MAX, cleanSay, WORLD_OPS, WORLD_X, WORLD_Z, claimOf, dayStart, isStored, isWorldPt, otherVersion, parseClient, parseServer, tokyoDay, type Act, type Target, type WorldOp } from './live-protocol.ts';
import { PLAN } from '#lib/components/island/world.ts';

const KEY = 'ab'.repeat(32);
const j = (o: object) => JSON.stringify({ v: 1, ...o });
/** As the current version speaks (the relay answers each phone in its own). */
const j2 = (o: object) => JSON.stringify({ v: 3, ...o });

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
    expect(parseClient(j2({ kind: 'walk', to: [195, 900] }))).toEqual({ v: 3, kind: 'walk', to: [195, 900] });
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
      JSON.stringify({ v: 4, kind: 'ping', c: 1 }),
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
    expect(parseServer(j2({ kind: 'welcome', me: 'A', peer: true, t: 1 }))).toEqual({ v: 3, kind: 'welcome', me: 'A', peer: true, t: 1 });
    const rec = { at: '2026-11-01T01:02:03.456Z', rev: 'e1' };
    expect(parseServer(j2({ kind: 'welcome', me: 'A', peer: true, t: 1, rec }))).toEqual({ v: 3, kind: 'welcome', me: 'A', peer: true, t: 1, rec });
    expect(parseServer(j2({ kind: 'welcome', me: 'A', peer: true, t: 1, rec: { at: 'soon', rev: 'e1' } }))).toEqual({ v: 3, kind: 'welcome', me: 'A', peer: true, t: 1 }); // a bad mark: as without one
    // when each person not here left (2026-11): a bad time left out
    expect(parseServer(j2({ kind: 'welcome', me: 'A', peer: false, t: 1, here: [], gone: { A: 5, B: 'x', Z: 3, G: 7 } }))).toEqual({ v: 3, kind: 'welcome', me: 'A', peer: false, t: 1, here: [], gone: { A: 5, G: 7 } });
    expect(parseServer(j2({ kind: 'pong', c: 1, t: 2 }))).toEqual({ v: 3, kind: 'pong', c: 1, t: 2 });
    expect(parseServer(j2({ kind: 'presence', who: 'B', on: false, t: 3 }))).toEqual({ v: 3, kind: 'presence', who: 'B', on: false, t: 3 });
    expect(parseServer(j2({ kind: 'walk', to: [1, 2], who: 'B', t: 4 }))).toEqual({ v: 3, kind: 'walk', to: [1, 2], who: 'B', t: 4 });
    expect(parseServer(j2({ kind: 'saved', who: 'A', t: 5 }))).toEqual({ v: 3, kind: 'saved', who: 'A', t: 5 });
  });

  it('accepts a sheet change with its known fields only, and refuses a bad one', () => {
    const n = { what: 'event', who: 'B', at: '2026-11-01T01:02:03.456Z', rev: 'mhf0a1b2' };
    expect(parseServer(j2({ kind: 'changed', ...n, t: 6, extra: 1 }))).toEqual({ v: 3, kind: 'changed', ...n, t: 6 });
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
  it('takes a node id or an integer point within the world extent (island/world.ts PLAN lies inside it)', () => {
    expect(WORLD_X[0]).toBeLessThanOrEqual(PLAN.x0);
    expect(WORLD_X[1]).toBeGreaterThanOrEqual(PLAN.x1);
    expect(WORLD_Z[0]).toBeLessThanOrEqual(PLAN.z0);
    expect(WORLD_Z[1]).toBeGreaterThanOrEqual(PLAN.z1);
    expect(parseClient(j2({ kind: 'walk', to: [-230, 2650], at: 9 }))).toEqual({ v: 3, kind: 'walk', to: [-230, 2650], at: 9 });
    expect(parseClient(j2({ kind: 'walk', to: 'bridgeStoneN' }))).toEqual({ v: 3, kind: 'walk', to: 'bridgeStoneN' });
    for (const to of [[621, 0], [0, -461], [-231, 0], [0, 2651], [0.5, 0], [0, 0, 0]]) expect(parseClient(j2({ kind: 'walk', to })), String(to)).toBeNull();
    expect(parseServer(j2({ kind: 'walk', to: [700, 0], who: 'B', t: 4 }))).toBeNull();
    // v1 keeps its stage units
    expect(parseClient(j({ kind: 'walk', to: [5000, -4000] }))).toEqual({ v: 1, kind: 'walk', to: [5000, -4000] });
    expect(isWorldPt([620, -460])).toBe(true);
  });

  it('tells a version nobody speaks apart from junk', () => {
    expect(otherVersion(JSON.stringify({ v: 4, kind: 'hello' }))).toBe(4);
    expect(otherVersion(JSON.stringify({ v: 0 }))).toBe(0);
    for (const x of [j({ kind: 'x' }), j2({ kind: 'x' }), JSON.stringify({ kind: 'ping' }), JSON.stringify({ v: '3' }), 'nope', 'null', '[3]', 3])
      expect(otherVersion(x), String(x)).toBeNull();
  });
});

describe('live protocol: the shared world (v2)', () => {
  it('takes a catch with where and how, a pick, a put, a shake and an act at a point', () => {
    expect(parseClient(j2({ kind: 'catch', what: 'sea-bass', id: 'fish:12', at: [120, -40], how: 'rod', x: 1 })))
      .toEqual({ v: 3, kind: 'catch', what: 'sea-bass', id: 'fish:12', at: [120, -40], how: 'rod' });
    for (const how of HOWS) expect(parseClient(j2({ kind: 'catch', what: 'koi', id: 'a', how })), how).not.toBeNull();
    expect(parseClient(j2({ kind: 'pick', id: 's4560', what: 'present:item:froggy-chair', at: [1, 2] })))
      .toEqual({ v: 3, kind: 'pick', id: 's4560', what: 'present:item:froggy-chair', at: [1, 2] });
    expect(parseClient(j2({ kind: 'put', id: 'p1', what: 'present', at: [1, 2] }))).toEqual({ v: 3, kind: 'put', id: 'p1', what: 'present', at: [1, 2] });
    for (const drop of DROPS) expect(parseClient(j2({ kind: 'shake', tree: 'oak-p1', drop })), drop).toEqual({ v: 3, kind: 'shake', tree: 'oak-p1', drop });
    expect(parseClient(j2({ kind: 'act', act: 'bush', id: 'hedge-2', pt: [36, 596] }))).toEqual({ v: 3, kind: 'act', act: 'bush', id: 'hedge-2', pt: [36, 596] });
    expect(parseServer(j2({ kind: 'pick', id: 'w1', what: 'weed', who: 'B', t: 9 }))).toEqual({ v: 3, kind: 'pick', id: 'w1', what: 'weed', who: 'B', t: 9 });
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

describe('live protocol: the very walk, acks and the day in one replay', () => {
  it('a v2 walk may carry where from, the way (≤ VIA_MAX points), when it set off and how long', () => {
    const w = { kind: 'walk', to: [195, 900], from: [132, 214], via: [[160, 400]], s: 1_793_500_000_000, ms: 2400, f: 'home' };
    expect(parseClient(j2(w))).toEqual({ v: 3, ...w });
    expect(parseClient(j2({ ...w, f: 'up' }))).toBeNull();
    expect(parseClient(j2({ ...w, via: Array.from({ length: VIA_MAX + 1 }, () => [1, 1]) }))).toBeNull();
    expect(parseClient(j2({ ...w, ms: 60_001 }))).toBeNull();
    expect(parseClient(j2({ ...w, from: [1.5, 2] }))).toBeNull();
    expect(parseClient(j({ kind: 'walk', to: [1, 2], ms: 10 }))).toBeNull();
    // the longest, sent (with its number) and relayed (with who and t), fits a message
    const most = { ...w, to: [-230, 2650], from: [-230, 2650], via: Array.from({ length: VIA_MAX }, () => [-230, 2650]), ms: 60_000 };
    expect(j2({ ...most, c: 1_793_500_000_123 }).length).toBeLessThanOrEqual(MAX_BYTES);
    expect(parseServer(j2({ ...most, who: 'A', t: 1_793_500_000_123 }))).not.toBeNull();
  });
  it('an intent may carry its sequence number c (a positive integer); a hello may ask for a batch', () => {
    expect(parseClient(j2({ kind: 'pick', id: 'a', what: 'weed', c: 7 }))).toEqual({ v: 3, c: 7, kind: 'pick', id: 'a', what: 'weed' });
    expect(parseClient(j2({ kind: 'pick', id: 'a', what: 'weed', c: 0 }))).toBeNull();
    expect(parseClient(j2({ kind: 'pick', id: 'a', what: 'weed', c: 1.5 }))).toBeNull();
    expect(parseClient(j2({ kind: 'hello', key: KEY, batch: true }))).toEqual({ v: 3, kind: 'hello', key: KEY, batch: true });
    expect(parseClient(j2({ kind: 'hello', key: KEY, batch: 1 }))).toBeNull();
    expect(parseClient(j2({ kind: 'act', act: 'wake', id: 'B', at: 1_793_500_000_000 }))).toMatchObject({ act: 'wake', id: 'B' });
    expect(parseClient(j2({ kind: 'world', op: 'woke', id: 'gulliver' }))).toMatchObject({ op: 'woke' });
  });
  it('an ack, and a replay up to REPLAY_BYTES (its bad events left out); nothing else that long', () => {
    expect(parseServer(j2({ kind: 'ack', c: 3, t: 9, ok: false }))).toEqual({ v: 3, kind: 'ack', c: 3, t: 9, ok: false });
    expect(parseServer(j2({ kind: 'ack', c: 3, t: 9 }))).toBeNull();
    const e = { v: 3, kind: 'pick', id: 'p1', what: 'find:shell:cowrie', at: [150, 40], who: 'A', t: 5 };
    const es = Array.from({ length: 120 }, (_, i) => ({ ...e, id: `p${i}` }));
    const raw = j2({ kind: 'replay', es: [...es, { kind: 'pick', who: 'C', t: 1 }], t: 10 });
    expect(raw.length).toBeGreaterThan(MAX_BYTES);
    const m = parseServer(raw);
    expect(m?.kind === 'replay' && m.es.length).toBe(120);
    expect(parseServer(j2({ kind: 'replay', es: Array.from({ length: 200 }, () => e), t: 10 }))).toBeNull();
    expect(parseServer(j2({ kind: 'walk', to: [1, 2], who: 'B', t: 4, pad: 'x'.repeat(300), note: '"kind":"replay"' }))).toBeNull();
  });
});

describe('live protocol: decorations (v2)', () => {
  const T = 1_793_000_000_000;
  const set = { kind: 'decor', id: 'dmh1abc2a', at: T, item: 'stone-lantern', x: 120, z: 480, f: 3, p: T };
  it('takes a set (its whole state) and a removal, known fields only; the room keeps both; nothing claimed', () => {
    expect(parseClient(j2({ ...set, c: T, extra: 1 }))).toEqual({ v: 3, c: T, ...set });
    expect(parseClient(j2({ kind: 'decor', id: 'dmh1abc2a', at: T, rm: true }))).toEqual({ v: 3, kind: 'decor', id: 'dmh1abc2a', at: T, rm: true });
    expect(parseServer(j2({ ...set, who: 'B', t: T + 3 }))).toEqual({ v: 3, ...set, who: 'B', t: T + 3 });
    expect(isStored({ ...set, kind: 'decor' } as never)).toBe(true);
    expect(claimOf({ ...set, kind: 'decor' } as never)).toBeNull();
  });
  it('refuses v1, a bad id, item, spot or facing, a removal with rm other than true', () => {
    for (const bad of [
      j({ ...set }), j2({ ...set, id: 'x1' }), j2({ ...set, item: 'Sofa' }), j2({ ...set, x: 1.5 }), j2({ ...set, z: 99999 }), j2({ ...set, f: 4 }),
      j2({ ...set, p: undefined }), j2({ kind: 'decor', id: 'dmh1abc2a', at: T, rm: 1 }), j2({ kind: 'decor', id: 'dmh1abc2a', rm: true })
    ]) expect(parseClient(bad), bad).toBeNull();
  });
  it('fits the size budget numbered and relayed', () => {
    const big = { ...set, id: 'd' + 'z'.repeat(24), item: 'garden-wagon', x: -230, z: -460 };
    expect(j2({ ...big, c: 1e15 - 1 }).length).toBeLessThanOrEqual(MAX_BYTES);
    expect(j2({ ...big, who: 'B', t: T }).length).toBeLessThanOrEqual(MAX_BYTES);
  });
});

describe('live protocol: the tent (v2)', () => {
  const T = 1_793_000_000_000;
  const set = { kind: 'decor', sc: 't', id: 'dmh1abc2a', at: T, item: 'f4041', x: 7, z: 0, f: 1, p: T };
  it('a decor op in the tent keeps its scope; its tiles are the room’s', () => {
    expect(parseClient(j2(set))).toEqual({ v: 3, ...set });
    expect(parseServer(j2({ ...set, who: 'A', t: T }))).toEqual({ v: 3, ...set, who: 'A', t: T });
    expect(parseClient(j2({ kind: 'decor', sc: 't', id: 'dmh1abc2a', at: T, rm: true }))).toEqual({ v: 3, kind: 'decor', sc: 't', id: 'dmh1abc2a', at: T, rm: true });
    for (const bad of [j2({ ...set, x: 8 }), j2({ ...set, sc: 'x' }), j2({ ...set, z: -1 })]) expect(parseClient(bad), bad).toBeNull();
    // a light's switch
    expect(parseClient(j2({ ...set, l: 0 }))).toEqual({ v: 3, ...set, l: 0 });
    expect(parseClient(j2({ ...set, l: 3 }))).toBeNull();
    // on another piece's surface
    expect(parseClient(j2({ ...set, on: 'dmh1table1' }))).toEqual({ v: 3, ...set, on: 'dmh1table1' });
    for (const bad of [j2({ ...set, on: 'nope' }), j2({ ...set, sc: undefined, on: 'dmh1table1', x: 100, z: 100 })]) expect(parseClient(bad), bad).toBeNull();
  });
  it('a drag and the villager inside are presence only: never kept, never claimed, small', () => {
    const drag = { kind: 'drag', id: 'dmh1abc2a', x: -12, z: 33, f: 2 };
    expect(parseClient(j2(drag))).toEqual({ v: 3, ...drag });
    expect(parseClient(j2({ ...drag, it: 'f4041', end: true }))).toEqual({ v: 3, ...drag, it: 'f4041', end: true });
    expect(j2(drag).length).toBeLessThanOrEqual(60);
    for (const bad of [j2({ ...drag, x: 41 }), j2({ ...drag, x: 1.5 }), j2({ ...drag, end: 1 }), j2({ ...drag, it: 'Bad Item' }), j({ ...drag })]) expect(parseClient(bad), bad).toBeNull();
    const walk = { kind: 'tent', in: true, from: [-7, 22], via: [[0, 10]], to: [20, -30], s: T, ms: 1800 };
    expect(parseClient(j2(walk))).toEqual({ v: 3, ...walk });
    expect(parseServer(j2({ kind: 'tent', in: false, who: 'B', t: T }))).toEqual({ v: 3, kind: 'tent', in: false, who: 'B', t: T });
    for (const bad of [j2({ ...walk, in: 1 }), j2({ ...walk, to: [50, 0] }), j2({ ...walk, via: [[0, 99]] })]) expect(parseClient(bad), bad).toBeNull();
    // in the museum (`sc: 'm'`): its points over its own wider extent (a home's room's only within its own)
    const museum = { ...walk, from: [0, 56], via: [[60, 10]], to: [180, -40], sc: 'm' };
    expect(parseClient(j2(museum))).toEqual({ v: 3, ...museum });
    expect(parseServer(j2({ kind: 'tent', in: true, to: [-250, 80], sc: 'm', who: 'G', t: T }))).toEqual({ v: 3, kind: 'tent', in: true, to: [-250, 80], sc: 'm', who: 'G', t: T });
    for (const bad of [j2({ ...museum, to: [400, 0] }), j2({ ...museum, sc: 'u' }), j2({ ...museum, sc: 'x' })]) expect(parseClient(bad), bad).toBeNull();
    // sitting or lying on a piece
    const sit = { kind: 'tent', in: true, to: [0, 10], seat: 'dmh1sofa01', n: 1, s: T };
    expect(parseClient(j2(sit))).toEqual({ v: 3, ...sit });
    expect(parseClient(j2({ ...sit, lie: true }))).toEqual({ v: 3, ...sit, lie: true });
    for (const bad of [j2({ ...sit, seat: 'x' }), j2({ ...sit, n: 9 }), j2({ ...sit, lie: 1 })]) expect(parseClient(bad), bad).toBeNull();
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
    expect(parseClient(j2({ kind: 'say', text: ' がんばろう！\n', at: 4 }))).toEqual({ v: 3, kind: 'say', text: 'がんばろう！' });
    expect(parseClient(j({ kind: 'say', text: 'hi' }))).toBeNull();
    for (const text of [undefined, '', ' \n ', 3]) expect(parseClient(j2({ kind: 'say', text }))).toBeNull();
    expect(parseServer(j2({ kind: 'say', text: 'a\u202Eb', who: 'B', t: 9 }))).toEqual({ v: 3, kind: 'say', text: 'ab', who: 'B', t: 9 });
    // where it was said (a home's room; none: the island), additive: kept through the relay, an unknown place refused
    expect(parseClient(j2({ kind: 'say', text: 'やっほー！', sc: 'u' }))).toEqual({ v: 3, kind: 'say', text: 'やっほー！', sc: 'u' });
    expect(parseServer(j2({ kind: 'say', text: 'hi', sc: 't', who: 'G', t: 9 }))).toEqual({ v: 3, kind: 'say', text: 'hi', sc: 't', who: 'G', t: 9 });
    expect(parseClient(j2({ kind: 'say', text: 'みて！', sc: 'm' }))).toEqual({ v: 3, kind: 'say', text: 'みて！', sc: 'm' });
    for (const sc of ['o', 'x', 1, null]) expect(parseClient(j2({ kind: 'say', text: 'hi', sc }))).toBeNull();
    expect(isStored({ kind: 'say', text: 'x' })).toBe(false);
    expect(claimOf({ kind: 'say', text: 'x' })).toBeNull();
    // twenty of the widest characters still fit a relayed message
    expect(JSON.stringify({ v: 3, kind: 'say', text: '\u{1F600}'.repeat(SAY_MAX), who: 'A', t: 1_793_527_259_353 }).length).toBeLessThanOrEqual(MAX_BYTES);
  });
});

describe('live protocol: a high-five (v2, the relay only)', () => {
  it('a highfive at a time, numbered and sent with the partner away, never kept in the day; got answers one heard', () => {
    expect(parseClient(j2({ kind: 'highfive', at: 1_793_000_000_000, c: 4, x: 1 }))).toEqual({ v: 3, c: 4, kind: 'highfive', at: 1_793_000_000_000 });
    expect(parseServer(j2({ kind: 'highfive', at: 5, who: 'B', t: 9 }))).toEqual({ v: 3, kind: 'highfive', at: 5, who: 'B', t: 9 });
    expect(parseClient(j2({ kind: 'got', at: 5 }))).toEqual({ v: 3, kind: 'got', at: 5 });
    for (const bad of [j({ kind: 'highfive', at: 5 }), j({ kind: 'got', at: 5 }), j2({ kind: 'highfive' }), j2({ kind: 'highfive', at: -1 }), j2({ kind: 'got', at: 'x' })]) expect(parseClient(bad), bad).toBeNull();
    const hf = { kind: 'highfive', at: 5 } as const;
    expect(isAcked(hf)).toBe(true);
    expect(isStored(hf)).toBe(false);
    expect(claimOf(hf)).toBeNull();
    expect(isAcked({ kind: 'say', text: 'x' })).toBe(false);
    expect(isAcked({ kind: 'walk', to: [1, 2] })).toBe(true);
  });
});
