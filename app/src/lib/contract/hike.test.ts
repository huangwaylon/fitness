// トレイル's own hikes' contract (contract/hike.ts): the op's shape and cleaning, the merge (the latest `at`, then who;
// a removal final and dropping its track), the cap, the phone's fold, the track's shape and the raw rows' reader.
import { describe, expect, it } from 'vitest';
import { HikeBook, hikeClean, hikeFold, hikeOpOf, hikeRowOf, hikesOf, hikeTrackOf, hikeTrkAccept, hikeTrkOf, newHikeId, type HikeEntry } from './hike.ts';
import { eventSlot, validEventData } from './record.ts';
import { guestMayWrite } from './guest.ts';
import type { EventRow } from './api.ts';

const T = Date.parse('2026-11-20T03:00:00.000Z');
type W = 'A' | 'B' | 'G';
const BASE = { area: '架空県', status: 'done', src: 'manual' };
const row = (who: W, d: Record<string, unknown>, queued = false): HikeEntry => ({ ...hikeRowOf('hike', d, who)!, ...(queued ? { queued: true as const } : {}) });
const hike = (who: W, id: string, at: number, name = id, extra: Record<string, unknown> = {}, queued = false) => row(who, { id, at, name, ...BASE, ...extra }, queued);
const rm = (who: W, id: string, at: number, queued = false) => row(who, { id, at, rm: true }, queued);
const TRK = { v: 1, len: 900, pts: [[150, 20, 10], [150.01, 20.01, 20.5]], wpts: [] };

describe('the op', () => {
  it('reads a hike and a removal, their known keys only, each in range', () => {
    const full = { id: 'habc1234', at: T, name: '架空山', area: '', status: 'want', date: '2026-12-01', src: 'yamap', ref: 'a42', km: 8.3, gainM: 812, downM: 790, time: '5:02', diff: 'veryhard', notes: 'a\nb' };
    expect(hikeOpOf(full)).toEqual(full);
    expect(hikeOpOf({ id: 'habc1234', at: T, rm: true })).toEqual({ id: 'habc1234', at: T, rm: true });
    const ok = { id: 'habc1234', at: T, name: 'x', ...BASE };
    expect(hikeOpOf(ok)).toEqual(ok);
    for (const d of [
      { ...ok, id: 'dabc1234' }, { ...ok, at: 5 }, { ...ok, name: '' }, { ...ok, name: 'x'.repeat(61) }, { ...ok, area: undefined },
      { ...ok, status: 'done!' }, { ...ok, src: 'x' }, { ...ok, ref: 'a1' }, { ...ok, src: 'yamap', ref: 'a0' }, { ...ok, km: 1001 },
      { ...ok, downM: -1 }, { ...ok, time: '25:61' }, { ...ok, notes: '' }, { ...ok, notes: ' x' }, { ...ok, notes: 'x'.repeat(2001) },
      { ...ok, extra: 1 }, { id: 'habc1234', at: T, rm: 1 }
    ]) expect(hikeOpOf(d), JSON.stringify(d)).toBeNull();
    expect(hikeOpOf({ ...ok, at: T + 2 * 86400_000 }, T)).toBeNull();
    expect(newHikeId(T)).toMatch(/^h[0-9a-z]{6,24}$/);
  });

  it('cleans texts as the record keeps them; the record takes it from anyone, in its id’s slot', () => {
    expect(hikeClean({ id: 'habc1234', at: T, name: ' a\n\u0007b ', area: ' 県 ', notes: ' x \r\n\n\n\ny\t ' })).toMatchObject({ name: 'a b', area: '県', notes: 'x\n\ny' });
    expect(hikeClean({ id: 'habc1234', notes: ' \n ' })).not.toHaveProperty('notes');
    expect((hikeClean({ notes: 'あ'.repeat(2100) }).notes as string).length).toBe(2000);
    expect(validEventData('hike', { id: 'habc1234', at: T, name: 'x', ...BASE }, T)).toBe(true);
    expect(validEventData('hike', { id: 'habc1234', at: T, name: ' x', ...BASE }, T)).toBe(false);
    expect(eventSlot('hike', 'G', 'G', { id: 'habc1234' }, T)).toBe('hike|habc1234');
    expect(eventSlot('hike_trk', 'G', 'G', { id: 'habc1234' }, T)).toBe('hike_trk|habc1234');
    expect(guestMayWrite('hike', {})).toBe(true);
    expect(guestMayWrite('hike_trk', {})).toBe(true);
  });
});

describe('the book', () => {
  it('the latest `at` wins, then G over B over A; a removal is final and drops its track', () => {
    const b = new HikeBook();
    expect(b.apply(hike('A', 'hone0001', T)).v).toBe('append');
    expect(b.apply(hike('B', 'hone0001', T - 1, 'older')).v).toBe('stale');
    expect(b.apply(hike('A', 'hone0001', T, 'same A')).v).toBe('stale');
    expect(b.apply(hike('G', 'hone0001', T, 'same G')).v).toBe('append');
    expect(b.apply(rm('A', 'hone0001', T + 1))).toMatchObject({ v: 'append', drop: ['hike_trk|hone0001'] });
    expect(b.apply(hike('B', 'hone0001', T + 9, 'back')).v).toBe('stale');
    expect(b.apply(rm('A', 'hnever01', T)).v).toBe('stale');
    expect(hikesOf(b)).toEqual([]);
  });

  it('at most 300 standing; a removal frees a place', () => {
    const b = new HikeBook();
    for (let i = 0; i < 300; i++) expect(b.apply(hike('A', `hn${String(i).padStart(6, '0')}`, T)).v).toBe('append');
    expect(b.apply(hike('A', 'hfull001', T)).v).toBe('full');
    b.apply(rm('A', 'hn000000', T + 1));
    expect(b.apply(hike('A', 'hfull001', T)).v).toBe('append');
  });

  it('the phone’s fold: the record’s rows taken, its own queued ones judged; the hikes by date, latest first', () => {
    const b = hikeFold([
      hike('A', 'hold0001', T, 'old', { date: '2025-05-01' }),
      hike('B', 'hnew0001', T, 'new', { date: '2026-11-01' }),
      hike('G', 'hnodate1', T, 'b undated'),
      hike('G', 'hnodate2', T, 'a undated'),
      hike('A', 'hold0001', T - 5, 'queued but older', {}, true),
      rm('B', 'hgone001', T, true)
    ]);
    expect(hikesOf(b).map((h) => [h.id, h.name, h.who])).toEqual([['hnew0001', 'new', 'B'], ['hold0001', 'old', 'A'], ['hnodate2', 'a undated', 'G'], ['hnodate1', 'b undated', 'G']]);
  });
});

describe('the track', () => {
  it('reads a track’s shape, refusing anything else', () => {
    expect(hikeTrkOf({ id: 'habc1234', ...TRK })).toEqual({ id: 'habc1234', ...TRK });
    for (const d of [
      { ...TRK }, { id: 'habc1234', ...TRK, v: 2 }, { id: 'habc1234', ...TRK, len: -1 }, { id: 'habc1234', ...TRK, pts: [[1, 2, 3]] },
      { id: 'habc1234', ...TRK, pts: [[1, 2], [1, 2]] }, { id: 'habc1234', ...TRK, pts: [[1, 91, 0], [1, 2, 0]] },
      { id: 'habc1234', ...TRK, wpts: [{ lon: 1, lat: 1 }] }, { id: 'habc1234', ...TRK, wpts: Array(31).fill({ lon: 1, lat: 1, name: '' }) },
      { id: 'habc1234', ...TRK, x: 1 }
    ]) expect(hikeTrkOf(d), JSON.stringify(d).slice(0, 80)).toBeNull();
    expect(validEventData('hike_trk', { id: 'habc1234', ...TRK }, T)).toBe(true);
  });

  it('kept only for a hike standing, and only the first', () => {
    const h = hike('A', 'habc1234', T);
    expect(hikeTrkAccept(h, false)).toBe('append');
    expect(hikeTrkAccept(h, true)).toBe('stale');
    expect(hikeTrkAccept(rm('A', 'habc1234', T), false)).toBe('stale');
    expect(hikeTrkAccept(null, false)).toBe('stale');
  });

  it('a hike’s track from the model’s raw rows, by its id (key order free), null when none or broken', () => {
    const r = (id: string, data: string): EventRow => ['2026-11-20T03:00:00.000Z', 'A', id, 'hike_trk', data];
    const rows = [r('e1', JSON.stringify({ ...TRK, wpts: [{ lon: 1, lat: 1, name: '"id":"hzzzzzzz"' }], id: 'habc1234' })), r('e2', '{"id":"hbroken1",'), r('e3', JSON.stringify({ id: 'hbad0001', ...TRK, v: 9 }))];
    expect(hikeTrackOf(rows, 'habc1234')).toEqual({ ...TRK, wpts: [{ lon: 1, lat: 1, name: '"id":"hzzzzzzz"' }] });
    expect(hikeTrackOf(rows, 'hzzzzzzz')).toBeNull();
    expect(hikeTrackOf(rows, 'hbroken1')).toBeNull();
    expect(hikeTrackOf(rows, 'hbad0001')).toBeNull();
    expect(hikeTrackOf(rows, 'hnone001')).toBeNull();
  });
});
