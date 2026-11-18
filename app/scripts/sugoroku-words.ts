// 英語すごろく's word lists (docs/sugoroku.md "Words"), from the curated lists scripts/sugoroku-wordlist.py builds by
// cross-referencing ENABLE with SCOWL, wordfreq, Norvig's counts, NGSL / NGSL-Spoken and CEFR-J (its sources, rules
// and licences in the docs), at SUGOROKU_LISTS (its accept.txt and common.txt):
//   - lib/sugoroku/words.txt: the common words (the hints' and the glosses' list), with every everyday word;
//   - lib/sugoroku/accept.txt: what a word may be (real and actually used, 2–8 letters), the common ones and a few
//     loanwords a Japanese table uses besides, prefix-delta coded (each line: the letters shared with the line before,
//     then the rest), sorted;
// and ぶん's lines (below). All committed (CI has none of the sources). Without SUGOROKU_LISTS the word lists are left as
// committed.
//   SUGOROKU_LISTS=/tmp/wordlist npm run sugoroku:words
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const everyday: Record<string, string> = JSON.parse(readFileSync(join(root, 'src/lib/sugoroku/everyday.json'), 'utf8'));
/** Loanwords a Japanese table uses that the lists lack (food, everyday Japan), and a few real words just under the cut. */
const LOAN = ('bento matcha mochi udon soba wifi vlog karaoke tempura wasabi edamame miso onigiri gyoza tonkatsu sukiyaki ' +
  'ganache calzone aioli reframe glitchy daycare skincare homepage meetup').split(' ');
const lists = process.env.SUGOROKU_LISTS;
if (lists) {
  const read = (f: string) => readFileSync(join(lists, f), 'utf8').split('\n').map((w) => w.trim()).filter((w) => /^[a-z]{2,8}$/.test(w));
  const common = new Set([...read('common.txt'), ...Object.keys(everyday)]);
  const accept = new Set([...read('accept.txt'), ...common, ...LOAN.filter((w) => /^[a-z]{2,8}$/.test(w))]);
  writeFileSync(join(root, 'src/lib/sugoroku/words.txt'), [...common].sort().join('\n') + '\n');
  let prev = '';
  const coded = [...accept].sort().map((w) => {
    let k = 0;
    while (k < prev.length && k < w.length && prev[k] === w[k]) k++;
    prev = w;
    return `${k}${w.slice(k)}`;
  });
  writeFileSync(join(root, 'src/lib/sugoroku/accept.txt'), coded.join('\n') + '\n');
  console.log(`${common.size} common, ${accept.size} accepted`);
}

// The racks' seeds (seeds.json: tiles.ts refill draws each rack round one, so every rack holds a real word of 5–8
// letters): the common words of 5–8 letters a fresh bag can spell, the everyday ones first (`e`: their count).
{
  const { COUNT } = await import('../src/lib/sugoroku/tiles.ts');
  const common = readFileSync(join(root, 'src/lib/sugoroku/words.txt'), 'utf8').split('\n').filter((w) => w.length >= 5 && w.length <= 8);
  const fits = (w: string) => [...new Set(w)].every((c) => (COUNT[c] ?? 0) >= w.split(c).length - 1);
  const ok = common.filter(fits);
  const ev = ok.filter((w) => w in everyday), rest = ok.filter((w) => !(w in everyday));
  writeFileSync(join(root, 'src/lib/sugoroku/seeds.json'), JSON.stringify({ e: ev.length, w: [...ev, ...rest] }) + '\n');
  console.log(`${ok.length} seeds (${ev.length} everyday)`);
}

// ぶん's lines: English Study's フレーズ deck (catalog.ts deckOf, in the plan's order), its `use` (our portable example
// over the TV line) with its Japanese, 3–6 words, each a level (game.ts Level): 1 (やさしい) ≤ 4 words, every one an
// everyday word, no slang; 2 (ふつう) ≤ 5 words, 80 %+ everyday; 3 (むずかしい) the rest, unless line-overrides.json
// says otherwise (a line the deck adds later gets the guess): lib/sugoroku/sentences.json,
// [en, ja, level] triples.
const { CLIPS } = await import('../src/lib/english/clips/index.ts');
const { deckOf } = await import('../src/lib/english/catalog.ts');
const { planOf } = await import('../src/lib/english/plan.ts');
const { splitUse } = await import('../src/lib/english/phrases.ts');
const SLANG = new Set(['gonna', 'gotta', 'wanna', 'kinda', 'ya', 'yeah', 'y', 'aw', 'um', 'uh', 'huh']);
/** A contraction's first half that's everyday (I'm, don't, let's…). */
const SHORT = new Set(['i', 'you', 'we', 'they', 'he', 'she', 'it', 'that', 'what', 'there', 'let', 'don', 'can', 'isn', 'aren', 'doesn',
  'didn', 'won', 'wasn', 'here', 'who', 'where', 'how']);
const plain = (t: string) => t in everyday || (t.includes("'") && (t.split("'")[0] in everyday || SHORT.has(t.split("'")[0])));
/** By line: an ESL teacher's level (0 drops it) and a Japanese reader's fix (2026-11-17's panel). */
const overrides: Record<string, { level?: number; ja?: string }> = JSON.parse(readFileSync(join(root, 'src/lib/sugoroku/line-overrides.json'), 'utf8'));
const lines: [string, string, number][] = [];
const seenEn = new Set<string>();
for (const e of deckOf(planOf(CLIPS))) {
  const { en, ja } = splitUse(e[4]);
  const words = en.trim().split(/\s+/);
  if (!ja || words.length < 3 || words.length > 6 || seenEn.has(en) || /[*()（）]/.test(en)) continue;
  seenEn.add(en);
  const toks = words.map((w) => w.toLowerCase().replace(/’/g, "'").replace(/[^a-z']/g, ''));
  const known = toks.filter(plain).length / toks.length, slang = toks.some((t) => SLANG.has(t));
  const guess = toks.length <= 4 && known === 1 && !slang ? 1 : toks.length <= 5 && known >= 0.8 && !slang ? 2 : 3;
  // an ESL teacher's level and a Japanese reader's fix win (line-overrides.json; level 0: not for the table)
  const fix = overrides[words.join(' ')] ?? {};
  const level = fix.level ?? guess;
  if (level === 0) continue;
  lines.push([words.join(' '), (fix.ja ?? ja).trim(), level]);
}
writeFileSync(join(root, 'src/lib/sugoroku/sentences.json'), JSON.stringify(lines) + '\n');
console.log(`${lines.length} sentences (${[1, 2, 3].map((l) => lines.filter((x) => x[2] === l).length).join(' / ')} by level)`);
