import { describe, expect, it } from 'vitest';
import { phrases } from './phrases.ts';
import ja from './ja.json';
import jaKiki from './kikimimi.ja.json';

const lines = (t: string) => phrases(t).map((p) => p.join(''));
const cat: Record<string, string> = { ...ja, ...jaKiki };
const t = (k: string, p: Record<string, string> = {}) => cat[k].replace(/\{(\w+)\}/g, (_, n: string) => p[n]);

describe('phrases', () => {
  it('breaks after a particle or ending and after punctuation, never inside a word or a number', () => {
    expect(lines('23個を5,026かいがらで買いました。模様替えに入っています')).toEqual(['23個を', '5,026かいがらで', '買いました。', '模様替えに', '入っています']);
    expect(phrases('23個を5,026かいがらで')[1]).toEqual(['', '5,026', 'かいがらで']);
  });
  it('leaves English and spaced kana to their spaces', () => {
    expect(lines('Saved 1,200 kcal')).toEqual(['Saved 1,200 kcal']);
    expect(lines('ぜんぶ 23こで')).toEqual(['ぜんぶ', ' 23こで']);
  });
  // the sheet lines review 11/10 r2 saw split mid-word at 393 px (「ご / ほうび」, 「わかりま / す」, 「置きま / しょう」)
  it('keeps the guest note, the check card and the tent hint whole by word', () => {
    expect(lines(t('guest.jarNote', { a: 'ウェイ', b: 'うめ' }))).toContain('ごほうびはふたりが');
    expect(lines(t('kiki.check.card')).at(-1)).toBe('場所がわかります');
    expect(lines(t('tent.hint')).at(-1)).toBe('置きましょう');
  });
});
