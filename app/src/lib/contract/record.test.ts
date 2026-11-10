// The record's rules (contract/record.ts): `prefTaken` agrees with what the model takes, and the slots.
import { describe, expect, it } from 'vitest';
import { eventSlot, goalDay, prefTaken, TALLY_PAST_DAYS, validEventData } from './record.ts';
import { DEFAULT_LOOKS } from './look.ts';
import { WALLET_SPLIT_MS } from './rules.ts';
import { stockOf, buyPrice } from './stock.ts';
import { reduce } from '../model/state.ts';
import type { EventRow } from './api.ts';

describe('prefTaken', () => {
  it('is exactly what the model takes (a pref it ignores leaves the earlier one in force)', () => {
    const cases: [string, unknown][] = [
      ['locale', 'ja'], ['locale', 'fr'], ['villagerName', 'うめ'], ['villagerName', '  '], ['villagerName', 'x'.repeat(21)], ['villagerName', 7],
      ['villager', 'ankha'], ['villager', 'Ankha'], ['goalWeight', 60.5], ['goalWeight', 60.55], ['goalWeight', null], ['goalWeight', ''], ['goalWeight', 400],
      ['goalBodyFat', 22.5], ['goalBodyFat', 3], ['goalBodyFat', 60], ['goalBodyFat', 2.9], ['goalBodyFat', 60.1], ['goalBodyFat', 22.55], ['goalBodyFat', null], ['goalBodyFat', ''], ['goalBodyFat', '22'],
      ['moveGoal', 450], ['moveGoal', 450.5], ['moveGoal', 50], ['stepsGoal', 9000], ['stepsGoal', 9100], ['nope', 1],
      ['look', { kind: 'player', look: DEFAULT_LOOKS.B }], ['look', { kind: 'player', look: { hair: 'PlayerHair12' } }], ['look', { kind: 'player' }], ['look', 'goldie'], ['look', null],
      ['savedLooks', [{ id: 'abcd1234', name: 'あ', look: DEFAULT_LOOKS.A }]], ['savedLooks', 'x']
    ];
    const before: EventRow = ['2026-11-01T00:00:00.000Z', 'A', 'p0', 'pref', ''];
    const seed: Record<string, unknown> = { look: { kind: 'villager' }, savedLooks: [], locale: 'en', villagerName: 'ウェイ', villager: 'bob', goalWeight: 70, goalBodyFat: 25, moveGoal: 300, stepsGoal: 7000 };
    for (const [key, value] of cases) {
      const base = reduce({ metrics: [], events: [[...before.slice(0, 4), JSON.stringify({ key, value: seed[key] ?? 1 })] as EventRow] });
      const after = reduce({ metrics: [], events: [[...before.slice(0, 4), JSON.stringify({ key, value: seed[key] ?? 1 })] as EventRow, ['2026-11-01T00:00:01.000Z', 'A', 'p1', 'pref', JSON.stringify({ key, value })]] });
      const pick = (s: ReturnType<typeof reduce>) => JSON.stringify([s.prefs.A, s.dailyGoals.A.move.map((g) => g.v), s.dailyGoals.A.steps.map((g) => g.v)]);
      const changedOrSame = pick(after) !== pick(base) || value === seed[key];
      expect(prefTaken(key, value), `${key} ${JSON.stringify(value)}`).toBe(key !== 'nope' && changedOrSame);
    }
  });
});

describe('eventSlot', () => {
  const at = Date.parse('2026-11-01T15:30:00.000Z'); // 00:30 on 11-02 in Tokyo
  it('a day row per sender and date, a cosmetic pref per subject, a goal per subject and Tokyo day, a decoration per scope and id', () => {
    expect(eventSlot('tally', 'A', 'A', { date: '2026-11-02' }, at)).toBe('tally|A|2026-11-02');
    expect(eventSlot('island', 'B', 'B', { date: '2026-11-02' }, at)).toBe('island|B|2026-11-02');
    expect(eventSlot('pref', 'A', 'A', { key: 'villager', value: 'ankha' }, at)).toBe('pref|A|villager');
    expect(eventSlot('pref', 'A', 'B', { key: 'goalWeight', value: 60, person: 'B' }, at)).toBe('pref|B|goalWeight');
    // the body fat goal: latest only per person, like the weight goal (shown, never prices a day)
    expect(eventSlot('pref', 'B', 'A', { key: 'goalBodyFat', value: 18.5, person: 'A' }, at)).toBe('pref|A|goalBodyFat');
    expect(eventSlot('pref', 'A', 'A', { key: 'goalBodyFat', value: null }, at)).toBe('pref|A|goalBodyFat');
    expect(eventSlot('pref', 'A', 'A', { key: 'goalBodyFat', value: 61 }, at)).toBeNull(); // out of bounds: ignored
    expect(eventSlot('pref', 'B', 'A', { key: 'moveGoal', value: 450, person: 'A' }, at)).toBe('pref|A|moveGoal|2026-11-02');
    expect(eventSlot('pref', 'A', 'A', { key: 'moveGoal', value: 45 }, at)).toBeNull(); // the model ignores it
    expect(eventSlot('decor', 'A', 'A', { id: 'd000001' }, at)).toBe('decor||d000001');
    expect(eventSlot('decor', 'A', 'A', { id: 'd000001', sc: 't' }, at)).toBe('decor|t|d000001');
    for (const t of ['spend', 'spend_void', 'harvest', 'find']) expect(eventSlot(t, 'A', 'A', {}, at)).toBeNull();
  });

  it('the look and the コーデ: one each per person, the latest', () => {
    expect(eventSlot('pref', 'B', 'B', { key: 'look', value: { kind: 'player', look: DEFAULT_LOOKS.A } }, at)).toBe('pref|B|look');
    expect(eventSlot('pref', 'G', 'G', { key: 'look', value: null }, at)).toBe('pref|G|look');
    expect(eventSlot('pref', 'A', 'A', { key: 'savedLooks', value: [] }, at)).toBe('pref|A|savedLooks');
    expect(eventSlot('pref', 'A', 'A', { key: 'look', value: 'x' }, at)).toBeNull();
  });
});

describe('validEventData: the look', () => {
  const now = Date.parse('2026-11-05T03:00:00.000Z');
  const ok = (key: string, value: unknown) => validEventData('pref', { key, value }, now);
  it('takes a whole look, a villager, null, and at most 20 whole コーデ; refuses the rest', () => {
    expect(ok('look', { kind: 'player', look: DEFAULT_LOOKS.A })).toBe(true);
    expect(ok('look', { kind: 'villager' })).toBe(true);
    expect(ok('look', null)).toBe(true);
    expect(ok('look', { kind: 'player', look: { ...DEFAULT_LOOKS.A, hair: 'TopsTexX' } })).toBe(false);
    expect(ok('look', { kind: 'player', look: { hair: 'PlayerHair12' } })).toBe(false);
    expect(ok('look', 'goldie')).toBe(false);
    const s = (i: number) => ({ id: `abcd${String(i).padStart(4, '0')}`, name: `コーデ ${i}`, look: DEFAULT_LOOKS.B });
    expect(ok('savedLooks', [])).toBe(true);
    expect(ok('savedLooks', Array.from({ length: 20 }, (_, i) => s(i)))).toBe(true);
    expect(ok('savedLooks', Array.from({ length: 21 }, (_, i) => s(i)))).toBe(false);
    expect(ok('savedLooks', [{ ...s(1), name: 'x'.repeat(13) }])).toBe(false);
    expect(ok('savedLooks', null)).toBe(false);
  });
});

describe('validEventData: each type\'s shape', () => {
  const now = Date.parse('2026-11-05T03:00:00.000Z'); // 12:00 on 11-05 in Tokyo
  const T = now - 60_000, AHEAD = now + 2 * 86_400_000; // an op's `at`; one over a day past the record's clock
  const ok = (type: string, d: Record<string, unknown>) => validEventData(type, d, now);
  const RICE = { id: 'mext:01088', n: 'ごはん', k: 156, p: 2.5, fa: 0.3, c: 37.1, s: 0 };

  it('a spend names a reward at exactly its price; a void, a harvest and a find their ids', () => {
    expect(ok('spend', { spendId: 's1', item: 'snack', bells: 40 })).toBe(true);
    expect(ok('spend', { spendId: 's1', item: 'snack', bells: 39 })).toBe(false);
    expect(ok('spend', { spendId: 's1', item: 'caviar', bells: 40 })).toBe(false);
    expect(ok('spend', { spendId: '', item: 'snack', bells: 40 })).toBe(false);
    // at its price as of the record's clock: the halved ones only from the wallets' split (rules.ts WALLET_SPLIT_MS)
    expect(ok('spend', { spendId: 's1', item: 'dinner', bells: 35 })).toBe(false);
    expect(validEventData('spend', { spendId: 's1', item: 'dinner', bells: 35 }, WALLET_SPLIT_MS)).toBe(true);
    expect(validEventData('spend', { spendId: 's1', item: 'dinner', bells: 70 }, WALLET_SPLIT_MS)).toBe(false);
    expect(validEventData('spend', { spendId: 's1', item: 'dinner', bells: 70 }, WALLET_SPLIT_MS - 1)).toBe(true);
    expect(ok('spend_void', { spendId: 's1' })).toBe(true);
    expect(ok('spend_void', {})).toBe(false);
    expect(ok('harvest', { week: '2026-11-04' })).toBe(true);
    expect(ok('harvest', { week: 'Wednesday' })).toBe(false);
    expect(ok('find', { kind: 'fish', id: 'koi' })).toBe(true);
    expect(ok('find', { kind: 'gold', id: 'koi' })).toBe(false);
  });

  it('a pref: a known key with a value, a profile value in range, a day only on a goal a day keeps, a season look', () => {
    expect(ok('pref', { key: 'locale', value: 'ja' })).toBe(true);
    expect(ok('pref', { key: 'nope', value: 1 })).toBe(false);
    expect(ok('pref', { key: 'locale' })).toBe(false);
    expect(ok('pref', { key: 'sex', value: 'f' })).toBe(true);
    expect(ok('pref', { key: 'sex', value: 'x' })).toBe(false);
    expect(ok('pref', { key: 'birth', value: '1990-03-04' })).toBe(true);
    expect(ok('pref', { key: 'birth', value: '2026-01-01' })).toBe(false); // under 10 years ago
    expect(ok('pref', { key: 'bmiStd', value: null })).toBe(true);
    expect(ok('pref', { key: 'stepsGoal', value: 9000, day: '2026-11-05' })).toBe(true);
    expect(ok('pref', { key: 'stepsGoal', value: 9000, day: 'today' })).toBe(false);
    expect(ok('pref', { key: 'goalWeight', value: 60, day: '2026-11-05' })).toBe(false); // a latest-only goal has no day
    expect(ok('pref', { key: 'locale', value: 'ja', day: '2026-11-05' })).toBe(false);
    expect(ok('pref', { key: 'seasonLook', value: { season: 'winter', weather: null } })).toBe(true);
    expect(ok('pref', { key: 'seasonLook', value: { colour: 'red' } })).toBe(false);
  });

  it('a tally and a give-back: a tally\'s shape, dated no later than tomorrow and no earlier than TALLY_PAST_DAYS back', () => {
    const counts = { 'fish:koi': 2 };
    for (const type of ['tally', 'tally_back']) {
      expect(ok(type, { date: '2026-11-05', counts })).toBe(true);
      expect(ok(type, { date: '2026-11-06', counts })).toBe(true);
      expect(ok(type, { date: '2026-11-07', counts })).toBe(false);
      expect(ok(type, { date: '2026-10-01', counts })).toBe(true); // 35 days back
      expect(TALLY_PAST_DAYS).toBe(35);
      expect(ok(type, { date: '2026-09-30', counts })).toBe(false);
      expect(ok(type, { date: '2026-11-05', counts: {} })).toBe(false);
    }
  });

  it('an island day, by its shape and not after tomorrow', () => {
    const day = { date: '2026-11-05', taken: [], puts: [], shakes: [], watered: [], wishes: {} };
    expect(ok('island', day)).toBe(true);
    expect(ok('island', { ...day, date: '2026-11-07' })).toBe(false);
    expect(ok('island', { date: '2026-11-05' })).toBe(false);
  });

  it('a decor op (the island\'s, a room\'s or the layout\'s) and a board post, their `at` at most a day ahead', () => {
    const decor = { id: 'd000001', at: T, item: 'birdbath', x: 12, z: -30, f: 3, p: T };
    expect(ok('decor', decor)).toBe(true);
    expect(ok('decor', { ...decor, at: AHEAD })).toBe(false);
    expect(ok('decor', { sc: 't', id: 'dabc123', at: T, rm: true })).toBe(true);
    expect(ok('decor', { sc: 'o', id: 'fl:52:180', at: T, rm: true })).toBe(true);
    expect(ok('decor', { sc: 'o', id: 'fl:52:180', at: AHEAD, rm: true })).toBe(false);
    expect(ok('decor', { id: 'd000001' })).toBe(false);
    expect(ok('board', { id: 'babcdef1', at: T, p: T, t: 'やあ' })).toBe(true);
    expect(ok('board', { id: 'babcdef1', at: AHEAD, rm: true })).toBe(false);
    expect(ok('board', { id: 'babcdef1', at: T, p: T, t: ' やあ ' })).toBe(false);
  });

  it('a meal entry and a repeat: not after tomorrow (a removal any day), recipes and custom foods by shape and `at`', () => {
    const meal = { id: 'fabcdef1', at: T, d: '2026-11-06', m: 'b', g: 100, f: RICE };
    expect(ok('food', meal)).toBe(true);
    expect(ok('food', { ...meal, d: '2026-11-07' })).toBe(false);
    expect(ok('food', { ...meal, at: AHEAD })).toBe(false);
    expect(ok('food', { id: 'fabcdef1', at: T, rm: true })).toBe(true);
    expect(ok('food', { id: 'fabcdef1' })).toBe(false);
    const rep = { id: 'rabcdef1', at: T, m: 'b', it: [{ g: 150, f: RICE }], w: 127, from: '2026-11-06' };
    expect(ok('food_repeat', rep)).toBe(true);
    expect(ok('food_repeat', { ...rep, from: '2026-11-07' })).toBe(false);
    expect(ok('food_repeat', { ...rep, at: AHEAD })).toBe(false);
    expect(ok('food_repeat', { id: 'rabcdef1', at: T, rm: true })).toBe(true);
    expect(ok('food_repeat', {})).toBe(false);
    const recipe = { id: 'cabcdef1', at: T, n: 'おうちカレー', sv: 4, it: [{ g: 600, f: RICE }] };
    expect(ok('food_recipe', recipe)).toBe(true);
    expect(ok('food_recipe', { ...recipe, at: AHEAD })).toBe(false);
    expect(ok('food_recipe', { id: 'cabcdef1' })).toBe(false);
    const custom = { id: 'mabcdef1', at: T, n: '会社の弁当', u: '1個', k: 650 };
    expect(ok('food_custom', custom)).toBe(true);
    expect(ok('food_custom', { ...custom, at: AHEAD })).toBe(false);
    expect(ok('food_custom', { id: 'mabcdef1' })).toBe(false);
  });

  it('a sell and a buy at their prices, a ききみみ game not after tomorrow, a pack and a wedding op by their own rules', () => {
    expect(ok('sell', { species: 'fish:koi', n: 3, v: 600 })).toBe(true);
    expect(ok('sell', { species: 'fish:koi', n: 3, v: 601 })).toBe(false);
    const item = stockOf('2026-11-05')[0];
    expect(ok('buy', { item, price: buyPrice(item)!, d: '2026-11-05' })).toBe(true);
    expect(ok('buy', { item, price: buyPrice(item)! + 1, d: '2026-11-05' })).toBe(false);
    const game = { d: '2026-11-05', g: 'ab12', lv: 2, n: 2, ms: 180_000, r: [['w2-read', 1, 0, 0]] };
    expect(ok('listen', game)).toBe(true);
    expect(ok('listen', { ...game, d: '2026-11-07' })).toBe(false);
    expect(ok('listen', { d: '2026-11-05' })).toBe(false);
    expect(ok('pack', { trip: 'nz', id: '_abc1234', at: T, rm: true })).toBe(true);
    expect(ok('pack', { trip: 'nz' })).toBe(false);
    expect(ok('wtask', { id: 'a2', at: T, rm: true })).toBe(true);
    expect(ok('wtask', { id: 'a2' })).toBe(false);
    expect(ok('anything_else', {})).toBe(true);
  });
});

describe('goalDay', () => {
  const at = Date.parse('2026-11-01T15:30:00.000Z'); // 00:30 on 11-02 in Tokyo
  it('the phone\'s day when within a day of the record\'s Tokyo day of `at`, else that day', () => {
    expect(goalDay({}, at)).toBe('2026-11-02');
    expect(goalDay({ day: '2026-11-01' }, at)).toBe('2026-11-01'); // set at 23:59, heard after midnight
    expect(goalDay({ day: '2026-11-02' }, at)).toBe('2026-11-02');
    expect(goalDay({ day: '2026-11-03' }, at)).toBe('2026-11-03');
    expect(goalDay({ day: '2026-10-30' }, at)).toBe('2026-11-02'); // queued offline for days
    expect(goalDay({ day: 'yesterday' }, at)).toBe('2026-11-02');
    expect(goalDay({ day: 20261101 }, at)).toBe('2026-11-02');
  });
});

describe('prefTaken: the island\'s and the profile\'s prefs', () => {
  it('takes a weather mode, a season look, and a profile value or null', () => {
    expect(prefTaken('weatherMode', 'real')).toBe(true);
    expect(prefTaken('weatherMode', 'sunny')).toBe(false);
    expect(prefTaken('seasonLook', null)).toBe(true);
    expect(prefTaken('seasonLook', 'winter')).toBe(false);
    for (const k of ['sex', 'birth', 'bmiStd']) expect(prefTaken(k, null), k).toBe(true);
    expect(prefTaken('sex', 'm')).toBe(true);
    expect(prefTaken('sex', 'x')).toBe(false);
    expect(prefTaken('birth', '1990-03-04')).toBe(true);
    expect(prefTaken('birth', '1990-13-04')).toBe(false);
    expect(prefTaken('bmiStd', 'who')).toBe(true);
    expect(prefTaken('bmiStd', 'eu')).toBe(false);
  });
});

describe('eventSlot: the other slots', () => {
  const at = Date.parse('2026-11-01T15:30:00.000Z');
  it('a give-back, a light\'s switch, a board post, a meal\'s ops by id, the island\'s prefs once for the island', () => {
    expect(eventSlot('tally_back', 'B', 'B', { date: '2026-11-02' }, at)).toBe('tally_back|B|2026-11-02');
    expect(eventSlot('tally', 'A', 'A', {}, at)).toBeNull();
    expect(eventSlot('decor', 'A', 'A', { id: 'd000001', sc: 't', lt: 1 }, at)).toBe('decor|t|d000001|l');
    expect(eventSlot('decor', 'A', 'A', {}, at)).toBeNull();
    expect(eventSlot('board', 'A', 'A', { id: 'babcdef1' }, at)).toBe('board|babcdef1');
    expect(eventSlot('board', 'A', 'A', {}, at)).toBeNull();
    expect(eventSlot('food', 'A', 'A', { id: 'fabcdef1' }, at)).toBe('food|fabcdef1');
    expect(eventSlot('food', 'A', 'A', {}, at)).toBeNull();
    for (const t of ['food_repeat', 'food_recipe', 'food_custom']) {
      expect(eventSlot(t, 'A', 'A', { id: 'x1' }, at)).toBe(`${t}|x1`);
      expect(eventSlot(t, 'A', 'A', {}, at)).toBeNull();
    }
    expect(eventSlot('pref', 'G', 'G', { key: 'weatherMode', value: 'game' }, at)).toBe('pref|island|weatherMode');
    expect(eventSlot('pref', 'A', 'A', { key: 'seasonLook', value: null }, at)).toBe('pref|island|seasonLook');
    expect(eventSlot('pref', 'A', 'A', { key: 'stepsGoal', value: 9000, day: '2026-11-01' }, at)).toBe('pref|A|stepsGoal|2026-11-01');
  });

  it('a pack op and a wedding op take their own module\'s slot', () => {
    expect(eventSlot('pack', 'A', 'A', { trip: 'nz', id: '_abc1234' }, at)).toEqual(expect.any(String));
    expect(eventSlot('wtask', 'A', 'A', { id: 'a1' }, at)).toEqual(expect.any(String));
  });
});
