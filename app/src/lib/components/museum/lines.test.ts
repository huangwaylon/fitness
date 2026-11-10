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
    for (let i = 0; i < 400; i++) {
      const k = curatorLine(Math.random, last);
      expect(k).not.toBe(last);
      expect(k).not.toBe('museum.curator.hello');
      seen.add((last = k));
    }
    expect(seen.size).toBe(11);
    for (const k of [...seen, 'museum.curator.hello', 'museum.curator', 'museum.curator.new']) {
      expect((ja as Record<string, string>)[k], k).toBeTruthy();
      expect((en as Record<string, string>)[k], k).toBeTruthy();
    }
  });

  test('a find of the last day on show: now and then his news of it, never twice running, never his welcome’s place', () => {
    expect(curatorLine(Math.random, undefined, true)).toBe('museum.curator.hello');
    let last = 'museum.curator.0', news = 0;
    for (let i = 0; i < 400; i++) {
      const k = curatorLine(Math.random, last, true);
      expect(k).not.toBe(last);
      if (k === 'museum.curator.new') news++;
      last = k;
    }
    expect(news).toBeGreaterThan(80);
    for (let i = 0; i < 100; i++) expect(curatorLine(Math.random, 'museum.curator.0')).not.toBe('museum.curator.new');
  });
});
