// Japanese lines break only at the copy's spaces or after 、。！ (`word-break: keep-all` on html[lang=ja]), so a
// run with no break opportunity is one unbreakable word: long ones overflow a 320px screen or a narrow card.
import { describe, expect, it } from 'vitest';
import jaMain from './ja.json';
import jaTab from './kenkou.ja.json';

const ja = { ...jaMain, ...jaTab };

/** The longest stretch of a string with no break opportunity under keep-all, in characters ({n} counts as one). */
function longestRun(s: string): number {
  const runs = s.replace(/\{[^}]+\}/g, 'X').split(/[\s、。！？!?）)」』・〜~/]|(?<=[（(「『])/);
  return Math.max(...runs.map((r) => [...r].length));
}

describe('ja copy under keep-all', () => {
  it('has no unbreakable run longer than 12 characters (≈ 290px at the 24px title size)', () => {
    const long = Object.entries(ja as Record<string, string>).filter(([, v]) => longestRun(v) > 12).map(([k, v]) => `${k}: ${v}`);
    expect(long).toEqual([]);
  });
});

describe('catalog text', () => {
  it('has no broken characters (U+FFFD) in either language', async () => {
    const en = (await import('./en.json')).default as Record<string, string>;
    const bad = [...Object.entries(ja as Record<string, string>), ...Object.entries(en)].filter(([, v]) => v.includes('\uFFFD')).map(([k]) => k);
    expect(bad).toEqual([]);
  });
});
