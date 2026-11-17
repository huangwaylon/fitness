// 英語すごろく's word list (docs/sugoroku.md "Words"): the words heard in English Study's TV transcripts (real English,
// inflections and all: went, cats) that a dictionary knows (macOS's /usr/share/dict/web2, its lower-case base words,
// with simple inflections), heard in 3+ clips, 2–8 letters, minus names and a short list of words not for the table;
// plus every everyday word (lib/sugoroku/everyday.json: the A1–A2 list with its Japanese). Written to
// lib/sugoroku/words.txt, committed (CI has no dictionary): one word a line, a–z. And ぶん's lines (below).
//   npm run sugoroku:words
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const dir = join(root, 'src/lib/english/transcripts');
const everyday: Record<string, string> = JSON.parse(readFileSync(join(root, 'src/lib/sugoroku/everyday.json'), 'utf8'));
const dict = new Set(readFileSync('/usr/share/dict/web2', 'utf8').split('\n').filter((w) => /^[a-z]+$/.test(w)));
const names = new Set(readFileSync('/usr/share/dict/propernames', 'utf8').split('\n').map((w) => w.toLowerCase()));
/** Not for a family table (the shows say them; the game won't teach them). */
const BLOCK = new Set(('sex sexy sexual damn hell crap ass butt piss pee poop puke boob boobs bitch bastard dick cock penis ' +
  'nude naked whore slut porn screw screwed kill killed killing murder drug drugs drunk vomit diarrhea suicide gun guns ' +
  'nazi nazis jerk idiot stupid dumb hate fart farts horny condom condoms').split(' '));

const ENDINGS: [string, string][] = [['s', ''], ['es', ''], ['ies', 'y'], ['ed', ''], ['ed', 'e'], ['ied', 'y'], ['ing', ''], ['ing', 'e'],
  ['er', ''], ['er', 'e'], ['est', ''], ['est', 'e'], ['ier', 'y'], ['iest', 'y'], ['ly', ''], ['ily', 'y']];
/** A dictionary word, or one of its simple inflections (a doubled last consonant too: stopped, bigger). */
function known(w: string): boolean {
  if (dict.has(w)) return true;
  for (const [end, put] of ENDINGS) {
    if (!w.endsWith(end)) continue;
    const stem = w.slice(0, -end.length);
    if (dict.has(stem + put)) return true;
    if (/(.)\1$/.test(stem) && dict.has(stem.slice(0, -1))) return true;
  }
  return false;
}

const all = new Map<string, number>(), capital = new Map<string, number>(), clips = new Map<string, number>();
for (const f of readdirSync(dir).filter((f) => f.endsWith('.en.json'))) {
  const seen = new Set<string>();
  for (const l of (JSON.parse(readFileSync(join(dir, f), 'utf8')) as { lines: { en: string }[] }).lines) {
    // a word after a sentence's start counts as capitalised only mid-sentence
    const words = l.en.match(/[A-Za-z]+(?:'[A-Za-z]+)?|[.!?]/g) ?? [];
    let start = true;
    for (const raw of words) {
      if (/[.!?]/.test(raw)) { start = true; continue; }
      const w = raw.toLowerCase();
      const first = start;
      start = false;
      if (raw.includes("'")) continue;
      all.set(w, (all.get(w) ?? 0) + 1);
      if (!first && raw[0] !== w[0]) capital.set(w, (capital.get(w) ?? 0) + 1);
      seen.add(w);
    }
  }
  for (const w of seen) clips.set(w, (clips.get(w) ?? 0) + 1);
}

const out = new Set<string>(Object.keys(everyday));
for (const [w, n] of all) {
  if (!/^[a-z]{2,8}$/.test(w) || BLOCK.has(w) || (clips.get(w) ?? 0) < 3 || !known(w)) continue;
  const cap = (capital.get(w) ?? 0) / n;
  if (cap > 0.5 || (names.has(w) && cap > 0.2)) continue;
  out.add(w);
}
for (const w of BLOCK) out.delete(w);
const words = [...out].sort();
writeFileSync(join(root, 'src/lib/sugoroku/words.txt'), words.join('\n') + '\n');
console.log(`${words.length} words (${Object.keys(everyday).length} everyday)`);

// ぶん's lines: English Study's フレーズ deck (catalog.ts deckOf, in the plan's order), its `use` (our portable example
// over the TV line) with its Japanese, 3–6 words: lib/sugoroku/sentences.json, [en, ja] pairs.
const { CLIPS } = await import('../src/lib/english/clips/index.ts');
const { deckOf } = await import('../src/lib/english/catalog.ts');
const { planOf } = await import('../src/lib/english/plan.ts');
const { splitUse } = await import('../src/lib/english/phrases.ts');
const lines: [string, string][] = [];
const seenEn = new Set<string>();
for (const e of deckOf(planOf(CLIPS))) {
  const { en, ja } = splitUse(e[4]);
  const words = en.trim().split(/\s+/);
  if (!ja || words.length < 3 || words.length > 6 || seenEn.has(en) || /[*()（）]/.test(en)) continue;
  seenEn.add(en);
  lines.push([words.join(' '), ja.trim()]);
}
writeFileSync(join(root, 'src/lib/sugoroku/sentences.json'), JSON.stringify(lines) + '\n');
console.log(`${lines.length} sentences`);
