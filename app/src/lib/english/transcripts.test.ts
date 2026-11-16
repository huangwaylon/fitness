// セリフ, the clips' transcripts (docs/english.md "Transcripts"): every transcripts/<video>.en.json, written from the
// whisper pass, and every <video>.ja.json, our translations. The en file: the shape, time order and no overlaps, each
// line ≤ 200 characters (the clip's length is the build's to hold: vite.config.ts english-data). The ja file: one line
// for each of the en file's with the same `t`, each ≤ 80 characters, every character in the trimmed font (names in
// katakana, no English lines). The line at the playhead is scenes.ts atTime's (scenes.test.ts).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { notInTrimmedFont } from '../../../scripts/font-subsets.ts';
import type { JaTranscriptFile, TranscriptFile } from './types.ts';

const DIR = join(import.meta.dirname, 'transcripts');
const EN = readdirSync(DIR).filter((f) => f.endsWith('.en.json'));
const JA = readdirSync(DIR).filter((f) => f.endsWith('.ja.json'));
const EN_MAX = 200;
const JA_MAX = 80;
/** Two Latin words in a row: an English line. */
const ENGLISH = /[A-Za-z]+[\s,.!?]+[A-Za-z]+/;

/** The lines' timing: [from, to] with 0 ≤ from < to, in time order, no overlaps; the problems. */
function checkTiming(lines: readonly { t: readonly [number, number] }[], name: string): string[] {
  const bad: string[] = [];
  lines.forEach((l, i) => {
    const at = `${name} #${i}`;
    const [a, b] = Array.isArray(l.t) && l.t.length === 2 ? l.t : [NaN, NaN];
    if (!Number.isFinite(a) || !Number.isFinite(b) || a < 0 || b <= a) bad.push(`${at}: t [from, to], 0 ≤ from < to`);
    const prev = lines[i - 1];
    if (prev?.t && a < prev.t[1]) bad.push(`${at}: overlaps or out of order`);
  });
  return bad;
}

describe('transcript files', () => {
  it('there is at least the fixture, translated', () => {
    expect(EN).toContain('lm2MpPpkGL8.en.json');
    expect(JA).toContain('lm2MpPpkGL8.ja.json');
  });

  it.each(EN)('%s', (f) => {
    const o = JSON.parse(readFileSync(join(DIR, f), 'utf8')) as TranscriptFile;
    expect(Object.keys(o).filter((k) => !['video', 'lines'].includes(k)), 'keys: video and lines only').toEqual([]);
    expect(o.video, 'video = the file name').toBe(f.replace(/\.en\.json$/, ''));
    expect(Array.isArray(o.lines) && o.lines.length > 0, 'lines: a list').toBe(true);
    const bad = checkTiming(o.lines, 'line');
    o.lines.forEach((l, i) => {
      const at = `line #${i}`;
      if (Object.keys(l).sort().join() !== 'en,t') return void bad.push(`${at}: { en, t } only`);
      if (typeof l.en !== 'string' || !l.en.trim() || l.en !== l.en.trim()) bad.push(`${at}: en, trimmed`);
      else if ([...l.en].length > EN_MAX) bad.push(`${at}: over ${EN_MAX} characters`);
    });
    expect(bad).toEqual([]);
  });

  it.each(JA)('%s', (f) => {
    const video = f.replace(/\.ja\.json$/, '');
    const o = JSON.parse(readFileSync(join(DIR, f), 'utf8')) as JaTranscriptFile;
    expect(Object.keys(o).filter((k) => !['video', 'lines'].includes(k)), 'keys: video and lines only').toEqual([]);
    expect(o.video, 'video = the file name').toBe(video);
    const en = EN.includes(`${video}.en.json`) ? (JSON.parse(readFileSync(join(DIR, `${video}.en.json`), 'utf8')) as TranscriptFile) : undefined;
    expect(en, `the en file ${video}.en.json`).toBeDefined();
    expect(o.lines.length, 'one line for each of the en file’s').toBe(en!.lines.length);
    const bad = checkTiming(o.lines, 'line');
    o.lines.forEach((l, i) => {
      const at = `line #${i}`;
      if (Object.keys(l).sort().join() !== 'ja,t') return void bad.push(`${at}: { ja, t } only`);
      if (JSON.stringify(l.t) !== JSON.stringify(en!.lines[i].t)) bad.push(`${at}: t the en line’s own`);
      if (typeof l.ja !== 'string' || !l.ja.trim()) return void bad.push(`${at}: ja`);
      if ([...l.ja].length > JA_MAX) bad.push(`${at}: over ${JA_MAX} characters`);
      if (ENGLISH.test(l.ja)) bad.push(`${at}: English words (names in katakana)`);
      const missing = notInTrimmedFont(l.ja);
      if (missing.length) bad.push(`${at}: not in the trimmed font: ${missing.join('')} (choose another word)`);
    });
    expect(bad).toEqual([]);
  });
});
