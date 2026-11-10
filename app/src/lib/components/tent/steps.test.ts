import { describe, expect, it } from 'vitest';
import { mergeTent, tentLayout, TENT_MAX, type TentEntry, type TentOp } from '#lib/contract/tent.ts';
import { roomSaveOf, type RoomSaveOp } from '#lib/contract/roomSave.ts';
import { clearStep, plan, restoreStep, savedPieces, type Ctx, type RoomNow, type Step } from './steps.ts';

const T0 = Date.parse('2026-11-10T03:00:00.000Z');

/** A room on this phone: ops merged as the store does, the layout read back. */
function room(sc: 't' | 'u' | 'v' = 'u') {
  const m = new Map<string, TentEntry>();
  let clock = T0, ids = 0;
  const ctx: Ctx = { sc, at: (after = 0) => (clock = Math.max(clock + 1, after + 1)), newId: () => `dn${String(++ids).padStart(6, '0')}`, defaults: { wall: 'w100', floor: 'g100' } };
  const now = (): RoomNow => {
    const l = tentLayout(m.values());
    return { pieces: l.pieces, wall: l.wall, floor: l.floor, size: l.size };
  };
  const put = (ops: readonly TentOp[], who: TentEntry['who'] = 'A') => ops.forEach((op) => mergeTent(m, { ...op, who } as TentEntry));
  const run = (step: Step) => {
    const r = plan(now(), step, ctx);
    if (r) put(r.ops);
    return r;
  };
  return { m, ctx, now, put, run };
}
/** The room as anyone sees it: each piece's item, tile, facing, light and what it stands on (by that one's item and
 *  tile); the surfaces and the size. */
function seen(r: RoomNow) {
  const at = (id?: string) => (id ? ((p) => p && `${p.item}@${p.x},${p.z}`)(r.pieces.find((q) => q.id === id)) : undefined);
  const key = (p: { item: string; x: number; z: number; on?: string }) => `${p.item}@${p.x},${p.z}/${p.on ?? ''}`;
  const pieces = r.pieces.map((p) => ({ item: p.item, x: p.x, z: p.z, f: p.f, l: p.l, on: at(p.on) })).sort((a, b) => (key(a) < key(b) ? -1 : 1));
  return { pieces, wall: r.wall, floor: r.floor, size: r.size };
}
/** A furnished room: a table with a lamp (switched off) on it, a rug, a wall clock, a chair turned. */
function furnished() {
  const r = room();
  const op = (id: string, item: string, x: number, z: number, f: 0 | 1 | 2 | 3, extra: object = {}): TentOp => ({ sc: 'u', id, at: T0 - 100, item, x, z, f, p: T0 - 200 + x, ...extra }) as TentOp;
  r.put([op('dtable01', 'f4081', 2, 3, 1), op('drug0001', 'f7000', 0, 0, 0), op('dclock01', 'f1300', 3, 2, 0), op('dchair01', 'f1432', 5, 5, 3), op('dlamp001', 'f2220', 0, 0, 0, { on: 'dtable01', l: 0 })], 'B');
  r.put([{ sc: 'u', id: 'dtentwall', at: T0 - 100, item: 'w4840', x: 0, z: 0, f: 0, p: T0 - 100 }]);
  return r;
}

describe('the clear and its undo', () => {
  it('takes every piece away (the wallpaper, floor and size stay); the undo puts each back exactly, one batch each', () => {
    const r = furnished();
    const before = seen(r.now());
    const c = r.run(clearStep(r.now()))!;
    expect(c.ops).toHaveLength(5);
    expect(c.ops.every((o) => 'rm' in o && o.rm)).toBe(true);
    expect(r.now().pieces).toEqual([]);
    expect(r.now().wall).toBe('w4840');
    const u = r.run(c.undo)!;
    expect(u.ops).toHaveLength(5);
    expect(seen(r.now())).toEqual(before);
    // new ids (a removal is final), the lamp on the new table
    const lamp = r.now().pieces.find((p) => p.item === 'f2220')!;
    expect(lamp.id).not.toBe('dlamp001');
    expect(r.now().pieces.find((p) => p.id === lamp.on)?.item).toBe('f4081');
    // and the undo's undo clears it again
    r.run(u.undo);
    expect(r.now().pieces).toEqual([]);
  });

  it('nothing to clear is nothing to do; a step past the room’s cap is refused whole', () => {
    const r = room();
    expect(plan(r.now(), clearStep(r.now()), r.ctx)).toBeNull();
    const add = Array.from({ length: TENT_MAX + 1 }, (_, i) => ({ id: `s${i}`, item: 'f4081', x: i % 8, z: (i >> 3) % 8, f: 0 as const, p: T0 }));
    expect(plan(r.now(), { add }, r.ctx)).toBeNull();
    expect(plan(r.now(), { add: add.slice(0, TENT_MAX) }, r.ctx)!.ops).toHaveLength(TENT_MAX);
  });

  it('a move undone sets the piece back where it stood; a removal undone puts a new one there', () => {
    const r = furnished();
    const before = seen(r.now());
    const chair = r.now().pieces.find((p) => p.id === 'dchair01')!;
    r.put([{ sc: 'u', id: 'dchair01', at: T0 + 50, item: 'f1432', x: 1, z: 6, f: 0, p: chair.p }]);
    r.run({ set: [chair] });
    expect(seen(r.now())).toEqual(before);
    const clock = r.now().pieces.find((p) => p.id === 'dclock01')!;
    r.put([{ sc: 'u', id: 'dclock01', at: T0 + 60, rm: true }]);
    r.run({ add: [clock] });
    expect(seen(r.now())).toEqual(before);
  });
});

describe('a saved arrangement', () => {
  const saveOf = (r: ReturnType<typeof room>, at = T0): Extract<RoomSaveOp, { name: string }> => {
    const n = r.now();
    const op = roomSaveOf({ sc: 'u', n: 1, at, name: 'いつもの', pieces: savedPieces(n), wall: n.wall, floor: n.floor, size: n.size });
    expect(op).not.toBeNull();
    return op as Extract<RoomSaveOp, { name: string }>;
  };

  it('saves the room as the record takes it, and calls it up exactly over a rearranged room; the undo brings that back', () => {
    const r = furnished();
    const saved = seen(r.now());
    const save = saveOf(r);
    // rearranged: the chair moved, the table (and its lamp) away, a new piece, another wallpaper, a smaller room
    r.put([{ sc: 'u', id: 'dchair01', at: T0 + 10, item: 'f1432', x: 1, z: 1, f: 0, p: T0 }, { sc: 'u', id: 'dlamp001', at: T0 + 10, rm: true }, { sc: 'u', id: 'dtable01', at: T0 + 11, rm: true },
      { sc: 'u', id: 'dnew0001', at: T0 + 12, item: 'f9999', x: 4, z: 1, f: 2, p: T0 + 12 }, { sc: 'u', id: 'dtentwall', at: T0 + 13, item: 'w1', x: 0, z: 0, f: 0, p: T0 }, { sc: 'u', id: 'dtentsize', at: T0 + 14, item: 's6', x: 0, z: 0, f: 0, p: T0 }]);
    const changed = seen(r.now());
    const { step, missing } = restoreStep(r.now(), save, () => true);
    expect(missing).toEqual([]);
    const res = r.run(step)!;
    expect(res.ops.length).toBeLessThanOrEqual(2 * TENT_MAX + 3);
    expect(seen(r.now())).toEqual(saved);
    r.run(res.undo);
    expect(seen(r.now())).toEqual(changed);
  });

  it('a piece nobody has to put down is left out, with what stands on it, and listed', () => {
    const r = furnished();
    const save = saveOf(r);
    const { step, missing } = restoreStep(r.now(), save, (item) => item !== 'f4081');
    expect(missing).toEqual(['f4081', 'f2220']);
    r.run(step);
    expect(r.now().pieces.map((p) => p.item).sort()).toEqual(['f1300', 'f1432', 'f7000']);
  });
});
