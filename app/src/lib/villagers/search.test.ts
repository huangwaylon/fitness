import { describe, expect, it } from 'vitest';
import { ROSTER, ROSTER_IDS } from './roster.ts';
import { fold, searchVillagers } from './search.ts';

describe('villager search', () => {
  it('folds case, width and hiragana', () => {
    expect(fold(' ＡＢｃ ')).toBe('abc');
    expect(fold('ねこ')).toBe('ネコ');
    expect(fold('ｱﾝﾁｮﾋﾞ')).toBe('アンチョビ');
  });

  it('empty query → the whole roster in picker order', () => {
    expect(searchVillagers('  ')).toEqual(ROSTER_IDS);
  });

  it('matches names in both languages', () => {
    expect(searchVillagers('ancho')).toEqual(['anchovy']); // 'anch' also finds Blanche
    expect(searchVillagers('あんちょび')).toEqual(['anchovy']);
    expect(searchVillagers('ジュン')).toContain('marshal');
  });

  it('matches species and personality in both languages; words narrow', () => {
    const cats = searchVillagers('ねこ');
    expect(cats.length).toBeGreaterThan(5);
    expect(cats.every((id) => ROSTER[id].species === 'cat')).toBe(true);
    expect(searchVillagers('Cat')).toEqual(expect.arrayContaining(cats));
    expect(searchVillagers('cat lazy').every((id) => ROSTER[id].personality === 'lazy')).toBe(true);
    expect(searchVillagers('ネコ ぼんやり')).toContain('bob');
  });

  it('finds special characters by name and by 「とくべつ」 / special', () => {
    expect(searchVillagers('たぬきち')).toEqual(['tom-nook']);
    expect(searchVillagers('k.k.')).toEqual(['kk-slider']);
    const special = searchVillagers('とくべつ');
    expect(special).toHaveLength(23);
    expect(searchVillagers('Special')).toEqual(special);
    expect(special.every((id) => ROSTER[id].special)).toBe(true);
  });

  it('no match → empty', () => {
    expect(searchVillagers('zzzz')).toEqual([]);
  });
});
