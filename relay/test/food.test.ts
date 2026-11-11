// The meal log in the record (docs/backend.md#events `food`): an entry set or removed, each entry's latest op kept
// (one row per entry), removal final; the food's name cleaned here as on the phone; anyone logs their own (the guest
// too), only the owner edits or removes; every phone sees every meal, the guest's too; the daily kcal goal a pref. A
// repeat (`food_repeat`), a recipe (`food_recipe`) and a custom food (`food_custom`) by the same rules: one row per id,
// its owner's alone; a recipe and a custom food everyone's to see and to log as a food entry of their own.
import { beforeEach, describe, expect, it } from 'vitest';
import { StoreCore } from '../src/store.ts';
import {
  customPortions, customSnap, foodCustomFold, foodCustomOp, foodFold, foodOp, foodRecipeFold, foodRecipeOp, foodRepeatFold, foodRepeatOp,
  recipePortion, recipeSnap, type CustomOp, type FoodCustom, type FoodEntry, type FoodOp, type FoodRecipe, type FoodRepeat, type RecipeOp,
  type RepeatOp
} from '../../app/src/lib/contract/food.ts';
import type { Notice } from '../../app/src/lib/contract/live-protocol.ts';
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
    // (calm: the island draws no meal; a phone fetches a run of them once it pauses, r3 L9)
    expect(notices.at(-1)).toMatchObject({ what: 'event', who: 'A', calm: true });
    for (const key of [KEY_B, KEY_C]) expect(entries(key)).toMatchObject([{ id: 'fmeal001', who: 'A', d: '2026-11-03', m: 'l', g: 150, f: RICE }]);
    // a batch of meals is calm too; one with anything the island draws is not
    call(KEY_A, 'events', { events: [{ id: 'eb1', type: 'food', data: { id: 'fmeal101', at: (now += 1000), d: '2026-11-03', m: 'l', g: 150, f: RICE } }] });
    expect(notices.at(-1)?.calm).toBe(true);
    call(KEY_A, 'events', { events: [{ id: 'eb2', type: 'food', data: { id: 'fmeal102', at: (now += 1000), d: '2026-11-03', m: 'l', g: 150, f: RICE } }, { id: 'eb3', type: 'pref', data: { key: 'locale', value: 'en' } }] });
    expect(notices.at(-1)).not.toHaveProperty('calm');
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

  // (the ops' shapes are the contract's: contract/food.test.ts; here, what the record adds)
  it('refuses a malformed op, a day after tomorrow (the record’s Tokyo date), an `at` over a day ahead of its clock', () => {
    const ok = { id: 'fmeal010', at: now, d: '2026-11-03', m: 'l', g: 150, f: RICE };
    const bad = [
      { ...ok, g: 0 }, { ...ok, f: { ...RICE, html: '<b>' } }, { ...ok, person: 'B' },
      { ...ok, d: '2026-11-05' }, // after tomorrow
      { ...ok, at: now + 86_400_001 }, { id: 'fmeal010', at: now + 86_400_001, rm: true } // a clock far ahead
    ];
    for (const d of bad) expect(send('A', d)).toMatchObject({ ok: false, error: 'bad_request' });
    expect(log('A', 'fmeal011', { d: '2026-11-04' }, now + 86_400_000)).toMatchObject({ ok: true }); // tomorrow, a day ahead: fine
  });

  it('“tomorrow” turns at Tokyo midnight (15:00Z)', () => {
    now = Date.parse('2026-11-03T14:59:59.999Z'); // 11/03 23:59:59.999 JST
    expect(log('A', 'fmeal012', { d: '2026-11-05' }, now)).toMatchObject({ ok: false, error: 'bad_request' });
    now = Date.parse('2026-11-03T15:00:00.000Z'); // 11/04 00:00 JST
    expect(log('A', 'fmeal012', { d: '2026-11-05' }, now)).toMatchObject({ ok: true });
    expect(log('A', 'fmeal013', { d: '2026-11-06' }, now)).toMatchObject({ ok: false, error: 'bad_request' });
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

  it('takes the nutrient goals as the kcal goal: either member for either, the guest its own', () => {
    const pref = (who: 'A' | 'B' | 'G', data: object) => call(keyOf[who], 'event', { id: `p${++n}`, type: 'pref', data });
    expect(pref('A', { person: 'B', key: 'proteinGoal', value: 110 })).toMatchObject({ ok: true });
    expect(pref('B', { key: 'saltGoal', value: 7.5 })).toMatchObject({ ok: true });
    expect(pref('G', { key: 'fatGoal', value: 60 })).toMatchObject({ ok: true });
    expect(pref('G', { key: 'carbsGoal', value: null })).toMatchObject({ ok: true });
    // fibre and alcohol (2026-11-05): as the others (the record's slot, the guest its own)
    expect([pref('A', { key: 'fibreGoal', value: 21 }), pref('G', { key: 'alcoholGoal', value: 10 }), pref('G', { person: 'B', key: 'fibreGoal', value: 20 })]
      .map((r) => r.error ?? r.ok)).toEqual([true, true, 'forbidden']);
    expect(pref('G', { person: 'A', key: 'proteinGoal', value: 100 })).toMatchObject({ ok: false, error: 'forbidden' });
    // the latest per person and key: a second protein goal replaces the first
    expect(pref('B', { person: 'B', key: 'proteinGoal', value: 120 })).toMatchObject({ ok: true });
    const goals = (call(KEY_C, 'snapshot').rows.events as unknown[][]).filter((r) => r[3] === 'pref').map((r) => JSON.parse(r[4] as string));
    expect(goals.filter((d) => d.key === 'proteinGoal')).toEqual([{ person: 'B', key: 'proteinGoal', value: 120 }]);
    expect(goals.map((d) => d.key).sort()).toEqual(['alcoholGoal', 'carbsGoal', 'fatGoal', 'fibreGoal', 'proteinGoal', 'saltGoal']);
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

  it('refuses a malformed repeat, a first day after tomorrow, an `at` over a day ahead', () => {
    const ok = { id: 'rmeal010', at: now, m: 'b', it: [{ g: 150, f: RICE }], w: 127, from: '2026-11-01' };
    const bad = [
      { ...ok, w: 0 }, { ...ok, x: 1 }, { ...ok, person: 'B' }, { ...ok, nx: 'fmeal010' },
      { ...ok, from: '2026-11-05' }, // after tomorrow
      { ...ok, at: now + 86_400_001 }
    ];
    for (const d of bad) expect(sendRep('A', d)).toMatchObject({ ok: false, error: 'bad_request' });
    expect(rep('A', 'rmeal011', { from: '2026-11-04', to: '2026-11-04' })).toMatchObject({ ok: true }); // tomorrow, one day
  });

  it('a day skipped stays skipped, whichever of two phones’ ops comes first (the newer kept, with both’s skips)', () => {
    // phone 1 makes 11/04 ordinary (a skip; its items became entries) while phone 2, not fetched yet, stops it on 11/04
    const t = now + 1000;
    rep('A', 'rmeal050', {}, t);
    const skip = { sk: ['2026-11-04', '2026-11-05'] }, stop = { to: '2026-11-04' };
    // the skip first, then the stop (newer, no skips): the stop kept with the skip within its days
    expect(rep('A', 'rmeal050', skip, t + 1000)).toMatchObject({ ok: true });
    expect(rep('A', 'rmeal050', stop, t + 2000)).toMatchObject({ ok: true });
    expect(repRows().map((r) => JSON.parse(r[4]))).toMatchObject([{ at: t + 2000, to: '2026-11-04', sk: ['2026-11-04'] }]);
    // the other order: the stop held, the older skip adds its day to it (a new row, not a duplicate)
    rep('A', 'rmeal051', {}, t);
    expect(rep('A', 'rmeal051', stop, t + 2000)).toMatchObject({ ok: true });
    expect(rep('A', 'rmeal051', skip, t + 1000)).toEqual({ ok: true });
    expect(repeats().map((r) => [r.id, r.at, r.to, r.sk])).toEqual([['rmeal050', t + 2000, '2026-11-04', ['2026-11-04']], ['rmeal051', t + 2000, '2026-11-04', ['2026-11-04']]]);
    expect(repRows()).toHaveLength(2);
    // an older op that skips nothing new: acknowledged, nothing kept
    expect(rep('A', 'rmeal051', skip, t + 1500)).toEqual({ ok: true, duplicate: true });
  });

  it('an end that names the repeat after it (`nx`) is kept only once the record holds that one: a change is both or neither', () => {
    rep('A', 'rmeal060');
    // the new one refused (its first day after the record's tomorrow: the phone's day ahead), so the end too
    expect(rep('A', 'rmeal061', { from: '2026-11-05' })).toMatchObject({ ok: false, error: 'bad_request' });
    expect(rep('A', 'rmeal060', { to: '2026-11-04', nx: 'rmeal061' })).toMatchObject({ ok: false, error: 'bad_request' });
    rep('B', 'rmeal062', { from: '2026-11-04' });
    expect(rep('A', 'rmeal060', { to: '2026-11-03', nx: 'rmeal062' })).toMatchObject({ ok: false, error: 'bad_request' }); // not mine
    expect(repeats().find((r) => r.id === 'rmeal060')?.to).toBeUndefined();
    // the new one held: the end kept, without its `nx`
    expect(rep('A', 'rmeal061', { from: '2026-11-04' })).toMatchObject({ ok: true });
    expect(rep('A', 'rmeal060', { to: '2026-11-03', nx: 'rmeal061' })).toMatchObject({ ok: true });
    expect(repRows().map((r) => JSON.parse(r[4])).find((d) => d.id === 'rmeal060')).toEqual({ id: 'rmeal060', at: now, m: 'b', it: [{ g: 150, f: RICE }], w: 127, from: '2026-11-01', to: '2026-11-03' });
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

  it('refuses a malformed recipe, an `at` over a day ahead', () => {
    const ok = { id: 'cmeal010', at: now, n: 'カレー', sv: 2, it: [{ g: 150, f: RICE }] };
    for (const d of [{ ...ok, sv: 0 }, { ...ok, x: 1 }, { ...ok, person: 'B' }, { ...ok, at: now + 86_400_001 }]) {
      expect(sendRec('A', d)).toMatchObject({ ok: false, error: 'bad_request' });
    }
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

  // ---- custom foods (マイ食品)
  const sendCus = (who: 'A' | 'B' | 'G', data: object) => call(keyOf[who], 'event', { id: `e${++n}`, type: 'food_custom', data });
  const custom = (who: 'A' | 'B' | 'G', id: string, extra: object = {}, at = (now += 1000)) =>
    sendCus(who, { id, at, n: '会社の弁当', u: '1個', k: 650, ...extra });
  const cusRows = (key = KEY_A) => (call(key, 'snapshot').rows.events as [string, 'A' | 'B' | 'G', string, string, string][]).filter((r) => r[3] === 'food_custom');
  const customs = (key = KEY_A): FoodCustom[] =>
    foodCustomFold(cusRows(key).map((r) => ({ ...foodCustomOp(JSON.parse(r[4]))!, who: r[1] }) as CustomOp & { who: 'A' | 'B' | 'G' }));

  it('keeps a custom food, normalized, seen by every phone; the partner and the guest log it as their own entry', () => {
    expect(custom('A', 'mmeal001', { n: '  会社の\u0007弁当\n ', u: ' 1\t個 ', p: 20, fa: null })).toMatchObject({ ok: true });
    expect(notices.at(-1)).toMatchObject({ what: 'event', who: 'A' });
    expect(JSON.parse(cusRows()[0][4])).toEqual({ id: 'mmeal001', at: now, n: '会社の弁当', u: '1 個', k: 650, p: 20, fa: null, c: null, s: null });
    for (const key of [KEY_B, KEY_C]) expect(customs(key)).toMatchObject([{ id: 'mmeal001', who: 'A', n: '会社の弁当', k: 650 }]);
    // no weight: a serving logs as a nominal 100 g of a per-serving snapshot (`sv`), over a food's 950 kcal per 100 g
    const c = customs(KEY_B)[0];
    const [{ g, label }] = customPortions(c);
    expect(g).toBe(100);
    for (const who of ['B', 'G'] as const) expect(log(who, `fmealm0${who.toLowerCase()}`, { g: g * 2, f: customSnap(c, label) })).toMatchObject({ ok: true });
    expect(entries().map((e) => [e.who, e.g, e.f])).toEqual([
      ['B', 200, { id: 'custom:mmeal001', n: '会社の弁当', k: 650, p: 20, fa: null, c: null, s: null, u: '1 個', sv: true }],
      ['G', 200, { id: 'custom:mmeal001', n: '会社の弁当', k: 650, p: 20, fa: null, c: null, s: null, u: '1 個', sv: true }]
    ]);
    // with a weight: per 100 g, its serving's grams
    expect(custom('B', 'mmeal002', { n: 'おにぎり', u: '1個', g: 110, k: 180, c: 39.6 })).toMatchObject({ ok: true });
    const o = customs(KEY_C).find((x) => x.id === 'mmeal002')!;
    expect(customPortions(o)).toEqual([{ label: '1個', g: 110 }, { label: '100g', g: 100 }]);
    expect(log('G', 'fmealm1g', { g: 110, f: customSnap(o, '1個') })).toMatchObject({ ok: true });
    const e = entries().find((x) => x.id === 'fmealm1g')!;
    expect(e.f).toEqual({ id: 'custom:mmeal002', n: 'おにぎり', k: 163.6, p: null, fa: null, c: 36, s: null, u: '1個' });
    expect((e.f.k * e.g) / 100).toBeCloseTo(180, 0);
  });

  it('refuses a malformed custom food, an `at` over a day ahead, a serving denser than any food; a bad `sv` snapshot', () => {
    const ok = { id: 'mmeal010', at: now, n: '弁当', u: '1個', k: 650 };
    for (const d of [
      { ...ok, id: 'cmeal010' }, { ...ok, n: ' ' }, { ...ok, u: '' }, { ...ok, k: 5001 }, { ...ok, k: -1 }, { ...ok, g: 0 }, { ...ok, g: 1.25 },
      { ...ok, p: 501 }, { ...ok, g: 50, k: 500 }, { ...ok, g: 10, s: 11 }, { ...ok, x: 1 }, { ...ok, person: 'B' }, { ...ok, at: now + 86_400_001 }
    ]) expect(sendCus('A', d)).toMatchObject({ ok: false, error: 'bad_request' });
    // limits: a name cut at 30, a label at 20; 5000 kcal and 500 g of a nutrient in a serving with no weight
    expect(custom('A', 'mmeal011', { n: 'あ'.repeat(40), u: 'い'.repeat(30), k: 5000, p: 500 })).toMatchObject({ ok: true });
    expect(customs()[0]).toMatchObject({ n: 'あ'.repeat(30), u: 'い'.repeat(20), k: 5000, p: 500 });
    expect(log('A', 'fmealm11', { g: 100, f: customSnap(customs()[0]) })).toMatchObject({ ok: true });
    // `sv` only `true`; without it, a food's per 100 g limits
    const big = { id: 'custom:x', n: 'x', k: 1200, p: null, fa: null, c: null, s: null };
    expect(log('A', 'fmealm12', { f: { ...big, sv: false } })).toMatchObject({ ok: false, error: 'bad_request' });
    expect(log('A', 'fmealm13', { f: big })).toMatchObject({ ok: false, error: 'bad_request' });
    expect(log('A', 'fmealm14', { f: { ...big, sv: true } })).toMatchObject({ ok: true });
    expect(JSON.parse(rows().find((r) => r[4].includes('fmealm14'))![4]).f).toEqual({ ...big, sv: true });
  });

  it('keeps each custom food’s latest op as its one row; an older op, a set after a removal, a removal it never held acknowledged', () => {
    const at = now + 1000;
    custom('B', 'mmeal020', {}, at);
    expect(custom('B', 'mmeal020', { k: 700 }, at + 5000)).toMatchObject({ ok: true });
    expect(custom('B', 'mmeal020', { k: 800 }, at + 2000)).toMatchObject({ ok: true, duplicate: true });
    expect(customs()).toMatchObject([{ id: 'mmeal020', k: 700, at: at + 5000 }]);
    expect(cusRows()).toHaveLength(1);
    now = at + 5000;
    expect(sendCus('B', { id: 'mmeal020', at: (now += 1000), rm: true })).toMatchObject({ ok: true });
    expect(custom('B', 'mmeal020', { k: 900 })).toMatchObject({ ok: true, duplicate: true });
    expect(sendCus('B', { id: 'mmeal021', at: (now += 1000), rm: true })).toMatchObject({ ok: true, duplicate: true });
    expect(customs()).toEqual([]);
    expect(cusRows()).toHaveLength(1); // the removal's row
  });

  it('lets only the owner change a custom food; the guest keeps its own; a copy is a new one of the copier', () => {
    custom('G', 'mmeal030');
    custom('A', 'mmeal031');
    expect(custom('A', 'mmeal030', { k: 1 })).toMatchObject({ ok: false, error: 'forbidden' });
    expect(sendCus('B', { id: 'mmeal030', at: (now += 1000), rm: true })).toMatchObject({ ok: false, error: 'forbidden' });
    expect(custom('G', 'mmeal031', { k: 1 })).toMatchObject({ ok: false, error: 'forbidden' });
    expect(sendCus('G', { id: 'mmeal031', at: (now += 1000), rm: true })).toMatchObject({ ok: false, error: 'forbidden' });
    expect(custom('G', 'mmeal030', { n: 'ゲスト弁当' })).toMatchObject({ ok: true });
    expect(custom('B', 'mmeal032', { n: '会社の弁当（コピー）' })).toMatchObject({ ok: true });
    expect(customs(KEY_C).map((r) => [r.id, r.who, r.n])).toEqual([['mmeal032', 'B', '会社の弁当（コピー）'], ['mmeal030', 'G', 'ゲスト弁当'], ['mmeal031', 'A', '会社の弁当']]);
  });

  it('a custom food persists and loads back from a dump; someone else’s op in a load keeps only its id', () => {
    custom('A', 'mmeal040');
    store = open();
    expect(customs().map((r) => r.id)).toEqual(['mmeal040']);
    const dumped = store.dump().rows.events.filter((r) => r[3] === 'food_custom');
    db = memSql();
    store = open();
    expect(store.load({ rows: { events: dumped } })).toMatchObject({ ok: true, events: 1 });
    expect(store.load({ rows: { events: dumped } })).toMatchObject({ ok: true, events: 0 }); // idempotent
    const other = [new Date(now + 5000).toISOString(), 'B', 'e-other-m', 'food_custom', JSON.stringify({ id: 'mmeal040', at: now + 5000, rm: true })];
    const bad = [new Date(now + 7000).toISOString(), 'A', 'e-bad-m', 'food_custom', JSON.stringify({ id: 'mmeal041', at: now, n: 'x', u: '1個', k: -5 })];
    expect(store.load({ rows: { events: [other, bad] } })).toMatchObject({ ok: true, events: 0 });
    expect(customs().map((r) => [r.id, r.who])).toEqual([['mmeal040', 'A']]);
    const edit = [new Date(now + 8000).toISOString(), 'A', 'e-edit-m', 'food_custom', JSON.stringify({ id: 'mmeal040', at: now + 8000, n: '弁当', u: '1食', g: 400, k: 600 })];
    expect(store.load({ rows: { events: [edit] } })).toMatchObject({ ok: true, events: 1 });
    expect(customs()).toMatchObject([{ id: 'mmeal040', n: '弁当', u: '1食', g: 400, k: 600 }]);
    expect(cusRows()).toHaveLength(1);
  });

  it('a custom food is a recipe’s ingredient as any food', () => {
    custom('A', 'mmeal050', { n: 'ドレッシング', u: '大さじ1', g: 15, k: 60, fa: 6 });
    const c = customs()[0];
    expect(recipe('B', 'cmeal050', { n: 'サラダ', sv: 1, it: [{ g: 15, f: customSnap(c) }, { g: 100, f: RICE }] })).toMatchObject({ ok: true });
    expect(recipes()[0].it[0].f).toMatchObject({ id: 'custom:mmeal050', k: 400, fa: 40 });
  });

  it('fibre and alcohol (`fi`, `al`, 2026-11-05): kept when known, in bounds; an op without them as before', () => {
    const BEER = { id: 'mext:16006', n: 'ビール', k: 39, p: 0.3, fa: 0, c: 3.1, s: 0, fi: 0, al: 3.7, u: '中ジョッキ' };
    const got: unknown[] = [
      log('A', 'fmealfa1', { g: 350, f: BEER }).ok, log('B', 'fmealfa2').ok, log('G', 'fmealfa3', { f: { ...RICE, fi: 1.5, al: null } }).ok,
      // out of bounds or not a number: refused (a food's per 100 g up to 100 g; a serving's, `sv`, up to 500 g)
      ...[{ ...BEER, al: 100.5 }, { ...BEER, fi: -1 }, { ...BEER, fi: '1' }, { ...BEER, al: { g: 1 } }, { ...BEER, sv: true, al: 501 }].map((f, i) => log('A', `fmealfb${i}`, { f }).error),
      log('A', 'fmealfc1', { g: 100, f: { ...BEER, sv: true, al: 500 } }).ok,
      // a custom food and a recipe carry them too; a repeat's items as a food's
      custom('A', 'mmealfa1', { n: 'ハイボール', u: '1杯', g: 350, k: 150, al: 28, fi: null }).ok, custom('A', 'mmealfa2', { n: 'x', u: '1杯', g: 10, k: 1, fi: 11 }).error,
      recipe('B', 'cmealfa1', { n: 'ビールとごはん', sv: 1, it: [{ g: 350, f: BEER }, { g: 150, f: RICE }] }).ok,
      sendRep('A', { id: 'rmealfa1', at: (now += 1000), m: 'd', it: [{ g: 350, f: BEER }], w: 127, from: '2026-11-03' }).ok
    ];
    const f = (id: string) => JSON.parse(rows().find((r) => r[4].includes(id))![4]).f;
    const { fi: _fi, al: _al, ...bare } = BEER;
    expect([...got, f('fmealfa1'), f('fmealfa2'), f('fmealfa3'), customs().find((c) => c.id === 'mmealfa1'), recipes()[0].it[0].f]).toEqual([
      true, true, true, 'bad_request', 'bad_request', 'bad_request', 'bad_request', 'bad_request', true, true, 'bad_request', true, true,
      BEER, RICE, { ...RICE, fi: 1.5 }, expect.objectContaining({ al: 28, k: 150 }), BEER
    ]);
    expect(Object.keys(f('fmealfa2'))).toEqual(Object.keys(RICE));
    expect(bare).toEqual({ ...BEER, fi: undefined, al: undefined });
  });
});
