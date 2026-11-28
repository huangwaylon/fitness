// 聞き取りチャレンジ's lines, made at build time (docs/english.md "Catch the line"; vite.config.ts english-data): a
// clip's caption-checked short lines with their chunks' times. A line is a live question's `line` (one speaker, one
// sentence: no — … / nor "Name:"), 3–10 words, every word found in YouTube's auto captions (english-captions/<video>
// .en.json3) near the question's segment, in order, spoken within MAX_SPAN s; its Japanese the one 「…」 its `said`
// quotes. Its segment is cut from the caption words' own times (LEAD before the first, the player's 0.4 s tail after the
// last), so the line is all that plays. Chunks (catch.ts chunksOf) and 1–2 distractor chunks (a minimal pair swapped
// into one of its chunks, or a word of another line of the clip). Pure: the caller reads the files.
import type { CatchLine, Clip, Question } from './types.ts';

type Json3 = { events?: { tStartMs?: number; segs?: { utf8?: string; tOffsetMs?: number }[] }[] };
/** A caption word: normalized, its start and end, s. */
type Word = { w: string; t: number; e: number };

/** The line's words spoken within this long at most (first word's start to last word's end), s. */
export const MAX_SPAN = 6;
/** Words a line, at least and at most. */
const MIN_WORDS = 3, MAX_WORDS = 10;
/** Played from this long before the first word (the captions' times run a little late), s. */
const LEAD = 0.3;
/** Caption words searched this far around the question's segment, s. */
const NEAR = 3;
/** Lines a clip at most (the lesson draws 2). */
const PER_CLIP = 8;
/** The skills whose line is the point (a form item first: its line is what the question asked to hear). */
const FORM = new Set<Question['skill']>(['dict', 'sound', 'phrase', 'marker']);

/** The tiles a line at most, and at least (fewer: no line). */
export const MAX_TILES = 6;
const MIN_TILES = 3;
/** Words said weakly with the word after them (an article, a possessive, a short preposition): a chunk with it, so a
 *  tile is a sound an A2 ear can hear, never a lone "a" or "of". */
const GLUE = new Set('a an the my your his her our their its to of in on at for with from'.split(' '));
/** Words said weakly before the next (a pronoun, an auxiliary, a conjunction): joined to it first when over MAX_TILES. */
const WEAK = new Set(("i you he she we they it this that is are was were be been will would can could do does did don't can't won't " +
  "i'm you're we're they're it's that's he's she's i'll you'll i've if and but so or not just").split(' '));
/** The shows' people: a line's first word kept capitalized when it's one of them. */
const NAMES = new Set(('Rachel Ross Monica Chandler Joey Phoebe Gunther Janice Emma Ben Carol Susan Mike Michael Dwight Jim Pam Ryan Andy ' +
  'Angela Kevin Oscar Stanley Phyllis Creed Meredith Kelly Toby Erin Darryl Jan Holly Gabe Leslie Ron Ann April Tom Chris Jerry Donna Craig ' +
  'Garry Carly Sam Freddie Spencer Gibby Lewbert Terry').split(' '));

/** A line's words as tiles show them: its punctuation dropped (an apostrophe kept), the first word lower case unless
 *  it's I (I'm, I'll…) or a name (NAMES, or `names`: the clip's words capitalized mid-sentence), so no tile gives the
 *  start away. */
export function wordsIn(line: string, names: ReadonlySet<string> = NAMES): string[] {
  const ws = line.split(/\s+/).map((w) => w.replace(/[^\p{L}\p{N}'’]/gu, '').replace(/^['’]+|['’]+$/g, '')).filter(Boolean);
  if (ws[0] && !/^I(['’]|$)/.test(ws[0]) && !NAMES.has(ws[0]) && !names.has(ws[0])) ws[0] = ws[0][0].toLowerCase() + ws[0].slice(1);
  return ws;
}

/** A line's chunks: each GLUE word with the word after it; then, over MAX_TILES, the shortest neighbouring pair joined
 *  till it fits; under MIN_TILES, the words alone (≤ MAX_TILES of them). */
export function chunksOf(words: readonly string[]): string[] {
  const out: string[] = [];
  let carry = '';
  for (const w of words) {
    if (GLUE.has(w.toLowerCase()) && w !== words.at(-1)) carry = carry ? `${carry} ${w}` : w;
    else out.push(carry ? `${carry} ${w}` : w), (carry = '');
  }
  if (carry) out.push(carry);
  if (out.length < MIN_TILES && words.length >= MIN_TILES && words.length <= MAX_TILES) return [...words];
  while (out.length > MAX_TILES) {
    let best = 0;
    const cost = (i: number) => out[i].length + out[i + 1].length + (WEAK.has(out[i].split(' ').at(-1)!.toLowerCase().replace(/’/g, "'")) ? 0 : 100);
    for (let i = 1; i < out.length - 1; i++) if (cost(i) < cost(best)) best = i;
    out.splice(best, 2, `${out[best]} ${out[best + 1]}`);
  }
  return out;
}

const norm = (s: string) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9']/g, '').replace(/'/g, '');

/** The caption words of a json3 file, in time order. */
export function captionWords(d: Json3): Word[] {
  const out: Word[] = [];
  for (const ev of d.events ?? []) for (const s of ev.segs ?? []) {
    for (const part of (s.utf8 ?? '').replace(/\[[^\]]*\]|>>/g, ' ').split(/[\s\-–]+/)) {
      const w = norm(part);
      if (w) out.push({ w, t: ((ev.tStartMs ?? 0) + (s.tOffsetMs ?? 0)) / 1000, e: 0 });
    }
  }
  out.sort((a, b) => a.t - b.t);
  out.forEach((x, i) => (x.e = Math.min(out[i + 1]?.t ?? x.t + 0.6, x.t + 0.6)));
  return out;
}

/** One speaker's one sentence (no turn, pause or speaker's name), its stars dropped; else null. */
export function plainLine(line: string | undefined): string | null {
  if (!line || /[—…/]|\.\.\.|^\s*[A-Z][a-z]+:/.test(line)) return null;
  const t = line.replace(/\*/g, '').trim();
  // one sentence: no stop but at its end
  return /[.?!]\s+\S/.test(t) ? null : t;
}

/** The one 「…」 a `said` quotes (its Japanese), else null. */
export function quoteOf(said: string): string | null {
  const m = said.match(/「([^「」]+)」/g);
  return m?.length === 1 ? m[0].slice(1, -1) : null;
}

/** The line's words in the captions near `seg`, every one in order (≤ 1 filler between two), else null: each word's
 *  caption start and end. */
export function locate(words: readonly string[], cw: readonly Word[], seg: readonly [number, number]): { t: number; e: number }[] | null {
  const n = words.map(norm);
  const lo = cw.findIndex((x) => x.t >= seg[0] - NEAR);
  if (lo < 0) return null;
  const hits: { t: number; e: number }[][] = [];
  for (let i = lo; i < cw.length && cw[i].t <= seg[1] + NEAR; i++) {
    if (cw[i].w !== n[0]) continue;
    const got = [cw[i]];
    let j = i;
    for (let k = 1; k < n.length; k++) {
      const at = cw[j + 1]?.w === n[k] ? j + 1 : cw[j + 2]?.w === n[k] ? j + 2 : -1;
      if (at < 0) break;
      got.push(cw[(j = at)]);
    }
    if (got.length === n.length) hits.push(got);
  }
  // once only: twice near the segment can't say which
  return hits.length === 1 ? hits[0].map(({ t, e }) => ({ t, e })) : null;
}

/** Near pairs an A2 ear mixes up, never homophones (to/too, for/four, know/no, your/you're: no ear tells those apart):
 *  a chunk with one swapped is a distractor that sounds close and is told by listening. */
const PAIRS: Record<string, string> = {
  can: "can't", "can't": 'can', is: 'was', was: 'is', are: 'were', were: 'are', him: 'them', them: 'him', he: 'she', she: 'he',
  this: 'that', that: 'this', these: 'those', those: 'these', do: 'did', did: 'do', does: 'did', have: 'had', had: 'have',
  "don't": "didn't", "didn't": "don't", "doesn't": "didn't", will: 'would', would: 'will', could: 'can', in: 'on', on: 'in', at: 'in',
  some: 'any', any: 'some', me: 'my', my: 'me', think: 'thing', thing: 'think', got: 'get', get: 'got', said: 'say', say: 'said',
  want: 'wanted', wanted: 'want', need: 'needed', like: 'liked', know: 'knew', knew: 'know', come: 'came', came: 'come', tell: 'told',
  told: 'tell', go: 'going', going: 'go', you: 'we', we: 'you', they: 'we', always: 'all', never: 'ever', anything: 'something',
  something: 'anything', everyone: 'anyone', anyone: 'everyone', here: 'there', there: 'here', now: 'no', all: 'old', much: 'many', many: 'much'
};
const keepCase = (from: string, to: string) => (/^[A-Z]/.test(from) && to !== 'I' ? to[0].toUpperCase() + to.slice(1) : to);

/** 1 distractor for ≤ 4 chunks, else 2: a chunk with a minimal pair swapped in (a different chunk each), then words of
 *  the clip's other lines (`others`) not in this one; never one of its own chunks. */
export function distractorsOf(chunks: readonly string[], others: readonly string[], seed: number): string[] {
  const want = chunks.length <= 4 ? 1 : 2, own = new Set(chunks.map((c) => c.toLowerCase())), out: string[] = [];
  const order = chunks.map((_, i) => i).sort((a, b) => ((a * 7 + seed) % 11) - ((b * 7 + seed) % 11) || a - b);
  for (const i of order) {
    if (out.length >= want) break;
    const ws = chunks[i].split(' ');
    const k = ws.findIndex((w) => PAIRS[w.toLowerCase()]);
    if (k < 0) continue;
    const swapped = ws.map((w, j) => (j === k ? keepCase(w, PAIRS[w.toLowerCase()]) : w)).join(' ');
    if (!own.has(swapped.toLowerCase()) && !out.includes(swapped)) out.push(swapped);
  }
  const mine = new Set(chunks.flatMap((c) => c.toLowerCase().split(' ')));
  const pool = [...new Set(others.flatMap((l) => wordsIn(l)).filter((w) => w.length >= 3 && /^[a-z]/.test(w) && !mine.has(w.toLowerCase())))];
  for (let i = 0; out.length < want && i < pool.length; i++) {
    const w = pool[(seed + i * 5) % pool.length];
    if (!out.includes(w) && !own.has(w.toLowerCase())) out.push(w);
  }
  return out;
}

/** A clip's catch lines (≤ PER_CLIP, form items' first, one per line's words), from its captions' words. */
export function catchLinesOf(c: Clip, cw: readonly Word[]): CatchLine[] {
  if (!cw.length) return [];
  const live = c.questions.filter((q) => !q.retired);
  const seen = new Set<string>(), out: CatchLine[] = [];
  const ranked = live.toSorted((a, b) => +FORM.has(b.skill) - +FORM.has(a.skill) || (a.level === 'B1' ? 0 : 1) - (b.level === 'B1' ? 0 : 1));
  const allLines = live.flatMap((q) => plainLine(q.line) ?? []);
  const names = new Set(live.flatMap((q) => [...(q.line ?? '').matchAll(/(?<=[a-z,] )[A-Z][a-z]+/g)].map((m) => m[0])));
  for (const q of ranked) {
    if (out.length >= PER_CLIP) break;
    const text = plainLine(q.line), ja = quoteOf(q.said);
    if (!text || !ja || ja.length > 40 || /[。？！].+/.test(ja)) continue;
    const words = wordsIn(text, names);
    const key = words.join(' ').toLowerCase();
    if (words.length < MIN_WORDS || words.length > MAX_WORDS || seen.has(key)) continue;
    const at = locate(words, cw, q.seg);
    if (!at || at.at(-1)!.e - at[0].t > MAX_SPAN) continue;
    const chunks = chunksOf(words);
    if (chunks.length < MIN_TILES) continue;
    seen.add(key);
    let w = 0;
    const t = chunks.map((ch) => {
      const s = at[w].t;
      w += ch.split(' ').length;
      return Math.round(s * 100) / 100;
    });
    const seed = [...q.id].reduce((h, ch) => h * 31 + ch.charCodeAt(0), 7) >>> 0;
    out.push({
      q: q.id,
      seg: [Math.round(Math.max(0, at[0].t - LEAD) * 100) / 100, Math.round(at.at(-1)!.e * 100) / 100],
      tiles: chunks, t, ja,
      x: distractorsOf(chunks, allLines.filter((l) => l !== text), seed)
    });
  }
  return out.sort((a, b) => a.seg[0] - b.seg[0]);
}
