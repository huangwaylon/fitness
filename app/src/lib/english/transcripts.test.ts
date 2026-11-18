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

  // (one test a check, every file's problems together: a row per file was 2,352 rows)
  it('the en files: video and lines only, { en, t } lines, timed, trimmed, ≤ EN_MAX', () => {
    const bad = EN.flatMap((f) => {
      const o = JSON.parse(readFileSync(join(DIR, f), 'utf8')) as TranscriptFile;
      const out: string[] = [];
      if (Object.keys(o).some((k) => !['video', 'lines'].includes(k))) out.push('keys: video and lines only');
      if (o.video !== f.replace(/\.en\.json$/, '')) out.push('video ≠ the file name');
      if (!Array.isArray(o.lines) || !o.lines.length) return [`${f}: lines: a list`];
      out.push(...checkTiming(o.lines, 'line'));
      o.lines.forEach((l, i) => {
        const at = `line #${i}`;
        if (Object.keys(l).sort().join() !== 'en,t') return void out.push(`${at}: { en, t } only`);
        if (typeof l.en !== 'string' || !l.en.trim() || l.en !== l.en.trim()) out.push(`${at}: en, trimmed`);
        else if ([...l.en].length > EN_MAX) out.push(`${at}: over ${EN_MAX} characters`);
      });
      return out.map((x) => `${f}: ${x}`);
    });
    expect(bad).toEqual([]);
  });

  it('the ja files: each en line’s own t, ≤ JA_MAX, no English, in the trimmed font', () => {
    const files = JA.map((f) => [f, JSON.parse(readFileSync(join(DIR, f), 'utf8')) as JaTranscriptFile] as const);
    // (the font asked once, for every character used: a line at a time took ~6 s)
    const unfit = new Set(notInTrimmedFont([...new Set(files.flatMap(([, o]) => o.lines.flatMap((l) => (typeof l.ja === 'string' ? [...l.ja] : []))))].join('')));
    const bad = files.flatMap(([f, o]) => {
      const video = f.replace(/\.ja\.json$/, '');
      const out: string[] = [];
      if (Object.keys(o).some((k) => !['video', 'lines'].includes(k))) out.push('keys: video and lines only');
      if (o.video !== video) out.push('video ≠ the file name');
      if (!EN.includes(`${video}.en.json`)) return [`${f}: no en file ${video}.en.json`];
      const en = JSON.parse(readFileSync(join(DIR, `${video}.en.json`), 'utf8')) as TranscriptFile;
      if (o.lines.length !== en.lines.length) out.push(`${o.lines.length} lines, not one for each of the en file’s ${en.lines.length}`);
      out.push(...checkTiming(o.lines, 'line'));
      o.lines.forEach((l, i) => {
        const at = `line #${i}`;
        if (Object.keys(l).sort().join() !== 'ja,t') return void out.push(`${at}: { ja, t } only`);
        if (JSON.stringify(l.t) !== JSON.stringify(en.lines[i]?.t)) out.push(`${at}: t the en line’s own`);
        if (typeof l.ja !== 'string' || !l.ja.trim()) return void out.push(`${at}: ja`);
        if ([...l.ja].length > JA_MAX) out.push(`${at}: over ${JA_MAX} characters`);
        if (ENGLISH.test(l.ja)) out.push(`${at}: English words (names in katakana)`);
        const missing = [...l.ja].filter((ch) => unfit.has(ch));
        if (missing.length) out.push(`${at}: not in the trimmed font: ${missing.join('')} (choose another word)`);
      });
      return out.map((x) => `${f}: ${x}`);
    });
    expect(bad).toEqual([]);
  });
});
