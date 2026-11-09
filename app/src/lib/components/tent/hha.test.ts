import { describe, expect, it } from 'vitest';
import table from './hha.json';
import { BADGES, rate, type HhaRoom, type HhaTable } from './hha.ts';

const T = table as HhaTable;
let n = 0;
const room = (items: (string | [string, Partial<{ on: string; l: 0 | 1 }>])[], more: Partial<HhaRoom> = {}): HhaRoom => ({
  pieces: items.map((it) => (typeof it === 'string' ? { id: `d${String(n++).padStart(6, '0')}`, item: it } : { id: it[1].on === undefined ? `d${String(n++).padStart(6, '0')}` : `d${String(n++).padStart(6, '0')}`, item: it[0], ...it[1] })),
  wall: null, floor: null, lights: true, ...more
});

// a cosy camp: a cot, a lantern, a sleeping bag, a rug, a stool and a round table
const camp = ['f4081', 'f1432', 'f1434', 'f9563', 'f4038', 'f4043'];
// the log series, a room of it: bed, tables, sofa, stools, bench, shelves, the log wall clock, a lantern and a rug
const log = ['f4041', 'f4040', 'f4039', 'f4038', 'f4042', 'f4044', 'f4036', 'f4037', 'f1432', 'f9563'];
// the log room grown: the rattan lamp on a table, a plant, the fireplace, more seats, a wall lamp, two wall things
const full = [...log, 'f4043', 'f4050', 'f4129', 'f742', 'f4053', 'f1103', 'f3559', 'f4727', 'f4014', 'f1433', 'f8468', 'f739'];

describe('the HHA rating', () => {
  it('scores the same room the same, whatever order its pieces come in', () => {
    const a = room(full), b = { ...a, pieces: [...a.pieces].reverse() };
    expect(rate(b, T)).toEqual(rate(a, T));
  });

  it('an empty tent: the wallpaper and floor only, no ハニワ, a nudge to put things in', () => {
    const r = rate(room([]), T);
    expect(r.badge).toBeNull();
    expect(r.note).toEqual({ k: 'empty' });
    expect(r.total).toBe(r.parts[0].pts);
    expect(r.next).toBe(BADGES.at(-1)![1] - r.total);
  });

  it('the starter camp is short of bronze; a log room is bronze, its series and colour named; grown and lit, silver or gold', () => {
    const c = rate(room(camp), T), l = rate(room(log), T), f = rate(room(full), T);
    expect(c.badge).toBeNull();
    expect(c.next).toBeGreaterThan(0);
    expect(l.badge).toBe('bronze');
    expect(l.parts.find((p) => p.k === 'series')!.pts).toBeGreaterThan(0);
    expect(l.parts.find((p) => p.k === 'colour')!.pts).toBeGreaterThan(0);
    expect(l.note).toEqual({ k: 'series', v: 'log' });
    expect(f.total).toBeGreaterThan(l.total);
    expect(['silver', 'gold']).toContain(f.badge);
  });

  it('a second of the same thing counts half, a third nothing', () => {
    const one = rate(room(['f4129']), T).parts[0].pts, two = rate(room(['f4129', 'f4129']), T).parts[0].pts, three = rate(room(['f4129', 'f4129', 'f4129']), T).parts[0].pts;
    expect(two - one).toBe(Math.round(T.f4129.p / 2));
    expect(three).toBe(two);
  });

  it('lights count while they are on; a dark room with none on says so', () => {
    const on = rate(room(['f4129', 'f1432']), T), off = rate(room(['f4129', ['f1432', { l: 0 }]], { lights: false }), T);
    expect(on.parts.find((p) => p.k === 'light')!.pts).toBeGreaterThan(0);
    expect(off.parts.find((p) => p.k === 'light')!.pts).toBe(0);
    expect(off.note).toEqual({ k: 'dark' });
  });

  it('a thing on a table and a thing on a wall each add to the space', () => {
    const r = room(['f4043', 'f1432']);
    const flat = rate(r, T).parts.find((p) => p.k === 'space')!.pts;
    const onIt = rate({ ...r, pieces: [r.pieces[0], { ...r.pieces[1], on: r.pieces[0].id }] }, T).parts.find((p) => p.k === 'space')!.pts;
    expect(onIt).toBeGreaterThan(flat);
    const wall = rate(room(['f4043', 'f1432', 'f4037']), T).parts.find((p) => p.k === 'space')!.pts;
    expect(wall).toBeGreaterThan(flat);
  });

  it('a crowded floor says so', () => {
    expect(rate(room(Array.from({ length: 30 }, () => 'f4041')), T).note).toEqual({ k: 'crowded' });
  });

  it('the space is the room’s own: what sits well in the largest room crowds a 4 × 4 tent', () => {
    const r = room(['f4041', 'f4041', 'f4041', 'f4041']);
    const space = (size?: number) => rate({ ...r, size }, T).parts.find((p) => p.k === 'space')!.pts;
    expect(space()).toBe(space(8));
    expect(space(4)).toBeLessThan(space(8));
  });
});
