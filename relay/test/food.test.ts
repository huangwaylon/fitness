// The meal log in the record (docs/backend.md#events `food`): an entry set or removed, each entry's latest op kept
// (one row per entry), removal final; the food's name cleaned here as on the phone; anyone logs their own (the guest
// too), only the owner edits or removes; every phone sees every meal, the guest's too; the daily kcal goal a pref. A
// repeat (`food_repeat`) and a recipe (`food_recipe`) by the same rules: one row per id, its owner's alone; a recipe
// everyone's to see and to log as a food entry of their own.
import { beforeEach, describe, expect, it } from 'vitest';
import { StoreCore } from '../src/store.ts';
import {
  foodFold, foodOp, foodRecipeFold, foodRecipeOp, foodRepeatFold, foodRepeatOp, recipePortion, recipeSnap,
  type FoodEntry, type FoodOp, type FoodRecipe, type FoodRepeat, type RecipeOp, type RepeatOp
} from '../../app/src/lib/contract/food.ts';
import type { Notice } from '../../app/src/lib/sync/live-protocol.ts';
import { memSql } from './sqlite.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);
const KEY_C = 'c'.repeat(64);
const T0 = Date.parse('2026-11-03T03:00:00.000Z');
const RICE = { id: 'mext:01088', n: 'こめ 精白米 うるち米 めし', k: 156, p: 2.5, fa: 0.3, c: 37.1, s: 0, u: '1杯' };

describe('the meal log in the record', () => {
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
  /** `who` sends a food op (its event id fresh each time). */
  const send = (who: 'A' | 'B' | 'G', data: object) => call(keyOf[who], 'event', { id: `e${++n}`, type: 'food', data });
  const log = (who: 'A' | 'B' | 'G', id: string, extra: object = {}, at = (now += 1000)) =>
    send(who, { id, at, d: '2026-11-03', m: 'l', g: 150, f: RICE, ...extra });
  const rows = (key = KEY_A) => (call(key, 'snapshot').rows.events as [string, 'A' | 'B' | 'G', string, string, string][]).filter((r) => r[3] === 'food');
  /** The entries as a phone gets them (its snapshot's food rows, folded). */
  const entries = (key = KEY_A): FoodEntry[] => foodFold(rows(key).map((r) => ({ ...foodOp(JSON.parse(r[4]))!, who: r[1] }) as FoodOp & { who: 'A' | 'B' | 'G' }));

  it('keeps an entry, tells the phones, and the partner’s and the guest’s phones see it', () => {
    expect(log('A', 'fmeal001')).toMatchObject({ ok: true });
    expect(notices.at(-1)).toMatchObject({ what: 'event', who: 'A' });
    for (const key of [KEY_B, KEY_C]) expect(entries(key)).toMatchObject([{ id: 'fmeal001', who: 'A', d: '2026-11-03', m: 'l', g: 150, f: RICE }]);
  });

  it('cleans the food’s name and label, rounds the grams, and keeps it as cleaned', () => {
    expect(log('B', 'fmeal002', { g: 12.3, f: { ...RICE, n: '  ご\u0007はん\n大盛り\u202e ', u: ' 1\t杯 ' } })).toMatchObject({ ok: true });
    expect(JSON.parse(rows()[0][4]).f).toEqual({ ...RICE, n: 'ごはん 大盛り', u: '1 杯' });
    expect(entries()[0].g).toBe(12.3);
    // a long name is cut at 60 characters; a missing nutrient is unknown (null)
    const { p: _p, ...noProtein } = RICE;
    expect(log('B', 'fmeal003', { f: { ...noProtein, n: 'あ'.repeat(80) } })).toMatchObject({ ok: true });
    expect(entries().find((e) => e.id === 'fmeal003')?.f).toMatchObject({ n: 'あ'.repeat(60), p: null });
  });

  it('refuses a malformed op', () => {
    const at = now;
    const bad = [
      { id: 'nope', at, d: '2026-11-03', m: 'l', g: 150, f: RICE },
      { id: 'fmeal010', at: 'x', d: '2026-11-03', m: 'l', g: 150, f: RICE },
      { id: 'fmeal010', at, d: '2026-02-30', m: 'l', g: 150, f: RICE },
      { id: 'fmeal010', at, d: '2026-11-05', m: 'l', g: 150, f: RICE }, // after tomorrow
      { id: 'fmeal010', at, d: '2026-11-03', m: 'x', g: 150, f: RICE },
      { id: 'fmeal010', at, d: '2026-11-03', m: 'l', g: 0, f: RICE },
      { id: 'fmeal010', at, d: '2026-11-03', m: 'l', g: 5000.1, f: RICE },
      { id: 'fmeal010', at, d: '2026-11-03', m: 'l', g: 1.25, f: RICE },
      { id: 'fmeal010', at, d: '2026-11-03', m: 'l', g: 150, f: { ...RICE, k: 951 } },
      { id: 'fmeal010', at, d: '2026-11-03', m: 'l', g: 150, f: { ...RICE, s: 101 } },
      { id: 'fmeal010', at, d: '2026-11-03', m: 'l', g: 150, f: { ...RICE, n: ' \u0000 ' } },
      { id: 'fmeal010', at, d: '2026-11-03', m: 'l', g: 150, f: { ...RICE, id: 'x'.repeat(65) } },
      { id: 'fmeal010', at, d: '2026-11-03', m: 'l', g: 150, f: { ...RICE, html: '<b>' } },
      { id: 'fmeal010', at, d: '2026-11-03', m: 'l', g: 150, f: RICE, person: 'B' },
      { id: 'fmeal010', at, rm: true, g: 1 }
    ];
    for (const d of bad) expect(send('A', d)).toMatchObject({ ok: false, error: 'bad_request' });
    expect(log('A', 'fmeal011', { d: '2026-11-04' })).toMatchObject({ ok: true }); // tomorrow is fine
  });

  it('lets the owner edit, the latest op kept as the entry’s one row, an older edit acknowledged and dropped', () => {
    const at = now + 1000;
    log('A', 'fmeal020', {}, at);
    expect(log('A', 'fmeal020', { g: 200, m: 'd' }, at + 5000)).toMatchObject({ ok: true });
    expect(log('A', 'fmeal020', { g: 50 }, at + 2000)).toMatchObject({ ok: true, duplicate: true });
    expect(entries()).toMatchObject([{ id: 'fmeal020', g: 200, m: 'd', at: at + 5000 }]);
    expect(rows()).toHaveLength(1);
  });

  it('lets only the owner edit or remove: the partner, a member, the guest are refused', () => {
    log('G', 'fmeal030');
    log('A', 'fmeal031');
    expect(log('A', 'fmeal030', { g: 1 })).toMatchObject({ ok: false, error: 'forbidden' });
    expect(send('B', { id: 'fmeal030', at: (now += 1000), rm: true })).toMatchObject({ ok: false, error: 'forbidden' });
    expect(log('G', 'fmeal031', { g: 1 })).toMatchObject({ ok: false, error: 'forbidden' });
    expect(send('G', { id: 'fmeal031', at: (now += 1000), rm: true })).toMatchObject({ ok: false, error: 'forbidden' });
    // the guest edits and removes its own
    expect(log('G', 'fmeal030', { g: 300 })).toMatchObject({ ok: true });
    expect(entries().map((e) => [e.id, e.who, e.g])).toEqual([['fmeal030', 'G', 300], ['fmeal031', 'A', 150]]);
    expect(send('G', { id: 'fmeal030', at: (now += 1000), rm: true })).toMatchObject({ ok: true });
    expect(entries().map((e) => e.id)).toEqual(['fmeal031']);
  });

  it('a removal is final: a later set is acknowledged and dropped; a removal of an entry it never held too', () => {
    log('B', 'fmeal040');
    expect(send('B', { id: 'fmeal040', at: (now += 1000), rm: true })).toMatchObject({ ok: true });
    expect(log('B', 'fmeal040', { g: 99 })).toMatchObject({ ok: true, duplicate: true });
    expect(send('B', { id: 'fmeal041', at: (now += 1000), rm: true })).toMatchObject({ ok: true, duplicate: true });
    expect(entries()).toEqual([]);
    expect(rows()).toHaveLength(1); // the removal's row
  });

  it('acknowledges a retry of the same event as a duplicate', () => {
    const ev = { id: 'e-retry', type: 'food', data: { id: 'fmeal050', at: now + 1000, d: '2026-11-03', m: 'b', g: 80, f: RICE } };
    expect(call(KEY_A, 'event', ev)).toMatchObject({ ok: true });
    expect(call(KEY_A, 'event', ev)).toEqual({ ok: true, duplicate: true });
    expect(rows()).toHaveLength(1);
  });

  it('takes a kcal goal: either member for either, the guest its own only', () => {
    const pref = (who: 'A' | 'B' | 'G', data: object) => call(keyOf[who], 'event', { id: `p${++n}`, type: 'pref', data });
    expect(pref('A', { person: 'B', key: 'kcalGoal', value: 1800 })).toMatchObject({ ok: true });
    expect(pref('G', { key: 'kcalGoal', value: 2000 })).toMatchObject({ ok: true });
    expect(pref('G', { person: 'A', key: 'kcalGoal', value: 2000 })).toMatchObject({ ok: false, error: 'forbidden' });
    expect(pref('G', { key: 'kcalGoal', value: null })).toMatchObject({ ok: true });
    const goals = (call(KEY_C, 'snapshot').rows.events as unknown[][]).filter((r) => r[3] === 'pref');
    // one row per person (the latest): the guest's clear replaced its goal
    expect(goals.map((r) => [r[1], JSON.parse(r[4] as string)])).toEqual([
      ['A', { person: 'B', key: 'kcalGoal', value: 1800 }],
      ['G', { key: 'kcalGoal', value: null }]
    ]);
  });

  it('persists: a new store has the entries, and a dump loads back as it was (a beaten op skipped)', () => {
    log('A', 'fmeal060');
    log('G', 'fmeal061');
    store = open();
    expect(entries().map((e) => e.id)).toEqual(['fmeal060', 'fmeal061']);
    const dumped = store.dump().rows.events.filter((r) => r[3] === 'food');
    expect(dumped).toHaveLength(2);
    db = memSql();
    store = open();
    expect(store.load({ rows: { events: dumped } })).toMatchObject({ ok: true, events: 2 });
    expect(entries().map((e) => [e.id, e.who])).toEqual([['fmeal060', 'A'], ['fmeal061', 'G']]);
    // someone else's op on an entry, in a load: only its id is kept
    const other = [new Date(now + 5000).toISOString(), 'B', 'e-other', 'food', JSON.stringify({ id: 'fmeal060', at: now + 5000, rm: true })];
    expect(store.load({ rows: { events: [other] } })).toMatchObject({ ok: true, events: 0 });
    expect(entries().map((e) => e.id)).toEqual(['fmeal060', 'fmeal061']);
  });

  // ---- repeats (いつもの)
  const sendRep = (who: 'A' | 'B' | 'G', data: object) => call(keyOf[who], 'event', { id: `e${++n}`, type: 'food_repeat', data });
  const rep = (who: 'A' | 'B' | 'G', id: string, extra: object = {}, at = (now += 1000)) =>
    sendRep(who, { id, at, m: 'b', it: [{ g: 150, f: RICE }], w: 127, from: '2026-11-01', ...extra });
  const repRows = (key = KEY_A) => (call(key, 'snapshot').rows.events as [string, 'A' | 'B' | 'G', string, string, string][]).filter((r) => r[3] === 'food_repeat');
  const repeats = (key = KEY_A): FoodRepeat[] =>
    foodRepeatFold(repRows(key).map((r) => ({ ...foodRepeatOp(JSON.parse(r[4]))!, who: r[1] }) as RepeatOp & { who: 'A' | 'B' | 'G' }));

  it('keeps a repeat, normalized (names cleaned, grams rounded, skipped days sorted once, a null end open), seen by every phone', () => {
    const it2 = [{ g: 150, f: { ...RICE, n: ' ご\u0007はん ' } }, { g: 45.0, f: RICE }];
    expect(rep('A', 'rmeal001', { it: it2, to: null, sk: ['2026-11-03', '2026-11-02', '2026-11-03'] })).toMatchObject({ ok: true });
    expect(notices.at(-1)).toMatchObject({ what: 'event', who: 'A' });
    expect(JSON.parse(repRows()[0][4])).toEqual({
      id: 'rmeal001', at: now, m: 'b', it: [{ g: 150, f: { ...RICE, n: 'ごはん' } }, { g: 45, f: RICE }], w: 127, from: '2026-11-01', sk: ['2026-11-02', '2026-11-03']
    });
    for (const key of [KEY_B, KEY_C]) expect(repeats(key)).toMatchObject([{ id: 'rmeal001', who: 'A', w: 127 }]);
  });

  it('refuses a malformed repeat', () => {
    const at = now;
    const ok = { id: 'rmeal010', at, m: 'b', it: [{ g: 150, f: RICE }], w: 127, from: '2026-11-01' };
    const bad = [
      { ...ok, id: 'fmeal010' }, { ...ok, id: 'r12' }, { ...ok, at: 'x' }, { ...ok, m: 'x' }, { ...ok, w: 0 }, { ...ok, w: 128 }, { ...ok, w: 1.5 },
      { ...ok, from: '2026-02-30' }, { ...ok, from: '2026-11-05' }, // after tomorrow
      { ...ok, to: '2026-10-31' }, { ...ok, to: 'x' }, { ...ok, it: [] }, { ...ok, it: Array(21).fill({ g: 1, f: RICE }) },
      { ...ok, it: [{ g: 0, f: RICE }] }, { ...ok, it: [{ g: 1.25, f: RICE }] }, { ...ok, it: [{ g: 1, f: { ...RICE, k: 951 } }] },
      { ...ok, it: [{ g: 1, f: RICE, d: '2026-11-01' }] }, { ...ok, it: [null] }, { ...ok, it: 'x' },
      { ...ok, sk: ['2026-10-31'] }, { ...ok, to: '2026-11-03', sk: ['2026-11-04'] }, { ...ok, sk: ['x'] }, { ...ok, sk: '2026-11-02' },
      { ...ok, sk: Array.from({ length: 401 }, () => '2026-11-02') }, { ...ok, x: 1 }, { ...ok, person: 'B' },
      { id: 'rmeal010', at, rm: true, w: 1 }, { id: 'rmeal010', at, rm: false }
    ];
    for (const d of bad) expect(sendRep('A', d)).toMatchObject({ ok: false, error: 'bad_request' });
    expect(rep('A', 'rmeal011', { from: '2026-11-04', to: '2026-11-04' })).toMatchObject({ ok: true }); // tomorrow, one day
  });

  it('keeps each repeat’s latest op as its one row; an older op, a set after a removal, a removal it never held acknowledged', () => {
    const at = now + 1000;
    rep('B', 'rmeal020', {}, at);
    expect(rep('B', 'rmeal020', { sk: ['2026-11-02'] }, at + 5000)).toMatchObject({ ok: true });
    expect(rep('B', 'rmeal020', { w: 31 }, at + 2000)).toMatchObject({ ok: true, duplicate: true });
    expect(repeats()).toMatchObject([{ id: 'rmeal020', w: 127, sk: ['2026-11-02'], at: at + 5000 }]);
    expect(repRows()).toHaveLength(1);
    now = at + 5000;
    expect(sendRep('B', { id: 'rmeal020', at: (now += 1000), rm: true })).toMatchObject({ ok: true });
    expect(rep('B', 'rmeal020', { to: '2026-11-03' })).toMatchObject({ ok: true, duplicate: true });
    expect(sendRep('B', { id: 'rmeal021', at: (now += 1000), rm: true })).toMatchObject({ ok: true, duplicate: true });
    expect(repeats()).toEqual([]);
    expect(repRows()).toHaveLength(1); // the removal's row
    // a repeat's id and an entry's are slots apart: the same suffix never collides
    expect(log('B', 'fmeal020')).toMatchObject({ ok: true });
  });

  it('lets only the owner change a repeat; the guest keeps its own', () => {
    rep('G', 'rmeal030');
    rep('A', 'rmeal031');
    expect(rep('A', 'rmeal030', { w: 1 })).toMatchObject({ ok: false, error: 'forbidden' });
    expect(sendRep('B', { id: 'rmeal030', at: (now += 1000), rm: true })).toMatchObject({ ok: false, error: 'forbidden' });
    expect(rep('G', 'rmeal031', { to: '2026-11-03' })).toMatchObject({ ok: false, error: 'forbidden' });
    expect(rep('G', 'rmeal030', { to: '2026-11-03' })).toMatchObject({ ok: true });
    expect(repeats().map((r) => [r.id, r.who, r.to])).toEqual([['rmeal030', 'G', '2026-11-03'], ['rmeal031', 'A', undefined]]);
  });

  it('a repeat persists and loads back from a dump; someone else’s op in a load keeps only its id', () => {
    rep('A', 'rmeal040');
    store = open();
    const dumped = store.dump().rows.events.filter((r) => r[3] === 'food_repeat');
    db = memSql();
    store = open();
    expect(store.load({ rows: { events: dumped } })).toMatchObject({ ok: true, events: 1 });
    expect(store.load({ rows: { events: dumped } })).toMatchObject({ ok: true, events: 0 }); // idempotent
    const other = [new Date(now + 5000).toISOString(), 'B', 'e-other-r', 'food_repeat', JSON.stringify({ id: 'rmeal040', at: now + 5000, rm: true })];
    const bad = [new Date(now + 7000).toISOString(), 'A', 'e-bad-r', 'food_repeat', JSON.stringify({ id: 'rmeal041', at: now, w: 0 })];
    expect(store.load({ rows: { events: [other, bad] } })).toMatchObject({ ok: true, events: 0 });
    expect(repeats().map((r) => [r.id, r.who])).toEqual([['rmeal040', 'A']]);
    // its owner's removal, in a load, ends it
    const gone = [new Date(now + 8000).toISOString(), 'A', 'e-gone-r', 'food_repeat', JSON.stringify({ id: 'rmeal040', at: now + 8000, rm: true })];
    expect(store.load({ rows: { events: [gone] } })).toMatchObject({ ok: true, events: 1 });
    expect(repeats()).toEqual([]);
  });

  // ---- recipes (マイレシピ)
  const CURRY = { id: 'mext:x', n: 'カレールウ', k: 474, p: 6.5, fa: 34.1, c: 44.7, s: 10.6 };
  const sendRec = (who: 'A' | 'B' | 'G', data: object) => call(keyOf[who], 'event', { id: `e${++n}`, type: 'food_recipe', data });
  const recipe = (who: 'A' | 'B' | 'G', id: string, extra: object = {}, at = (now += 1000)) =>
    sendRec(who, { id, at, n: 'おうちカレー', sv: 4, it: [{ g: 600, f: RICE }, { g: 100, f: CURRY }], ...extra });
  const recRows = (key = KEY_A) => (call(key, 'snapshot').rows.events as [string, 'A' | 'B' | 'G', string, string, string][]).filter((r) => r[3] === 'food_recipe');
  const recipes = (key = KEY_A): FoodRecipe[] =>
    foodRecipeFold(recRows(key).map((r) => ({ ...foodRecipeOp(JSON.parse(r[4]))!, who: r[1] }) as RecipeOp & { who: 'A' | 'B' | 'G' }));

  it('keeps a recipe, normalized, seen by every phone; the partner and the guest log it as their own entry', () => {
    expect(recipe('A', 'cmeal001', { n: '  おうち\u0007カレー\n ', it: [{ g: 600.0, f: { ...RICE, n: ' ごはん ' } }, { g: 100, f: CURRY }] })).toMatchObject({ ok: true });
    expect(notices.at(-1)).toMatchObject({ what: 'event', who: 'A' });
    expect(JSON.parse(recRows()[0][4])).toEqual({ id: 'cmeal001', at: now, n: 'おうちカレー', sv: 4, it: [{ g: 600, f: { ...RICE, n: 'ごはん' } }, { g: 100, f: CURRY }] });
    for (const key of [KEY_B, KEY_C]) expect(recipes(key)).toMatchObject([{ id: 'cmeal001', who: 'A', n: 'おうちカレー', sv: 4 }]);
    // logging it: an ordinary food entry of the logger's, the recipe per 100 g, one serving's grams
    const r = recipes(KEY_B)[0];
    const { g } = recipePortion(r);
    for (const who of ['B', 'G'] as const) expect(log(who, `fmealr0${who.toLowerCase()}`, { g, f: recipeSnap(r, '1人前') })).toMatchObject({ ok: true });
    expect(entries().map((e) => [e.who, e.g, e.f.id, e.f.n, e.f.u])).toEqual([['B', 175, 'recipe:cmeal001', 'おうちカレー', '1人前'], ['G', 175, 'recipe:cmeal001', 'おうちカレー', '1人前']]);
    // what a serving adds up to: a quarter of the recipe's kcal
    const kcal = (e: FoodEntry) => (e.f.k * e.g) / 100;
    expect(kcal(entries()[0])).toBeCloseTo((600 * 156 + 100 * 474) / 100 / 4, 0);
  });

  it('refuses a malformed recipe', () => {
    const at = now;
    const ok = { id: 'cmeal010', at, n: 'カレー', sv: 2, it: [{ g: 150, f: RICE }] };
    const bad = [
      { ...ok, id: 'fmeal010' }, { ...ok, id: 'c12' }, { ...ok, at: 'x' }, { ...ok, n: ' \u0000 ' }, { ...ok, n: 5 }, { ...ok, sv: 0 }, { ...ok, sv: 21 },
      { ...ok, sv: 1.5 }, { ...ok, sv: '2' }, { ...ok, it: [] }, { ...ok, it: Array(31).fill({ g: 1, f: RICE }) }, { ...ok, it: [{ g: 0, f: RICE }] },
      { ...ok, it: [{ g: 1.25, f: RICE }] }, { ...ok, it: [{ g: 1, f: { ...RICE, k: 951 } }] }, { ...ok, it: [{ g: 1, f: RICE, m: 'b' }] }, { ...ok, it: 'x' },
      { ...ok, x: 1 }, { ...ok, person: 'B' }, { id: 'cmeal010', at, rm: true, sv: 1 }, { id: 'cmeal010', at, rm: false }
    ];
    for (const d of bad) expect(sendRec('A', d)).toMatchObject({ ok: false, error: 'bad_request' });
    // a long name is cut at 30; 30 ingredients and 20 servings are fine
    expect(recipe('A', 'cmeal011', { n: 'あ'.repeat(40), sv: 20, it: Array(30).fill({ g: 1, f: RICE }) })).toMatchObject({ ok: true });
    expect(recipes()[0].n).toBe('あ'.repeat(30));
  });

  it('keeps each recipe’s latest op as its one row; an older op, a set after a removal, a removal it never held acknowledged', () => {
    const at = now + 1000;
    recipe('B', 'cmeal020', {}, at);
    expect(recipe('B', 'cmeal020', { sv: 2 }, at + 5000)).toMatchObject({ ok: true });
    expect(recipe('B', 'cmeal020', { sv: 6 }, at + 2000)).toMatchObject({ ok: true, duplicate: true });
    expect(recipes()).toMatchObject([{ id: 'cmeal020', sv: 2, at: at + 5000 }]);
    expect(recRows()).toHaveLength(1);
    now = at + 5000;
    expect(sendRec('B', { id: 'cmeal020', at: (now += 1000), rm: true })).toMatchObject({ ok: true });
    expect(recipe('B', 'cmeal020', { sv: 3 })).toMatchObject({ ok: true, duplicate: true });
    expect(sendRec('B', { id: 'cmeal021', at: (now += 1000), rm: true })).toMatchObject({ ok: true, duplicate: true });
    expect(recipes()).toEqual([]);
    expect(recRows()).toHaveLength(1); // the removal's row
  });

  it('lets only the owner change a recipe; the guest keeps its own; a copy is a new recipe of the copier', () => {
    recipe('G', 'cmeal030');
    recipe('A', 'cmeal031');
    expect(recipe('A', 'cmeal030', { sv: 1 })).toMatchObject({ ok: false, error: 'forbidden' });
    expect(sendRec('B', { id: 'cmeal030', at: (now += 1000), rm: true })).toMatchObject({ ok: false, error: 'forbidden' });
    expect(recipe('G', 'cmeal031', { sv: 1 })).toMatchObject({ ok: false, error: 'forbidden' });
    expect(sendRec('G', { id: 'cmeal031', at: (now += 1000), rm: true })).toMatchObject({ ok: false, error: 'forbidden' });
    expect(recipe('G', 'cmeal030', { n: 'ゲストカレー' })).toMatchObject({ ok: true });
    expect(recipe('B', 'cmeal032', { n: 'おうちカレー（コピー）' })).toMatchObject({ ok: true });
    expect(recipes(KEY_C).map((r) => [r.id, r.who, r.n])).toEqual([['cmeal032', 'B', 'おうちカレー（コピー）'], ['cmeal030', 'G', 'ゲストカレー'], ['cmeal031', 'A', 'おうちカレー']]);
  });

  it('a recipe persists and loads back from a dump; someone else’s op in a load keeps only its id', () => {
    recipe('A', 'cmeal040');
    store = open();
    expect(recipes().map((r) => r.id)).toEqual(['cmeal040']);
    const dumped = store.dump().rows.events.filter((r) => r[3] === 'food_recipe');
    db = memSql();
    store = open();
    expect(store.load({ rows: { events: dumped } })).toMatchObject({ ok: true, events: 1 });
    expect(store.load({ rows: { events: dumped } })).toMatchObject({ ok: true, events: 0 }); // idempotent
    const other = [new Date(now + 5000).toISOString(), 'B', 'e-other-c', 'food_recipe', JSON.stringify({ id: 'cmeal040', at: now + 5000, rm: true })];
    const bad = [new Date(now + 7000).toISOString(), 'A', 'e-bad-c', 'food_recipe', JSON.stringify({ id: 'cmeal041', at: now, n: 'x', sv: 0, it: [] })];
    expect(store.load({ rows: { events: [other, bad] } })).toMatchObject({ ok: true, events: 0 });
    expect(recipes().map((r) => [r.id, r.who])).toEqual([['cmeal040', 'A']]);
    const edit = [new Date(now + 8000).toISOString(), 'A', 'e-edit-c', 'food_recipe', JSON.stringify({ id: 'cmeal040', at: now + 8000, n: 'カレー', sv: 2, it: [{ g: 100, f: RICE }] })];
    expect(store.load({ rows: { events: [edit] } })).toMatchObject({ ok: true, events: 1 });
    expect(recipes()).toMatchObject([{ id: 'cmeal040', n: 'カレー', sv: 2 }]);
    expect(recRows()).toHaveLength(1);
  });
});
