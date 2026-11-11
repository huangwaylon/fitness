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
  it('keeps an opening bracket with what follows and a closing one with what precedes, a number’s too', () => {
    expect(lines('苗がありません。タヌキ商店で買えます（野菜も植えられます）')).toEqual(['苗がありません。', 'タヌキ商店で', '買えます', '（野菜も', '植えられます）']);
    expect(phrases('トマトの苗を買いました（9かいがら）').at(-1)).toEqual(['', '（9', 'かいがら）']);
    expect(phrases('5株（12個）')).toEqual([['', '5', '株', '（12', '個）']]);
    expect(lines('「はい」と言った。」')).toEqual(['「はい」と', '言った。」']);
  });
  it('strands no bracket at a line’s end or start in any Japanese line of the app', () => {
    const ends = /[（「『【〔〈《［]$/, starts = /^[）」』】〕〉》］、。・ー]/;
    for (const k of Object.keys(cat)) {
      const ps = phrases(t(k, new Proxy({}, { get: () => '12' })));
      for (const [i, p] of ps.entries()) {
        const line = p.join('');
        expect(ends.test(line) && i < ps.length - 1, `${k}: 「${line}」`).toBe(false);
        expect(starts.test(line) && i > 0, `${k}: 「${line}」`).toBe(false);
        // within a phrase: a piece kept whole never leaves an opening bracket behind it
        expect(p.some((q, j) => j % 2 === 0 && j < p.length - 1 && ends.test(q)), `${k}: 「${line}」`).toBe(false);
      }
    }
  });
  // the sheet lines review 11/10 r2 saw split mid-word at 393 px (「ご / ほうび」, 「わかりま / す」, 「置きま / しょう」)
  it('keeps the guest note, the check card and the tent hint whole by word', () => {
    expect(lines(t('guest.jarNote', { a: 'ウェイ', b: 'うめ' }))).toContain('ごほうびはふたりが');
    expect(lines(t('kiki.check.card')).at(-1)).toBe('場所がわかります');
    expect(lines(t('tent.hint')).at(-1)).toBe('置きましょう');
  });
});
