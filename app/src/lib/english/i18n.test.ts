// English Study's strings (i18n.ts): every key in both languages, non-empty, with the same {placeholders}.
import { describe, expect, it, vi } from 'vitest';
import { i18n, setLocale } from '#lib/i18n/index.ts';
import { jaStrings, s } from './i18n.ts';

/** Every placeholder filled with its own name, ‹name›: what a string asks for, read back from its output. */
const named = new Proxy({}, { get: (_, k) => `‹${String(k)}›` }) as Record<string, string>;
const asks = (text: string) => [...text.matchAll(/‹(\w+)›/g)].map((m) => m[1]).sort();

describe('english i18n', () => {
  it('ja and en: every key, non-empty, the same placeholders', async () => {
    const keys = Object.keys(jaStrings()) as Parameters<typeof s>[0][];
    setLocale('ja');
    const ja = keys.map((k) => s(k, named));
    setLocale('en');
    await vi.waitUntil(() => i18n.locale === 'en');
    const en = keys.map((k) => s(k, named));
    setLocale('ja');
    keys.forEach((k, i) => {
      expect(ja[i].trim(), k).not.toBe('');
      expect(en[i].trim(), k).not.toBe('');
      // (dur: the English m:ss pads its seconds, {ss})
      if (k !== 'dur') expect(asks(en[i]), k).toEqual(asks(ja[i]));
    });
  });
});
