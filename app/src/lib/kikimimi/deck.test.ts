import { describe, expect, it } from 'vitest';
import { BANK, DIALOGUE_TYPES, clipIds, clipItems, isDialogue, type Level } from './bank.ts';
import { DECK_SIZE, LEVELS as OFFERED, MIX, deck, inMix, mixes, playable } from './deck.ts';
import { FIRST_LISTEN, RIGHT, points } from './score.ts';
import { QUIZ_MAX_S, QUIZ_QS } from '../contract/live-protocol.ts';
import { LINE_GAP, clipDur, clipUrl, itemDur, sequenceStarts, voiced } from './clips.ts';
import { DIALOGUES } from './dialogues.ts';

/** Every level with a bank (deck() builds a gated level's deck too: only the lobby hides it). */
const LEVELS: Level[] = [1, 2, 3, 4];
const seeds = Array.from({ length: 300 }, (_, i) => (Math.imul(i + 1, 2654435761) >>> 0));

describe('kikimimi deck', () => {
  it('is deterministic: the same {seed, lv} gives the same deck', () => {
    for (const lv of LEVELS) for (const s of seeds.slice(0, 20)) expect(deck(s, lv)).toEqual(deck(s, lv));
  });

  it('differs between seeds and levels', () => {
    const ids = (s: number, lv: Level) => deck(s, lv).map((it) => it.id).join();
    expect(new Set(seeds.slice(0, 20).map((s) => ids(s, 1))).size).toBeGreaterThan(15);
    expect(ids(7, 1)).not.toBe(ids(7, 2));
  });

  it("follows the level's mix, with no item twice, all of the level", () => {
    for (const lv of LEVELS)
      for (const s of seeds) {
        const d = deck(s, lv);
        expect(d).toHaveLength(DECK_SIZE);
        expect(new Set(d.map((it) => it.id)).size).toBe(DECK_SIZE);
        for (const it of d) expect(it.lv).toBe(lv);
        for (const [t, n] of Object.entries(MIX[lv]!)) expect(d.filter((it) => it.type === t).length).toBe(n);
      }
  });

  it('never has the same type more than twice in a row', () => {
    for (const lv of LEVELS)
      for (const s of seeds) {
        const t = deck(s, lv).map((it) => it.type);
        for (let i = 2; i < t.length; i++) expect(t[i] === t[i - 1] && t[i] === t[i - 2], `${s}/${lv}: ${t}`).toBe(false);
      }
  });

  it("shuffles the choices by the seed and moves the answer with them", () => {
    const byId = new Map(BANK.map((it) => [it.id, it]));
    let moved = 0, n = 0;
    for (const lv of LEVELS)
      for (const s of seeds.slice(0, 50))
        for (const it of deck(s, lv)) {
          const src = byId.get(it.id)!;
          expect([...it.choices].sort()).toEqual([...src.choices].sort());
          expect(it.choices[it.answer]).toBe(src.choices[src.answer]);
          n++;
          if (it.answer !== src.answer) moved++;
        }
    expect(moved / n).toBeGreaterThan(0.5);
  });

  it('level 4 with its dialogues voiced: one gist and one next a game, the rest of its mix as given, never twice in a row', () => {
    const all = mixes(Object.fromEntries(BANK.flatMap((it) => clipIds(it)).map((id) => [id, {}])));
    expect(all[4]).toMatchObject({ gist: 1, next: 1 });
    for (const s of seeds) {
      const d = deck(s, 4, all);
      expect(d).toHaveLength(DECK_SIZE);
      expect(new Set(d.map((it) => it.id)).size).toBe(DECK_SIZE);
      for (const [t, n] of Object.entries(all[4]!)) expect(d.filter((it) => it.type === t).length).toBe(n);
      const t = d.map((it) => it.type);
      for (let i = 2; i < t.length; i++) expect(t[i] === t[i - 1] && t[i] === t[i - 2]).toBe(false);
      // a dialogue keeps its lines; its choices shuffled like any
      for (const it of d.filter(isDialogue)) expect(it.lines.length).toBeGreaterThanOrEqual(2);
    }
    // today (every dialogue line voiced): level 4's deck has them, and にがて れんしゅう's pool takes them (inMix)
    for (const s of seeds.slice(0, 50)) expect(deck(s, 4).some((it) => DIALOGUE_TYPES.includes(it.type))).toBe(true);
    expect(DIALOGUES.every((it) => inMix(it))).toBe(true);
    expect(DIALOGUES.every((it) => inMix(it, all))).toBe(true);
  });

  it('leaves the bank untouched', () => {
    const before = JSON.stringify(BANK);
    deck(123, 2);
    expect(JSON.stringify(BANK)).toBe(before);
  });

  it('takes any 32-bit seed', () => {
    for (const s of [0, 1, 0x7fffffff, 0xffffffff]) expect(deck(s, 3)).toHaveLength(DECK_SIZE);
  });

  it('a level this bank has no mix for (5: another phone’s newer level) is an empty deck, not a crash', () => {
    expect(deck(7, 5)).toEqual([]);
  });
});

describe('kikimimi levels offered (the lobby’s gate)', () => {
  const all = Object.fromEntries(BANK.flatMap((it) => clipIds(it)).map((id) => [id, {}]));

  it('a level is offered only once every item of it has a clip', () => {
    expect(playable(all)).toEqual([1, 2, 3, 4]);
    const oneShort: Record<string, unknown> = { ...all };
    delete oneShort[BANK.find((it) => it.lv === 4 && !isDialogue(it))!.id];
    expect(playable(oneShort)).toEqual([1, 2, 3]);
    expect(playable({})).toEqual([]);
  });

  it('dialogues have a gate of their own: level 4 plays without them till every line of every dialogue has a clip', () => {
    const noDialogues = Object.fromEntries(BANK.filter((it) => !isDialogue(it)).map((it) => [it.id, {}]));
    expect(playable(noDialogues)).toEqual([1, 2, 3, 4]);
    expect(mixes(noDialogues)[4]).toEqual({ word: 2, num: 2, reply: 2, mean: 2 });
    const lineShort: Record<string, unknown> = { ...all };
    delete lineShort[clipIds(DIALOGUES[3])[1]];
    expect(mixes(lineShort)[4]).not.toHaveProperty('gist');
    expect(playable(lineShort)).toEqual([1, 2, 3, 4]);
    expect(mixes(all)[4]).toHaveProperty('gist', 1);
  });

  it('never a level without a mix or items (5), whatever the clips', () => {
    expect(playable({ ...all, 'x5-anything': {} })).not.toContain(5);
  });

  it('today: levels 1-4 (level 4 since the neural cast’s clips landed)', () => {
    expect(OFFERED).toEqual([1, 2, 3, 4]);
  });
});

describe('kikimimi score', () => {
  it('100 for right, +30 on the first listen, 0 for wrong', () => {
    expect(points(true, false)).toBe(RIGHT + FIRST_LISTEN);
    expect(points(true, true)).toBe(RIGHT);
    expect(points(false, false)).toBe(0);
    expect(points(false, true)).toBe(0);
    expect(QUIZ_QS).toBe(DECK_SIZE);
    expect(QUIZ_MAX_S).toBe(DECK_SIZE * (RIGHT + FIRST_LISTEN));
  });
});

describe('kikimimi clips', () => {
  it('paths under audio/ (as loadVoice takes them) carry the file hash, slow ones their own', () => {
    const id = 'p1-squid';
    expect(clipUrl(id)).toMatch(/^kikimimi\/p1-squid\.m4a\?v=[0-9a-f]{8}$/);
    expect(clipUrl(id, true)).toMatch(/^kikimimi\/p1-squid-slow\.m4a\?v=[0-9a-f]{8}$/);
    expect(clipUrl(id)).not.toBe(clipUrl(id, true).replace('-slow', ''));
    expect(clipDur(id)).toBeGreaterThan(0);
    expect(clipDur('nope')).toBeUndefined();
  });

  it('a dialogue: a clip per line (<id>-<n>), the lines the audio script speaks (cast, tts), its length the lines’ and the gaps', () => {
    const d = DIALOGUES.find((it) => it.id === 'd4-oat-latte')!;
    expect(clipIds(d)).toEqual(['d4-oat-latte-1', 'd4-oat-latte-2', 'd4-oat-latte-3']);
    const lines = clipItems(d);
    expect(lines.map((l) => [l.id, l.speaker, l.cast, l.voice, l.lv])).toEqual([
      ['d4-oat-latte-1', 'rosie', d.lines![0].cast, 'us', 4], ['d4-oat-latte-2', 'dom', d.lines![1].cast, 'us', 4], ['d4-oat-latte-3', 'rosie', d.lines![0].cast, 'us', 4]
    ]);
    expect(lines[2].tts).toContain('Lemme'); // what's spoken
    expect(lines[2].en).toContain('Let me');
    expect(lines[1].tts).toBeUndefined();
    for (const l of lines) expect(l.lines).toBeUndefined();
    // a single item: itself
    const one = BANK.find((it) => it.id === 'p1-squid')!;
    expect(clipItems(one)).toEqual([one]);
    const clips = { 'd4-oat-latte-1': { dur: 1.5 }, 'd4-oat-latte-2': { dur: 2.25 }, 'd4-oat-latte-3': { dur: 3 } };
    expect(itemDur(d, clips)).toBeCloseTo(1.5 + 2.25 + 3 + 2 * LINE_GAP);
    expect(itemDur(d, { 'd4-oat-latte-1': { dur: 1 } })).toBeUndefined();
    expect(voiced(d, clips)).toBe(true);
    expect(voiced(d)).toBe(true); // its lines' clips landed
    expect(itemDur(one)).toBe(clipDur('p1-squid'));
  });

  it('a sequence’s starts: each line a gap after the last; heard late, lines over are skipped and the one under way plays from now', () => {
    const g = LINE_GAP * 1000;
    expect(sequenceStarts([1, 2, 1.5], 10_000, 9000)).toEqual([10_000, 11_000 + g, 13_000 + 2 * g]);
    // now inside line 2: line 1 skipped, line 2 whole from now, line 3 after it
    const now = 11_000 + g + 500;
    expect(sequenceStarts([1, 2, 1.5], 10_000, now)).toEqual([-1, now, now + 2000 + g]);
    // all over: nothing
    expect(sequenceStarts([1, 1], 0, 10_000)).toEqual([-1, -1]);
  });
});
