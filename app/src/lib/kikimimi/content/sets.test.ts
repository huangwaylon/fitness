// The content sprint's sets (content/index.ts SETS, 2026-11-06): each set's own shape. Everything the bank holds them to
// (speakers, voices, the Japanese, choices, focus, notes, `tts`, dialogues) is bank.test.ts's; their staging and sound
// marks staging.test.ts's; near-duplicates across every bank near-dupes.test.ts's. Here only what's the set's: its
// size and split, its id prefixes, its level, its families, how long its clips may run, its accents.
import { describe, expect, it } from 'vitest';
import { isDialogue, type Item, type ItemType, type Level } from '../bank.ts';
import { SETS } from './index.ts';

interface Want {
  lv: Level;
  items: number;
  dialogues: [gist: number, next: number];
  prefix: [string, string];
  /** Each single type's least. */
  least: number;
  /** Families: how many, each at least this many items. */
  families?: [number, number];
  /** A clip's most words (what's spoken). */
  words: number;
  /** A dialogue's fewest lines. */
  lines: number;
}

const WANT: Record<string, Want> = {
  'mori-life': { lv: 4, items: 70, dialogues: [8, 7], prefix: ['ml', 'dml'], least: 15, families: [13, 3], words: 26, lines: 2 },
  'mori-work': { lv: 4, items: 70, dialogues: [8, 7], prefix: ['mw', 'dmw'], least: 10, words: 26, lines: 2 },
  'yama-a': { lv: 6, items: 80, dialogues: [10, 10], prefix: ['ya', 'dya'], least: 12, words: 26, lines: 2 },
  'yama-b': { lv: 6, items: 80, dialogues: [10, 10], prefix: ['yb', 'dyb'], least: 15, families: [12, 7], words: 26, lines: 2 },
  hoshi: { lv: 7, items: 90, dialogues: [13, 12], prefix: ['ho', 'dho'], least: 6, families: [10, 5], words: 45, lines: 3 }
};

const spoken = (it: Item) => (isDialogue(it) ? it.lines.map((l) => l.tts ?? l.en) : [it.tts ?? it.en]);

describe('kikimimi content sets', () => {
  it('the five sets, nothing else', () => expect(Object.keys(SETS).sort()).toEqual(Object.keys(WANT).sort()));

  for (const [name, w] of Object.entries(WANT))
    it(`${name}: ${w.items} items and ${w.dialogues[0] + w.dialogues[1]} dialogues at level ${w.lv}, ids ${w.prefix.join('- / ')}-, its families, clips ≤ ${w.words} words`, () => {
      const { items, dialogues, family } = SETS[name];
      const all = [...items, ...dialogues];
      expect(items).toHaveLength(w.items);
      expect(items.filter(isDialogue)).toEqual([]);
      expect(dialogues.every(isDialogue)).toBe(true);
      expect(['gist', 'next'].map((t) => dialogues.filter((it) => it.type === t).length)).toEqual(w.dialogues);
      for (const it of all) expect(it.lv, it.id).toBe(w.lv);
      for (const it of items) expect(it.id).toMatch(new RegExp(`^${w.prefix[0]}-[a-z0-9]+(-[a-z0-9]+)*$`));
      for (const it of dialogues) expect(it.id).toMatch(new RegExp(`^${w.prefix[1]}-[a-z0-9]+(-[a-z0-9]+)*$`));
      for (const t of ['reply', 'mean', 'word', 'num'] as ItemType[]) expect(items.filter((it) => it.type === t).length, t).toBeGreaterThanOrEqual(w.least);
      expect(all.filter((it) => it.type === 'pic')).toEqual([]);
      if (w.families) {
        expect(Object.keys(family!).sort()).toEqual(all.map((it) => it.id).sort());
        const fams = new Set(Object.values(family!));
        expect(fams.size).toBe(w.families[0]);
        for (const f of fams) expect(all.filter((it) => family![it.id] === f).length, f).toBeGreaterThanOrEqual(w.families[1]);
      }
      for (const it of all) for (const s of spoken(it)) expect(s.split(/\s+/).length, `${it.id}: ${s}`).toBeLessThanOrEqual(w.words);
      for (const it of dialogues) expect(it.lines!.length, it.id).toBeGreaterThanOrEqual(w.lines);
    });

  it('ほし: single-clip gists (what a bulletin or talk is about) and nexts (what the speaker says next) beside its dialogues', () => {
    const { items } = SETS.hoshi;
    expect(items.filter((it) => it.type === 'gist').length).toBeGreaterThanOrEqual(6);
    expect(items.filter((it) => it.type === 'next').length).toBeGreaterThanOrEqual(6);
  });
});
