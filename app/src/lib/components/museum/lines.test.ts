// The curator's lines (museum/lines.ts): his welcome first, then his lines, never the same twice running; each in
// both languages.
import { describe, expect, test } from 'vitest';
import ja from '#lib/i18n/ja.json';
import en from '#lib/i18n/en.json';
import { curatorLine } from './lines.ts';

describe('the curator’s lines', () => {
  test('his welcome first, then one of his lines, never the last one again, each of them in turn', () => {
    expect(curatorLine(Math.random)).toBe('museum.curator.hello');
    const seen = new Set<string>();
    let last = curatorLine(Math.random);
    for (let i = 0; i < 200; i++) {
      const k = curatorLine(Math.random, last);
      expect(k).not.toBe(last);
      expect(k).not.toBe('museum.curator.hello');
      seen.add((last = k));
    }
    expect(seen.size).toBe(6);
    for (const k of [...seen, 'museum.curator.hello', 'museum.curator']) {
      expect((ja as Record<string, string>)[k], k).toBeTruthy();
      expect((en as Record<string, string>)[k], k).toBeTruthy();
    }
  });
});
