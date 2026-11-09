// Answer-choice tells (tells.ts, docs/curriculum.md "Choice tells"): every level's 3-choice reply, mean, gist and next
// sets (compile.ts choiceSets: the banks' items, the units' items and their tiers), held to chance plus a tolerance;
// the shares printed per level (scripts/kikimimi-tells.ts lists the sets). The right choice's place after the deal: every
// deck shuffles it (bank.ts shuffleChoices), seeded, so the same seed deals the same order and the places come out even.
import { describe, expect, it } from 'vitest';
import { mulberry32 } from '#lib/random.ts';
import { shuffleChoices, type Item } from './bank.ts';
import { choiceSets } from './compile.ts';
import { AUTHORED } from './source.ts';
import { TELL_TYPES, overLimits, statsOfTells, tellReport, tellsOf } from './tells.ts';

/** The levels rewritten so far (the rest are reported, not held, till theirs land). */
const HELD = new Set(['L2', 'L3', 'L4', 'L5', 'L6', 'L7']);

describe('answer-choice tells', () => {
  it('reports each level and holds it to the limits', () => {
    const { lines, over } = tellReport(choiceSets(), HELD);
    console.log(lines.join('\n'));
    expect(over).toEqual([]);
  });

  it('weighs what it is for', () => {
    const t = tellsOf({ en: 'Are you still working on that plate?', answer: 0, choices: ["Oh, I'm good, thanks. You can take it away now.", 'Yes, I work there.', 'The plate is blue.'] });
    expect(t).toMatchObject({ longest: true, longBy: true, shortest: false, echoLeast: true, echoMost: false, form: { opener: true, question: false, wrongOpeners: 0 } });
    const even = tellsOf({ en: 'Do you want soup or salad with that?', answer: 1, choices: ['Soup, I guess.', 'Salad, please.', 'Soup or salad, sure.'] });
    expect(even).toMatchObject({ longest: false, longBy: false, shortest: false });
    const s = statsOfTells([t, t]);
    expect(s).toMatchObject({ sets: 2, longest: 1, opener: 1, question: 0 });
    expect(overLimits({ ...s, sets: 30 })).toEqual(['longest 100 % > 45 %', 'longBy 100 % > 12 %', 'shortest 0 % < 20 %', 'echoLeast 100 % > 45 %', 'echoMost 0 % < 15 %', 'opener 100 % > 12 %']);
    expect(overLimits({ ...s, sets: 30, longest: 0.1, longBy: 0, shortest: 0.3, echoLeast: 0.3, echoMost: 0.3, opener: 0 })).toEqual(['longest 10 % < 20 %']);
  });

  it('deals the right choice to every place evenly, the same seed the same order', () => {
    const items = AUTHORED.filter((it) => TELL_TYPES.has(it.type) && it.choices.length === 3);
    const r = mulberry32(7), at = [0, 0, 0];
    for (let k = 0; k < 20; k++) for (const it of items) at[shuffleChoices(it, r).answer]++;
    const n = at.reduce((a, b) => a + b);
    for (const x of at) expect(Math.abs(x / n - 1 / 3)).toBeLessThan(0.02);
    const deal = (it: Item, seed: number) => shuffleChoices(it, mulberry32(seed));
    for (const it of items.slice(0, 50)) {
      const a = deal(it, 42);
      expect(deal(it, 42)).toEqual(a);
      expect(a.choices[a.answer]).toBe(it.choices[it.answer]);
      if (a.cja) expect(a.cja[a.answer]).toBe(it.cja![it.answer]);
    }
  });
});
