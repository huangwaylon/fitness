// ききみみ's compiled levels (docs/kikimimi-engine.md "Loading"): levels/ is what compile.ts makes of the bank, the ladders,
// clips.json and words.json (else: npm run kikimimi:levels); each level loaded is the bank's own items in the bank's
// order (so every phone's decks are the ones the bank gives); the index is the bank's; each chunk under its budget.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import type { Level } from './bank.ts';
import { CLIPS, WORDS } from './testdata.ts';
import { PART_MAX, compile, playable } from './compile.ts';
import { LEVELS, LADDER_OK } from './deck.ts';
import { LADDERS, RUNG_ITEMS } from './ladders.ts';
import { ENTRIES, INDEX, entryOf, isRungId, itemOf, ladders, levelItems, load, loadAll, loaded, rungAt, unitOf } from './pool.ts';
import { BANK } from './source.ts';
import { skillsOf, tagsOf } from './tags.ts';

const DIR = join(import.meta.dirname, 'levels');
const files = compile(CLIPS, WORDS);
const levels = [...new Set(BANK.map((it) => it.lv))];

describe('kikimimi levels: compiled', () => {
  it('levels/ is the compiler’s output for the bank and the clips as committed (else: npm run kikimimi:levels)', () => {
    const disk = ['index.json', ...readdirSync(join(DIR, 'parts')).map((f) => `parts/${f}`)].sort();
    expect(disk).toEqual([...files.keys()].sort());
    for (const [path, text] of files) expect(readFileSync(join(DIR, path), 'utf8') === text, `${path}: run npm run kikimimi:levels`).toBe(true);
  });

  it('each chunk is under its budget (60 KB gzipped), the index small', () => {
    for (const [path, text] of files) expect(gzipSync(text).length, path).toBeLessThanOrEqual(path === 'index.json' ? 16 * 1024 : PART_MAX);
  });

  it('the index: the gates as the bank and clips give them, every item in the bank’s order with its tags, every rung', () => {
    expect(LEVELS).toEqual(playable(CLIPS));
    expect(LADDER_OK).toBe(RUNG_ITEMS.every((it) => it.id in CLIPS));
    expect(ENTRIES.map((e) => e.id)).toEqual(BANK.map((it) => it.id));
    for (const it of BANK) {
      const e = entryOf(it.id)!;
      expect([e.lv, e.type, e.voice]).toEqual([it.lv, it.type, it.voice]);
      expect(tagsOf(e)).toEqual(tagsOf(it));
      expect(skillsOf(e)).toEqual(skillsOf(it));
      expect(unitOf(it.id)).toBe(it.lv);
    }
    for (const it of RUNG_ITEMS) {
      expect(isRungId(it.id) && unitOf(it.id)).toBe('ladder');
      expect(rungAt(it.id)).toEqual({ ladder: it.rung!.ladder, n: it.rung!.n });
    }
    expect(isRungId(BANK[0].id)).toBe(false);
    expect(INDEX.test[0]).toBe(BANK.find((it) => it.lv === 1)!.id);
  });
});

describe('kikimimi levels: loaded', () => {
  it('a level loads alone (its parts, nothing else); a deck of one not loaded throws rather than draw from half a bank', async () => {
    expect(loaded(5)).toBe(false);
    expect(() => levelItems(5)).toThrow();
    await load(5);
    expect(loaded(5)).toBe(true);
    expect(loaded(4)).toBe(false);
    expect(itemOf(BANK.find((it) => it.lv === 5)!.id)).toBeDefined();
    expect(itemOf(BANK.find((it) => it.lv === 4)!.id)).toBeUndefined();
    expect(loaded(8 as Level)).toBe(false); // (音の へんしん's phrases: a level of their own, loaded when the drill is played)
  });

  it('each level is the bank’s items of it, in the bank’s order, as authored; the ladders are ladders.ts’s', async () => {
    await loadAll();
    for (const lv of levels) expect(levelItems(lv)).toEqual(BANK.filter((it) => it.lv === lv));
    expect(ladders()).toEqual(LADDERS);
    for (const it of RUNG_ITEMS) expect(itemOf(it.id)).toEqual(it);
  });
});
