// ききみみ クイズ: every bank item spoken by macOS `say` into static/audio/kikimimi/ (docs/kikimimi.md "Audio").
//   node scripts/kikimimi-audio.ts             generate what's new or changed, drop clips of items that are gone, print the list
//   node scripts/kikimimi-audio.ts --force     regenerate every clip
//   node scripts/kikimimi-audio.ts --list      only print the listen-through list
//   node scripts/kikimimi-audio.ts --listen [--only <regex over ids>]   play each clip (afplay) with its text: the listening check
// Voices: a table per accent and gender, best first; the first one installed is used (`say -v '?'`). The Premium and
// Enhanced voices (System Settings → Accessibility → Spoken Content → Manage Voices) win when installed; the fallbacks
// are Samantha (US), Daniel (UK) and Karen (AU), so on a Mac with only those both genders of an accent share a voice.
// The Eloquence voices (Eddy, Reed, Rocko, Flo, Shelley, Sandy, Grandma, Grandpa) and the old robotic ones are never used.
// Each item: `say` at its level's rate (and at ~70% for levels 1 and 2: `<id>-slow.m4a`) → ffmpeg: leading and trailing
// silence trimmed (a short pad kept), loudness to −16 LUFS, mono AAC ~48 kbps at 24 kHz, +faststart.
// src/lib/kikimimi/clips.json gets {id: {dur, hash, slow?, src}}: `src` hashes what was spoken (text, voice, rate, this
// pipeline's version), so a run regenerates only the items whose text or voice changed (or whose files are missing).
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BANK, type Accent, type Item, type Level } from '../src/lib/kikimimi/bank.ts';
import { ROSTER } from '../src/lib/villagers/roster.ts';
import type { Clip } from '../src/lib/kikimimi/clips.ts';

const FFMPEG = process.env.FFMPEG ?? '/opt/homebrew/bin/ffmpeg';
const FFPROBE = process.env.FFPROBE ?? '/opt/homebrew/bin/ffprobe';
const OUT = join(import.meta.dirname, '../static/audio/kikimimi');
const CLIPS = join(import.meta.dirname, '../src/lib/kikimimi/clips.json');
/** Bump to regenerate everything after a change to the processing below. */
const PIPELINE = 1;
/** Words per minute by level: a little slow for level 1, natural for 3. Slow clips at ~70%. */
const RATE: Record<Level, number> = { 1: 160, 2: 175, 3: 185 };
const SLOW = 0.7;
const hasSlow = (it: Item): boolean => it.lv !== 3;

/** Best first; the last of each is the stock fallback. */
const VOICES: Record<Accent, Record<'f' | 'm', string[]>> = {
  us: {
    f: ['Ava (Premium)', 'Zoe (Premium)', 'Ava (Enhanced)', 'Zoe (Enhanced)', 'Allison (Enhanced)', 'Susan (Enhanced)', 'Samantha (Enhanced)', 'Samantha'],
    m: ['Evan (Premium)', 'Nathan (Premium)', 'Evan (Enhanced)', 'Nathan (Enhanced)', 'Tom (Enhanced)', 'Alex', 'Samantha']
  },
  uk: {
    f: ['Serena (Premium)', 'Serena (Enhanced)', 'Kate (Enhanced)', 'Stephanie (Enhanced)', 'Daniel'],
    m: ['Jamie (Premium)', 'Oliver (Enhanced)', 'Daniel (Enhanced)', 'Arthur (Enhanced)', 'Daniel']
  },
  au: {
    f: ['Matilda (Premium)', 'Karen (Premium)', 'Karen (Enhanced)', 'Catherine (Enhanced)', 'Karen'],
    m: ['Lee (Premium)', 'Lee (Enhanced)', 'Gordon (Enhanced)', 'Karen']
  }
};
const NEVER = /^(Eddy|Reed|Rocko|Flo|Shelley|Sandy|Grandma|Grandpa|Fred|Ralph|Albert|Kathy|Junior)\b/;

const args = process.argv.slice(2);
const flag = (f: string) => args.includes(f);
const only = args.includes('--only') ? new RegExp(args[args.indexOf('--only') + 1]) : null;

/** Installed voices by name; macOS adds " (English (UK))" to a name it has in more than one language or variant. */
const installed = new Set(
  execFileSync('say', ['-v', '?'], { encoding: 'utf8' }).split('\n')
    .map((l) => l.split(/\s{2,}|\s+[a-z]{2}_[A-Z]{2}\s/)[0].trim().replace(/ \(English \([^)]*\)\)$/, '')).filter(Boolean)
);
function voiceFor(it: Item): string {
  const gender = ROSTER[it.speaker].gender;
  const name = VOICES[it.voice][gender].find((v) => installed.has(v) && !NEVER.test(v));
  if (!name) throw new Error(`no ${it.voice} voice installed (wanted one of ${VOICES[it.voice][gender].join(', ')})`);
  return name;
}

const sha = (b: string | Buffer, n: number) => createHash('sha256').update(b).digest('hex').slice(0, n);
const spoken = (it: Item) => it.tts ?? it.en;
const srcOf = (it: Item, voice: string) => sha(JSON.stringify([spoken(it), voice, RATE[it.lv], hasSlow(it) && SLOW, PIPELINE]), 10);
const fileOf = (id: string, slow = false) => join(OUT, `${id}${slow ? '-slow' : ''}.m4a`);

const tmp = mkdtempSync(join(tmpdir(), 'kikimimi-'));
/** Speak and encode one file; its duration (s). */
function render(text: string, voice: string, rate: number, out: string): void {
  const aiff = join(tmp, 'say.aiff');
  execFileSync('say', ['-v', voice, '-r', String(rate), '-o', aiff, text]);
  const trim = 'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.04';
  execFileSync(FFMPEG, [
    '-v', 'error', '-y', '-i', aiff,
    '-af', `${trim},areverse,${trim},areverse,loudnorm=I=-16:TP=-1.5:LRA=11,apad=pad_dur=0.06`,
    '-ac', '1', '-ar', '24000', '-c:a', 'aac', '-b:a', '48k', '-map_metadata', '-1', '-fflags', '+bitexact', '-movflags', '+faststart', out
  ]);
}
const duration = (file: string): number =>
  Math.round(Number(execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' })) * 100) / 100;

const old: Record<string, Clip> = existsSync(CLIPS) ? JSON.parse(readFileSync(CLIPS, 'utf8')) : {};
const clips: Record<string, Clip> = {};
mkdirSync(OUT, { recursive: true });

function listen(): void {
  for (const it of BANK) {
    if (only && !only.test(it.id)) continue;
    console.log(`\n${it.id}  [${it.voice.toUpperCase()} ${voiceFor(it)}, ${ROSTER[it.speaker].nameEn}]\n  ${it.en}\n  ${it.ja}`);
    spawnSync('afplay', [fileOf(it.id)], { stdio: 'inherit' });
    if (hasSlow(it)) spawnSync('afplay', [fileOf(it.id, true)], { stdio: 'inherit' });
  }
}

function printList(c: Record<string, Clip>): void {
  console.log('\nListen-through list (each clip, then its slow one at levels 1-2; `--listen` plays them in order):');
  let lv = 0;
  for (const it of [...BANK].sort((a, b) => a.lv - b.lv || a.id.localeCompare(b.id))) {
    if (it.lv !== lv) console.log(`\n== level ${(lv = it.lv)} ==`);
    const d = c[it.id]?.dur.toFixed(2) ?? '  ?  ';
    console.log(`[ ] ${it.id.padEnd(18)} ${d}s  ${it.voice.toUpperCase()} ${voiceFor(it).padEnd(10)} ${it.en}`);
  }
}

if (flag('--listen')) listen();
else if (flag('--list')) printList(old);
else {
  let made = 0;
  for (const it of BANK) {
    const voice = voiceFor(it), src = srcOf(it, voice), prev = old[it.id];
    const files = [fileOf(it.id), ...(hasSlow(it) ? [fileOf(it.id, true)] : [])];
    if (!flag('--force') && prev?.src === src && files.every((f) => existsSync(f))) {
      clips[it.id] = prev;
      continue;
    }
    render(spoken(it), voice, RATE[it.lv], files[0]);
    if (hasSlow(it)) render(spoken(it), voice, Math.round(RATE[it.lv] * SLOW), files[1]);
    else rmSync(fileOf(it.id, true), { force: true });
    clips[it.id] = {
      dur: duration(files[0]),
      hash: sha(readFileSync(files[0]), 8),
      ...(hasSlow(it) && { slow: sha(readFileSync(files[1]), 8) }),
      src
    };
    made++;
    process.stdout.write(`\r${made} spoken: ${it.id.padEnd(24)}`);
  }
  // clips of items no longer in the bank
  const want = new Set(BANK.flatMap((it) => [`${it.id}.m4a`, ...(hasSlow(it) ? [`${it.id}-slow.m4a`] : [])]));
  const gone = readdirSync(OUT).filter((f) => !want.has(f));
  for (const f of gone) rmSync(join(OUT, f));
  const sorted = Object.fromEntries(Object.keys(clips).sort().map((k) => [k, clips[k]]));
  writeFileSync(CLIPS, JSON.stringify(sorted, null, 1).replace(/\n  +/g, ' ').replace(/\n \}/g, ' }') + '\n');
  const bytes = readdirSync(OUT).reduce((s, f) => s + readFileSync(join(OUT, f)).length, 0);
  console.log(`\n${made} items spoken, ${gone.length} old files removed; ${readdirSync(OUT).length} files, ${(bytes / 1024).toFixed(0)} KB`);
  const used = new Set(BANK.map(voiceFor));
  console.log(`voices: ${[...used].join(', ')}`);
  printList(clips);
}
rmSync(tmp, { recursive: true, force: true });
