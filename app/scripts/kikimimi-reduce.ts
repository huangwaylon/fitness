// 音の へんしん: is each phrase's reduction actually heard? (docs/curriculum.md "Connected speech"). The audio gate makes
// sure whisper hears every word of a clip (reductions normalised: "gonna" passes for "going to"); this checks the
// other way round, that the natural take is said reduced and the careful one in full, so the drill never asks for a
// change nobody can hear. For each voiced phrase whisper-cli (large-v3-turbo) hears its natural `<id>` and careful
// `<id>-c` takes verbatim, prompted with the reduced spellings (so it writes "gonna", "lemme", "outta" when that's what's
// said), word by word with DTW timings. A phrase passes when
//   - its natural take is heard in its reduced spelling (a spelled reduction: gonna, wanna, gotta, hafta, lemme, gimme,
//     kinda, sorta, outta, lotsa, coupla, dunno, gotcha, whatcha, 'em…), or its focus is said in at most SHORTER of the
//     careful take's time per syllable (each word's own span, so the careful take's pauses don't count), and
//   - its careful take isn't heard reduced.
// src/lib/kikimimi/reduce.json: `{id: [natural hash, careful hash, pass 0/1, ratio, spelled 0/1, heard]}`; content.test
// holds every voiced phrase to a pass at its clips' hashes. Silent: it never plays a sound.
//   node scripts/kikimimi-reduce.ts [--force] [--only <regex>]       (npm run kikimimi:reduce; after audio:kikimimi)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { registerHooks } from 'node:module';
import { FFMPEG, WHISPER_MODEL as MODEL } from './tts/tools.ts';

registerHooks({
  load: (url, ctx, next) => (url.endsWith('.json') ? next(url, { ...ctx, importAttributes: { type: 'json' } }) : next(url, ctx))
});
const { AUTHORED } = await import('../src/lib/kikimimi/source.ts');
const { WORK, unpackClips } = await import('./kikimimi-packs.ts');
const { REDUCE_SHORTER: SHORTER, spelledIn, syllables } = await import('../src/lib/kikimimi/games/henshin/reduce.ts');

const APP = join(import.meta.dirname, '..');
const OUT = join(APP, 'src/lib/kikimimi/reduce.json');
const CLIPS = JSON.parse(readFileSync(join(APP, 'src/lib/kikimimi/clips.json'), 'utf8')) as Record<string, { dur: number; hash: string }>;
const force = process.argv.includes('--force');
const onlyAt = process.argv.indexOf('--only');
const only = onlyAt > 0 ? new RegExp(process.argv[onlyAt + 1]) : null;
/** whisper's prompt: the reduced spellings it should keep as said. */
const PROMPT = "Yeah, I'm gonna, wanna, gotta, hafta, hasta, lemme, gimme, kinda, sorta, outta, lotsa, coupla, dunno, gotcha, whatcha, didja, wouldja, whaddaya, 'em, y'know.";

type Row = [nat: string, care: string, pass: 0 | 1, ratio: number, spelled: 0 | 1, heard: string];
const out: Record<string, Row> = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
const phrases = AUTHORED.filter((it) => it.hs && CLIPS[it.id] && CLIPS[`${it.id}-c`] && (!only || only.test(it.id)));
const todo = phrases.filter((it) => force || out[it.id]?.[0] !== CLIPS[it.id].hash || out[it.id]?.[1] !== CLIPS[`${it.id}-c`].hash);
console.log(`${phrases.length} voiced phrases, ${todo.length} to check`);

const norm = (w: string) => w.toLowerCase().replace(/[’]/g, "'").replace(/[^a-z0-9']/g, '');
type Heard = { w: string; from: number; to: number };

/** The focus's words' own spans (s) in a take: whisper's words matched to the sentence's in order (a DP over spellings, a
 *  reduced word standing for the full ones it shortens: "gonna" covers "going to"), the focus's matched words summed. */
function focusTime(en: string, focus: string, heard: readonly Heard[]): number | null {
  const words = en.split(/\s+/).map(norm).filter(Boolean), at = en.slice(0, en.indexOf(focus)).split(/\s+/).filter((w) => norm(w)).length;
  const n = focus.split(/\s+/).filter((w) => norm(w)).length;
  const h = heard.map((x) => norm(x.w));
  // each heard word to the shown word it starts at (a greedy walk: a heard word that matches none covers the next one)
  let i = 0;
  const span: number[] = new Array(words.length).fill(0);
  for (let j = 0; j < h.length && i < words.length; j++) {
    const k = words.slice(i, i + 4).findIndex((w) => w === h[j] || (w.length > 2 && h[j].startsWith(w.slice(0, 3))) || (h[j].length > 2 && w.startsWith(h[j].slice(0, 3))));
    if (k > 0) i += k;
    span[i] += heard[j].to - heard[j].from;
    i++;
  }
  const t = span.slice(at, at + n).reduce((a, b) => a + b, 0);
  return t > 0 ? t : null;
}

if (todo.length) {
  if (!existsSync(MODEL)) throw new Error(`${MODEL} missing: the one-time setup in docs/kikimimi-engine.md "Audio" (or WHISPER_MODEL)`);
  unpackClips();
  const tmp = mkdtempSync(join(tmpdir(), 'kiki-reduce-'));
  try {
    const wav = (id: string) => join(tmp, `${id}.wav`);
    for (const it of todo) for (const id of [it.id, `${it.id}-c`]) execFileSync(FFMPEG, ['-loglevel', 'error', '-y', '-i', join(WORK, `${id}.m4a`), '-ar', '16000', '-ac', '1', wav(id)]);
    const files = todo.flatMap((it) => [wav(it.id), wav(`${it.id}-c`)]);
    for (let k = 0; k < files.length; k += 50)
      execFileSync('whisper-cli', ['-m', MODEL, '-l', 'en', '-np', '-ml', '1', '-sow', '-dtw', 'large.v3.turbo', '--prompt', PROMPT, '-oj', ...files.slice(k, k + 50).flatMap((f) => ['-f', f])], { stdio: ['ignore', 'ignore', 'ignore'] });
    const heardOf = (id: string): Heard[] =>
      (JSON.parse(readFileSync(`${wav(id)}.json`, 'utf8')) as { transcription: { offsets: { from: number; to: number }; text: string }[] }).transcription
        .map((s) => ({ w: s.text.trim(), from: s.offsets.from / 1000, to: s.offsets.to / 1000 })).filter((x) => norm(x.w));
    let passed = 0;
    for (const it of todo) {
      const nat = heardOf(it.id), care = heardOf(`${it.id}-c`);
      const natText = nat.map((x) => x.w).join(' ').replace(/\s+([,.?!])/g, '$1'), careText = care.map((x) => x.w).join(' ');
      const spelled = spelledIn(it.hs!.red, natText), careReduced = spelledIn(it.hs!.red, careText);
      const full = it.hs!.full ?? it.focus!, syl = Math.max(1, syllables(full));
      const tn = focusTime(it.en, it.focus!, nat), tc = focusTime(it.en, it.focus!, care);
      const ratio = tn !== null && tc !== null ? Math.round((tn / syl / (tc / syl)) * 100) / 100 : 9;
      const pass = (spelled || ratio <= SHORTER) && !careReduced;
      if (pass) passed++;
      else console.log(`  FAIL ${it.id}: heard "${natText}" (${spelled ? 'spelled' : `ratio ${ratio}`})${careReduced ? `, careful heard reduced "${careText}"` : ''}`);
      out[it.id] = [CLIPS[it.id].hash, CLIPS[`${it.id}-c`].hash, pass ? 1 : 0, ratio, spelled ? 1 : 0, natText];
    }
    console.log(`${passed}/${todo.length} heard reduced (and their careful takes in full)`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
const keep = new Set(AUTHORED.filter((it) => it.hs).map((it) => it.id));
const sorted = Object.entries(out).filter(([id]) => keep.has(id) && CLIPS[id]).sort(([a], [b]) => a.localeCompare(b));
writeFileSync(OUT, '{\n' + sorted.map(([id, r]) => `  ${JSON.stringify(id)}: ${JSON.stringify(r)}`).join(',\n') + '\n}\n');
console.log(`reduce.json: ${sorted.length} phrases, ${sorted.filter(([, r]) => r[2]).length} pass`);
