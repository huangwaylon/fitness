// はつおん ききわけ (games/pair/): the pairs file checks (and a broken one doesn't), its cards (two lines, the words' clips,
// both in the villager's US voice), the deal (8 by the seed, at most two of a contrast), the word to say (the same on
// every phone), the untimed rounds and what's right (the word to say; the speaker's 言えた never), the chunk's cards as
// compiled, its mode on the 声に出す shelf only with the mic on (in the みんなで picker for あてっこ, never きまぐれ), and
// its row: minutes only.
import { beforeAll, describe, expect, it } from 'vitest';
import { clipDur, itemDur } from '../../clips.ts';
import { readPairs } from '../../compile.ts';
import { INDEX, load, partItems } from '../../pool.ts';
import { WINDOWS } from '../../round/session.ts';
import { LANES } from '../../round/registry.ts';
import { modeOf, sharable, shelves, whims } from '../../catalog.ts';
import { listenOf } from '../../../contract/listen.ts';
import { PAIR_QS, SAID, UNSURE, pairDeal, pairGame, sayOf, speakerRole } from './def.ts';
import { PAIR_UNIT, SOUNDS, pairClipItems, pairProblems, pairsFile, type PairCard } from './pairs.ts';

const RAW = readPairs() as { pairs: Record<string, unknown>[] };
const FILE = pairsFile(RAW);
const one = (p: Record<string, unknown>) => ({ ...RAW, pairs: [p] });

describe('はつおん: the pairs', () => {
  it('the file checks: every contrast, a US villager, help, two words with a picture, a line and a mouth tip', () => {
    expect(pairProblems(RAW)).toEqual([]);
    expect(new Set(FILE.cards.map((c) => c.pair.sound))).toEqual(new Set(SOUNDS));
    expect(FILE.cards.length).toBeGreaterThanOrEqual(30);
  });

  it('a broken file says what', () => {
    const p = RAW.pairs[0] as { words: Record<string, unknown>[] };
    expect(pairProblems({ ...RAW, status: 'done' })).toContain('status: draft | voiced | listened');
    expect(pairProblems({ ...RAW, pairs: [RAW.pairs[0], RAW.pairs[0]] }).join()).toMatch(/id twice/);
    expect(pairProblems(one({ ...p, sound: 'ng' })).join()).toMatch(/sound/);
    expect(pairProblems(one({ ...p, who: 'nobody' })).join()).toMatch(/US voice/);
    expect(pairProblems(one({ ...p, why: 'English only' })).join()).toMatch(/why/);
    expect(pairProblems(one({ ...p, words: [p.words[0]] })).join()).toMatch(/two words/);
    expect(pairProblems(one({ ...p, words: [p.words[0], p.words[0]] })).join()).toMatch(/same word twice/);
    expect(pairProblems(one({ ...p, words: [{ ...p.words[0], en: 'Rice cake' }, p.words[1]] })).join()).toMatch(/one lower-case word/);
    expect(pairProblems(one({ ...p, words: [{ ...p.words[0], ex: 'A bowl of noodles.' }, p.words[1]] })).join()).toMatch(/not in its ex/);
    expect(pairProblems(one({ ...p, words: [{ ...p.words[0], kana: '御飯' }, p.words[1]] })).join()).toMatch(/kana/);
    expect(pairProblems(one({ ...p, words: [{ ...p.words[0], how: undefined }, p.words[1]] })).join()).toMatch(/how/);
  });

  it('a card: two lines (its words, a breath apart), its clips the words said alone in its villager’s voice', () => {
    const c = FILE.cards[0];
    expect(c).toMatchObject({ id: 'pr-rice', type: 'word', voice: 'us', speaker: 'goldie', choices: ['rice', 'lice'] });
    expect(c.lines?.map((l) => [l.en, l.tts, l.who])).toEqual([['rice', 'Rice.', 'goldie'], ['lice', 'Lice.', 'goldie']]);
    expect((c.lines?.[1] as { at?: number }).at).toBeGreaterThan(0.3);
    const items = pairClipItems(RAW);
    expect(items).toHaveLength(FILE.cards.length * 2);
    expect(items[0]).toMatchObject({ id: 'pr-rice-1', en: 'rice', tts: 'Rice.', voice: 'us', cast: c.cast });
    expect(items.every((it) => !('pair' in it) && !it.lines)).toBe(true);
  });
});

describe('はつおん: the deal and the rounds', () => {
  const cards = FILE.cards;
  it('8 pairs by the seed, at most two of a contrast; another seed, another deck', () => {
    for (const seed of [1, 2, 3, 99]) {
      const d = pairDeal(seed, cards);
      expect(d).toHaveLength(PAIR_QS);
      expect(new Set(d.map((c) => c.id)).size).toBe(PAIR_QS);
      const per = new Map<string, number>();
      for (const c of d) per.set(c.pair.sound, (per.get(c.pair.sound) ?? 0) + 1);
      expect(Math.max(...per.values())).toBeLessThanOrEqual(2);
      expect(pairDeal(seed, cards).map((c) => c.id)).toEqual(d.map((c) => c.id));
    }
    expect(pairDeal(1, cards).map((c) => c.id)).not.toEqual(pairDeal(2, cards).map((c) => c.id));
  });

  it('the word to say: by the seed and the card, both words over the cards; あてっこ’s speaker by turns', () => {
    expect(sayOf(5, 'pr-rice')).toBe(sayOf(5, 'pr-rice'));
    const says = cards.map((c) => sayOf(5, c.id));
    expect(says).toContain(0);
    expect(says).toContain(1);
    expect([0, 1, 2, 3].map(speakerRole)).toEqual([0, 1, 0, 1]);
  });

  const deal = pairDeal(4, cards);
  const game = pairGame({ cards: () => deal, playMs: () => 1600, cv: () => 'abc123' });
  const deck = game.deck(4, { lv: 3, timer: 30 }, { w: WINDOWS, enc: [3, 0] });
  it('solo and あてっこ (two roles), no たいせん; both words, then untimed', () => {
    expect(game.modes).toEqual({ solo: true, coop: true, vs: false, same: true });
    expect(game.roles).toBe(2);
    expect(game.cv?.({ lv: 3, timer: 30 })).toBe('abc123');
    expect(deck.count).toBe(8);
    expect(deck.round(0)).toEqual({ kind: 'mic.pair', id: deal[0].id, say: sayOf(4, deal[0].id), play: 1600 });
    expect(deck.timing(0)).toEqual({ lead: WINDOWS.lead, play: 1600, answer: Infinity });
  });
  it('right is the word to say; unsure, skipped or the speaker’s 言えた never; no points', () => {
    const say = sayOf(4, deal[0].id);
    for (const a of [0, 1, UNSURE, SAID]) expect(deck.valid(0, a)).toBe(true);
    for (const a of [4, -1, [0]]) expect(deck.valid(0, a)).toBe(false);
    expect(deck.valid(8, 0)).toBe(false);
    expect(deck.grade(0, say, 0)).toEqual({ ok: true, pts: 0 });
    for (const a of [1 - say, UNSURE, SAID]) expect(deck.grade(0, a, 0).ok).toBe(false);
    expect(deck.maxScore).toBe(0);
  });
});

describe('はつおん: as compiled, its mode and its row', () => {
  beforeAll(() => load(PAIR_UNIT as never));
  const ALL = { levels: [1, 2, 3, 4, 5, 6, 7], ladder: true, review: true, story: true, games: (gm: string) => LANES.ready(gm) };

  it('the chunk has every card and both words’ clips (voiced: past draft)', () => {
    expect(FILE.status).not.toBe('draft');
    const got = partItems(PAIR_UNIT as never) as PairCard[];
    expect(got.map((c) => c.id)).toEqual(FILE.cards.map((c) => c.id));
    expect(got.every((c) => clipDur(`${c.id}-1`) && clipDur(`${c.id}-2`))).toBe(true);
    expect(itemDur(got[0])).toBeGreaterThan((clipDur(`${got[0].id}-1`) ?? 0) + (clipDur(`${got[0].id}-2`) ?? 0));
    expect(INDEX.games['pair:mic-pairs']).toMatch(/^[0-9a-f]{6}$/);
  });

  it('on the 声に出す shelf only while the mic is on, in the みんなで picker (あてっこ), never きまぐれ’s pick', () => {
    expect(modeOf('pair')).toMatchObject({ group: 'koe', game: 'pair', requires: 'mic', coop: true });
    expect(LANES.ready('pair')).toBe(true);
    expect(shelves(ALL).map((s) => s.group)).not.toContain('koe');
    expect(sharable(ALL).map((m) => m.id)).not.toContain('pair');
    const was = modeOf('pair').gate;
    modeOf('pair').gate = () => true;
    try {
      expect(shelves(ALL).find((s) => s.group === 'koe')?.modes.map((m) => m.id)).toContain('pair');
      expect(sharable(ALL).map((m) => m.id)).toContain('pair');
      expect(whims(ALL)).not.toContain('pair');
    } finally {
      modeOf('pair').gate = was;
    }
  });

  it('my row: minutes only; with an answer it’s refused', async () => {
    const lane = (await LANES.loading('pair'))!;
    expect(lane.record?.({} as never, [], [], true)).toEqual([]);
    expect(lane.chunks({ o: [3, 0] })).toEqual([PAIR_UNIT]);
    expect(lane.deal({ gm: 'pair', seed: 4, o: [3, 0] }).map((c) => c.id)).toEqual(pairDeal(4, FILE.cards).map((c) => c.id));
    const row = { d: '2026-11-07', g: 'abcd1234', gm: 'pair', lv: 3, n: 1, ms: 120_000, r: [] };
    expect(listenOf(row)).toEqual(row);
    expect(listenOf({ ...row, r: [['pr-rice', 1, 0, 0]] })).toBeNull();
  });
});
