// 音の へんしん: is each phrase's change actually heard? (docs/curriculum.md "Connected speech"). The audio gate makes sure
// whisper hears every word of a clip (reductions normalised: "gonna" passes for "going to"); this checks the other way
// round. whisper-cli (large-v3-turbo) hears each voiced phrase's natural take `<id>` prompted with the reduced spellings
// (so it writes "gonna", "lemme", "outta" when that's what's said) and its careful take `<id>-c` unprompted. A phrase
// passes when its careful take is heard in full (the full form's words, in order), and, where its spelling as said is one
// whisper writes (games/henshin/reduce.ts SPELLED: gonna, wanna, gotta, lemme, kinda, dunno, gotcha, whaddaya…), its
// natural take is heard in that spelling. A flap, a dropped t or h, a link or a weak vowel whisper spells as written
// whatever is said: those phrases' natural takes are their respelling said (`tts`: "Pud it on", "nex' week", "tell 'im"),
// every word still heard (the gate).
// src/lib/kikimimi/reduce.json: `{id: [natural hash, careful hash, pass 0/1, spelled 0/1, natural heard, careful heard]}`;
// content/henshin.test.ts holds every voiced phrase to a pass at its clips' hashes. Silent: it never plays a sound.
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
const { fullIn, spelledIn, spellingsOf } = await import('../src/lib/kikimimi/games/henshin/reduce.ts');

const APP = join(import.meta.dirname, '..');
const OUT = join(APP, 'src/lib/kikimimi/reduce.json');
const CLIPS = JSON.parse(readFileSync(join(APP, 'src/lib/kikimimi/clips.json'), 'utf8')) as Record<string, { dur: number; hash: string }>;
const force = process.argv.includes('--force');
const onlyAt = process.argv.indexOf('--only');
const only = onlyAt > 0 ? new RegExp(process.argv[onlyAt + 1]) : null;
/** whisper's prompt: the reduced spellings it should keep as said. */
const PROMPT = "Yeah, I'm gonna, wanna, gotta, hafta, hasta, lemme, gimme, kinda, sorta, outta, lotsa, coupla, dunno, gotcha, whatcha, didja, wouldja, whaddaya, 'em, y'know.";

type Row = [nat: string, care: string, pass: 0 | 1, spelled: 0 | 1, heard: string, careful: string];
const out: Record<string, Row> = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
const phrases = AUTHORED.filter((it) => it.hs && CLIPS[it.id] && CLIPS[`${it.id}-c`] && (!only || only.test(it.id)));
const todo = phrases.filter((it) => force || out[it.id]?.[0] !== CLIPS[it.id].hash || out[it.id]?.[1] !== CLIPS[`${it.id}-c`].hash);
console.log(`${phrases.length} voiced phrases, ${todo.length} to check`);

const norm = (w: string) => w.toLowerCase().replace(/[’]/g, "'").replace(/[^a-z0-9']/g, '');
type Heard = { w: string; from: number; to: number };

if (todo.length) {
  if (!existsSync(MODEL)) throw new Error(`${MODEL} missing: the one-time setup in docs/kikimimi-engine.md "Audio" (or WHISPER_MODEL)`);
  unpackClips();
  const tmp = mkdtempSync(join(tmpdir(), 'kiki-reduce-'));
  try {
    const wav = (id: string) => join(tmp, `${id}.wav`);
    for (const it of todo) for (const id of [it.id, `${it.id}-c`]) execFileSync(FFMPEG, ['-loglevel', 'error', '-y', '-i', join(WORK, `${id}.m4a`), '-ar', '16000', '-ac', '1', wav(id)]);
    // the natural takes prompted with the reduced spellings, the careful ones as whisper hears anything
    const hear = (files: string[], prompt: string[]) => {
      for (let k = 0; k < files.length; k += 50)
        execFileSync('whisper-cli', ['-m', MODEL, '-l', 'en', '-np', ...prompt, '-oj', ...files.slice(k, k + 50).flatMap((f) => ['-f', f])], { stdio: ['ignore', 'ignore', 'ignore'] });
    };
    hear(todo.map((it) => wav(it.id)), ['--prompt', PROMPT]);
    hear(todo.map((it) => wav(`${it.id}-c`)), []);
    const heardOf = (id: string): Heard[] =>
      (JSON.parse(readFileSync(`${wav(id)}.json`, 'utf8')) as { transcription: { offsets: { from: number; to: number }; text: string }[] }).transcription
        .map((s) => ({ w: s.text.trim(), from: s.offsets.from / 1000, to: s.offsets.to / 1000 })).filter((x) => norm(x.w).length > 0);
    let passed = 0;
    for (const it of todo) {
      const natText = heardOf(it.id).map((x) => x.w).join(' ').trim(), careText = heardOf(`${it.id}-c`).map((x) => x.w).join(' ').trim();
      const spellable = spellingsOf(it.hs!.red).length > 0, spelled = spelledIn(it.hs!.red, natText);
      const full = fullIn(it.hs!.full ?? it.focus!, careText);
      const pass = full && (!spellable || spelled);
      if (pass) passed++;
      else console.log(`  FAIL ${it.id}: natural heard "${natText}"${spellable && !spelled ? ` (not "${it.hs!.red}")` : ''}${full ? '' : `, careful heard "${careText}" (not "${it.hs!.full ?? it.focus}")`}`);
      out[it.id] = [CLIPS[it.id].hash, CLIPS[`${it.id}-c`].hash, pass ? 1 : 0, spelled ? 1 : 0, natText, careText];
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
