// English Study's transcripts, セリフ (docs/english.md "Transcripts"): each video's full English text as the local
// whisper pass heard it, one file a video: src/lib/english/transcripts/<video>.en.json, { "video", "lines": [{ "t":
// [from, to], "en" }] } (transcripts.test.ts holds them; the build holds them to the clip's length). Reads the
// whisper.cpp JSON of each video dir (~/friends/out/<video>/whisper.json on the importer's machine); a translation
// (<video>.ja.json) has one line for each of these with the same `t`.
//   npm run english:transcripts -- <out dir>                    → each video: lines and span
//   npm run english:transcripts -- <out dir> --write            → writes the files (only when changed)
//   npm run english:transcripts -- <out dir> --ids a,b --write  → these videos only
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type Whisper = { transcription?: { offsets?: { from?: number; to?: number }; text?: string }[] };
type Line = { t: [number, number]; en: string };

/** The longest line, characters (transcripts.test.ts holds it). */
const MAX = 200;
const LETTER = /\p{L}/u;
const latin = (ch: string) => /[A-Za-zÀ-ɏ]/.test(ch);

/** A segment's text, or null for the whisper's noise over music: a line mostly not Latin letters (Cyrillic, CJK) is
 *  dropped, a stray non-Latin letter in a Latin line goes. */
function textOf(raw: string): string | null {
  const chars = [...raw.replace(/\s+/g, ' ').trim()];
  const letters = chars.filter((c) => LETTER.test(c));
  if (letters.length && letters.filter(latin).length * 2 < letters.length) return null;
  return chars.filter((c) => !LETTER.test(c) || latin(c)).join('').replace(/\s+/g, ' ').trim() || null;
}

/** A line over MAX characters (one breathless segment) in parts: cut at a sentence end, else a space, else hard; the
 *  timing by each part's share of the characters (the display and a seek, nothing finer). */
function splitLong(l: Line): Line[] {
  const out: Line[] = [];
  let [from, to] = l.t;
  let chars = [...l.en];
  while (chars.length > MAX) {
    const head = chars.slice(0, MAX);
    const end = Math.max(...['.', '!', '?'].map((p) => head.findLastIndex((c, i) => c === p && head[i + 1] === ' ')));
    let cut = end + 1;
    if (cut < 80) cut = head.lastIndexOf(' ');
    if (cut < 1) cut = MAX;
    const mid = Math.min(Math.max(Math.round((from + ((to - from) * cut) / chars.length) * 100) / 100, from + 0.01), to - 0.01);
    out.push({ t: [from, mid > from ? mid : from], en: head.slice(0, cut).join('').trim() });
    from = mid > from ? mid : from;
    chars = chars.slice(cut);
    while (chars[0] === ' ') chars = chars.slice(1);
  }
  if (chars.length) out.push({ t: [from, to], en: chars.join('').trim() });
  // a part left without time (a segment under 0.02 s split) goes: never a zero-length line
  return out.filter((p) => p.t[1] > p.t[0] && p.en);
}

/** A video's lines from its whisper pass: 0.1 s, time order without overlaps, the noise and the loops cut. */
function linesOf(w: Whisper): Line[] {
  const out: Line[] = [];
  for (const s of w.transcription ?? []) {
    const en = textOf(s.text ?? '');
    if (!en) continue;
    let a = Math.round((s.offsets?.from ?? 0) / 100) / 10;
    let b = Math.round((s.offsets?.to ?? 0) / 100) / 10;
    if (b <= a) b = a + 0.1;
    const prev = out[out.length - 1];
    if (prev && a < prev.t[1]) a = prev.t[1];
    if (b <= a) continue;
    out.push(...splitLong({ t: [a, b], en }));
  }
  // a run of 3+ identical lines in a row is the whisper's loop over music or a talking head, never speech: cut it
  const keep = out.map(() => true);
  let run = 1;
  for (let i = 1; i <= out.length; i++) {
    if (i < out.length && out[i].en === out[i - 1].en) {
      run++;
      continue;
    }
    if (run >= 3) for (let j = i - run; j < i; j++) keep[j] = false;
    run = 1;
  }
  return out.filter((_, i) => keep[i]);
}

const [dir, ...rest] = process.argv.slice(2);
if (!dir) {
  console.error('usage: npm run english:transcripts -- <out dir> [--ids a,b] [--write]');
  process.exit(1);
}
const write = rest.includes('--write');
const at = rest.indexOf('--ids');
const ids = at >= 0 ? (rest[at + 1]?.split(',') ?? []) : [];
const videos = readdirSync(dir).filter((d) => existsSync(join(dir, d, 'whisper.json')) && (ids.length === 0 || ids.includes(d)));
const here = join(import.meta.dirname, '../src/lib/english/transcripts');
let written = 0;
for (const video of videos) {
  const lines = linesOf(JSON.parse(readFileSync(join(dir, video, 'whisper.json'), 'utf8')) as Whisper);
  if (!lines.length) {
    console.log(`${video}: no lines`);
    continue;
  }
  const text = JSON.stringify({ video, lines }) + '\n';
  console.log(`${video}: ${lines.length} lines, ${lines[0].t[0]}–${lines[lines.length - 1].t[1]} s`);
  const path = join(here, `${video}.en.json`);
  if (write && (!existsSync(path) || readFileSync(path, 'utf8') !== text)) {
    writeFileSync(path, text);
    written++;
  }
}
if (write) console.log(`${written} written of ${videos.length}`);
