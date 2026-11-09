// まるごと 聞く's real recordings (docs/kikimimi-engine.md "まるごと 聞く", docs/curriculum.md "Long listening"): each line of a
// `real` long piece (content/listen/s4-long-*.yaml) cut from its recording, end to end, so the lines played in turn are
// the excerpt; and every long line heard by whisper against its transcript (the alignment check). Silent: nothing plays.
//   node scripts/kikimimi-real.ts --src <dir> [--only <regex>]
//       cut what's new or changed: <dir> holds the files downloaded (each credit.file's name, or the archive member its
//       #fragment names; its sha256 checked), read
//       by ffmpeg only (downloads are data). The excerpt (credit.start…end) once to a WAV, its loudness measured once
//       (one gain for the whole piece, to −18 LUFS as the stories: no line louder than its neighbours), each line
//       (`t`, s into the excerpt) to mono AAC at LONG_KBPS, 24 kHz, a 5 ms fade at each cut; clips.json and
//       kikimimi-clips.src.json (the line's source: the file's sha256, its span, the gain, REAL_V), then the packs
//       and the levels.
//   node scripts/kikimimi-real.ts --align [--only <regex>]
//       whisper-cli (large-v3-turbo) hears every long line, real and generated, against its `en` (a generated one's
//       `tts` too, the nearer; numbers said as words, punctuation and case aside): align.json {clip: [hash, WER %]};
//       content/long.test holds each piece to the bounds (ALIGN_*) at its clips' hashes.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { registerHooks } from 'node:module';
import { FFMPEG, FFPROBE, WHISPER_MODEL, measureLoudness, writeAtomic } from './tts/tools.ts';

registerHooks({
  load: (url, ctx, next) => (url.endsWith('.json') ? next(url, { ...ctx, importAttributes: { type: 'json' } }) : next(url, ctx))
});
const { readListen } = await import('../src/lib/kikimimi/compile.ts');
const { LONG_KBPS, listenClipIds, listenUnit } = await import('../src/lib/kikimimi/listen.ts');
const { alignWer } = await import('../src/lib/kikimimi/align.ts');
const { WORK, writePacks } = await import('./kikimimi-packs.ts');
const { writeLevels } = await import('./kikimimi-levels.ts');

const APP = join(import.meta.dirname, '..');
const CLIPS = join(APP, 'src/lib/kikimimi/clips.json');
const SRCS = join(import.meta.dirname, 'kikimimi-clips.src.json');
const ALIGN = join(APP, 'src/lib/kikimimi/align.json');
/** Bump to cut every real line again after a change to how it's made. */
const REAL_V = 2;
/** The pieces' loudness (the stories' and the generated pieces': scripts/kikimimi-audio.ts STORY_LUFS). */
const LUFS = -18;
const SR = 24_000;
const FADE = 0.005;

const arg = (k: string) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : undefined);
const only = arg('--only') ? new RegExp(arg('--only')!) : null;
const sha = (b: string | Buffer, n: number) => createHash('sha256').update(b).digest('hex').slice(0, n);
const ff = (...a: string[]) => execFileSync(FFMPEG, ['-v', 'error', '-y', ...a]);
const duration = (f: string): number => Math.round(Number(execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], { encoding: 'utf8' })) * 100) / 100;
const sorted = <T>(o: Record<string, T>) => Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]));
const longs = readListen().flatMap(({ raw }) => listenUnit(raw).items.flatMap((it) => (it.kind === 'long' && (!only || only.test(it.id)) ? [it] : [])));

if (process.argv.includes('--align')) align();
else cut(arg('--src'));

function cut(src: string | undefined): void {
  if (!src) throw new Error('kikimimi-real: --src <dir> (the downloaded recordings)');
  const clips = JSON.parse(readFileSync(CLIPS, 'utf8')) as Record<string, { dur: number; hash: string }>;
  const srcs = JSON.parse(readFileSync(SRCS, 'utf8')) as Record<string, string>;
  const tmp = mkdtempSync(join(tmpdir(), 'kiki-real-'));
  mkdirSync(WORK, { recursive: true });
  let made = 0;
  try {
    for (const it of longs) {
      if (it.source !== 'real' || !it.credit) continue;
      // (the file's name: its URL's, or the archive member its #fragment names)
      const c = it.credit, url = new URL(c.file), file = join(src, url.hash ? decodeURIComponent(url.hash.slice(1)) : basename(url.pathname));
      if (!existsSync(file)) throw new Error(`kikimimi-real: ${it.id}: ${file} isn't there (download ${c.file})`);
      const got = createHash('sha256').update(readFileSync(file)).digest('hex');
      if (got !== c.sha256) throw new Error(`kikimimi-real: ${it.id}: ${basename(file)} is ${got}, not the credit's ${c.sha256}`);
      const ids = listenClipIds(it);
      const todo = it.lines.map((l, n) => ({ l, id: ids[n] })).filter(({ l, id }) => srcs[id] !== lineSrc(c.sha256, c.start, l.t!) || !existsSync(join(WORK, `${id}.m4a`)) || !clips[id]);
      if (!todo.length) continue;
      // the excerpt once (float WAV, mono, 24 kHz), and one gain for the whole of it
      const ex = join(tmp, `${it.id}.wav`);
      ff('-i', file, '-ss', String(c.start), '-to', String(c.end), '-ac', '1', '-ar', String(SR), '-c:a', 'pcm_f32le', ex);
      const { i, tp } = measureLoudness(ex), gain = LUFS - i;
      const limit = tp + gain > -1.5 ? `,alimiter=limit=${(10 ** (-1.6 / 20)).toFixed(3)}:attack=2:release=40:level=0` : '';
      for (const { l, id } of todo) {
        const [a, b] = l.t!, out = join(WORK, `${id}.m4a`), d = b - a;
        // (seeking on the input: the line's own clock from 0, as the fades want; a WAV seeks to the sample)
        ff('-ss', a.toFixed(3), '-t', d.toFixed(3), '-i', ex, '-af', `volume=${gain.toFixed(2)}dB${limit},afade=t=in:d=${FADE},afade=t=out:st=${(d - FADE).toFixed(3)}:d=${FADE}`,
          '-ac', '1', '-ar', String(SR), '-c:a', 'aac', '-b:a', `${LONG_KBPS}k`, '-map_metadata', '-1', '-fflags', '+bitexact', '-movflags', '+faststart', out);
        clips[id] = { dur: duration(out), hash: sha(readFileSync(out), 8) };
        srcs[id] = lineSrc(c.sha256, c.start, l.t!);
        made++;
      }
      console.log(`${it.id}: ${todo.length} lines cut (${(c.end - c.start).toFixed(0)} s, ${i.toFixed(1)} LUFS → ${LUFS})`);
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
    writeAtomic(CLIPS, JSON.stringify(sorted(clips), null, 1).replace(/\n  +/g, ' ').replace(/\n \}/g, ' }') + '\n');
    writeAtomic(SRCS, JSON.stringify(sorted(srcs), null, 1) + '\n');
  }
  console.log(`${made} lines cut`);
  if (made) {
    writePacks();
    writeLevels(true);
  }
}

/** A real line's source hash: the recording, the line's span in it, how it's made. */
function lineSrc(file: string, start: number, t: readonly number[]): string {
  return sha(JSON.stringify([file, start, t, LUFS, LONG_KBPS, REAL_V]), 10);
}

/** Every long line heard by whisper (16 kHz WAVs in a scratch dir, a batch at a time), its WER against `en`. */
function align(): void {
  const clips = JSON.parse(readFileSync(CLIPS, 'utf8')) as Record<string, { hash: string }>;
  const out = (existsSync(ALIGN) ? JSON.parse(readFileSync(ALIGN, 'utf8')) : {}) as Record<string, [string, number]>;
  // (a generated line against its transcript or what it was spoken from, its respelling: the nearer)
  const lines = longs.flatMap((it) => it.lines.map((l, n) => ({ id: listenClipIds(it)[n], refs: [l.en, ...(l.tts ? [l.tts] : [])] }))).filter(({ id }) => clips[id] && out[id]?.[0] !== clips[id].hash);
  const tmp = mkdtempSync(join(tmpdir(), 'kiki-align-'));
  try {
    for (let k = 0; k < lines.length; k += 24) {
      const batch = lines.slice(k, k + 24), files = batch.map(({ id }) => join(tmp, `${id}.wav`));
      batch.forEach(({ id }, j) => ff('-i', join(WORK, `${id}.m4a`), '-ac', '1', '-ar', '16000', files[j]));
      execFileSync('whisper-cli', ['-m', WHISPER_MODEL, '-l', 'en', '-np', '-nt', '-otxt', ...files.flatMap((f) => ['-f', f])], { stdio: ['ignore', 'ignore', 'ignore'] });
      batch.forEach(({ id, refs }, j) => {
        const heard = readFileSync(`${files[j]}.txt`, 'utf8');
        out[id] = [clips[id].hash, Math.round(Math.min(...refs.map((r) => alignWer(r, heard))) * 100)];
      });
      console.log(`${Math.min(k + 24, lines.length)} / ${lines.length}`);
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
    writeAtomic(ALIGN, JSON.stringify(sorted(out), null, 0).replace(/\],"/g, '],\n"') + '\n');
  }
}
