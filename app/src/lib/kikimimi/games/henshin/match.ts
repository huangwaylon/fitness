// 音の へんしん's dictation, matched forgivingly (docs/kikimimi.md "音の へんしん"): what I typed for the missing words against
// the words said, case and punctuation aside, a contraction as good as its long form either way (I'm = I am, it's = it
// has), the apostrophe optional where no other word is spelled so (dont, im), and a reduced spelling as good as what it
// stands for (gonna = going to, whaddaya = what do you or what are you): I heard it, and that's what was asked. Never a
// near spelling: then / than, think / thing are the very confusions a dictation checks. Pure.

/** Each long form and its contraction, lower case (both sides are folded to the contraction, so either way matches). */
const CONTRACT: readonly (readonly [string, string])[] = [
  ...['i am'].map((l) => [l, "i'm"] as const),
  ...['you', 'we', 'they', 'who', 'what'].flatMap((p) => [[`${p} are`, `${p}'re`]] as const),
  ...['it', 'he', 'she', 'that', 'there', 'what', 'where', 'who', 'how', 'here'].flatMap((p) => [[`${p} is`, `${p}'s`], [`${p} has`, `${p}'s`]] as const),
  ...['i', 'you', 'we', 'they', 'should', 'would', 'could', 'might', 'must'].map((p) => [`${p} have`, `${p}'ve`] as const),
  ...['i', 'you', 'we', 'they', 'he', 'she', 'it', 'that', 'there', 'who', 'what'].flatMap((p) => [[`${p} will`, `${p}'ll`], [`${p} would`, `${p}'d`], [`${p} had`, `${p}'d`]] as const),
  ...['do', 'does', 'did', 'is', 'are', 'was', 'were', 'have', 'has', 'had', 'would', 'could', 'should', 'must'].map((v) => [`${v} not`, `${v}n't`] as const),
  ['will not', "won't"], ['can not', "can't"], ['let us', "let's"]
];
const LONG = new Map(CONTRACT.map(([l, c]) => [l, c]));
/** The contractions typed without their apostrophe that aren't words of their own (its, were, well, ill, id, hell… are). */
const BARE: Readonly<Record<string, string>> = Object.fromEntries([
  ...["i'm", "don't", "doesn't", "didn't", "isn't", "aren't", "wasn't", "weren't", "haven't", "hasn't", "hadn't", "can't", "couldn't", "wouldn't", "shouldn't",
    "mustn't", "won't", "you're", "they're", "that's", "what's", "there's", "where's", "who's", "how's", "let's", "i've", "you've", "we've", "they've",
    "should've", "would've", "could've", "you'll", "they'll", "she'll", "it'll", "that'll", "you'd", "they'd", "she'd"].map((c) => [c.replace(/'/g, ''), c]),
  ['cannot', "can't"], ['em', "'em"]
]);
/** A reduced spelling and what it stands for (more than one where it's said for several). */
const REDUCED: Readonly<Record<string, readonly string[]>> = {
  gonna: ['going to'], wanna: ['want to', 'want a'], gotta: ['got to', 'have got to', 'got a'], hafta: ['have to'], hasta: ['has to'],
  lemme: ['let me'], gimme: ['give me'], dunno: ["don't know"], kinda: ['kind of', 'kind of a'], sorta: ['sort of', 'sort of a'], outta: ['out of'],
  lotta: ['lot of'], lotsa: ['lots of'], coupla: ['couple of'], useta: ['used to'], didja: ['did you'], wouldja: ['would you'], couldja: ['could you'],
  whaddaya: ['what do you', 'what are you'], whatcha: ['what are you', 'what you', 'what do you'], whadja: ['what did you'], gotcha: ['got you'],
  betcha: ['bet you'], letcha: ['let you'], getcha: ['get you'], meetcha: ['meet you'], doncha: ["don't you"], toldja: ['told you'],
  woulda: ["would've"], shoulda: ["should've"], coulda: ["could've"], ya: ['you'], yer: ['your'], "'em": ['them'], "'im": ['him'], "'er": ['her'],
  "'cause": ['because'], cuz: ['because'], fer: ['for'], "y'know": ['you know'], dja: ['did you', 'do you']
};

/** A text's words, lower case: curly quotes straight, punctuation out (an apostrophe inside or leading a word kept). */
export const wordsOf = (s: string): string[] =>
  s.toLowerCase().replace(/[’‘`]/g, "'").replace(/[^a-z0-9'\s-]/g, ' ').split(/[\s-]+/).map((w) => w.replace(/^'+(?!(em|im|er|cause)$)|'+$/g, '')).filter(Boolean);

/** A token of the folded text and the words it came from (their places in the list folded). */
interface Tok {
  t: string;
  of: number[];
}

/** Words folded to one spelling: a bare contraction given its apostrophe, a long form's two words its contraction. */
function fold(words: readonly string[]): Tok[] {
  const out: Tok[] = [];
  for (let i = 0; i < words.length; i++) {
    const w = BARE[words[i]] ?? words[i];
    const pair = i + 1 < words.length ? LONG.get(`${w} ${words[i + 1]}`) : undefined;
    if (pair) (out.push({ t: pair, of: [i, i + 1] }), i++);
    else out.push({ t: w, of: [i] });
  }
  return out;
}

/** The typed words as every reading of its reduced spellings (gonna → going to; whaddaya → what do you, what are you), at most 16. */
function readings(words: readonly string[]): string[][] {
  let all: string[][] = [[]];
  for (const w of words) {
    const alts = REDUCED[w]?.map((x) => x.split(' ')) ?? [[w]];
    all = all.flatMap((a) => alts.map((x) => [...a, ...x])).slice(0, 16);
  }
  return all;
}

/** The longest common run of two token lists, as which of `b`'s tokens it uses. */
function lcs(a: readonly string[], b: readonly string[]): boolean[] {
  const n = a.length, m = b.length, L = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const used = new Array<boolean>(m).fill(false);
  for (let i = 0, j = 0; i < n && j < m; ) {
    if (a[i] === b[j]) (used[j] = true), i++, j++;
    else if (L[i + 1][j] >= L[i][j + 1]) i++;
    else j++;
  }
  return used;
}

/** Typed words beyond the target's this many (an "um", a stray "the") still count; more and nothing does. */
const EXTRA = 1;

/**
 * Which of the target's words (the dictation's missing words, in order) the typed text has: each slot right or not.
 * Right when the typed text, folded, has the target's folded tokens in order, with at most EXTRA words besides; a slot
 * is right when every token it's part of was matched (I am → I'm: both slots on the one token).
 */
export function matchTyped(typed: string, target: readonly string[]): boolean[] {
  const want = fold(target.flatMap(wordsOf)), slots = target.map((w) => wordsOf(w).length);
  // a target word's place among the target's words (a slot can be two words: "I've" is one, "kind of" two)
  const wordSlot = slots.flatMap((n, j) => new Array<number>(n).fill(j));
  const typedWords = wordsOf(typed);
  let best: { used: boolean[]; extra: number } | null = null;
  for (const r of readings(typedWords)) {
    const got = fold(r).map((x) => x.t), used = lcs(got, want.map((x) => x.t));
    const hit = used.filter(Boolean).length, extra = got.length - hit;
    if (!best || hit > best.used.filter(Boolean).length || (hit === best.used.filter(Boolean).length && extra < best.extra)) best = { used, extra };
  }
  const ok = target.map(() => true);
  if (!best || !typedWords.length || best.extra > EXTRA) return target.map(() => false);
  want.forEach((tok, k) => {
    if (!best!.used[k]) for (const i of tok.of) ok[wordSlot[i]] = false;
  });
  return ok;
}
