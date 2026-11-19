// けっこんしき's categories in Japanese (contract/wedCats.ts): the starter list.
import { describe, expect, it } from 'vitest';
import { boardConfig } from './config.ts';
import { CATEGORIES } from '#lib/contract/wedCats.ts';

describe('wedding categories', () => {
  it('the starter list is Japanese (招待客, 手続き)', () => {
    expect(boardConfig({}).cats).toEqual([...CATEGORIES]);
    expect(CATEGORIES).toContain('招待客');
    expect(CATEGORIES).toContain('手続き');
    expect(boardConfig({ cats: ['予算', 'ドリンク'] }).cats).toEqual(['予算', 'ドリンク']);
  });
});
