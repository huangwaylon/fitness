// English Study's speech rate, one measure for every clip (types.ts Clip.wpm): the captions' words a minute over speech
// time, speech time being the union of the caption events that hold words ([Music]-style tags and >> left out). Reads
// YouTube's auto captions as json3, one file a video (<video>.en-orig.json3 or <video>.en.json3), e.g. fetched with
//   yt-dlp --skip-download --write-auto-subs --sub-format json3 --sub-langs en-orig -o '%(id)s' <url>
//   npm run english:wpm -- <dir>           → each clip: wpm and band now and measured (no captions: kept)
//   npm run english:wpm -- <dir> --write   → and writes them into the clip files, bands the library's thirds
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { bandsOf, CLIPS } from '../src/lib/english/clips/index.ts';

type Json3 = { events?: { tStartMs?: number; dDurationMs?: number; segs?: { utf8?: string }[] }[] };

/** Words a minute over speech time, from a json3 file's events. */
function wpmOf(d: Json3): number {
  const ev = (d.events ?? [])
    .filter((e) => e.segs)
    .map((e) => ({ t: e.tStartMs ?? 0, d: e.dDurationMs ?? 0, x: e.segs!.map((s) => s.utf8 ?? '').join('').replace(/\[[^\]]*\]|>>/g, '').trim() }))
    .filter((e) => e.x);
  const words = ev.reduce((n, e) => n + e.x.split(/\s+/).length, 0);
  let speech = 0, from = -1, to = -1;
  for (const [s, e] of ev.map((x) => [x.t, x.t + x.d]).sort((a, b) => a[0] - b[0])) {
    if (s > to) {
      speech += to - from;
      [from, to] = [s, e];
    } else to = Math.max(to, e);
  }
  speech += to - from;
  return speech > 0 ? Math.round((words * 60000) / speech) : 0;
}

const [dir, flag] = process.argv.slice(2);
if (!dir) {
  console.error('usage: node scripts/english-wpm.ts <captions dir> [--write]');
  process.exit(1);
}
const here = join(import.meta.dirname, '../src/lib/english/clips');
// each clip's wpm: measured where its captions are in `dir`, else as it is
const measured = CLIPS.map((c) => {
  const file = [`${c.video}.en-orig.json3`, `${c.video}.en.json3`].map((f) => join(dir, f)).find(existsSync);
  return file ? wpmOf(JSON.parse(readFileSync(file, 'utf8'))) : null;
});
const wpms = CLIPS.map((c, i) => measured[i] ?? c.wpm);
const bands = bandsOf(wpms);
const missing = CLIPS.filter((_, i) => measured[i] === null).map((c) => c.id);
const sorted = [...wpms].sort((a, b) => a - b);
console.log(`thirds: ゆっくり < ${sorted[Math.floor(sorted.length / 3)]} ≤ ふつう < ${sorted[Math.floor((2 * sorted.length) / 3)]} ≤ 速い`);
CLIPS.forEach((c, i) => console.log(`${c.id.padEnd(13)} ${c.wpm} ${c.band} → ${wpms[i]} ${bands[i]}${measured[i] === null ? '  (no captions: kept)' : ''}`));
if (missing.length) console.error(`no captions for ${missing.length}: ${missing.join(' ')} (the bands mix measures until they're in)`);
if (flag === '--write')
  CLIPS.forEach((c, i) => {
    const path = join(here, `${c.id}.ts`);
    const src = readFileSync(path, 'utf8');
    const out = src.replace(/wpm: \d+/, `wpm: ${wpms[i]}`).replace(/band: '(slow|mid|fast)'/, `band: '${bands[i]}'`);
    if (!/wpm: \d+/.test(src) || !/band: '(slow|mid|fast)'/.test(src)) console.error(`  ${c.id}: wpm/band not found in ${path}`);
    if (out !== src) writeFileSync(path, out);
  });
