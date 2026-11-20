// トレイル's own hikes in the record (docs/backend.md#events `hike`, `hike_trk`, contract/hike.ts): anyone (the guest
// too) adds, edits and removes a hike; the latest `at` wins per id (then who), a removal final and taking its track;
// a track only for a hike held, sent once, under its own cap; the cap of hikes; the texts cleaned; a dump loads back
// the same hikes and a removed hike's track pruned.
import { beforeEach, describe, expect, it } from 'vitest';
import { StoreCore } from '../src/store.ts';
import { hikeFold, hikeRowOf, hikesOf, hikeTrackOf, type HikeRow } from '../../app/src/lib/contract/hike.ts';
import { HIKE_TRK_CHARS } from '../../app/src/lib/contract/hikeTrack.ts';
import type { EventRow } from '../../app/src/lib/contract/api.ts';
import type { Notice } from '../../app/src/lib/contract/live-protocol.ts';
import { memSql } from './sqlite.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);
const KEY_C = 'c'.repeat(64);
const T0 = Date.parse('2026-11-20T03:00:00.000Z');
type W = 'A' | 'B' | 'G';
/** An invented track (no real place). */
const TRK = { v: 1, len: 1200, pts: [[150, 20, 100], [150.001, 20.002, 180.5], [150.002, 20.004, 260]], wpts: [{ lon: 150.002, lat: 20.004, name: '架空山' }] };

describe('hikes in the record', () => {
  let now: number;
  let notices: Notice[];
  let db: ReturnType<typeof memSql>;
  let store: StoreCore;
  const open = () => new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B, KEY_C }, now: () => now, notify: (n) => notices.push(n) });
  beforeEach(() => {
    now = T0;
    notices = [];
    db = memSql();
    store = open();
  });
  const call = (key: string, action: string, extra: object = {}) => store.handle({ key, action, ...extra }, 100) as Record<string, any>;
  const keyOf = { A: KEY_A, B: KEY_B, G: KEY_C } as const;
  let n = 0;
  const send = (who: W, data: object, type = 'hike') => call(keyOf[who], 'event', { id: `e${++n}`, type, data });
  const at = () => (now += 1000);
  const hike = (who: W, id: string, name: string, extra: object = {}, t = at()) => send(who, { id, at: t, name, area: '架空県', status: 'done', src: 'manual', ...extra });
  const trk = (who: W, id: string, t: object = TRK) => send(who, { id, ...t }, 'hike_trk');
  const events = (key = KEY_A) => call(key, 'snapshot').rows.events as EventRow[];
  const rows = (type: string, key = KEY_A) => events(key).filter((r) => r[3] === type);
  /** The hikes as a phone gets them (its snapshot's rows, folded). */
  const hikes = (key = KEY_A) => hikesOf(hikeFold(rows('hike', key).map((r) => hikeRowOf(r[3], JSON.parse(r[4]), r[1])).filter((r): r is HikeRow => r !== null)));

  it('anyone, the guest too, adds, edits and removes a hike and its track; every phone is told', () => {
    expect(hike('G', 'hkaku001', '架空山', { status: 'want', src: 'yamap', ref: 'm77', km: 4.9, gainM: 571, downM: 572, time: '3:32', diff: 'easy' })).toMatchObject({ ok: true });
    expect(notices.at(-1)).toMatchObject({ what: 'event', who: 'G' });
    expect(trk('G', 'hkaku001')).toMatchObject({ ok: true });
    expect(hike('B', 'hkaku001', '架空山', { status: 'done', date: '2026-11-15', src: 'yamap', ref: 'm77', notes: '紅葉が\n\n\nきれい ' })).toMatchObject({ ok: true });
    expect(hikes(KEY_C)).toEqual([{ id: 'hkaku001', at: now, name: '架空山', area: '架空県', status: 'done', date: '2026-11-15', src: 'yamap', ref: 'm77', notes: '紅葉が\n\nきれい', who: 'B' }]);
    expect(hikeTrackOf(rows('hike_trk', KEY_C), 'hkaku001')).toEqual(TRK);
    expect(send('A', { id: 'hkaku001', at: at(), rm: true })).toMatchObject({ ok: true });
    expect(hikes()).toEqual([]);
    expect(rows('hike_trk')).toEqual([]);
  });

  it('the latest `at` wins, then who; an older op and anything after a removal are acknowledged and change nothing', () => {
    const t = at();
    expect(hike('A', 'hone0001', 'あと', {}, t + 5000)).toMatchObject({ ok: true });
    expect(hike('B', 'hone0001', 'まえ', {}, t + 2000)).toMatchObject({ ok: true, duplicate: true });
    expect(hike('G', 'hone0001', 'ゲスト', {}, t + 5000)).toMatchObject({ ok: true });
    expect(hikes()[0].name).toBe('ゲスト');
    expect(send('A', { id: 'hone0001', at: t + 6000, rm: true })).toMatchObject({ ok: true });
    expect(hike('B', 'hone0001', 'again', {}, t + 9000)).toMatchObject({ ok: true, duplicate: true });
    expect(send('A', { id: 'hnever01', at: at(), rm: true })).toMatchObject({ ok: true, duplicate: true });
    expect(hikes()).toEqual([]);
  });

  it('a track only for a hike held, sent once, within its cap and its shape', () => {
    expect(trk('A', 'hnone001')).toMatchObject({ ok: true, duplicate: true });
    hike('A', 'htrk0001', 'T');
    expect(trk('B', 'htrk0001')).toMatchObject({ ok: true });
    expect(trk('A', 'htrk0001', { ...TRK, len: 9 })).toMatchObject({ ok: true, duplicate: true });
    expect(JSON.parse(rows('hike_trk')[0][4]).len).toBe(1200);
    hike('A', 'htrk0002', 'U');
    const big = { ...TRK, pts: Array.from({ length: 4000 }, (_, i) => [150 + i * 1e-5, 20.12345, 1234.5]) };
    expect(JSON.stringify(big).length).toBeGreaterThan(HIKE_TRK_CHARS);
    expect(trk('A', 'htrk0002', big)).toMatchObject({ ok: false, error: 'too_large' });
    // (over the other events' 20,000 but under its own)
    const mid = { ...TRK, pts: Array.from({ length: 1500 }, (_, i) => [150 + i * 1e-5, 20.12345, 1234.5]) };
    expect(JSON.stringify(mid).length).toBeGreaterThan(20_000);
    expect(trk('A', 'htrk0002', mid)).toMatchObject({ ok: true });
    for (const t of [{ ...TRK, v: 2 }, { ...TRK, pts: [[150, 20, 1]] }, { ...TRK, pts: [[200, 20, 1], [150, 20, 1]] }, { ...TRK, wpts: [{ lon: 1, lat: 1, name: 'x', d: 1 }] }, { ...TRK, extra: 1 }]) {
      hike('A', 'htrk0003', 'V');
      expect(trk('A', 'htrk0003', t), JSON.stringify(t).slice(0, 80)).toMatchObject({ ok: false, error: 'bad_request' });
    }
  });

  it('cleans the texts; refuses a malformed op or one a day ahead', () => {
    hike('A', 'hclean01', '  Mt.\u0007 \n Kaku ', { area: ' 架空県 ' });
    expect(hikes()[0]).toMatchObject({ name: 'Mt. Kaku', area: '架空県' });
    const ok = { id: 'hbad0001', at: now, name: 'x', area: '', status: 'done', src: 'gpx' };
    expect(send('A', ok)).toMatchObject({ ok: true });
    const bad: object[] = [
      { ...ok, name: ' ' },
      { ...ok, status: 'maybe' },
      { ...ok, src: 'alltrails' },
      { ...ok, ref: 'a1' },
      { ...ok, src: 'yamap', ref: 'x1' },
      { ...ok, date: '2026-13-01' },
      { ...ok, km: -1 },
      { ...ok, gainM: 1.5 },
      { ...ok, time: '3h' },
      { ...ok, diff: 'extreme' },
      { ...ok, html: 1 },
      { ...ok, id: 'BAD' },
      { ...ok, at: now + 2 * 86400_000 },
      { id: 'hbad0001', at: now, rm: true, name: 'x' }
    ];
    for (const d of bad) expect(send('A', d), JSON.stringify(d)).toMatchObject({ ok: false, error: 'bad_request' });
    expect((hikes().find((h) => h.id === 'hbad0001')!.name)).toBe('x');
  });

  it('at most 300 hikes standing: a new one past them is refused, a removal frees a place', () => {
    for (let i = 0; i < 300; i++) expect(hike('A', `hn${String(i).padStart(6, '0')}`, `#${i}`).ok).toBe(true);
    expect(hike('A', 'hfull001', 'one more')).toMatchObject({ ok: false, error: 'bad_request', detail: 'hike full' });
    expect(send('A', { id: 'hn000001', at: at(), rm: true })).toMatchObject({ ok: true });
    expect(hike('A', 'hfull001', 'one more')).toMatchObject({ ok: true });
  });

  it('a dump loads back the same hikes and tracks; a load drops a removed hike’s track', () => {
    hike('A', 'hload001', 'L', { date: '2026-10-01' });
    hike('G', 'hload002', 'M', { status: 'planned', date: '2026-12-01' });
    trk('A', 'hload001');
    hike('G', 'hload002', 'M2');
    const before = hikes();
    const dumped = store.dump().rows.events;
    db = memSql();
    store = open();
    expect(store.load({ rows: { events: dumped } })).toMatchObject({ ok: true, events: dumped.length, skipped: 0 });
    expect(hikes()).toEqual(before);
    expect(hikeTrackOf(rows('hike_trk'), 'hload001')).toEqual(TRK);
    expect(store.load({ rows: { events: dumped } })).toMatchObject({ ok: true, events: 0 });
    // a file with a track and its hike's removal (in either order)
    const ev = (id: string, type: string, d: object, t: number) => [new Date(t).toISOString(), 'B', id, type, JSON.stringify(d)];
    expect(store.load({ rows: { events: [ev('x1', 'hike_trk', { id: 'hload003', ...TRK }, T0 - 5), ev('x2', 'hike', { id: 'hload003', at: T0 - 9, rm: true }, T0 - 9)] } })).toMatchObject({ ok: true, skipped: 0 });
    expect(rows('hike_trk').map((r) => JSON.parse(r[4]).id)).toEqual(['hload001']);
  });
});
