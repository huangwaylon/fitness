// 場面のあらすじ (docs/english.md "Scene summaries"): every scenes/<video>.json, as the importer writes them. The shape,
// time order within the clip, no overlaps and gaps of 5 s at most; each line ≤ 40 characters, no quoted dialogue (no
// 「」 or quotation marks), no English lines, every character in the trimmed font. And sceneAt.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CLIPS } from './clips/index.ts';
import { sceneAt } from './scenes.ts';
import { covers, parseRanges } from '../../../scripts/font-subsets.ts';
import type { Scene } from './types.ts';

const DIR = join(import.meta.dirname, 'scenes');
const FILES = readdirSync(DIR).filter((f) => f.endsWith('.json'));
/** The longest gap between two scenes, s. */
const GAP = 5;
const MAX = 40;
const QUOTES = /[「」『』"'“”‘’＂＇〝〟]/;
/** Two Latin words in a row: an English line. */
const ENGLISH = /[A-Za-z]+[\s,.!?]+[A-Za-z]+/;
/** The trimmed font's ranges (lib/styles/fonts.css), each weight. */
const css = readFileSync(join(import.meta.dirname, '../styles/fonts.css'), 'utf8');
const fontRanges = (w: number) => [...css.matchAll(/@font-face\s*{[^}]*}/g)].filter((m) => m[0].includes(`font-weight: ${w};`)).flatMap((m) => parseRanges(/unicode-range:\s*([^;]+);/.exec(m[0])?.[1] ?? ''));
const FONT = [fontRanges(500), fontRanges(700)];

describe('scenes files', () => {
  it('there is at least the fixture', () => expect(FILES).toContain('lm2MpPpkGL8.json'));

  it.each(FILES)('%s', (f) => {
    const data: unknown = JSON.parse(readFileSync(join(DIR, f), 'utf8'));
    const o = data as { video?: unknown; scenes?: unknown };
    expect(Object.keys(o).sort(), 'keys').toEqual(['scenes', 'video']);
    expect(o.video, 'video = the file name').toBe(f.replace(/\.json$/, ''));
    expect(Array.isArray(o.scenes) && o.scenes.length > 0, 'scenes: a list').toBe(true);
    const scenes = o.scenes as Scene[];
    const clip = CLIPS.find((c) => c.video === o.video);
    const bad: string[] = [];
    scenes.forEach((s, i) => {
      const at = `#${i}`;
      if (!s || typeof s !== 'object' || Object.keys(s).sort().join() !== 'ja,t') return void bad.push(`${at}: { t, ja } only`);
      const [a, b] = Array.isArray(s.t) && s.t.length === 2 ? s.t : [NaN, NaN];
      if (!Number.isFinite(a) || !Number.isFinite(b) || a < 0 || b <= a) bad.push(`${at}: t [from, to], 0 ≤ from < to`);
      if (clip && b > clip.dur) bad.push(`${at}: ends after the clip (${clip.dur} s)`);
      const prev = scenes[i - 1];
      if (prev?.t) {
        if (a < prev.t[1]) bad.push(`${at}: overlaps or out of order`);
        else if (a - prev.t[1] > GAP) bad.push(`${at}: a gap over ${GAP} s`);
      }
      if (typeof s.ja !== 'string' || !s.ja.trim()) return void bad.push(`${at}: ja`);
      if ([...s.ja].length > MAX) bad.push(`${at}: over ${MAX} characters`);
      if (QUOTES.test(s.ja)) bad.push(`${at}: a quote mark (no quoted dialogue)`);
      if (ENGLISH.test(s.ja)) bad.push(`${at}: English words (no lines)`);
      const missing = [...s.ja].filter((ch) => ch.codePointAt(0)! > 0x7f && FONT.some((r) => !covers(r, ch.codePointAt(0)!)));
      if (missing.length) bad.push(`${at}: not in the trimmed font: ${missing.join('')} (choose another word)`);
    });
    expect(bad).toEqual([]);
  });
});

describe('sceneAt', () => {
  const sc: Scene[] = [{ t: [2, 12], ja: 'a' }, { t: [14, 25], ja: 'b' }, { t: [25, 40], ja: 'c' }];
  it('the scene begun by then; in a gap the one before; before the first, the first', () => {
    expect([0, 2, 11.9, 13, 14, 24.9, 25, 99].map((t) => sceneAt(sc, t))).toEqual([0, 0, 0, 0, 1, 1, 2, 2]);
  });
});
