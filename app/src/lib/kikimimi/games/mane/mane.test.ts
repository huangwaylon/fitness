// まねっこ シャドーイング (games/mane/): which lines are worth shadowing, the deal (4 at my level by the seed, the
// shortest first, every level with enough), the untimed rounds that take a bare "done" and grade nothing, the level a
// lobby's plays, its mode on the 声に出す shelf only with the mic on (never きまぐれ, never shared), and its row: minutes
// only, a mic game's row with answers refused (contract/listen.ts).
import { beforeAll, describe, expect, it } from 'vitest';
import type { Item } from '../../bank.ts';
import { clipDur } from '../../clips.ts';
import { levelItems, load } from '../../pool.ts';
import { WINDOWS } from '../../round/session.ts';
import { LANES } from '../../round/registry.ts';
import { modeOf, playable, sharable, shelves, whims } from '../../catalog.ts';
import { listenOf } from '../../../contract/listen.ts';
import { MANE_QS, WORDS, lineJa, maneDeal, maneGame, maneLevel, shadowable } from './def.ts';

const LVS = [1, 2, 3, 4, 6, 7] as const;
const voiced = (id: string) => clipDur(id) !== undefined;
beforeAll(() => load(...LVS));

const line = (o: Partial<Item> = {}): Item => ({ id: 'x', lv: 3, type: 'word', en: 'I thought about it all night.', ja: '', speaker: 'raymond', voice: 'us', choices: [], answer: 0, ...o }) as Item;

describe('まねっこ: the lines', () => {
  it('one US speaker, a clean take, 4–12 words, no figures, voiced', () => {
    const yes = () => true;
    expect(shadowable(line(), yes)).toBe(true);
    expect(shadowable(line({ voice: 'uk' }), yes)).toBe(false);
    expect(shadowable(line({ cond: 'cafe' } as unknown as Partial<Item>), yes)).toBe(false);
    expect(shadowable(line({ channel: 'phone' }), yes)).toBe(false);
    expect(shadowable(line({ lines: [] }), yes)).toBe(false);
    expect(shadowable(line({ en: 'Got it.' }), yes)).toBe(false);
    expect(shadowable(line({ en: 'It comes to $43.20 with tax, I think.' }), yes)).toBe(false);
    expect(shadowable(line({ en: 'one two three four five six seven eight nine ten eleven twelve thirteen' }), yes)).toBe(false);
    expect(shadowable(line(), () => false)).toBe(false);
  });

  it('every level deals 4 lines, the same for a seed, shortest first, within the words', () => {
    for (const lv of LVS) {
      const a = maneDeal(7, levelItems(lv), voiced);
      expect(a).toHaveLength(MANE_QS);
      expect(maneDeal(7, levelItems(lv), voiced).map((it) => it.id)).toEqual(a.map((it) => it.id));
      expect(maneDeal(8, levelItems(lv), voiced).map((it) => it.id)).not.toEqual(a.map((it) => it.id));
      const n = a.map((it) => it.en.split(/\s+/).length);
      expect(n).toEqual([...n].sort((x, y) => x - y));
      expect(n.every((k) => k >= WORDS.min && k <= WORDS.max)).toBe(true);
      expect(a.every((it) => it.lv === lv && it.voice === 'us' && !it.lines)).toBe(true);
    }
  });

  it('a lobby’s level: アナウンス’s 5 plays もり’s, the top ほし’s', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].map(maneLevel)).toEqual([1, 2, 3, 4, 4, 6, 7, 7]);
  });
  it('a reply item’s Japanese: its own half, not the reply after the arrow', () => {
    expect(lineJa({ ja: 'なに してるの？ →「つりを してるだけ。」' })).toBe('なに してるの？');
    expect(lineJa({ ja: 'ながい フライトでしたね！' })).toBe('ながい フライトでしたね！');
  });
});

describe('まねっこ: the rounds', () => {
  let items: Item[] = [];
  const game = maneGame({ items: () => items, playMs: (it) => Math.round((clipDur(it.id) ?? 2) * 1000) });
  const deck = game.deck(3, { lv: 4, timer: 20 }, { w: WINDOWS, enc: [4, 1] });
  beforeAll(() => void (items = maneDeal(3, levelItems(4), voiced)));

  it('solo only; 4 rounds of the lines, the clip once then untimed', () => {
    expect(game.modes).toEqual({ solo: true, coop: false, vs: false, same: false });
    expect(game.cv).toBeUndefined(); // (never on the wire)
    expect(deck.count).toBe(4);
    expect(deck.round(0)).toEqual({ kind: 'mic.shadow', id: items[0].id, play: Math.round(clipDur(items[0].id)! * 1000) });
    expect(deck.timing(0)).toEqual({ lead: WINDOWS.lead, play: Math.round(clipDur(items[0].id)! * 1000), answer: Infinity });
  });
  it('takes a bare "done" and grades nothing: no points, no right or wrong to keep', () => {
    expect(deck.valid(0, 0)).toBe(true);
    expect(deck.valid(0, 1)).toBe(false);
    expect(deck.valid(0, [0])).toBe(false);
    expect(deck.valid(9, 0)).toBe(false);
    expect(deck.grade(0, 0, 0)).toEqual({ ok: true, pts: 0 });
    expect(deck.maxScore).toBe(0);
  });
});

describe('まねっこ: its mode and its row', () => {
  const ALL = { levels: [1, 2, 3, 4, 5, 6, 7], ladder: true, review: true, story: true, games: (gm: string) => LANES.ready(gm) };

  it('on the 声に出す shelf only while the mic is on, never きまぐれ’s pick, never shared', () => {
    expect(modeOf('mane')).toMatchObject({ group: 'koe', game: 'mane', requires: 'mic', coop: false });
    expect(LANES.ready('mane')).toBe(true);
    // (no store in the tests: the mic is off)
    expect(playable('mane', ALL)).toBe(false);
    expect(shelves(ALL).map((s) => s.group)).not.toContain('koe');
    const was = modeOf('mane').gate;
    modeOf('mane').gate = () => true;
    try {
      expect(shelves(ALL).find((s) => s.group === 'koe')?.modes.map((m) => m.id)).toEqual(['mane']);
      expect(whims(ALL)).not.toContain('mane');
      expect(sharable(ALL).map((m) => m.id)).not.toContain('mane');
    } finally {
      modeOf('mane').gate = was;
    }
  });

  it('my row: minutes only; a mic game’s row with an answer is refused', async () => {
    const lane = (await LANES.loading('mane'))!;
    expect(lane.record?.({} as never, [], [], true)).toEqual([]);
    const row = { d: '2026-11-07', g: 'abcd1234', gm: 'mane', lv: 4, n: 1, ms: 95_000, r: [] };
    expect(listenOf(row)).toEqual(row);
    expect(listenOf({ ...row, r: [['ab-1', 1, 0, 0]] })).toBeNull();
    expect(listenOf({ ...row, gm: undefined })).toBeNull(); // (a quiz row needs its answers)
  });
});
