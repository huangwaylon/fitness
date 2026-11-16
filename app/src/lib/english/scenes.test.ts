// 場面のあらすじ (docs/english.md "Scene summaries"): every scenes/<video>.json, as the importer writes them. The shape,
// time order within the clip, no overlaps and gaps of 5 s at most; each line ≤ 40 characters, no quoted dialogue (no
// 「」 or quotation marks), no English lines, every character in the trimmed font. The optional beats: each 2–10 s, the
// same order and gap rules, each inside one scene's span, ≤ 30 characters, the same line rules, `k` a known category.
// And atTime, beatsByScene.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CLIPS } from './clips/index.ts';
import { atTime, BEAT_KINDS, beatsByScene } from './scenes.ts';
import { notInTrimmedFont } from '../../../scripts/font-subsets.ts';
import type { Beat, Scene } from './types.ts';

const DIR = join(import.meta.dirname, 'scenes');
const FILES = readdirSync(DIR).filter((f) => f.endsWith('.json'));
/** The longest gap between two scenes (or two beats), s. */
const GAP = 5;
const MAX = 40;
const BEAT_MAX = 30;
/** A beat's length, s. */
const BEAT_LEN = [2, 10] as const;
const QUOTES = /[「」『』"'“”‘’＂＇〝〟]/;
/** Two Latin words in a row: an English line. */
const ENGLISH = /[A-Za-z]+[\s,.!?]+[A-Za-z]+/;

/** A list of timed lines (the scenes, or the beats): each one's shape, the order and gaps, each line's rules; the problems. */
function checkLines(list: readonly Scene[], name: string, keys: string, max: number, dur: number | undefined): string[] {
  const bad: string[] = [];
  list.forEach((s, i) => {
    const at = `${name} #${i}`;
    if (!s || typeof s !== 'object' || Object.keys(s).sort().join() !== keys) return void bad.push(`${at}: { ${keys} } only`);
    const [a, b] = Array.isArray(s.t) && s.t.length === 2 ? s.t : [NaN, NaN];
    if (!Number.isFinite(a) || !Number.isFinite(b) || a < 0 || b <= a) bad.push(`${at}: t [from, to], 0 ≤ from < to`);
    if (dur !== undefined && b > dur) bad.push(`${at}: ends after the clip (${dur} s)`);
    const prev = list[i - 1];
    if (prev?.t) {
      if (a < prev.t[1]) bad.push(`${at}: overlaps or out of order`);
      else if (a - prev.t[1] > GAP) bad.push(`${at}: a gap over ${GAP} s`);
    }
    if (typeof s.ja !== 'string' || !s.ja.trim()) return void bad.push(`${at}: ja`);
    if ([...s.ja].length > max) bad.push(`${at}: over ${max} characters`);
    if (QUOTES.test(s.ja)) bad.push(`${at}: a quote mark (no quoted dialogue)`);
    if (ENGLISH.test(s.ja)) bad.push(`${at}: English words (no lines)`);
    const missing = notInTrimmedFont(s.ja);
    if (missing.length) bad.push(`${at}: not in the trimmed font: ${missing.join('')} (choose another word)`);
  });
  return bad;
}

describe('scenes files', () => {
  it('there is at least the fixture, with beats', () => {
    expect(FILES).toContain('lm2MpPpkGL8.json');
    expect(JSON.parse(readFileSync(join(DIR, 'lm2MpPpkGL8.json'), 'utf8')).beats?.length).toBeGreaterThan(0);
  });

  it.each(FILES)('%s', (f) => {
    const data: unknown = JSON.parse(readFileSync(join(DIR, f), 'utf8'));
    const o = data as { video?: unknown; scenes?: unknown; beats?: unknown };
    expect(Object.keys(o).filter((k) => !['video', 'scenes', 'beats'].includes(k)), 'keys: video, scenes and beats only').toEqual([]);
    expect(o.video, 'video = the file name').toBe(f.replace(/\.json$/, ''));
    expect(Array.isArray(o.scenes) && o.scenes.length > 0, 'scenes: a list').toBe(true);
    const scenes = o.scenes as Scene[];
    const clip = CLIPS.find((c) => c.video === o.video);
    const bad = checkLines(scenes, 'scene', 'ja,t', MAX, clip?.dur);
    if ('beats' in o) {
      expect(Array.isArray(o.beats) && o.beats.length > 0, 'beats: a list, when present').toBe(true);
      const beats = o.beats as Beat[];
      bad.push(...checkLines(beats, 'beat', 'ja,k,t', BEAT_MAX, clip?.dur));
      beats.forEach((b, i) => {
        if (!Array.isArray(b?.t)) return;
        const at = `beat #${i}`;
        const len = b.t[1] - b.t[0];
        if (len < BEAT_LEN[0] || len > BEAT_LEN[1]) bad.push(`${at}: ${len} s long, not ${BEAT_LEN[0]}–${BEAT_LEN[1]} s`);
        if (!scenes.some((s) => s.t[0] <= b.t[0] && b.t[1] <= s.t[1])) bad.push(`${at}: not inside one scene's span`);
        if (!BEAT_KINDS.includes(b.k)) bad.push(`${at}: k ${JSON.stringify(b.k)} not one of ${BEAT_KINDS.join(' | ')}`);
      });
    }
    expect(bad).toEqual([]);
  });
});

describe('atTime', () => {
  const sc: Scene[] = [{ t: [2, 12], ja: 'a' }, { t: [14, 25], ja: 'b' }, { t: [25, 40], ja: 'c' }];
  it('the scene begun by then; in a gap the one before; before the first, the first', () => {
    expect([0, 2, 11.9, 13, 14, 24.9, 25, 99].map((t) => atTime(sc, t))).toEqual([0, 0, 0, 0, 1, 1, 2, 2]);
  });
});

describe('beatsByScene', () => {
  const sc: Scene[] = [{ t: [0, 10], ja: 'a' }, { t: [10, 20], ja: 'b' }, { t: [20, 30], ja: 'c' }];
  const bt: Beat[] = [{ t: [0, 4], ja: 'x', k: 'ask' }, { t: [4, 10], ja: 'y', k: 'joke' }, { t: [22, 28], ja: 'z', k: 'irony' }];
  it('each scene its beats, by index; a scene without any, none', () => expect(beatsByScene(sc, bt)).toEqual([[0, 1], [], [2]]));
});
