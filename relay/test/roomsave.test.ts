// Saved room arrangements in the record (contract/roomSave.ts, docs/backend.md#events `room_save`): any of us saves,
// overwrites or empties any room's slot (the latest to arrive wins), the shape and the caps checked; and a room's
// whole change as one group (the clear, a restore, their undo: contract/api.ts GROUP_MAX), all or none.
import { beforeEach, describe, expect, it } from 'vitest';
import { StoreCore } from '../src/store.ts';
import { GROUP_MAX } from '../../app/src/lib/contract/api.ts';
import { TENT_MAX } from '../../app/src/lib/contract/tent.ts';
import { memSql } from './sqlite.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);
const KEY_C = 'c'.repeat(64);
const T0 = Date.parse('2026-11-10T03:00:00.000Z');
const keyOf = { A: KEY_A, B: KEY_B, G: KEY_C } as const;

let store: StoreCore;
let now: number;
beforeEach(() => {
  now = T0;
  const db = memSql();
  store = new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B, KEY_C }, now: () => (now += 5), notify: () => {} });
});
let seq = 0;
const send = (who: 'A' | 'B' | 'G', type: string, data: object) => store.handle({ key: keyOf[who], action: 'event', id: `e${++seq}`, type, data }, 100) as Record<string, any>;
const batch = (who: 'A' | 'B' | 'G', events: object[]) => store.handle({ key: keyOf[who], action: 'events', events }, 100) as Record<string, any>;
const rows = (type: string) => ((store.handle({ key: KEY_A, action: 'snapshot' }, 100) as Record<string, any>).rows.events as unknown[][])
  .filter((r) => r[3] === type).map((r) => [r[1], JSON.parse(r[4] as string)]);
const save = (sc: string, n: number, name: string, extra: object = {}) => ({ sc, n, at: T0, name, pieces: [{ i: 'f4081', x: 2, z: 3, f: 1 }, { i: 'f1432', x: 0, z: 0, f: 0, on: 0, l: 0 }], wall: 'w1', floor: null, size: 8, ...extra });
const refused = { ok: false, error: 'bad_request' };

describe('a room’s saved arrangements', () => {
  it('anyone saves in any room; a slot holds the latest to arrive; emptied, it fills again', () => {
    expect(send('A', 'room_save', save('u', 1, 'いつもの'))).toEqual({ ok: true });
    expect(send('G', 'room_save', save('t', 3, 'ゲスト'))).toEqual({ ok: true });
    expect(send('B', 'room_save', save('u', 1, 'うめの', { at: T0 - 100 }))).toEqual({ ok: true }); // (arrival, not at)
    expect(rows('room_save').map(([who, d]) => [who, d.sc, d.n, d.name])).toEqual([['G', 't', 3, 'ゲスト'], ['B', 'u', 1, 'うめの']]);
    expect(send('A', 'room_save', { sc: 'u', n: 1, at: T0 + 1, rm: true })).toEqual({ ok: true });
    expect(rows('room_save').filter(([, d]) => d.sc === 'u')).toEqual([['A', { sc: 'u', n: 1, at: T0 + 1, rm: true }]]);
    expect(send('B', 'room_save', save('u', 1, 'また'))).toEqual({ ok: true });
    expect(rows('room_save').filter(([, d]) => d.sc === 'u').map(([, d]) => d.name)).toEqual(['また']);
  });

  it('its name one clean line of at most 20; at most 3 slots and TENT_MAX pieces; a piece only on an earlier one on the floor', () => {
    expect(send('A', 'room_save', save('t', 1, '  とても\nながい なまえの へやの もようがえ です  '))).toEqual({ ok: true });
    expect(rows('room_save')[0][1].name).toBe('とても ながい なまえの へやの もよう');
    expect(send('A', 'room_save', save('t', 4, 'x'))).toEqual(refused);
    expect(send('A', 'room_save', save('t', 0, 'x'))).toEqual(refused);
    expect(send('A', 'room_save', save('o', 1, 'x'))).toEqual(refused);
    expect(send('A', 'room_save', save('t', 1, ''))).toEqual(refused);
    const many = Array.from({ length: TENT_MAX + 1 }, (_, i) => ({ i: 'f4081', x: i % 8, z: (i >> 3) % 8, f: 0 }));
    expect(send('A', 'room_save', save('t', 1, 'x', { pieces: many }))).toEqual(refused);
    expect(send('A', 'room_save', save('t', 1, 'x', { pieces: many.slice(0, TENT_MAX) }))).toEqual({ ok: true });
    for (const pieces of [[{ i: 'f1', x: 0, z: 0, f: 0, on: 0 }], [{ i: 'f1', x: 0, z: 0, f: 0 }, { i: 'f2', x: 0, z: 0, f: 0, on: 1 }],
      [{ i: 'f1', x: 0, z: 0, f: 0 }, { i: 'f2', x: 0, z: 0, f: 0, on: 0 }, { i: 'f3', x: 0, z: 0, f: 0, on: 1 }], [{ i: 'w1', x: 0, z: 0, f: 0 }], [{ i: 'f1', x: 8, z: 0, f: 0 }], [{ i: 'f1', x: 0, z: 0, f: 0, y: 1 }]])
      expect(send('A', 'room_save', save('t', 2, 'x', { pieces })), JSON.stringify(pieces)).toEqual(refused);
    for (const extra of [{ wall: 'g1' }, { floor: 'w1' }, { size: 5 }, { extra: 1 }, { at: T0 + 2 * 86_400_000 }])
      expect(send('A', 'room_save', save('t', 2, 'x', extra)), JSON.stringify(extra)).toEqual(refused);
  });
});

describe('a room’s whole change as one group (GROUP_MAX)', () => {
  const piece = (i: number, at = T0) => ({ sc: 'u', id: `dp${String(i).padStart(6, '0')}`, at, item: 'f4081', x: i % 8, z: (i >> 3) % 8, f: 0, p: T0 - 1000 });
  const ev = (g: string, data: object, i: number) => ({ id: `${g}-${i}`, type: 'decor', group: g, data });
  const fill = () => {
    for (let i = 0; i < TENT_MAX; i += 30) expect(batch('A', Array.from({ length: 30 }, (_, k) => ({ id: `fill-${i + k}`, type: 'decor', data: piece(i + k) }))).results.every((r: { ok: boolean }) => r.ok)).toBe(true);
  };

  it('a full room cleared in one group of 60 (over EVENTS_MAX), its 60 back in another, by anyone', () => {
    fill();
    const rm = Array.from({ length: TENT_MAX }, (_, i) => ev('clear', { sc: 'u', id: piece(i).id, at: T0 + 10, rm: true }, i));
    expect(batch('G', rm).results.every((r: { ok: boolean }) => r.ok)).toBe(true);
    const back = Array.from({ length: TENT_MAX }, (_, i) => ev('undo', { ...piece(100 + i, T0 + 20) }, i));
    expect(batch('B', back).results.every((r: { ok: boolean }) => r.ok)).toBe(true);
    const live = new Map<string, boolean>();
    for (const [, d] of rows('decor')) live.set(d.id, !d.rm);
    expect([...live.values()].filter(Boolean)).toHaveLength(TENT_MAX);
  });

  it('all or none: one refused (past the room’s cap) and nothing of the group is kept', () => {
    fill();
    const over = [ev('g', { sc: 'u', id: piece(0).id, at: T0 + 10, rm: true }, 0), ev('g', piece(200, T0 + 10), 1), ev('g', piece(201, T0 + 10), 2)];
    const r = batch('A', over).results;
    expect(r.map((x: { ok: boolean; detail?: string }) => x.detail ?? 'ok')).toEqual(['group', 'group', 'tent full']);
    expect(rows('decor').some(([, d]) => d.rm || d.id === piece(200).id)).toBe(false);
  });

  it('over GROUP_MAX, or over EVENTS_MAX with more than one group, the batch is refused whole', () => {
    const big = Array.from({ length: GROUP_MAX + 1 }, (_, i) => ev('g', piece(i % TENT_MAX, T0 + i), i));
    expect(batch('A', big)).toEqual(refused);
    const mixed = Array.from({ length: 51 }, (_, i) => ev(i < 30 ? 'g1' : 'g2', piece(i, T0 + i), i));
    expect(batch('A', mixed)).toEqual(refused);
    const plain = Array.from({ length: 51 }, (_, i) => ({ id: `p-${i}`, type: 'decor', data: piece(i, T0 + i) }));
    expect(batch('A', plain)).toEqual(refused);
  });
});
