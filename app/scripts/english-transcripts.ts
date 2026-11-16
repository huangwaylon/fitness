// English Study's transcripts, せりふ (docs/english.md "Transcripts"): each video's full English text as the local
// whisper pass heard it, one file a video: src/lib/english/transcripts/<video>.en.json, { "video", "lines": [{ "t":
// [from, to], "en" }] } (transcripts.test.ts holds them). Reads the whisper.cpp JSON of each video dir
// (~/friends/out/<video>/whisper.json on the importer's machine); the Japanese halves (<video>.ja.json) are the
// translators', one line for each of these with the same `t`.
//   node scripts/english-transcripts.ts <out dir>                    → each video: lines and span
//   node scripts/english-transcripts.ts <out dir> --write            → writes the files (only when changed)
//   node scripts/english-transcripts.ts <out dir> --ids a,b --write  → these videos only
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CLIPS } from '../src/lib/english/clips/index.ts';

type Whisper = { transcription?: { offsets?: { from?: number; to?: number }; text?: string }[] };

/** A video's lines from its whisper pass: 0.1 s, text trimmed, inside the clip's length when it's a library clip. */
function linesOf(w: Whisper, dur: number | undefined): { t: [number, number]; en: string }[] {
  const out: { t: [number, number]; en: string }[] = [];
  for (const s of w.transcription ?? []) {
    const en = (s.text ?? '').replace(/\s+/g, ' ').trim();
    if (!en) continue;
    let a = Math.round((s.offsets?.from ?? 0) / 100) / 10;
    let b = Math.round((s.offsets?.to ?? 0) / 100) / 10;
    if (dur !== undefined) {
      if (a >= dur) continue;
      b = Math.min(b, dur);
    }
    if (b <= a) b = a + 0.1;
    const prev = out[out.length - 1];
    if (prev && a < prev.t[1]) a = prev.t[1];
    if (b <= a) continue;
    out.push({ t: [a, b], en });
  }
  // a line over 200 characters is one breathless whisper segment: split it at a sentence end, else a space, the
  // timing by each part's share of the characters (the display and a seek, nothing finer)
  const MAX = 200;
  const split: { t: [number, number]; en: string }[] = [];
  for (const l of out) {
    let rest = l;
    while ([...rest.en].length > MAX) {
      const head = [...rest.en].slice(0, MAX).join('');
      let cut = Math.max(head.lastIndexOf('. '), head.lastIndexOf('! '), head.lastIndexOf('? ')) + 1;
      if (cut < 80) cut = head.lastIndexOf(' ');
      if (cut < 1) cut = MAX;
      const en = head.slice(0, cut).trim();
      let mid = Math.round((rest.t[0] + (rest.t[1] - rest.t[0]) * (cut / [...rest.en].length)) * 100) / 100;
      mid = Math.min(Math.max(mid, rest.t[0] + 0.01), rest.t[1] - 0.01);
      if (mid <= rest.t[0]) break; // the segment is too short to split: it keeps its length
      split.push({ t: [rest.t[0], mid], en });
      rest = { t: [mid, rest.t[1]], en: [...rest.en].slice(cut).join('').trim() };
    }
    if (rest.en) split.push(rest);
  }
  // a run of 3+ identical lines in a row is the whisper loop over music or a talking head, never speech: cut it
  const keep = split.map(() => true);
  let run = 1;
  for (let i = 1; i <= split.length; i++) {
    if (i < split.length && split[i].en === split[i - 1].en) {
      run++;
      continue;
    }
    if (run >= 3) for (let j = i - run; j < i; j++) keep[j] = false;
    run = 1;
  }
  return split.filter((_, i) => keep[i]);
}

const [dir, ...rest] = process.argv.slice(2);
if (!dir) {
  console.error('usage: node scripts/english-transcripts.ts <out dir> [--ids a,b] [--write]');
  process.exit(1);
}
const write = rest.includes('--write');
const eq = rest.find((a) => a.startsWith('--ids='));
const at = rest.indexOf('--ids');
const ids = eq ? eq.slice(6).split(',') : at >= 0 ? (rest[at + 1]?.split(',') ?? []) : [];
const videos = readdirSync(dir).filter((d) => existsSync(join(dir, d, 'whisper.json')) && (ids.length === 0 || ids.includes(d)));
const here = join(import.meta.dirname, '../src/lib/english/transcripts');
let written = 0;
for (const video of videos) {
  const w = JSON.parse(readFileSync(join(dir, video, 'whisper.json'), 'utf8')) as Whisper;
  const dur = CLIPS.find((c) => c.video === video)?.dur;
  const lines = linesOf(w, dur);
  if (!lines.length) {
    console.log(`${video}: no lines`);
    continue;
  }
  const text = JSON.stringify({ video, lines }) + '\n';
  console.log(`${video}: ${lines.length} lines, ${lines[0].t[0]}–${lines[lines.length - 1].t[1]} s${dur !== undefined ? '' : ' (not in the library: no end held)'}`);
  if (write) {
    const path = join(here, `${video}.en.json`);
    if (!existsSync(path) || readFileSync(path, 'utf8') !== text) {
      writeFileSync(path, text);
      written++;
    }
  }
}
if (write) console.log(`${written} written of ${videos.length}`);
