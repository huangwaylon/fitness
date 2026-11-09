import { describe, expect, it } from 'vitest';
import { phrases } from './phrases.ts';

const lines = (t: string) => phrases(t).map((p) => p.join(''));

describe('phrases', () => {
  it('breaks after a particle or ending and after punctuation, never inside a word or a number', () => {
    expect(lines('23個を5,026かいがらで買いました。模様替えに入っています')).toEqual(['23個を', '5,026かいがらで', '買いました。', '模様替えに', '入っています']);
    expect(phrases('23個を5,026かいがらで')[1]).toEqual(['', '5,026', 'かいがらで']);
  });
  it('leaves English and spaced kana to their spaces', () => {
    expect(lines('Saved 1,200 kcal')).toEqual(['Saved 1,200 kcal']);
    expect(lines('ぜんぶ 23こで')).toEqual(['ぜんぶ', ' 23こで']);
  });
});
