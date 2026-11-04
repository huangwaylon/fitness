// The pocket's table (shop/pocket.ts): everything with a price shows in うる, in a section, with its name in both
// languages and an official icon; nothing else does.
import { describe, expect, it } from 'vitest';
import { SELL } from '#lib/contract/shopPrices.ts';
import { art } from '#lib/art.ts';
import ja from '#lib/i18n/catch.ja.json';
import en from '#lib/i18n/catch.en.json';
import { SECTIONS, pocketItem } from './pocket.ts';

describe('the pocket’s table', () => {
  it('every priced key has a section, a name (ja, en) and an icon', () => {
    const names: Record<string, string> = { ...ja }, names_en: Record<string, string> = { ...en };
    const bad = Object.keys(SELL).filter((k) => {
      const it = pocketItem(k);
      return !it || !SECTIONS.includes(it.section) || !names[it.name] || !names_en[it.name] || !art(it.art);
    });
    expect(bad).toEqual([]);
  });
  it('sorts the kinds into their sections; a present’s piece or an unknown good is none of them', () => {
    expect(['bug:moth', 'fish:koi', 'sea:octopus', 'shell:pearl', 'goods:wood', 'goods:tree-branch', 'goods:apple', 'goods:coconut', 'fossil:amber',
      'fragment:star-fragment', 'goods:rare-mushroom', 'goods:boot'].map((k) => pocketItem(k)?.section))
      .toEqual(['bug', 'fish', 'sea', 'shell', 'material', 'material', 'fruit', 'fruit', 'fossil', 'other', 'other', 'other']);
    expect([pocketItem('item:froggy-chair'), pocketItem('goods:nope'), pocketItem('wood')]).toEqual([null, null, null]);
  });
});
