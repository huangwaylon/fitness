import { describe, expect, it } from 'vitest';
import { BANK, type Level } from './bank.ts';
import { DECK_SIZE, LEVELS as OFFERED, MIX, deck, playable } from './deck.ts';
import { FIRST_LISTEN, RIGHT, points } from './score.ts';
import { QUIZ_MAX_S, QUIZ_QS } from '../contract/live-protocol.ts';
import { clipDur, clipUrl } from './clips.ts';

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
  const all = Object.fromEntries(BANK.map((it) => [it.id, {}]));

  it('a level is offered only once every item of it has a clip', () => {
    expect(playable(all)).toEqual([1, 2, 3, 4]);
    const oneShort: Record<string, unknown> = { ...all };
    delete oneShort[BANK.find((it) => it.lv === 4)!.id];
    expect(playable(oneShort)).toEqual([1, 2, 3]);
    expect(playable({})).toEqual([]);
  });

  it('never a level without a mix or items (5), whatever the clips', () => {
    expect(playable({ ...all, 'x5-anything': {} })).not.toContain(5);
  });

  it('today: levels 1-3 (level 4 waits for the neural cast’s clips: make this [1, 2, 3, 4] when they land)', () => {
    expect(OFFERED).toEqual([1, 2, 3]);
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
});
