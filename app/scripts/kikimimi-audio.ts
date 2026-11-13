// ききみみ クイズ: every bank item spoken (docs/kikimimi-engine.md "Audio"), each clip a loose m4a in the work folder
// (.cache/tts/clips/), then packed into static/audio/listen/ (scripts/kikimimi-packs.ts: only the packs whose clips
// changed get a new hash). Silent: never plays a sound itself except `--listen`, which a person runs.
//   node scripts/kikimimi-audio.ts [options]       make what's new or changed (by each clip's source hash), print a report
//     --engine qwen3            the engine (default qwen3); per accent: `qwen3,au=voxcpm2` or `us=kokoro,uk=kokoro,au=qwen3`
//                               qwen3 / voxcpm2 clone each cast voice's reference clip; kokoro uses cast.json `kokoro`
//                               voices (US and UK only); say is the legacy macOS voice (levels 1-3 only, never 4-7)
//     --levels 1,2,3,4,5,6,7    the levels to speak (default all; say: 1-3)
//     --only <regex>            item ids to speak (the rest keep their clips)
//     --out <dir>               a scratch dir instead of the work folder (no packs): clips.json, clips.src.json and
//                               report.json land there too
//     --force                   re-speak every selected item
//     --dry-run                 print what would be spoken (the clips whose source changed or is missing), speak nothing
//     --seed 1234               the first take's seed (a re-roll of a weak take: --only <id> --force --seed 2000)
//     --retries 5               the gate: re-roll a clip with the next seed while whisper mishears a content word or
//                               its voice drifts (--min-sim 0.5: ECAPA cosine to the reference)
//     --l1-tempo 0.92           level 1's normal clips gently slowed (atempo); 1 = as spoken
//     --no-mos, --no-sv         skip UTMOS or the speaker-similarity check
//     --tone-takes 4            a toned clip's seeds tried (tone.ts): the best by takeScore is kept in
//                               scripts/tts/tone-picks.json (every take's score with it) and spoken from then on
//   node scripts/kikimimi-audio.ts --refs [--design-seeds 7,11,23] [--only <regex over cast ids>]
//                               make the cast's missing reference clips (scripts/tts/refs/<id>.m4a, committed); with
//                               --design-seeds the VoiceDesign voices are re-rolled over those seeds and the best by
//                               UTMOS (heard word for word) is kept, its seed written back to cast.json
//   node scripts/kikimimi-audio.ts --tone-refs [--only <regex over cast ids>]
//                               make the missing tone references (scripts/tts/refs/<id>-soft.m4a, -firm.m4a, committed)
//                               of the voices a toned clip uses: the cast reference cloned saying tone.ts TONE_TEXT,
//                               over 3 seeds, the best by UTMOS heard word for word and near the voice (ECAPA ≥ 0.7),
//                               its seed written to cast.json `tones`
//   node scripts/kikimimi-audio.ts --list           the listen-through list (each clip with its cast voice and text)
//   node scripts/kikimimi-audio.ts --listen [--only <regex>]   play each clip (afplay) with its text: a person's check
//
// The cast (docs/curriculum.md "Audio and script rules"): scripts/tts/cast.json, 18 voices (US 6 a gender; UK and AU 3, only for the やま/ほし
// accent-exposure items), each villager one US voice for good (cast.ts CAST, EXPOSURE; speech.ts castOf). Every voice is a reference clip with its exact transcript, cloned for
// every line: US voices designed by Qwen3-TTS VoiceDesign from a text description (no real person), UK voices spoken by
// Phonon's synthetic catalogue voices, AU voices from the VCTK corpus (CC BY 4.0; credited in docs/kikimimi-engine.md
// "Generation").
// Spoken text: speech.ts spokenText (`tts`, else `en` with its numbers written out).
// Tone (src/lib/kikimimi/tone.ts; a ことば タイル's `tone`): a soft or firm clip is cloned from its voice's tone
// reference (cast.json `tones`, refs/<id>-<tone>.m4a), a toned clip's wh- and either/or questions end in "." for the
// engine (tone.ts engineText: report.json keeps the spoken text), and its seed is the best of --tone-takes by tone.ts
// takeScore (tts.py prosody's endings, pace and range, whisper, ECAPA, UTMOS), pinned in tts/tone-picks.json. An
// untoned clip's source hash is what it was.
// Each clip: the engine (seeded) → a raw WAV cached by source hash and seed under .cache/tts/raw (the masters) → ffmpeg:
// edge silence trimmed, loudness gain to −16 LUFS (true peak ≤ −1.5 dBTP via a limiter), mono AAC ~48 kbps at 24 kHz,
// +faststart. Levels 1-2 get `<id>-slow.m4a`: the take as spoken time-stretched to 0.75 by ffmpeg atempo (the same take,
// not a re-synthesis; level 1's normal clips are slowed to 0.92 the same way).
// Conditions (docs/kikimimi-engine.md "Conditions", src/lib/kikimimi/conditions.ts): a clip with a speech condition (its `cond`,
// or a phone or PA channel's light one: condOf) is mixed after the clean take passed the gate: a phone band and codec, a
// line breaking up (its dropouts), a voicemail's room, a PA hall with its chime, a noise bed (scripts/tts/beds/,
// scripts/kikimimi-beds.ts) at its SNR. The
// condition (its plan and its bed's file hash) is part of the clip's source hash; the raw take stays cached by the clean
// master's hash, so re-mixing never re-speaks. The strict gate runs on the clean take; the conditioned clip is only
// checked loosely (whisper's WER ≤ the condition's bound, else flagged `cond-wer`), and UTMOS is the clean take's. The
// clean take is kept under .cache/tts/clean/ (with the speech's offset in the mixed clip) for the karaoke's alignment.
// The listening kinds (ことば タイル, ようじ でんわ, たちぎき; content/listen/*.yaml, listen.ts): a tile's clip is its id, a
// call's or たちぎき's lines `<item>-<n>` (a call's `me` in the file's cast.me), at their stage's level (S1 かわ → 3), a
// call's lines in its phone band; a draft file only under --only. A derived tile plays its bank item's clip.
// 音の へんしん's phrases (level 8, content/henshin.ts): the natural clip (`tts`), a careful take `<id>-c` (speech.ts
// carefulText: the focus in full, its words apart; slowed to 0.8) through the same gate, and `<id>-f`, the natural take that passed
// sped up by FAST (atempo, as スピード はしご's rungs; whisper hears it, a mishearing flagged, never re-rolled).
// はつおん's pairs (content/mic/pairs.yaml): each word alone (`<pair>-1`, `<pair>-2`) at level 3, in its pair's own pack.
// The bedtime serials (おやすみ ものがたり, content/listen/story/, story.ts): each segment a clip (`<chapter>-<n>`), the
// narrator's voice or the villager's CAST voice, as spoken (no tempo change: the engine has no pace setting), no
// condition, a little softer than the quiz (−18 LUFS: heard in bed, one after another); --levels doesn't select them.
// QA: whisper-cli large-v3-turbo hears each clip; a content word wrong (articles and fillers aside; numbers and reductions
// normalised) re-rolls it with the next seed, up to --retries times, then it's flagged. UTMOS (SpeechMOS utmos22) and
// ECAPA cosine to the voice's reference (drift < 0.3 flagged) are measured. The full report (every clip's numbers:
// .cache/tts/report.json, beside the clips; in the assets-* release's tts-work, assets-release.sh) and, committed, its
// summary and each clip's source, text and condition (scripts/tts/report.json: what the tests read); a summary prints.
// No full report here (a fresh checkout): restore it from the newest assets-* release first (docs/kikimimi-engine.md).
// Before a run the work folder gets every clip from the packs (kikimimi-packs.ts unpackClips: what's missing or stale),
// so a clip whose source didn't change is never spoken again; after it, the packs are written (kikimimi-packs.ts
// writePacks) and the levels compiled with their offsets (kikimimi-levels.ts).
// src/lib/kikimimi/clips.json gets {id: {dur, hash, slow?}} (compiled into the levels' chunks: kikimimi-levels.ts, run at
// the end) and scripts/kikimimi-clips.src.json
// {id: src}: `src` hashes the engine, its model, the cast voice and its reference, the text and this pipeline's version.
//
// Python: scripts/tts/tts.py runs in venvs made with uv under .cache/tts/ from scripts/tts/requirements-*.txt, or the
// pythons in KIKIMIMI_TTS_PY (mlx-audio), KIKIMIMI_PHONON_PY (ptts), KIKIMIMI_KOKORO_PY, KIKIMIMI_QA_PY (jiwer,
// whisper-normalizer, torch for UTMOS), KIKIMIMI_SV_PY (speechbrain); KIKIMIMI_TTS_EVAL=/tmp/tts-eval takes the TTS
// evaluation's venvs. whisper-cli and its model (~/.cache/whisper/ggml-large-v3-turbo.bin, or WHISPER_MODEL) are needed;
// the one-time setup is in docs/kikimimi-engine.md "Audio" (a preflight names what's missing).
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { clipItems, type Accent, type CastId, type Item } from '../src/lib/kikimimi/bank.ts';
import { AUTHORED as ITEMS } from '../src/lib/kikimimi/source.ts';
import { ROSTER } from '../src/lib/villagers/roster.ts';
import type { Clip } from '../src/lib/kikimimi/clips.ts';
import { CAST_IDS, carefulText, castOf, spokenText } from '../src/lib/kikimimi/speech.ts';
import { codecArgs, condOf, condPlan, condSource, dropGaps, dropOut, stepFilter, type CondPlan, type Step } from '../src/lib/kikimimi/conditions.ts';
import type { Bed } from '../src/lib/kikimimi/bank.ts';
import { SR, chime, convolve, filter, gain, impulse, lufs, noise, readPcm, writeWav } from './tts/dsp.ts';
import { FFMPEG, FFPROBE, WHISPER_MODEL, measureLoudness, slimReport, staged, writeAtomic } from './tts/tools.ts';
import { fnv1a, mulberry32 } from '../src/lib/random.ts';
import { NATURAL_RATE, SPEEDS } from '../src/lib/kikimimi/ladder.ts';
import { LADDERS as ALL_LADDERS } from '../src/lib/kikimimi/ladders.ts';
import { writeLevels } from './kikimimi-levels.ts';
import { WORK, unpackClips, writePacks } from './kikimimi-packs.ts';
import { readListen, readPairs, readStories, unitItems } from '../src/lib/kikimimi/compile.ts';
import { pairClipItems } from '../src/lib/kikimimi/games/pair/pairs.ts';
import { LONG_KBPS, listenClipItems, realClipIds } from '../src/lib/kikimimi/listen.ts';
import { storyItems } from '../src/lib/kikimimi/story.ts';
import { TONE_REFS, TONE_TEXT, engineText, sentences, takeScore, type Prosody, type Tone } from '../src/lib/kikimimi/tone.ts';

const APP = join(import.meta.dirname, '..');
const TTS = join(import.meta.dirname, 'tts');
const CAST_FILE = join(TTS, 'cast.json');
const REFS = join(TTS, 'refs');
const BEDS = join(TTS, 'beds');
const CACHE = resolve(process.env.KIKIMIMI_TTS_CACHE ?? join(APP, '.cache/tts'));
const VCTK = process.env.KIKIMIMI_VCTK_REFS ?? join(CACHE, 'vctk');
const EVAL = process.env.KIKIMIMI_TTS_EVAL;

/** Bump to re-speak everything after a change to the processing below (neural engines; `say` keeps v1's hashes). */
const PIPELINE = 2;
/** 音の へんしん's fast take: the natural one at this tempo (atempo 1.25 kept UTMOS at 4.12 on the ladders' takes). */
const FAST = 1.25;
/** Bump to re-make every fast take after a change to how it's made. */
const FAST_V = 1;
/** A つながる 音 phrase's careful take as an item of its own (`<id>-c`: its careful text, no `hs`); none for any other. */
function carefulItems(it: Item): Item[] {
  if (!it.hs) return [];
  const { hs: _, ...rest } = it;
  return [{ ...rest, id: `${it.id}-c`, tts: carefulText(it) }];
}
/** 音の へんしん's careful takes, slowed to this (atempo, as level 1's): はっきり, each word heard as written. */
const CAREFUL_TEMPO = 0.8;
const CAREFUL_IDS: ReadonlySet<string> = new Set(ITEMS.filter((it) => it.hs).map((it) => `${it.id}-c`));
/** A clip's tempo: a listening file's by its place (LISTEN_TEMPO), level 1's gently slowed, a careful take slowed, else
 *  as spoken. */
const tempoOf = (it: Item): number => LISTEN_TEMPO.get(it.id) ?? (it.lv === 1 ? L1_TEMPO : CAREFUL_IDS.has(it.id) ? CAREFUL_TEMPO : 1);
/** A fast take's source hash: its natural take's master, the tempo and its version. */
const fastSrc = (master: string) => sha(JSON.stringify([master, FAST, STRETCH, FAST_V]), 10);
const SLOW = 0.75;
/** Levels 1-2's slow copies; never a listening kind's (はまべ's calls and tiles are slowed by LISTEN_TEMPO instead). */
const hasSlow = (it: Item): boolean => it.lv <= 2 && !LISTEN_IDS.has(it.id);

type Engine = 'qwen3' | 'voxcpm2' | 'kokoro' | 'say';
const MODEL: Readonly<Record<Engine | 'design' | 'phonon', string>> = {
  qwen3: 'mlx-community/Qwen3-TTS-12Hz-1.7B-Base-bf16',
  voxcpm2: 'mlx-community/VoxCPM2-bf16',
  kokoro: 'mlx-community/Kokoro-82M-bf16',
  say: 'macOS say',
  design: 'mlx-community/Qwen3-TTS-12Hz-1.7B-VoiceDesign-bf16',
  phonon: 'gradium/phonon-31m-en'
};
const CLONES = (e: Engine) => e === 'qwen3' || e === 'voxcpm2';

interface CastEntry {
  accent: Accent;
  gender: 'f' | 'm';
  /** design: Qwen3 VoiceDesign from `description`; phonon: a Phonon catalogue voice speaks ref.text; vctk: a corpus clip. */
  source: 'design' | 'phonon' | 'vctk';
  description: string;
  /** The reference's seed (design, phonon). */
  seed: number;
  /** Kokoro's voice for this slot (US and UK). */
  kokoro?: string;
  ref: { text: string; voice?: string; file?: string; origin: string; licence: string; attribution?: string; mos?: number };
  /** Its tone references (refs/<id>-<tone>.m4a): the cast reference cloned saying TONE_TEXT[tone] with this seed. */
  tones?: Partial<Record<ToneRef, { text: string; seed: number; mos?: number; sim?: number }>>;
}
type ToneRef = (typeof TONE_REFS)[number];
/** The reference a tone clones (neutral, or none: the cast reference's own). */
const toneRefOf = (tone: Tone | undefined): ToneRef | null => (tone && (TONE_REFS as readonly string[]).includes(tone) ? (tone as ToneRef) : null);
const CASTS: Record<CastId, CastEntry> = JSON.parse(readFileSync(CAST_FILE, 'utf8'));

// ---- arguments -------------------------------------------------------------------------------------------------------

const args = process.argv.slice(2);
const flag = (f: string) => args.includes(f);
const opt = (f: string): string | undefined => (args.includes(f) ? args[args.indexOf(f) + 1] : undefined);
/** The clip seeds: the first try's (--seed), then +1 per re-roll. */
const SEED = Number(opt('--seed') ?? 1234);
/** A person's re-roll kept across runs: the first take's seed of a clip whose default takes were weak (a `--seed` given
 *  on the command line wins). */
const PINNED: Readonly<Record<string, number>> = {
  // (the tiles re-voiced with a tone, 2026-11-12, lost their old pins: their words changed, tone-picks.json keeps theirs)
  'd4-landlord-3': 2000, 'd4-taxi-street-4': 2000,
  // wave 1's units (their listening check: docs/curriculum.md "Listening check"): the corrected detail heard over the heavy street
  // (dk-fast-replan's "seven", "did you say the pub"), Ikebukuro heard as said, and short exclamations off-voice
  'dk-fast-replan-4': 2000, 'dk-fast-replan-5': 3005, 'dmu-wrong-train-1': 5000, 'dk-wrong-time-4': 2003,
  'dk-loud-toast-4': 2003, 'dk-toast-2': 3009, 'dmu-bins-5': 3003,
  // the re-voicing (2026-11-06): Ikebukuro heard as said again, "Thursday? We'll be…" no longer "Thursday will be…",
  // and short lines nearer their voice than all six default takes
  'dvm-ac-out-3': 4000, 'dho-lab-notes-3': 4000, 'dmu-wrong-dates-6': 4000, 'dya-best-man-3': 4000,
  'd4-video-call-3': 4000,
  // the bedtime stories: "Bean There" heard as said, Walt's "you don't eat" no longer "need", and Mabel's line nearer
  // its voice
  'serial-cafe-3-16': 2000, 'serial-johnny-5-12': 2000, 'serial-cafe-3-20': 2000,
  // the content review's re-voicing (2026-11-07): takes nearer their voice (w1-fly's UTMOS 3.71 → 4.16 too)
  'w1-fly': 2004, 'dmw-standup-4': 4000, 'dmw-gossip-4': 5000,
  // wave 2's batch A1 (2026-11-07), each the best of five seed runs: a take heard as written (ya, ta, whaddaya), and
  // takes nearer their voice or cleaner (UTMOS) than the default's
  'tachi-hanami-spot-2': 4000, 'tachi-im-easy-6': 4000, 'tachi-film-verdict-1': 4000,
  'tachi-film-verdict-7': 5000, 'call-next-friday-1': 4000, 'call-next-friday-4': 3000, 'tachi-noisy-neighbour-5': 5000,
  'tachi-standup-blocked-5': 3000, 'call-handouts-favour-5': 2000,
  // wave 2's batch A2 (2026-11-07), each the best of five seed runs: takes heard as written (soup er salad, fer here er
  // ta go, oudda, ten ta two, jus' so ya know, large in black, yer prescription's, Rah-men), and takes nearer their voice
  // or cleaner (UTMOS) than the default's (short lines: Hmm how early 2.74 → 3.49, keep an eye on 'im 2.86 → 3.81)
  'kw-soup-or': 4001, 'kr-fast-combo': 3002, 'dk-fast-sweater-1': 5001, 'kr-heads-up': 3000, 'call-neighbor-cat-6': 3000,
  'dk-jacket-size-3': 4004, 'kw-prescription': 3000, 'kw-im-down': 1238, 'dk-hike-dinner-2': 2002, 'kw-keep-an-eye': 2000,
  'dk-for-here-1': 2000, 'kw-meetcha': 2000, 'dk-cookies-2': 3000, 'dk-rain-sunday-3': 3000, 'dk-dentist-day-4': 5002,
  'kw-great-on': 3004,
  // s1-tile-c's tiles of those same lines in the same voices, the same takes
  'tile-shop-great-on-you': 3004,
  
  // batch A3 (2026-11-07), the best of five seed runs: "colds" heard as said, a slip-and-fix order 14.4 → 12.9 s (under
  // a listening clip's 14), an "um" line's UTMOS 3.44 → 4.01
  'news-plaza-lights-5': 2001, 'rush-lunch-4': 3000, 'rush-bagels-1': 5000,
  // batch A5, st-tokyo (2026-11-07), the best of five seed runs: Sherb's sleepy night-shift line (UTMOS 3.92 → 4.37) and Rosie's
  // cry at the goldfish scoop (3.41 → 4.35)
  'serial-tokyo-2-9': 2003, 'serial-tokyo-4-26': 5000,
  // batch A4 (2026-11-07), the best of five seed runs: takes heard as written (whaddaya, sharea, Tex's, standin', keepin',
  // leavin', row B, sign back in), a phone line's mix under its bound, and short lines' UTMOS or voice (Ha. Mostly. 2.53
  // → 3.92; Oh, nice! sim 0.49 → 0.55); the tiles of the same lines in the same voices, the same takes
  'call-screen-ready-3': 4005, 'cu-fast-july-4': 2000, 'cu-r-landlord': 2005, 'dr-trip-next-3': 2000, 'fn-fast-no-sushi-1': 4004,
  'fn-w-feel-like': 4003, 'fn-w-share': 2000, 
  'rp-fast-truck-1': 5002, 'rp-fast-truck-4': 4000, 'sm-fast-ready-3': 2002,
  'tachi-deposit-letter-1': 4001, 'tachi-flight-canceled-2': 5000, 
  'tile-fl-well-actually': 4000, 'tile-tix-standing-room': 2001, 'tk-w-standing': 2001, 'tk-fast-balcony-4': 3000,
  'tk-game-row-b-4': 5000, 'wg-couch-joke-3': 5003, 'wg-toast-3': 2000,
  // はつおん's words (M6, 2026-11-07), each the best of ten seed runs by UTMOS among the takes heard as written (a word
  // alone is too short for ECAPA: these are kept with --retries 0, never re-rolled for their similarity)
  'pr-13-2': 2000, 'pr-14-1': 3000, 'pr-14-2': 1238, 'pr-15-1': 2000, 'pr-15-2': 1237, 'pr-16-2': 1237, 'pr-17-1': 1235,
  'pr-17-2': 1237, 'pr-18-1': 4000, 'pr-18-2': 2000, 'pr-19-1': 1238, 'pr-19-2': 2000, 'pr-bag-1': 4000, 'pr-bed-1': 1236,
  'pr-bed-2': 1238, 'pr-breathe-1': 2000, 'pr-breathe-2': 1239, 'pr-cab-1': 3000, 'pr-cab-2': 5000, 'pr-card-1': 1238,
  'pr-card-2': 1237, 'pr-coat-1': 1238, 'pr-collect-1': 1238, 'pr-collect-2': 1239, 'pr-fry-1': 3000, 'pr-fry-2': 1239,
  'pr-full-1': 1239, 'pr-full-2': 1239, 'pr-grass-1': 3000, 'pr-grass-2': 4000, 'pr-hat-1': 1235, 'pr-hat-2': 3000,
  'pr-heart-1': 3000, 'pr-live-1': 1236, 'pr-live-2': 1238, 'pr-mouth-2': 2000, 'pr-play-1': 3000, 'pr-play-2': 1238,
  'pr-prize-1': 3000, 'pr-prize-2': 5000, 'pr-rice-2': 5000, 'pr-right-1': 4000, 'pr-right-2': 1236, 'pr-rock-1': 1237,
  'pr-rock-2': 1235, 'pr-seat-1': 1239, 'pr-seat-2': 1236, 'pr-ship-1': 1236, 'pr-ship-2': 1239, 'pr-thick-1': 1235,
  'pr-thick-2': 1238, 'pr-think-1': 1238, 'pr-think-2': 1239, 'pr-van-1': 3000, 'pr-very-1': 1239, 'pr-very-2': 4000,
  'pr-vest-1': 5000, 'pr-vest-2': 3000, 'pr-vote-1': 1238, 'pr-vote-2': 4000, 'pr-walk-1': 1235, 'pr-walk-2': 2000,
  'pr-wing-2': 1237,
  // 音の へんしん (2026-11-09): careful takes heard in full (unprompted whisper), natural ones heard as said
  'hs-gotta-bus-here-c': 2000, 'hs-lemme-give-hand': 2000, 'hs-lemme-let-think': 2000, 'hs-lemme-give-ride': 2000, 'hs-kinda-what-music': 4000,
  'hs-kinda-out-time': 5000, 'hs-dunno-if-open': 2000, 'hs-dunno-what-mean': 2000, 'hs-chain-know-mean': 9000
};
/** A toned clip's kept take (--tone-takes): its seed, the takes' scores, and `key`, the voice and engine text it was
 *  picked for (a changed line or reference is picked again). */
const PICKS_FILE = join(TTS, 'tone-picks.json');
const PICKS: Record<string, { key: string; seed: number; scores: Record<string, number> }> = existsSync(PICKS_FILE) ? JSON.parse(readFileSync(PICKS_FILE, 'utf8')) : {};
const TONE_TAKES = Number(opt('--tone-takes') ?? 4);
/** What a tone pick is for: the voice (its reference's hash) and the engine text. */
const pickKey = (voice: unknown, say: string) => sha(JSON.stringify([voice, say]), 10);
const seedOf = (id: string, key?: string): number =>
  opt('--seed') ? SEED : PINNED[id] ?? (key && PICKS[id]?.key === key ? PICKS[id].seed : SEED);
const only = opt('--only') ? new RegExp(opt('--only')!) : null;
const RETRIES = Number(opt('--retries') ?? 5);
/** Level 1's normal clips a touch slower (Qwen speaks L1 lines at ~205 wpm; 0.92 → ~190, `say` v1 was 160): within
 *  §9's ±10%, and atempo leaves UTMOS where it was. 1 = none. */
const L1_TEMPO = Number(opt('--l1-tempo') ?? 0.92);
/** The voice gate: a take whose ECAPA cosine to its reference is under this is re-rolled (under 0.3: flagged drift). */
const MIN_SIM = Number(opt('--min-sim') ?? 0.5);

/** "qwen3" or "kokoro,au=qwen3" or "us=kokoro,uk=kokoro,au=qwen3" → an engine per accent. */
function engines(spec: string): Record<Accent, Engine> {
  const ok = (e: string): Engine => {
    if (!(e in MODEL) || e === 'design' || e === 'phonon') throw new Error(`unknown engine ${e}`);
    return e as Engine;
  };
  let def: Engine | undefined;
  const per: Partial<Record<Accent, Engine>> = {};
  for (const part of spec.split(',')) {
    const [a, e] = part.includes('=') ? part.split('=') : [undefined, part];
    if (a) per[a as Accent] = ok(e);
    else def = ok(e);
  }
  const out = { us: per.us ?? def, uk: per.uk ?? def, au: per.au ?? def };
  for (const [a, e] of Object.entries(out)) if (!e) throw new Error(`--engine: no engine for ${a}`);
  return out as Record<Accent, Engine>;
}
const ENGINE = engines(opt('--engine') ?? 'qwen3');
const SAY = ENGINE.us === 'say';
if (SAY && (ENGINE.uk !== 'say' || ENGINE.au !== 'say')) throw new Error('--engine say is all or nothing');
const LEVELS = (opt('--levels') ?? (SAY ? '1,2,3' : '1,2,3,4,5,6,7,8')).split(',').map(Number);
if (SAY && LEVELS.some((lv) => lv > 3)) throw new Error('levels 4-7 are never spoken by say (docs/curriculum.md "Audio and script rules")');

const SCRATCH = opt('--out') ? resolve(opt('--out')!) : null;
const OUT = SCRATCH ?? WORK;
const CLIPS = SCRATCH ? join(SCRATCH, 'clips.json') : join(APP, 'src/lib/kikimimi/clips.json');
const SRCS = SCRATCH ? join(SCRATCH, 'clips.src.json') : join(import.meta.dirname, 'kikimimi-clips.src.json');
/** The full report (each clip's numbers, kept for the next run's unchanged clips) and the committed slim one (no
 *  scratch run writes it). */
const REPORT = SCRATCH ? join(SCRATCH, 'report.json') : join(dirname(WORK), 'report.json');
const SLIM = SCRATCH ? null : join(TTS, 'report.json');
/** The bedtime serials' segments, a clip each (story.ts storyItems): spoken whatever --levels says (never by say). */
const STORY_ITEMS = storyItems(readStories());
const STORY: ReadonlySet<string> = new Set(STORY_ITEMS.map((it) => it.id));
/** The stories' loudness: a little softer than the quiz's −16. しずえの ニュース's lines and weather sentences are read
 *  at it too (a bulletin heard whole, like a chapter: kikimimi-engine.md "しずえの ニュース"). */
const STORY_LUFS = -18;
const listenOf = (game: string): string[] => readListen().filter(({ raw }) => (raw as { game: string }).game === game).flatMap(({ raw }) => listenClipItems(raw)).map((it) => it.id);
/** まるごと 聞く's generated lines (content/listen/s4-long-*.yaml): heard whole as a story is, at its loudness, and kept
 *  at 32 kbps (minutes of speech a piece: bank.test's line for them), as a real piece's are (scripts/kikimimi-real.ts). */
const LONG: ReadonlySet<string> = new Set(listenOf('long'));
const SOFT: ReadonlySet<string> = new Set([...STORY, ...listenOf('news'), ...LONG]);
const lufsOf = (it: Item): number => (SOFT.has(it.id) ? STORY_LUFS : -16);
/** A clip's AAC bitrate (kbps): a long piece's 32, else 48. */
const kbpsOf = (it: Item): number => (LONG.has(it.id) ? LONG_KBPS : 48);
/** The listening kinds' clips (content/listen/*.yaml, listen.ts listenClipItems: a tile's own, each line of a call or a
 *  たちぎき, `<item>-<n>`, at its stage's level): a draft file's only when --only names them (it's voiced after its
 *  review, curriculum.md "Authoring pipeline"). */
const LISTEN_ITEMS = readListen().filter(({ raw }) => only || (raw as { status: string }).status !== 'draft').flatMap(({ raw }) => listenClipItems(raw));
/** ほし's short listening games a touch faster (atempo, then gated as any take: the ladder's 1.2-1.4× rungs show whisper
 *  still hears it). */
const PACE = 1.1;
const PACED: ReadonlySet<string> = new Set(['tile', 'call', 'rush', 'tachi']);
/** The listening files' clips not as spoken, by place (docs/kikimimi.md "Places"): はまべ's slowed as level 1's, ほし's
 *  tile, call, rush and たちぎき at PACE; news and long as spoken above はまべ. */
const LISTEN_TEMPO: ReadonlyMap<string, number> = new Map(readListen().flatMap(({ raw }) => {
  const { stage, game } = raw as { stage: number; game: string }, t = stage === 1 ? L1_TEMPO : stage === 5 && PACED.has(game) ? PACE : 1;
  return t === 1 ? [] : listenClipItems(raw).map((it) => [it.id, t] as const);
}));
/** Every listening file's own clips, a draft's too (no slow copy: hasSlow). */
const LISTEN_IDS: ReadonlySet<string> = new Set(readListen().flatMap(({ raw }) => listenClipItems(raw).map((it) => it.id)));
/** まるごと 聞く's real pieces' lines (scripts/kikimimi-real.ts cuts them): kept, never spoken. */
const REAL_IDS = readListen().flatMap(({ raw }) => realClipIds(raw));
/** はつおん's words (content/mic/pairs.yaml, games/pair/pairs.ts): each alone, `<pair>-1`, `<pair>-2`, in the pair's
 *  villager's voice; a draft file's only under --only, as the listening kinds'. */
const PAIRS = readPairs() as { status?: string } | null;
const PAIR_ITEMS = PAIRS && (only || PAIRS.status !== 'draft') ? pairClipItems(PAIRS) : [];
/** One entry per clip: an item, or each line of a dialogue as its own (bank.ts clipItems: `<item>-<n>`); the bank's
 *  items, then the units' own (app/content/units/*.yaml, inline: same cast, `tts`, conditions and beds; their ids are
 *  never the bank's: units.ts checkUnits), the listening kinds', then the stories' segments. */
const ALL: readonly Item[] = [...[...ITEMS, ...unitItems()].flatMap((it) => [...clipItems(it), ...carefulItems(it)]), ...LISTEN_ITEMS, ...PAIR_ITEMS, ...STORY_ITEMS];
/** 音の へんしん's fast takes (`<id>-f`): made from their phrase's natural take, never spoken themselves. */
const FAST_IDS: ReadonlySet<string> = new Set(ITEMS.filter((it) => it.hs).map((it) => `${it.id}-f`));
const BANK = ALL.filter((it) => (STORY.has(it.id) ? !SAY : LEVELS.includes(it.lv)));
/** スピード はしご (ladder.ts): each ladder's line spoken once (the gate as any clip's), its rungs that take stretched. */
const LADDERS = ALL_LADDERS.filter((l) => LEVELS.includes(l.line.lv));
/** Every rung clip id (`<ladder>-<n>`), made or not. */
const RUNG_IDS = ALL_LADDERS.flatMap((l) => l.rungs.map((r) => r.id));

// ---- small helpers ---------------------------------------------------------------------------------------------------

const sha = (b: string | Buffer, n: number) => createHash('sha256').update(b).digest('hex').slice(0, n);
const dirOf = (...p: string[]) => {
  const d = join(...p);
  mkdirSync(d, { recursive: true });
  return d;
};
const duration = (file: string): number =>
  Math.round(Number(execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' })) * 100) / 100;
const ff = (...a: string[]) => execFileSync(FFMPEG, ['-v', 'error', '-y', ...a]);
const mean = (xs: number[]) => (xs.length ? Math.round((xs.reduce((s, x) => s + x, 0) / xs.length) * 1000) / 1000 : null);
const min = (xs: number[]) => (xs.length ? Math.min(...xs) : null);

// ---- python ----------------------------------------------------------------------------------------------------------

type Py = 'gen' | 'phonon' | 'kokoro' | 'qa' | 'sv';
const PY_ENV: Record<Py, [string, string]> = {
  gen: ['KIKIMIMI_TTS_PY', 'fish/venv/bin/python'],
  phonon: ['KIKIMIMI_PHONON_PY', 'phonon/.venv/bin/python'],
  kokoro: ['KIKIMIMI_KOKORO_PY', 'kokoro/bin/python'],
  qa: ['KIKIMIMI_QA_PY', 'scorer/bin/python'],
  sv: ['KIKIMIMI_SV_PY', 'fish/svenv/bin/python']
};
const REQ: Record<Py, string> = { gen: 'gen', phonon: 'gen', kokoro: 'kokoro', qa: 'qa', sv: 'qa' };
const venvDir = (which: Py) => join(CACHE, `venv-${REQ[which]}`);
/** A python that needs a venv made here (uv's job): no env var, no TTS evaluation, no venv yet. */
const needsVenv = (which: Py) => !process.env[PY_ENV[which][0]] && !EVAL && !existsSync(join(venvDir(which), 'bin/python'));
/** The venv each python job runs in: an env var, the TTS evaluation's, or one made here with uv. */
function python(which: Py): string {
  const [env, evalPath] = PY_ENV[which];
  if (process.env[env]) return process.env[env]!;
  if (EVAL) return join(EVAL, evalPath);
  const req = REQ[which], dir = venvDir(which), bin = join(dir, 'bin/python');
  if (!existsSync(bin)) {
    console.log(`making ${dir} (uv)…`);
    execFileSync('uv', ['venv', '-q', '-p', '3.12', dir], { stdio: 'inherit' });
    execFileSync('uv', ['pip', 'install', '-q', '--python', bin, '-r', join(TTS, `requirements-${req}.txt`)], { stdio: 'inherit' });
  }
  return bin;
}
let jobN = 0;
/** Run a tts.py subcommand on a job list; its JSON result. */
function py<T>(which: Py, cmd: string, jobs: unknown[], extra: string[] = []): Record<string, T> {
  if (!jobs.length) return {};
  const dir = dirOf(CACHE, 'jobs'), n = `${process.pid}-${jobN++}`;
  const jf = join(dir, `${cmd}-${n}.json`), rf = join(dir, `${cmd}-${n}.out.json`);
  writeAtomic(jf, JSON.stringify(jobs));
  const r = spawnSync(python(which), [join(TTS, 'tts.py'), cmd, ...extra, '--jobs', jf, '--result', rf], {
    stdio: 'inherit', env: { KIKIMIMI_ECAPA: join(CACHE, 'ecapa'), ...process.env, FFMPEG, WHISPER_MODEL }
  });
  if (r.status !== 0) throw new Error(`tts.py ${cmd} failed (${r.status})`);
  const out = JSON.parse(readFileSync(rf, 'utf8'));
  rmSync(jf); rmSync(rf);
  return out;
}

// ---- audio processing ------------------------------------------------------------------------------------------------

const TRIM = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05';
/** Raw engine output → mono 24 kHz float WAV, edge silence trimmed. */
function trim(raw: string, out: string): void {
  ff('-i', raw, '-af', `highpass=f=50,${TRIM},areverse,${TRIM},areverse`, '-ac', '1', '-ar', String(SR), '-c:a', 'pcm_f32le', out);
}
/** A trimmed WAV → the shipped m4a: a gain to −16 LUFS (a story's −18: lufsOf; a limiter holds the true peak under
 *  −1.5 dBTP), a 60 ms tail. */
function finish(wav: string, out: string, target = -16, kbps = 48): void {
  const { i, tp } = measureLoudness(wav);
  const gain = Number.isFinite(i) ? target - i : 0;
  const limit = tp + gain > -1.5 ? `,alimiter=limit=${(10 ** (-1.6 / 20)).toFixed(3)}:attack=2:release=40:level=0` : '';
  ff('-i', wav, '-af', `volume=${gain.toFixed(2)}dB${limit},apad=pad_dur=0.06`,
    '-ac', '1', '-ar', String(SR), '-c:a', 'aac', '-b:a', `${kbps}k`, '-map_metadata', '-1', '-fflags', '+bitexact', '-movflags', '+faststart', out);
}
/** ffmpeg atempo (WSOLA): in the pilot it kept UTMOS (0.92: 4.36 vs 4.37 unstretched; 0.75: 4.31), where rubberband
 *  cost 0.7 (R3) to 1.9 (R2). */
const STRETCH = 'atempo';
/** A trimmed WAV at another tempo (0.75: three quarters the speed), the pitch kept. */
function stretch(wav: string, tempo: number, out: string): void {
  ff('-i', wav, '-af', `atempo=${tempo}`, '-c:a', 'pcm_f32le', out);
}

// ---- speech conditions (conditions.ts: what each does; here, how) -----------------------------------------------------

const bedPcm = new Map<Bed, Float32Array>();
/** A stretch of a bed `n` samples long from an offset picked by the clip's id (the bed loops), faded in and out over
 *  `fade` s. */
function bedSegment(b: Bed, n: number, id: string, fade: number): Float32Array {
  if (!bedPcm.has(b)) bedPcm.set(b, readPcm(bedFile(b)));
  const bed = bedPcm.get(b)!, at = fnv1a(id) % bed.length, out = new Float32Array(n), f = Math.round(fade * SR);
  for (let i = 0; i < n; i++) out[i] = bed[(at + i) % bed.length] * Math.min(1, i / f, (n - 1 - i) / f);
  return out;
}
/** Speech over its bed: the bed from `pre` before it to `post` after (faded 0.25 s; under the speech only, 0.04 s), at
 *  `snr` dB under the speech's loudness `ref`. */
function withBed(x: Float32Array, plan: CondPlan, id: string, ref: number): Float32Array {
  const pre = Math.round(plan.pre * SR), post = Math.round(plan.post * SR);
  const seg = bedSegment(plan.bed!.id, pre + x.length + post, id, plan.pre ? 0.25 : 0.04);
  const out = gain(seg, ref - plan.bed!.snr - lufs(seg));
  for (let i = 0; i < x.length; i++) out[pre + i] += x[i];
  return out;
}
/** A channel's steps over the speech: band and compressor steps as one ffmpeg chain, a room by convolution, dropouts
 *  (conditions.ts dropGaps, dropOut), a codec round trip at 8 kHz, line hiss at its SNR. */
function channel(x: Float32Array, steps: readonly Step[], id: string): Float32Array {
  let y = x;
  for (let i = 0; i < steps.length; ) {
    const s = steps[i];
    if (s.op === 'band' || s.op === 'comp') {
      const run: Step[] = [];
      while (i < steps.length && (steps[i].op === 'band' || steps[i].op === 'comp')) run.push(steps[i++]);
      y = filter(y, run.map(stepFilter).join(','));
      continue;
    }
    if (s.op === 'room') y = convolve(y, impulse(s, Math.round(s.rt60 * 100)));
    else if (s.op === 'codec') y = filter(y, '', codecArgs(s));
    else if (s.op === 'drop') y = dropOut(y, dropGaps(y.length, SR, s, id), SR);
    else if (s.op === 'hiss') {
      const h = noise(y.length, mulberry32(fnv1a(`${id}:hiss`)), 6000, 200);
      const g = 10 ** ((lufs(y) - s.snr - lufs(h)) / 20);
      y = y.map((v, k) => v + h[k] * g);
    }
    i++;
  }
  return y;
}
/** The clean take (a trimmed WAV) under its condition into `out` (a WAV); the speech's offset in it (s): the chime and
 *  the bed's lead-in. */
function condition(wav: string, plan: CondPlan, id: string, out: string): number {
  let x: Float32Array = readPcm(wav);
  const ref = lufs(x);
  let lead = 0, head = 0;
  if (plan.chime) {
    const c = chime(), cg = gain(c, ref - 3 - lufs(c)), gap = Math.round(0.35 * SR);
    const y = new Float32Array(cg.length + gap + x.length);
    y.set(cg);
    y.set(x, cg.length + gap);
    x = y;
    head = cg.length + gap;
    lead += head / SR;
  }
  if (plan.bed?.at === 'source') {
    x = withBed(x, plan, id, ref);
    lead += plan.pre;
  }
  x = channel(x, plan.steps, id);
  if (plan.bed?.at === 'listener') {
    x = withBed(x, plan, id, lufs(x.subarray(head)));
    lead += plan.pre;
  }
  writeWav(out, x);
  return Math.round(lead * 1000) / 1000;
}
// ---- スピード はしご: a line's take at each rung's speed -------------------------------------------------------------

/** Bump to re-make every rung clip after a change below (a line's take is re-spoken only when its own source changes). */
const LADDER_V = 1;
/** A rung's tempo is kept within this (atempo measured on 24 level-4 takes, UTMOS: 0.8× 4.29, 1.0× 4.30, 1.15× 4.18,
 *  1.25× 4.12, 1.4× 3.93, 1.55× 3.73; whisper still heard them word for word): past it a line's rung is off its speed
 *  (the report's `clamped`). */
const TEMPO_MIN = 0.7, TEMPO_MAX = 1.6;
/** Syllables in spoken English, roughly (vowel groups, a silent final e aside): the pace's measure. */
function syllables(text: string): number {
  return (text.toLowerCase().match(/[a-z']+/g) ?? []).reduce((s, w) => {
    const v = w.replace(/'/g, '').replace(/(?:[^laeiouy]es|[^laeiouy]ed|[^laeiouy]e)$/, (m) => m[0]).replace(/^y/, '');
    return s + Math.max(1, v.match(/[aeiouy]+/g)?.length ?? 0);
  }, 0);
}
/** A ladder line's source hash for rung n (its take's source, the rung's speed, the rate it's stretched to). */
const rungSrc = (lineSrc: string, n: number) => sha(JSON.stringify([lineSrc, n, SPEEDS[n - 1], NATURAL_RATE, TEMPO_MIN, TEMPO_MAX, LADDER_V]), 10);

// ---- the cast's reference clips --------------------------------------------------------------------------------------

const refM4a = (id: CastId, tone: ToneRef | null = null) => join(REFS, `${id}${tone ? `-${tone}` : ''}.m4a`);
/** The reference as the engines take it (24 kHz mono WAV, cached; made from the committed m4a when missing): the
 *  voice's, or its tone reference. */
function refWav(id: CastId, tone: ToneRef | null = null): string {
  const wav = join(dirOf(CACHE, 'refs'), `${id}${tone ? `-${tone}` : ''}.wav`);
  if (!existsSync(wav)) {
    if (!existsSync(refM4a(id, tone))) throw new Error(`no ${tone ? `${tone} ` : ''}reference for ${id}: run with ${tone ? '--tone-refs' : '--refs'}`);
    staged([wav], ([t]) => ff('-i', refM4a(id, tone), '-ac', '1', '-ar', String(SR), '-c:a', 'pcm_s16le', t));
  }
  return wav;
}
const refHash = (id: CastId, tone: ToneRef | null = null) => sha(readFileSync(refM4a(id, tone)), 10);
/** What a clip is cloned from: the voice's reference, or its tone's. */
const refOf = (p: Pick<Plan, 'cast' | 'it'>) => {
  const tone = toneRefOf(p.it.tone);
  return { audio: refWav(p.cast, tone), text: tone ? CASTS[p.cast].tones![tone]!.text : CASTS[p.cast].ref.text };
};
/** Commit-sized reference: mono AAC 64 kbps (a 15 s clip ~120 KB). */
const encodeRef = (wav: string, id: CastId, tone: ToneRef | null = null) => staged([refM4a(id, tone)], ([t]) =>
  ff('-i', wav, '-ac', '1', '-ar', String(SR), '-c:a', 'aac', '-b:a', '64k', '-map_metadata', '-1', '-fflags', '+bitexact', '-movflags', '+faststart', t));

function makeRefs(): void {
  const seeds = opt('--design-seeds')?.split(',').map(Number);
  const ids = CAST_IDS.filter((id) => (!only || only.test(id)) && (!existsSync(refM4a(id)) || (seeds && CASTS[id].source === 'design')));
  const tmp = dirOf(CACHE, 'refs/cand');
  const cands: { id: CastId; seed: number; wav: string }[] = [];
  const design = ids.filter((id) => CASTS[id].source === 'design');
  // candidates cached by their description and text (a re-run re-scores without re-speaking)
  const designJobs = design.flatMap((id) => (seeds ?? [CASTS[id].seed]).map((seed) =>
    ({ out: join(tmp, `${id}_s${seed}-${sha(CASTS[id].description + CASTS[id].ref.text, 6)}.wav`), text: CASTS[id].ref.text, seed, instruct: CASTS[id].description })));
  py('gen', 'synth', designJobs.filter((j) => !existsSync(j.out)), ['--engine', 'qwen3-design', '--model', MODEL.design]);
  for (const j of designJobs) cands.push({ id: j.out.match(/([a-z]{2}-[fm]\d)_s/)![1] as CastId, seed: j.seed, wav: j.out });
  const phonon = ids.filter((id) => CASTS[id].source === 'phonon')
    .map((id) => ({ out: join(tmp, `${id}_s${CASTS[id].seed}.wav`), text: CASTS[id].ref.text, seed: CASTS[id].seed, voice: CASTS[id].ref.voice, id }));
  py('phonon', 'synth', phonon, ['--engine', 'phonon']);
  for (const j of phonon) cands.push({ id: j.id, seed: j.seed, wav: j.out });
  for (const id of ids.filter((id) => CASTS[id].source === 'vctk')) {
    const src = join(VCTK, CASTS[id].ref.file!);
    if (!existsSync(src)) throw new Error(`${id}: ${src} missing (KIKIMIMI_VCTK_REFS)`);
    const wav = join(tmp, `${id}_s0.wav`);
    ff('-i', src, '-ac', '1', '-ar', String(SR), '-c:a', 'pcm_s16le', wav);
    cands.push({ id, seed: 0, wav });
  }
  if (!cands.length) return console.log('every cast voice has its reference');
  const heard = py<{ hyp: string; wer: number; content: number }>('qa', 'wer', cands.map((c) => ({ wav: c.wav, refs: [CASTS[c.id].ref.text] })));
  const mos = flag('--no-mos') ? {} : py<number>('qa', 'mos', cands.map((c) => c.wav));
  for (const id of new Set(cands.map((c) => c.id))) {
    const mine = cands.filter((c) => c.id === id)
      .map((c) => ({ ...c, mos: mos[c.wav] ?? 0, content: heard[c.wav].content, hyp: heard[c.wav].hyp }))
      .sort((a, b) => a.content - b.content || b.mos - a.mos);
    for (const c of mine) console.log(`  ${id} seed ${c.seed}: UTMOS ${c.mos.toFixed(2)}, ${c.content} content errors${c.content ? `: "${c.hyp}"` : ''}`);
    const best = mine[0];
    staged([join(dirOf(CACHE, 'refs'), `${id}.wav`)], ([t]) => copyFileSync(best.wav, t));
    encodeRef(best.wav, id);
    CASTS[id].seed = best.seed;
    if (mos[best.wav]) CASTS[id].ref.mos = mos[best.wav];
    console.log(`${id}: seed ${best.seed} kept (${(statSync(refM4a(id)).size / 1024).toFixed(0)} KB)`);
  }
  writeAtomic(CAST_FILE, JSON.stringify(CASTS, null, 1) + '\n');
}

// ---- legacy: macOS say (levels 1-3) ----------------------------------------------------------------------------------

const RATE: Readonly<Record<number, number>> = { 1: 160, 2: 175, 3: 185 };
const SAY_SLOW = 0.7;
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
let installed: Set<string> | undefined;
function sayVoice(it: Item): string {
  /** Installed voices by name; macOS adds " (English (UK))" to a name it has in more than one language or variant. */
  installed ??= new Set(execFileSync('say', ['-v', '?'], { encoding: 'utf8' }).split('\n')
    .map((l) => l.split(/\s{2,}|\s+[a-z]{2}_[A-Z]{2}\s/)[0].trim().replace(/ \(English \([^)]*\)\)$/, '')).filter(Boolean));
  const gender = ROSTER[it.speaker].gender;
  const name = VOICES[it.voice][gender].find((v) => installed!.has(v) && !NEVER.test(v));
  if (!name) throw new Error(`no ${it.voice} voice installed (wanted one of ${VOICES[it.voice][gender].join(', ')})`);
  return name;
}
function sayRender(text: string, voice: string, rate: number, out: string): void {
  const aiff = join(dirOf(CACHE, 'say'), 'say.aiff'), wav = join(CACHE, 'say', 'say.wav');
  execFileSync('say', ['-v', voice, '-r', String(rate), '-o', aiff, text]);
  trim(aiff, wav);
  finish(wav, out);
}

// ---- the plan: what each item is spoken with ------------------------------------------------------------------------

interface Plan {
  it: Item;
  cast: CastId;
  engine: Engine;
  /** What's spoken (speech.ts spokenText): the report's text and the ASR's reference. */
  text: string;
  /** What the engine is given: `text`, a toned clip's with its wh- and either/or questions ending in "." (tone.ts). */
  say: string;
  /** The first take's seed. */
  seed: number;
  /** A toned clip's tone pick key (pickKey); undefined untoned. */
  key?: string;
  /** The clean master's hash: the raw takes are cached by it. */
  master: string;
  /** The speech condition mixed over the clean take (null: clean). */
  cond: CondPlan | null;
  /** The clip's source hash: the master's, with its condition's. */
  src: string;
}
const bedFile = (b: Bed) => join(BEDS, `${b}.m4a`);
/** The assets a condition uses (its bed's file), by hash: part of the clip's source. */
const condAssets = (c: CondPlan): Record<string, string> => (c.bed ? { [`bed:${c.bed.id}`]: sha(readFileSync(bedFile(c.bed.id)), 10) } : {});
function planOf(it: Item, seedFor?: number): Plan {
  const cast = castOf(it), engine = ENGINE[it.voice], entry = CASTS[cast];
  if (!entry) throw new Error(`${it.id}: no cast.json entry for ${cast}`);
  if (engine === 'say') {
    // v1's hash, so a say run keeps the shipped clips
    const text = it.tts ?? it.en, voice = sayVoice(it);
    const src = sha(JSON.stringify([text, voice, RATE[it.lv], hasSlow(it) && SAY_SLOW, 1]), 10);
    return { it, cast, engine, text, say: text, seed: seedOf(it.id), master: src, cond: null, src };
  }
  if (engine === 'kokoro' && !entry.kokoro) throw new Error(`${it.id}: kokoro has no ${cast} voice (no Australian voices: --engine kokoro,au=qwen3)`);
  const text = spokenText(it), say = it.tone ? engineText(text) : text, tone = CLONES(engine) ? toneRefOf(it.tone) : null;
  if (tone && !entry.tones?.[tone]) throw new Error(`${it.id}: ${cast} has no ${tone} reference (run with --tone-refs)`);
  // an untoned clip's voice and text as before: its hash unchanged
  const voice = CLONES(engine) ? (tone ? [cast, tone, refHash(cast, tone), entry.tones![tone]!.text] : [cast, refHash(cast), entry.ref.text]) : [entry.kokoro];
  const key = it.tone ? pickKey(voice, say) : undefined, seed = seedFor ?? seedOf(it.id, key);
  const tempo = tempoOf(it);
  const master = sha(JSON.stringify([engine, MODEL[engine], voice, say, seed, hasSlow(it) && [SLOW, STRETCH], tempo !== 1 && [tempo, STRETCH], PIPELINE,
    ...(SOFT.has(it.id) ? [['story', STORY_LUFS]] : []), ...(kbpsOf(it) !== 48 ? [['kbps', kbpsOf(it)]] : [])]), 10);
  const c = condOf(it), cond = c && condPlan(c);
  if (cond && hasSlow(it)) throw new Error(`${it.id}: no conditions at levels 1-2 (their slow clip is the clean take)`);
  return { it, cast, engine, text, say, seed, key, master, cond, src: condSource(master, cond, cond ? condAssets(cond) : {}) };
}

interface Take {
  seed: number;
  raw: string;
  wav: string;
  m4a: string;
  gen?: number;
  rawDur?: number;
  hyp?: string;
  wer?: number;
  content?: number;
  sim?: number;
}
interface Row {
  src: string;
  cast: CastId;
  engine: Engine;
  text: string;
  dur: number;
  /** Words a minute (the normal clip, its 60 ms tail aside). */
  wpm: number;
  seed: number;
  /** Takes spoken (1 + re-rolls). */
  tries: number;
  hyp?: string;
  wer?: number;
  content?: number;
  mos?: number;
  sim?: number;
  rtf?: number;
  /** The condition mixed over it ("pa:light"), and what whisper heard of the mixed clip (the loose check). */
  cond?: string;
  condHyp?: string;
  condWer?: number;
  /** A rung clip's (スピード はしご): its speed, the tempo its line's take was stretched by, its pace (syllables a
   *  second) and whether the tempo was clamped (off its speed). */
  speed?: number;
  tempo?: number;
  rate?: number;
  clamped?: boolean;
  flags: string[];
}

/** A take's rank, lowest best: content words misheard plus drift (another voice, similarity under 0.3, counts as one),
 *  then off-voice (under MIN_SIM), then WER, then the higher similarity. */
const rank = (t: Take): number => {
  const sim = t.sim ?? 1;
  return (t.content! + (sim < 0.3 ? 1 : 0)) * 1000 + (sim < MIN_SIM ? 100 : 0) + t.wer! * 10 + (1 - sim);
};
/** How many takes each item got. */
const takesOf = new Map<string, number>();

/** Speak `plans` with their engines: takes re-rolled with the next seed while whisper mishears a content word or the
 *  voice drifts from its reference (ECAPA cosine under MIN_SIM); the best take each. */
function speak(plans: Plan[]): Map<string, Take> {
  const work = dirOf(CACHE, 'work'), raws = dirOf(CACHE, 'raw');
  const best = new Map<string, Take>();
  let todo = plans;
  for (let k = 0; k <= RETRIES && todo.length; k++) {
    const takes = new Map<string, Take>();
    for (const p of todo) {
      const seed = p.seed + k;
      takesOf.set(p.it.id, k + 1);
      takes.set(p.it.id, { seed, raw: join(raws, `${p.master}-s${seed}.wav`), wav: join(work, `${p.it.id}-${k}.wav`), m4a: join(work, `${p.it.id}-${k}.m4a`) });
    }
    for (const engine of ['qwen3', 'voxcpm2', 'kokoro'] as const) {
      const jobs = todo.filter((p) => p.engine === engine && !existsSync(takes.get(p.it.id)!.raw)).map((p) => {
        const t = takes.get(p.it.id)!, e = CASTS[p.cast], ref = CLONES(engine) ? refOf(p) : null;
        return ref
          ? { out: t.raw, text: p.say, seed: t.seed, ref_audio: ref.audio, ref_text: ref.text }
          : { out: t.raw, text: p.say, seed: t.seed, voice: e.kokoro };
      });
      if (jobs.length) console.log(`${engine}: ${jobs.length} clips (try ${k + 1})`);
      const res = py<{ gen: number; dur: number }>(engine === 'kokoro' ? 'kokoro' : 'gen', 'synth', jobs, ['--engine', engine, '--model', MODEL[engine]]);
      for (const [raw, r] of Object.entries(res)) writeAtomic(`${raw}.json`, JSON.stringify(r)); // the master's timing, for RTF
    }
    for (const p of todo) {
      const t = takes.get(p.it.id)!, meta = `${t.raw}.json`;
      if (existsSync(meta)) {
        const r = JSON.parse(readFileSync(meta, 'utf8'));
        Object.assign(t, { gen: r.gen, rawDur: r.dur });
      }
    }
    for (const p of todo) {
      const t = takes.get(p.it.id)!;
      trim(t.raw, t.wav);
      // the slow clip is made from t.wav (the take as spoken), the normal one maybe gently stretched (L1)
      if (tempoOf(p.it) !== 1) {
        const s = t.wav.replace(/\.wav$/, '-t.wav');
        stretch(t.wav, tempoOf(p.it), s);
        finish(s, t.m4a, lufsOf(p.it), kbpsOf(p.it));
      } else finish(t.wav, t.m4a, lufsOf(p.it), kbpsOf(p.it));
    }
    const heard = py<{ hyp: string; wer: number; content: number }>('qa', 'wer', todo.map((p) => ({ wav: takes.get(p.it.id)!.m4a, refs: [p.it.en, p.text] })));
    const cloned = todo.filter((p) => CLONES(p.engine));
    const sim = flag('--no-sv') ? {} : py<number>('sv', 'sv', cloned.map((p) => ({ wav: takes.get(p.it.id)!.m4a, ref: refWav(p.cast) })));
    const again: Plan[] = [];
    for (const p of todo) {
      const t = takes.get(p.it.id)!, h = heard[t.m4a];
      Object.assign(t, { hyp: h.hyp, wer: h.wer, content: h.content, sim: sim[t.m4a] });
      const b = best.get(p.it.id);
      if (!b || rank(t) < rank(b)) best.set(p.it.id, t);
      if (h.content > 0 || (t.sim ?? 1) < MIN_SIM) again.push(p);
    }
    if (again.length) console.log(`gate: ${again.length} misheard or off-voice${k < RETRIES ? ', re-rolling' : ''}: ${again.map((p) => p.it.id).join(' ')}`);
    todo = again;
  }
  return best;
}

// ---- tone: a toned clip's best take, and the voices' tone references --------------------------------------------------

/** The toned clips (`tone`) without a pick for their voice and engine text get --tone-takes seeds (from --seed's
 *  default), each scored by tone.ts takeScore on the clean take as spoken; the best seed is kept in tone-picks.json
 *  with every take's score (a disagreeing listener's other take is its seed, from the raw cache), and the plans are made
 *  again with it (its raw take is cached, so the gate's first try isn't spoken twice). A PINNED seed wins. */
function pickTones(plans: Plan[]): Plan[] {
  const need = plans.filter((p) => p.key && CLONES(p.engine) && PINNED[p.it.id] === undefined && !opt('--seed') && PICKS[p.it.id]?.key !== p.key);
  if (!need.length) return plans;
  const work = dirOf(CACHE, 'work', 'tone'), raws = dirOf(CACHE, 'raw');
  const takes = need.flatMap((p) => Array.from({ length: TONE_TAKES }, (_, k) => {
    const seed = SEED + k, q = planOf(p.it, seed);
    return { p, seed, raw: join(raws, `${q.master}-s${seed}.wav`), wav: join(work, `${p.it.id}-s${seed}.wav`) };
  }));
  console.log(`tone: ${need.length} toned clips, ${TONE_TAKES} takes each`);
  for (const engine of ['qwen3', 'voxcpm2'] as const) {
    const jobs = takes.filter((t) => t.p.engine === engine && !existsSync(t.raw)).map((t) => {
      const ref = refOf(t.p);
      return { out: t.raw, text: t.p.say, seed: t.seed, ref_audio: ref.audio, ref_text: ref.text };
    });
    const res = py<{ gen: number; dur: number }>('gen', 'synth', jobs, ['--engine', engine, '--model', MODEL[engine]]);
    for (const [raw, r] of Object.entries(res)) writeAtomic(`${raw}.json`, JSON.stringify(r));
  }
  for (const t of takes) trim(t.raw, t.wav);
  const heard = py<{ content: number }>('qa', 'wer', takes.map((t) => ({ wav: t.wav, refs: [t.p.it.en, t.p.text] })));
  const sim = flag('--no-sv') ? {} : py<number>('sv', 'sv', takes.map((t) => ({ wav: t.wav, ref: refWav(t.p.cast) })));
  const mos = flag('--no-mos') ? {} : py<number>('qa', 'mos', takes.map((t) => t.wav));
  const pros = py<Prosody>('qa', 'prosody', takes.map((t) => ({
    wav: t.wav, text: t.p.text, gender: CASTS[t.p.cast].gender, words: sentences(t.p.text).map((s) => s.n), syl: syllables(t.p.text)
  })));
  for (const p of need) {
    const types = sentences(p.text).map((s) => s.type);
    const scores = Object.fromEntries(takes.filter((t) => t.p === p).map((t) => [String(t.seed),
      Math.round(takeScore(types, { ...pros[t.wav], content: heard[t.wav].content, sim: sim[t.wav] ?? 1, mos: mos[t.wav] ?? 0 }) * 100) / 100]));
    const seed = Number(Object.entries(scores).sort((a, b) => b[1] - a[1] || Number(a[0]) - Number(b[0]))[0][0]);
    PICKS[p.it.id] = { key: p.key!, seed, scores };
    console.log(`  ${p.it.id} (${p.it.tone}): seed ${seed} of ${JSON.stringify(scores)}`);
  }
  writeAtomic(PICKS_FILE, JSON.stringify(Object.fromEntries(Object.keys(PICKS).sort().map((k) => [k, PICKS[k]])), null, 1) + '\n');
  return plans.map((p) => (need.includes(p) ? planOf(p.it) : p));
}

/** The tone references the toned clips need (each voice's soft and firm, as used): the cast reference cloned saying
 *  TONE_TEXT over 3 seeds, the best heard word for word, near the voice (ECAPA ≥ 0.7) and by UTMOS; cast.json `tones`
 *  gets its seed. (The pilot chose by an emotion model too: every clone moved alike, so UTMOS decides here.) */
function makeToneRefs(): void {
  const want = new Map<string, [CastId, ToneRef]>();
  for (const it of ALL) {
    const t = toneRefOf(it.tone), id = castOf(it);
    if (t && CLONES(ENGINE[it.voice]) && (!only || only.test(id))) want.set(`${id}-${t}`, [id, t]);
  }
  const pairs = [...want.values()].filter(([id, t]) => !existsSync(refM4a(id, t)) || !CASTS[id].tones?.[t]);
  if (!pairs.length) return console.log('every toned voice has its tone references');
  const tmp = dirOf(CACHE, 'refs/cand');
  const cands = pairs.flatMap(([id, t]) => [11, 22, 33].map((seed) =>
    ({ id, t, seed, out: join(tmp, `${id}-${t}_s${seed}-${sha(refHash(id) + TONE_TEXT[t], 6)}.wav`) })));
  py('gen', 'synth', cands.filter((c) => !existsSync(c.out)).map((c) =>
    ({ out: c.out, text: TONE_TEXT[c.t], seed: c.seed, ref_audio: refWav(c.id), ref_text: CASTS[c.id].ref.text })), ['--engine', 'qwen3', '--model', MODEL.qwen3]);
  const heard = py<{ hyp: string; content: number }>('qa', 'wer', cands.map((c) => ({ wav: c.out, refs: [TONE_TEXT[c.t]] })));
  const mos = py<number>('qa', 'mos', cands.map((c) => c.out));
  const sim = py<number>('sv', 'sv', cands.map((c) => ({ wav: c.out, ref: refWav(c.id) })));
  for (const [id, t] of pairs) {
    const mine = cands.filter((c) => c.id === id && c.t === t).map((c) => ({ ...c, content: heard[c.out].content, mos: mos[c.out], sim: sim[c.out] }))
      .sort((a, b) => a.content - b.content || Number(a.sim < 0.7) - Number(b.sim < 0.7) || b.mos - a.mos);
    for (const c of mine) console.log(`  ${id} ${t} seed ${c.seed}: UTMOS ${c.mos.toFixed(2)}, sim ${c.sim.toFixed(2)}, ${c.content} content errors`);
    const best = mine[0];
    if (best.content || best.sim < 0.7) throw new Error(`${id} ${t}: no take heard word for word near the voice; try other seeds`);
    staged([join(dirOf(CACHE, 'refs'), `${id}-${t}.wav`)], ([w]) => copyFileSync(best.out, w));
    encodeRef(best.out, id, t);
    CASTS[id].tones = { ...CASTS[id].tones, [t]: { text: TONE_TEXT[t], seed: best.seed, mos: best.mos, sim: best.sim } };
    console.log(`${id} ${t}: seed ${best.seed} kept`);
  }
  writeAtomic(CAST_FILE, JSON.stringify(CASTS, null, 1) + '\n');
}

function listen(): void {
  if (!SCRATCH) unpackClips();
  for (const it of BANK) {
    if (only && !only.test(it.id)) continue;
    console.log(`\n${it.id}  [${castOf(it)}, ${ROSTER[it.speaker].nameEn}]\n  ${it.en}\n  ${it.ja}`);
    spawnSync('afplay', [join(OUT, `${it.id}.m4a`)], { stdio: 'inherit' });
    if (hasSlow(it)) spawnSync('afplay', [join(OUT, `${it.id}-slow.m4a`)], { stdio: 'inherit' });
  }
}

function printList(c: Record<string, Clip>): void {
  console.log('\nListen-through list (each clip, then its slow one at levels 1-2; `--listen` plays them in order):');
  let lv = 0;
  for (const it of [...BANK].sort((a, b) => a.lv - b.lv || a.id.localeCompare(b.id))) {
    if (it.lv !== lv) console.log(`\n== level ${(lv = it.lv)} ==`);
    const d = c[it.id]?.dur.toFixed(2) ?? '  ?  ';
    const cond = condOf(it);
    console.log(`[ ] ${it.id.padEnd(18)} ${d}s  ${castOf(it)}${cond ? `  (${condPlan(cond).key})` : ''}  ${it.en}`);
  }
  console.log('\n== スピード はしご (each rung: the line at its speed) ==');
  for (const l of LADDERS) console.log(`[ ] ${l.id.padEnd(18)} ${l.rungs.map((r) => `${c[r.id]?.dur.toFixed(2) ?? '?'}s`).join(' ')}  ${castOf(l.line)}  ${l.line.en}`);
}

function run(): void {
  const t0 = Date.now();
  mkdirSync(OUT, { recursive: true });
  if (!SCRATCH) console.log(`${unpackClips()} clips unpacked from the packs into ${OUT}`);
  const old: Record<string, Clip> = existsSync(CLIPS) ? JSON.parse(readFileSync(CLIPS, 'utf8')) : {};
  const oldSrc: Record<string, string> = existsSync(SRCS) ? JSON.parse(readFileSync(SRCS, 'utf8')) : {};
  const clips: Record<string, Clip> = { ...old }, srcs: Record<string, string> = { ...oldSrc };
  const fileOf = (id: string, slow = false) => join(OUT, `${id}${slow ? '-slow' : ''}.m4a`);
  const plans = BANK.filter((it) => !only || only.test(it.id)).map((it) => planOf(it));
  const stale = plans.filter((p) => {
    const files = [fileOf(p.it.id), ...(hasSlow(p.it) ? [fileOf(p.it.id, true)] : []), ...(p.it.hs ? [fileOf(`${p.it.id}-f`)] : [])];
    const fast = !p.it.hs || (old[`${p.it.id}-f`] && oldSrc[`${p.it.id}-f`] === fastSrc(p.master));
    return flag('--force') || !old[p.it.id] || oldSrc[p.it.id] !== p.src || !fast || !files.every((f) => existsSync(f));
  });
  if (flag('--dry-run')) return console.log(`${stale.length} of ${plans.length} to speak${stale.length ? `: ${stale.map((p) => p.it.id).join(' ')}` : ''}`);
  const todo = pickTones(stale);
  // スピード はしご: a ladder whose rung clips are missing or out of date has its line spoken (a take already made, a
  // level-4 line's own included, comes from the raw cache) and every rung made again from it
  const ladderPlans = SAY ? [] : LADDERS.filter((l) => !only || only.test(l.id)).map((l) => ({ l, p: planOf(l.line) }));
  const ladderTodo = ladderPlans.filter(({ l, p }) => l.rungs.some((r) =>
    flag('--force') || !old[r.id] || oldSrc[r.id] !== rungSrc(p.master, r.rung!.n) || !existsSync(fileOf(r.id))));
  console.log(`${plans.length} items selected, ${todo.length} to speak (engine ${JSON.stringify(ENGINE)}, slow by ${STRETCH}); ${ladderPlans.length} ladders, ${ladderTodo.length} to make`);
  const rows: Record<string, Row> = {};
  // each clip (and its slow take) is made beside its file and renamed in with its clips.json entry (tools.ts staged),
  // and the manifests are written however the run ends (the finally below): the files and their hashes always agree
  const record = (p: Plan, normal: string, slowWav: string | null, extra: Partial<Row>) => {
    clips[p.it.id] = staged([fileOf(p.it.id), fileOf(p.it.id, true)], ([out, slow]) => {
      copyFileSync(normal, out);
      if (slowWav) {
        const s = join(CACHE, 'work', `${p.it.id}-slow.wav`);
        stretch(slowWav, SLOW, s);
        finish(s, slow);
      }
      return { dur: duration(out), hash: sha(readFileSync(out), 8), ...(slowWav && { slow: sha(readFileSync(slow), 8) }) };
    });
    srcs[p.it.id] = p.src;
    const dur = clips[p.it.id].dur, words = p.text.match(/[A-Za-z']+/g)?.length ?? 0;
    rows[p.it.id] = { src: p.src, cast: p.cast, engine: p.engine, text: p.text, dur, wpm: Math.round((words / Math.max(dur - 0.06, 0.1)) * 60), seed: p.seed, tries: 1, flags: [], ...extra };
  };
  const sorted = <T>(o: Record<string, T>) => Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]));
  try {
    if (SAY) {
      for (const p of todo) {
        const voice = sayVoice(p.it);
        clips[p.it.id] = staged([fileOf(p.it.id), fileOf(p.it.id, true)], ([f, slow]) => {
          sayRender(p.text, voice, RATE[p.it.lv], f);
          if (hasSlow(p.it)) sayRender(p.text, voice, Math.round(RATE[p.it.lv] * SAY_SLOW), slow);
          return { dur: duration(f), hash: sha(readFileSync(f), 8), ...(hasSlow(p.it) && { slow: sha(readFileSync(slow), 8) }) };
        });
        srcs[p.it.id] = p.src;
        process.stdout.write(`\r${Object.keys(srcs).length} spoken: ${p.it.id.padEnd(24)}`);
      }
    } else {
      const best = speak([...todo, ...ladderTodo.map((x) => x.p)]);
      // the conditions over the clean takes that passed the gate, then whisper's loose check of the mixed clips
      const conds = todo.filter((p) => p.cond);
      const mixed = new Map<string, string>(), leads = new Map<string, number>();
      if (conds.length) console.log(`conditions: ${conds.length} clips`);
      for (const p of conds) {
        const t = best.get(p.it.id)!, w = t.wav.replace(/\.wav$/, '-c.wav'), m = t.m4a.replace(/\.m4a$/, '-c.m4a');
        leads.set(p.it.id, condition(t.wav, p.cond!, p.it.id, w));
        finish(w, m);
        mixed.set(p.it.id, m);
      }
      const loose = py<{ hyp: string; wer: number; content: number }>('qa', 'wer', conds.map((p) => ({ wav: mixed.get(p.it.id)!, refs: [p.it.en, p.text] })));
      const cleanDir = dirOf(CACHE, 'clean');
      for (const p of todo) {
        const t = best.get(p.it.id)!;
        const flags = [...(t.content ? ['misheard'] : []), ...(t.sim === undefined ? [] : t.sim < 0.3 ? ['drift'] : t.sim < MIN_SIM ? ['low-sim'] : [])];
        const m = mixed.get(p.it.id), h = m ? loose[m] : undefined;
        if (h && h.wer > p.cond!.maxWer) flags.push('cond-wer');
        record(p, m ?? t.m4a, hasSlow(p.it) ? t.wav : null, {
          seed: t.seed, tries: takesOf.get(p.it.id) ?? 1, hyp: t.hyp, wer: t.wer, content: t.content, sim: t.sim, flags,
          ...(t.gen !== undefined && t.rawDur && { rtf: Math.round((t.gen / t.rawDur) * 1000) / 1000 }),
          ...(p.cond && h && { cond: p.cond.key, condHyp: h.hyp, condWer: h.wer,
            wpm: Math.round(((p.text.match(/[A-Za-z']+/g)?.length ?? 0) / Math.max(duration(t.m4a) - 0.06, 0.1)) * 60) })
        });
        // the clean take beside the mixed clip (the karaoke aligns on it: kikimimi-words.ts), or none for a clean clip
        if (m) {
          staged([join(cleanDir, `${p.it.id}.m4a`)], ([c]) => copyFileSync(t.m4a, c));
          writeAtomic(join(cleanDir, `${p.it.id}.json`), JSON.stringify({ hash: clips[p.it.id].hash, lead: leads.get(p.it.id) }));
        } else for (const x of ['m4a', 'json']) rmSync(join(cleanDir, `${p.it.id}.${x}`), { force: true });
      }
      // each ladder's rungs: its take (trimmed, as spoken) stretched to each rung's speed × NATURAL_RATE, then finished
      // as any clip; whisper hears every rung (the report's QA at speed; a mishearing at 1.4× is flagged, never re-rolled:
      // the take passed the gate at its own pace)
      const rungs: { id: string; p: Plan; n: number; tempo: number; rate: number; clamped: boolean }[] = [];
      for (const { l, p } of ladderTodo) {
        const t = best.get(p.it.id)!;
        const rate = syllables(p.text) / Math.max(0.5, duration(t.wav));
        for (const r of l.rungs) {
          const n = r.rung!.n, want = (SPEEDS[n - 1] * NATURAL_RATE) / rate;
          const tempo = Math.round(Math.min(TEMPO_MAX, Math.max(TEMPO_MIN, want)) * 1000) / 1000;
          const wav = join(CACHE, 'work', `${r.id}-rung.wav`);
          stretch(t.wav, tempo, wav);
          clips[r.id] = staged([fileOf(r.id)], ([f]) => {
            finish(wav, f);
            return { dur: duration(f), hash: sha(readFileSync(f), 8) };
          });
          srcs[r.id] = rungSrc(p.master, n);
          rungs.push({ id: r.id, p, n, tempo, rate: Math.round((rate * tempo) * 100) / 100, clamped: Math.abs(tempo - want) > 0.005 });
        }
      }
      if (rungs.length) {
        const heard = py<{ hyp: string; wer: number; content: number }>('qa', 'wer', rungs.map((r) => ({ wav: fileOf(r.id), refs: [r.p.it.en, r.p.text] })));
        for (const r of rungs) {
          const t = best.get(r.p.it.id)!, h = heard[fileOf(r.id)], dur = clips[r.id].dur, words = r.p.text.match(/[A-Za-z']+/g)?.length ?? 0;
          rows[r.id] = {
            src: srcs[r.id], cast: r.p.cast, engine: r.p.engine, text: r.p.text, dur, wpm: Math.round((words / Math.max(dur - 0.06, 0.1)) * 60),
            seed: t.seed, tries: takesOf.get(r.p.it.id) ?? 1, hyp: h.hyp, wer: h.wer, content: h.content, sim: t.sim,
            speed: SPEEDS[r.n - 1], tempo: r.tempo, rate: r.rate, clamped: r.clamped,
            flags: [...(h.content ? ['misheard'] : []), ...(r.clamped ? ['clamped'] : []), ...(t.content ? ['take-misheard'] : [])]
          };
        }
      }
      // 音の へんしん's fast takes: the natural take that passed, sped up, then finished as any clip; whisper hears each
      const fasts: { id: string; p: Plan }[] = [];
      for (const p of todo.filter((x) => x.it.hs)) {
        const t = best.get(p.it.id)!, id = `${p.it.id}-f`, wav = join(CACHE, 'work', `${id}.wav`);
        stretch(t.wav, FAST, wav);
        clips[id] = staged([fileOf(id)], ([f]) => {
          finish(wav, f);
          return { dur: duration(f), hash: sha(readFileSync(f), 8) };
        });
        srcs[id] = fastSrc(p.master);
        fasts.push({ id, p });
      }
      if (fasts.length) {
        const heard = py<{ hyp: string; wer: number; content: number }>('qa', 'wer', fasts.map((x) => ({ wav: fileOf(x.id), refs: [x.p.it.en, x.p.text] })));
        for (const { id, p } of fasts) {
          const t = best.get(p.it.id)!, h = heard[fileOf(id)], dur = clips[id].dur, words = p.text.match(/[A-Za-z']+/g)?.length ?? 0;
          rows[id] = {
            src: srcs[id], cast: p.cast, engine: p.engine, text: p.text, dur, wpm: Math.round((words / Math.max(dur - 0.06, 0.1)) * 60),
            seed: t.seed, tries: takesOf.get(p.it.id) ?? 1, hyp: h.hyp, wer: h.wer, content: h.content, sim: t.sim, tempo: FAST,
            flags: [...(h.content ? ['misheard'] : []), ...(t.content ? ['take-misheard'] : [])]
          };
        }
      }
      const made = [...todo.map((p) => p.it.id), ...rungs.map((r) => r.id), ...fasts.map((x) => x.id)];
      if (!flag('--no-mos')) {
        // a mixed clip's UTMOS is its clean take's (noise is the point)
        const fileFor = (id: string) => (mixed.has(id) ? best.get(id)!.m4a : fileOf(id));
        const mos = py<number>('qa', 'mos', made.map(fileFor));
        for (const id of made) {
          rows[id].mos = mos[fileFor(id)];
          if (rows[id].mos! < 3.5) rows[id].flags.push('low-mos');
        }
      }
    }
    // clips of items no longer in the bank (a whole run into the work folder only)
    const ids = new Set([...ALL.map((it) => it.id), ...RUNG_IDS, ...FAST_IDS, ...REAL_IDS]);
    for (const id of Object.keys(clips)) if (!ids.has(id)) { delete clips[id]; delete srcs[id]; }
    if (!SCRATCH && !only) {
      const want = new Set([...ALL.filter((it) => clips[it.id]).flatMap((it) => [`${it.id}.m4a`, ...(hasSlow(it) ? [`${it.id}-slow.m4a`] : [])]),
        ...[...RUNG_IDS, ...FAST_IDS, ...REAL_IDS].filter((id) => clips[id]).map((id) => `${id}.m4a`)]);
      for (const f of readdirSync(OUT).filter((f) => !want.has(f))) rmSync(join(OUT, f));
    }
  } finally {
    // the manifests as the files are, however the run ends (a pass that throws keeps the clips made before it)
    writeAtomic(CLIPS, JSON.stringify(sorted(clips), null, 1).replace(/\n  +/g, ' ').replace(/\n \}/g, ' }') + '\n');
    writeAtomic(SRCS, JSON.stringify(sorted(srcs), null, 1) + '\n');
  }
  if (!SCRATCH) {
    writePacks(); // the packs whose clips changed (docs/kikimimi-engine.md "Audio")
    writeLevels(true); // the levels' chunks with the new clips and their packs (docs/kikimimi-engine.md "Loading")
  }
  const files = readdirSync(OUT).filter((f) => f.endsWith('.m4a'));
  const bytes = files.reduce((s, f) => s + statSync(join(OUT, f)).size, 0);
  if (SAY) return console.log(`\n${todo.length} items spoken by say; ${files.length} files, ${(bytes / 1024).toFixed(0)} KB`);

  // the report covers every clip made by this pipeline: earlier runs' rows kept while their clip is unchanged
  if (!existsSync(REPORT) && SLIM && existsSync(SLIM))
    throw new Error(`no full report at ${REPORT}: restore it from the newest assets-* release's tts-work (docs/kikimimi-engine.md "Audio")`);
  const prev: Record<string, Row> = existsSync(REPORT) ? JSON.parse(readFileSync(REPORT, 'utf8')).items ?? {} : {};
  for (const [id, r] of Object.entries(prev)) if (!rows[id] && r.src && srcs[id] === r.src && clips[id]) rows[id] = r;
  const R = Object.values(rows);
  const num = (k: 'mos' | 'sim' | 'rtf' | 'wer') => R.map((r) => r[k]).filter((x): x is number => typeof x === 'number');
  const perVoice = Object.fromEntries([...new Set(R.map((r) => r.cast))].sort().map((c) => {
    const rs = R.filter((r) => r.cast === c);
    const f = (k: 'mos' | 'sim') => rs.map((r) => r[k]).filter((x): x is number => typeof x === 'number');
    return [c, { n: rs.length, mos: mean(f('mos')), mosMin: min(f('mos')), sim: mean(f('sim')), simMin: min(f('sim')), misheard: rs.filter((r) => r.content).length }];
  }));
  const lvOf = new Map(ALL.filter((it) => !STORY.has(it.id)).map((it) => [it.id, it.lv]));
  const storyRows = Object.entries(rows).filter(([id]) => STORY.has(id)).map(([, r]) => r);
  const stories = {
    clips: storyRows.length, minutes: Math.round(storyRows.reduce((s, r) => s + r.dur, 0) / 6) / 10, wpm: mean(storyRows.map((r) => r.wpm)),
    mos: mean(storyRows.map((r) => r.mos).filter((x): x is number => typeof x === 'number')), contentClean: storyRows.filter((r) => !r.content).length
  };
  const wpm = Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8].map((lv) => [lv, mean(Object.entries(rows).filter(([id]) => lvOf.get(id) === lv).map(([, r]) => r.wpm))]));
  const summary = {
    engine: ENGINE, models: Object.fromEntries([...new Set(Object.values(ENGINE))].map((e) => [e, MODEL[e]])), pipeline: PIPELINE,
    slow: { tempo: SLOW, by: STRETCH }, l1Tempo: L1_TEMPO, at: new Date().toISOString(), wallSeconds: Math.round((Date.now() - t0) / 1000),
    spokenNow: todo.length, clips: R.length, perfect: R.filter((r) => r.wer === 0).length, contentClean: R.filter((r) => !r.content).length,
    rerolled: R.filter((r) => r.tries > 1).length, conditioned: R.filter((r) => r.cond).length,
    condWer: mean(R.map((r) => r.condWer).filter((x): x is number => typeof x === 'number')), flagged: Object.keys(rows).filter((k) => rows[k].flags.length).sort(),
    mos: mean(num('mos')), mosMin: min(num('mos')), sim: mean(num('sim')), simMin: min(num('sim')), rtf: mean(num('rtf')), wer: mean(num('wer')),
    wpm, stories, files: files.length, kb: Math.round(bytes / 1024), perVoice,
    ladders: Object.fromEntries(SPEEDS.map((speed) => {
      const rs = R.filter((r) => r.speed === speed);
      const f = (k: 'mos' | 'rate' | 'tempo') => rs.map((r) => r[k]).filter((x): x is number => typeof x === 'number');
      return [`${speed}x`, { n: rs.length, mos: mean(f('mos')), mosMin: min(f('mos')), rate: mean(f('rate')), tempoMin: min(f('tempo')),
        tempoMax: f('tempo').length ? Math.max(...f('tempo')) : null, clamped: rs.filter((r) => r.clamped).length, misheard: rs.filter((r) => r.content).length }];
    }))
  };
  writeAtomic(REPORT, JSON.stringify({ summary, items: sorted(rows) }, null, 1) + '\n');
  if (SLIM) writeAtomic(SLIM, slimReport(summary, sorted(rows)));
  console.log(`\n${todo.length} spoken in ${summary.wallSeconds}s. All ${R.length} clips: whisper word for word ${summary.perfect}, content clean ${summary.contentClean}, re-rolled ${summary.rerolled}`);
  console.log(`UTMOS mean ${summary.mos} (min ${summary.mosMin}); similarity to the ref mean ${summary.sim} (min ${summary.simMin}); RTF ${summary.rtf}; wpm by level ${JSON.stringify(wpm)}`);
  if (stories.clips) console.log(`stories: ${stories.clips} clips, ${stories.minutes} min, ${stories.wpm} wpm, UTMOS ${stories.mos}, content clean ${stories.contentClean}`);
  for (const [x, v] of Object.entries(summary.ladders)) if (v.n) console.log(`  rungs ${x}: ${v.n} clips, UTMOS ${v.mos} (min ${v.mosMin}), ${v.rate} syl/s, tempo ${v.tempoMin}-${v.tempoMax}, clamped ${v.clamped}, misheard ${v.misheard}`);
  for (const [c, v] of Object.entries(perVoice)) console.log(`  ${c}: ${v.n} clips, UTMOS ${v.mos} (min ${v.mosMin}), sim ${v.sim} (min ${v.simMin})${v.misheard ? `, ${v.misheard} misheard` : ''}`);
  if (summary.conditioned) console.log(`conditions: ${summary.conditioned} clips mixed, whisper's WER over them mean ${summary.condWer}`);
  for (const [id, r] of Object.entries(rows)) if (r.flags.length) console.log(`  FLAG ${id} [${r.flags.join(', ')}] said "${r.text}", heard "${r.hyp}"${r.cond ? ` (${r.cond}: "${r.condHyp}")` : ''}`);
  console.log(`${files.length} files in ${OUT}, ${(bytes / 1024).toFixed(0)} KB; report ${REPORT}`);
}

/** The tools a run needs, checked before minutes of synthesis (the one-time setup: docs/kikimimi-engine.md "Audio"). */
function preflight(): void {
  const uv = (Object.keys(PY_ENV) as Py[]).some(needsVenv) ? ['uv'] : []; // only to make a venv no env var names
  const missing = [FFMPEG, FFPROBE, 'whisper-cli', ...uv].filter((b) => spawnSync(b, ['-h'], { stdio: 'ignore' }).error);
  if (!existsSync(WHISPER_MODEL)) missing.push(WHISPER_MODEL);
  if (missing.length) throw new Error(`missing ${missing.join(', ')}: see the one-time setup in docs/kikimimi-engine.md "Audio"`);
}

if (flag('--refs')) { preflight(); makeRefs(); }
else if (flag('--tone-refs')) { preflight(); makeToneRefs(); }
else if (flag('--listen')) listen();
else if (flag('--list')) printList(existsSync(CLIPS) ? JSON.parse(readFileSync(CLIPS, 'utf8')) : {});
else { preflight(); run(); }
