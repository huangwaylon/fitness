// ききみみ クイズ: the karaoke's word timings (docs/kikimimi.md "Visuals"): every clip's words aligned by whisper into
// src/lib/kikimimi/words.json (compiled into the levels' chunks: kikimimi-levels.ts, run at the end), `{clip: [hash, start…, end]}` in centiseconds, one start per word of the clip's shown
// `en` (marks.ts wordSpans) and the clip's end. Silent: it never plays a sound. Run after `npm run audio:kikimimi`
// (a re-spoken clip has a new hash; its old timings are ignored by clips.ts wordTimes until this runs again).
//   node scripts/kikimimi-words.ts [--force] [--only <regex>]
// whisper-cli (large-v3-turbo, ~/.cache/whisper/ggml-large-v3-turbo.bin or WHISPER_MODEL) hears each clip word by word
// (`-ml 1 -sow`, DTW token timestamps); its words are matched to the shown words (a DP over normalised spellings:
// "gonna" is heard where "going to" is shown, a number may come as digits or words), and the shown words it didn't
// match are spread between their neighbours by their letters. Only the normal clips (the karaoke replays those) and
// スピード はしご's rungs. A clip
// mixed with a speech condition (noise, a phone line, a PA's hall: docs/kikimimi.md "Conditions") is aligned on its
// clean take, which the audio script keeps under .cache/tts/clean/ with the speech's offset in the mixed clip.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { registerHooks } from 'node:module';
import { FFMPEG, WHISPER_MODEL as MODEL } from './tts/tools.ts';

registerHooks({
  load: (url, ctx, next) => (url.endsWith('.json') ? next(url, { ...ctx, importAttributes: { type: 'json' } }) : next(url, ctx))
});
const { clipItems } = await import('../src/lib/kikimimi/bank.ts');
const { AUTHORED: BANK } = await import('../src/lib/kikimimi/source.ts');
const { RUNG_ITEMS } = await import('../src/lib/kikimimi/ladders.ts');
const { writeLevels } = await import('./kikimimi-levels.ts');
const { readListen, readStories, unitItems } = await import('../src/lib/kikimimi/compile.ts');
const { listenClipItems } = await import('../src/lib/kikimimi/listen.ts');
const { storyItems } = await import('../src/lib/kikimimi/story.ts');
const { wordSpans } = await import('../src/lib/kikimimi/marks.ts');
const { WORK, unpackClips } = await import('./kikimimi-packs.ts');

const APP = join(import.meta.dirname, '..');
const OUT = join(APP, 'src/lib/kikimimi/words.json');
const CLEAN = join(process.env.KIKIMIMI_TTS_CACHE ?? join(APP, '.cache/tts'), 'clean');
const CLIPS = JSON.parse(readFileSync(join(APP, 'src/lib/kikimimi/clips.json'), 'utf8')) as Record<string, { dur: number; hash: string }>;
const force = process.argv.includes('--force');
const onlyAt = process.argv.indexOf('--only');
const only = onlyAt > 0 ? new RegExp(process.argv[onlyAt + 1]) : null;

type Row = [string, ...number[]];
const words: Record<string, Row> = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
// (the units' own items, app/content/units/, スピード はしご's rung clips too: each the ladder's line at its speed,
// its karaoke at the top rung's reveal; the listening kinds' clips; and the bedtime stories' segments, a StoryFrame's karaoke)
const clips = [...[...BANK, ...unitItems()].flatMap(clipItems), ...RUNG_ITEMS, ...readListen().flatMap(({ raw }) => listenClipItems(raw)), ...storyItems(readStories())].filter((c) => CLIPS[c.id] && (!only || only.test(c.id)));
const todo = clips.filter((c) => force || words[c.id]?.[0] !== CLIPS[c.id].hash);
console.log(`${clips.length} clips, ${todo.length} to align`);

const norm = (w: string) => w.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]/g, '');
/** How alike a shown word and a heard one are: the same, one the other's start (gonna / going, lemme / let), else 0. */
function like(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 3;
  if (a.length >= 2 && b.length >= 2 && (a.startsWith(b.slice(0, 3)) || b.startsWith(a.slice(0, 3)))) return 1;
  return 0;
}

/** The shown words' starts (s) and the clip's end, from the heard words with their times. */
function align(shown: string[], heard: { w: string; from: number; to: number }[], dur: number): number[] {
  const n = shown.length, m = heard.length;
  const a = shown.map(norm), b = heard.map((h) => norm(h.w));
  // DP: the best total likeness, gaps free
  const S = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++) {
      const l = like(a[i - 1], b[j - 1]);
      S[i][j] = Math.max(S[i - 1][j], S[i][j - 1], l ? S[i - 1][j - 1] + l : -1);
    }
  const at = new Array<number | null>(n).fill(null);
  for (let i = n, j = m; i > 0 && j > 0; ) {
    const l = like(a[i - 1], b[j - 1]);
    if (l && S[i][j] === S[i - 1][j - 1] + l) {
      at[i - 1] = heard[j - 1].from;
      i--;
      j--;
    } else if (S[i][j] === S[i - 1][j]) i--;
    else j--;
  }
  // the unmatched spread between their neighbours (the first word from the first heard, the end the clip's)
  const anchors: [number, number][] = [[-1, heard[0]?.from ?? 0], ...at.flatMap((t, i): [number, number][] => (t === null ? [] : [[i, t]])), [n, dur]];
  const out = new Array<number>(n).fill(0);
  const weight = (i: number) => shown[i].replace(/[^\p{L}\p{N}]/gu, '').length + 1;
  for (let k = 0; k + 1 < anchors.length; k++) {
    const [i0, t0] = anchors[k], [i1, t1] = anchors[k + 1];
    if (i0 >= 0) out[i0] = t0;
    const gap = Array.from({ length: i1 - i0 - 1 }, (_, g) => i0 + 1 + g);
    if (!gap.length) continue;
    // a run before the first anchor starts at the first heard word; one after a matched word, a share of the way on
    const total = gap.reduce((s, i) => s + weight(i), i0 >= 0 ? weight(i0) : 0);
    let acc = i0 >= 0 ? weight(i0) : 0;
    for (const i of gap) {
      out[i] = t0 + ((t1 - t0) * acc) / total;
      acc += weight(i);
    }
  }
  // never backwards
  for (let i = 1; i < n; i++) out[i] = Math.max(out[i], out[i - 1]);
  return [...out.map((t) => Math.min(t, dur)), dur];
}

if (todo.length && !existsSync(MODEL)) throw new Error(`${MODEL} missing: the one-time setup in docs/kikimimi.md "Audio" (or WHISPER_MODEL)`);
if (todo.length) {
  unpackClips(); // the clips as loose files (from the packs, where the work folder hasn't them)
  const tmp = mkdtempSync(join(tmpdir(), 'kiki-words-'));
  try {
    /** A mixed clip's clean take and the speech's offset in the clip (s), while it's this clip's; else the clip. */
    const leads = new Map<string, number>();
    const files = todo.map((c) => {
      const wav = join(tmp, `${c.id}.wav`), side = join(CLEAN, `${c.id}.json`);
      const clean = existsSync(side) ? (JSON.parse(readFileSync(side, 'utf8')) as { hash: string; lead: number }) : null;
      const use = clean?.hash === CLIPS[c.id].hash && existsSync(join(CLEAN, `${c.id}.m4a`));
      if (use) leads.set(c.id, clean!.lead);
      execFileSync(FFMPEG, ['-loglevel', 'error', '-y', '-i', use ? join(CLEAN, `${c.id}.m4a`) : join(WORK, `${c.id}.m4a`), '-ar', '16000', '-ac', '1', wav]);
      return wav;
    });
    const t = Date.now();
    for (let k = 0; k < files.length; k += 50) {
      const batch = files.slice(k, k + 50);
      execFileSync('whisper-cli', ['-m', MODEL, '-l', 'en', '-np', '-ml', '1', '-sow', '-dtw', 'large.v3.turbo', '-oj', ...batch.flatMap((f) => ['-f', f])], { stdio: ['ignore', 'ignore', 'ignore'] });
    }
    console.log(`whisper: ${Math.round((Date.now() - t) / 1000)} s`);
    let matched = 0, total = 0;
    for (const [k, c] of todo.entries()) {
      const j = JSON.parse(readFileSync(`${files[k]}.json`, 'utf8')) as { transcription: { offsets: { from: number; to: number }; text: string }[] };
      const lead = leads.get(c.id) ?? 0;
      const heard = j.transcription.map((s) => ({ w: s.text.trim(), from: s.offsets.from / 1000 + lead, to: s.offsets.to / 1000 + lead })).filter((h) => norm(h.w));
      const shown = wordSpans(c.en).map(([a, b]) => c.en.slice(a, b));
      const dur = CLIPS[c.id].dur;
      const times = align(shown, heard, dur);
      total += shown.length;
      matched += shown.filter((w) => heard.some((h) => norm(h.w) === norm(w))).length;
      words[c.id] = [CLIPS[c.id].hash, ...times.map((s) => Math.round(s * 100))];
    }
    console.log(`shown words heard as written: ${matched}/${total} (${leads.size} mixed clips aligned on their clean takes)`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
// only the bank's clips, sorted
const keep = new Set(clips.map((c) => c.id));
const sorted = Object.fromEntries(Object.entries(words).filter(([id]) => keep.has(id) || (only && !only.test(id) && CLIPS[id])).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(OUT, '{\n' + Object.entries(sorted).map(([id, r]) => `  ${JSON.stringify(id)}: ${JSON.stringify(r)}`).join(',\n') + '\n}\n');
console.log(`words.json: ${Object.keys(sorted).length} clips`);
writeLevels(true); // the levels' chunks with the new timings (docs/kikimimi.md "Loading")
