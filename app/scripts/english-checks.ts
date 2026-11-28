// English Study's mechanical content checks (docs/english.md "Content", Rules; the 2026-11-28 panel's O7): what a
// reviewer kept finding by hand, checked against YouTube's word times (english-captions/<video>.en.json3 at the repo
// root) and the whisper transcripts. clips.test.ts asserts each list empty; run alone it prints the offenders:
//   node scripts/english-checks.ts [clip id…]
//   a. tail:  a live item's segment end + the player's 0.4 s run-on (and a predict's continuation) inside an EXCLUDE
//   b. line:  the quoted line's starred words (a dictation's answer) not inside its segment by caption word times
//   c. gap:   a fill-the-gap item's distractor that, put in the gap, is said inside the segment
//   d. crude: a crude or drug word said inside a played segment (+0.4 s) and not under an EXCLUDE (`// CRUDE-OK a–b: why`
//             for a narrowly justified one), or quoted by a line
//   e. a report of the clips with no captions file (checks b and c fall back or skip there)
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CLIPS } from '../src/lib/english/clips/index.ts';
import type { Clip, Question, TranscriptFile } from '../src/lib/english/types.ts';

/** How long the player runs past a segment's end, s (docs/english.md "The player"). */
export const RUN_ON = 0.4;
const HERE = join(import.meta.dirname, '../src/lib/english');
const CAPTIONS = join(import.meta.dirname, '../../english-captions');

type Span = readonly [number, number];
type Json3 = { events?: { tStartMs?: number; segs?: { utf8?: string; tOffsetMs?: number }[] }[] };
/** A caption word: normalized text, its start and (estimated) end, s. */
export type Word = { w: string; t: number; e: number; loose?: true };

export const norm = (s: string) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9']/g, '').replace(/'/g, '');

const ONES = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split(' ');
const TENS = 'x x twenty thirty forty fifty sixty seventy eighty ninety'.split(' ');
/** A caption's numeral as words, the way a line spells it (500 → five hundred; 1996 → nineteen ninety six); any other
 *  word as it is. */
function numberWords(w: string): string[] {
  if (!/^\d{1,4}$/.test(w)) return w ? [w] : [];
  const n = +w, two = (k: number): string[] => (k < 20 ? [ONES[k]] : [TENS[Math.floor(k / 10)], ...(k % 10 ? [ONES[k % 10]] : [])]);
  if (n < 100) return two(n);
  if (n < 1000) return [ONES[Math.floor(n / 100)], 'hundred', ...(n % 100 ? two(n % 100) : [])];
  if (n % 1000 === 0) return [...two(n / 1000), 'thousand'];
  return [...two(Math.floor(n / 100)), ...(n % 100 ? two(n % 100) : ['hundred'])];
}

/** The caption words of a json3 file, in time order. */
export function wordsOf(d: Json3): Word[] {
  const out: Word[] = [];
  for (const ev of d.events ?? [])
    for (const s of ev.segs ?? [])
      for (const part of (s.utf8 ?? '').replace(/\[[^\]]*\]|>>/g, ' ').split(/[\s\-–]+/)) {
        const t = ((ev.tStartMs ?? 0) + (s.tOffsetMs ?? 0)) / 1000;
        for (const w of numberWords(norm(part))) out.push({ w, t, e: 0, ...(s.tOffsetMs === undefined ? { loose: true as const } : {}) });
      }
  out.sort((a, b) => a.t - b.t);
  out.forEach((x, i) => {
    x.e = Math.min(out[i + 1]?.t ?? x.t + 0.6, x.t + 0.6);
    // an event's first word carries the event's start: after a gap ≥ 2 s that's when the caption showed (the last word
    // of a sentence before a laugh: janicesocks's “there” 7 s after “weren't”), not when it was said
    if (x.loose && !(i > 0 && x.t - out[i - 1].t >= 2)) delete x.loose;
  });
  return out;
}

const SRC = new Map<string, string>();
/** A clip's source file (its header markers). */
export const srcOf = (c: Clip) => SRC.get(c.id) ?? (SRC.set(c.id, readFileSync(join(HERE, 'clips', `${c.id}.ts`), 'utf8')), SRC.get(c.id)!);
const CW = new Map<string, Word[] | null>();
/** A clip's caption words, or null when it has no captions file. */
export function captionsOf(c: Clip): Word[] | null {
  if (!CW.has(c.video)) {
    const p = join(CAPTIONS, `${c.video}.en.json3`);
    CW.set(c.video, existsSync(p) ? wordsOf(JSON.parse(readFileSync(p, 'utf8'))) : null);
  }
  return CW.get(c.video)!;
}
const TF = new Map<string, TranscriptFile['lines'] | null>();
export function transcriptOf(c: Clip): TranscriptFile['lines'] | null {
  if (!TF.has(c.video)) {
    const p = join(HERE, 'transcripts', `${c.video}.en.json`);
    TF.set(c.video, existsSync(p) ? (JSON.parse(readFileSync(p, 'utf8')) as TranscriptFile).lines : null);
  }
  return TF.get(c.video)!;
}

/** A header's `// <tag> a–b[, c–d][: why]` spans. */
export const spansOf = (src: string, tag: string): Span[] =>
  [...src.matchAll(new RegExp(`^// ${tag} ([^:\\n]*)`, 'gm'))].flatMap((m) => [...m[1].matchAll(/(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)/g)].map((r) => [+r[1], +r[2]] as Span));
const overlaps = (s: Span, spans: readonly Span[]) => spans.some(([x, y]) => s[0] < y && s[1] > x);
/** What a live item plays: its segment and a predict's continuation, each with the run-on. */
export const played = (q: Question): Span[] => [q.seg, ...(q.then ? [q.then] : [])].map((s) => [s[0], s[1] + RUN_ON] as Span);
const live = (c: Clip) => c.questions.filter((q) => !q.retired);
const f1 = (n: number) => n.toFixed(1);

// ── a. the run-on into an EXCLUDE
export function tailOffenders(c: Clip): string[] {
  const ex = spansOf(srcOf(c), 'EXCLUDE');
  return live(c).flatMap((q) => (played(q).some((s) => overlaps([s[0], s[1] - 1e-6], ex)) && ![q.seg, ...(q.then ? [q.then] : [])].some((s) => overlaps(s, ex)) ? [`${q.id} ends ${q.then?.[1] ?? q.seg[1]} (+${RUN_ON} s) into EXCLUDE ${ex.filter((s) => overlaps([s[0] - RUN_ON, s[1]], [[q.seg[0], (q.then?.[1] ?? q.seg[1]) + RUN_ON]])).map((s) => s.join('–')).join(', ')}`] : []));
}

// ── b. the starred words inside the segment
const lev = (a: string, b: string): number => {
  const d = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0];
    d[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cur = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
  }
  return d[b.length];
};
/** 2 the same word, 1.2 a spelling apart (whisper vs captions: gonna/going, ok/okay), −1 another. */
const sim = (a: string, b: string): number =>
  a === b ? 2 : (a.length >= 4 && b.length >= 4 && lev(a, b) / Math.max(a.length, b.length) <= 0.25) || (a.length >= 2 && b.length >= 2 && SAME.has(`${a} ${b}`)) ? 1.2 : -1;
const SAME = new Set(['ok okay', 'okay ok', 'gonna going', 'going gonna', 'wanna want', 'want wanna', 'gotta got', 'got gotta', 'til until', 'until til', 'cause because', 'because cause', 'em them', 'them em', 'yeah yes', 'yes yeah', 'mr mister', 'mister mr', 'mrs missus', 'dr doctor', 'doctor dr']);

/** A line's tokens (speaker labels, parentheses and stars dropped), each with whether it was starred and whether a
 *  fragment (… or a turn) ends after it. */
export function tokensOf(line: string): { w: string; star: boolean; brk: boolean }[] {
  const out: { w: string; star: boolean; brk: boolean }[] = [];
  for (const turn of line.split(' / ')) {
    const body = turn.replace(/^\s*[A-Z][\w’'.]*(?: [A-Z][\w’'.]*){0,2}(?: \([^)]*\))?:\s/, '').replace(/\([^)]*\)/g, ' ');
    body.split('*').forEach((part, k) => {
      for (const frag of part.split(/(…|\.\.\.|—)/)) {
        if (/^(…|\.\.\.|—)$/.test(frag)) {
          if (out.length) out[out.length - 1].brk = true;
          continue;
        }
        for (const raw of frag.split(/[\s\-–]+/)) {
          const w = norm(raw);
          if (w) out.push({ w, star: k % 2 === 1, brk: false });
        }
      }
    });
    if (out.length) out[out.length - 1].brk = true;
  }
  return out;
}

/** The best local alignment of `toks` in cw[lo, hi): token index → caption word index, and the share matched. */
export function align(toks: { w: string; brk: boolean }[], cw: Word[], lo: number, hi: number): { map: Map<number, number>; ratio: number } {
  const n = toks.length, m = hi - lo, W = m + 1;
  const H = new Float32Array((n + 1) * W);
  let best = 0, bi = 0, bj = 0;
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++) {
      const h = Math.max(0, H[(i - 1) * W + j - 1] + sim(toks[i - 1].w, cw[lo + j - 1].w), H[(i - 1) * W + j] - 1, H[i * W + j - 1] - (toks[i - 1].brk ? 0.05 : 0.6));
      H[i * W + j] = h;
      if (h > best) (best = h), (bi = i), (bj = j);
    }
  const map = new Map<number, number>();
  for (let i = bi, j = bj; i > 0 && j > 0 && H[i * W + j] > 0;) {
    const h = H[i * W + j], s = sim(toks[i - 1].w, cw[lo + j - 1].w);
    if (h === H[(i - 1) * W + j - 1] + s) {
      if (s > 0) map.set(i - 1, lo + j - 1);
      i--, j--;
    } else if (h === H[(i - 1) * W + j] - 1) i--;
    else j--;
  }
  return { map, ratio: n ? map.size / n : 0 };
}

/** The share of starred words that must be heard inside the segment (whisper and the captions differ on a word now
 *  and then). */
const HELD = 0.8;
/** How far outside its segment a line is looked for, s (further off, a repeated word, not the line). */
const NEAR = 5;
/** Where a line sits in the captions near its item: each starred token's caption time, or why it can't be placed. */
export function starTimes(q: Question, cw: Word[]): { star: (number | null)[]; ratio: number } | string {
  const line = q.line ?? (q.answer ? `*${q.answer}*` : undefined);
  if (!line) return 'no line';
  let toks = tokensOf(line);
  if (!toks.some((t) => t.star)) toks = toks.map((t) => ({ ...t, star: true }));
  const end = q.then?.[1] ?? q.seg[1];
  const lo = Math.max(0, cw.findIndex((x) => x.t >= q.seg[0] - NEAR)), k = cw.findIndex((x) => x.t > end + NEAR), hi = k < 0 ? cw.length : k;
  if (hi <= lo) return 'no captions there';
  const { map, ratio } = align(toks, cw, lo, hi);
  // a line placed on too few of its words isn't placed: whisper and the captions disagree too much there
  if (ratio < 0.5 || map.size < 2 && toks.length > 1) return `placed on ${Math.round(ratio * 100)} % of its words`;
  const star = toks.flatMap((t, i) => (t.star ? [map.has(i) && !cw[map.get(i)!].loose ? cw[map.get(i)!].t : null] : []));
  // the starred words themselves placed on too few (the captions miss the line: ronshot's scotch)
  if (star.filter((t) => t !== null).length < star.length / 2) return 'its starred words not placed';
  return { star, ratio };
}

export function lineOffenders(c: Clip): string[] {
  const cw = captionsOf(c);
  if (!cw) return [];
  return live(c).flatMap((q) => {
    if (q.skill === 'gist' && !q.line) return [];
    const p = starTimes(q, cw);
    if (typeof p === 'string') return [];
    const placed = p.star.filter((t): t is number => t !== null);
    if (!placed.length) return [];
    // heard: a word starting from 0.3 s before the segment (its tail heard) to 0.2 s before the run-on stops (its first
    // syllable heard)
    const from = q.seg[0] - 0.3, to = (q.then?.[1] ?? q.seg[1]) + RUN_ON - 0.2;
    const ok = placed.filter((t) => t >= from && t <= to).length;
    if (ok / placed.length >= HELD) return [];
    const out = placed.filter((t) => t < from || t > to).map(f1);
    return [`${q.id} [${q.seg.join(', ')}]: ${ok}/${placed.length} placed starred words inside; outside at ${out.join(', ')} s`];
  });
}

// ── c. a gap's distractor said in the segment
/** Words as the captions write them: normalized, gonna → going to (and wanna, gotta). */
const spoken = (ws: string[]) => ws.map(norm).filter(Boolean).flatMap((w) => ({ gonna: ['going', 'to'], wanna: ['want', 'to'], gotta: ['got', 'to'] })[w] ?? [w]);
/** The quoted text of a stem with a gap (___), split at the gap: [before, after] as tokens. */
function gapOf(stem: string): [string[], string[]] | null {
  const m = stem.match(/[“"]([^”"]*_{2,}[^”"]*)[”"]/) ?? stem.match(/:\s*(.*_{2,}.*)$/);
  if (!m) return null;
  const [a, b] = m[1].split(/_{2,}/);
  const tok = (s: string) => spoken(s.split(/[\s\-–…]+/));
  return [tok(a ?? ''), tok(b ?? '')];
}
/** The words said in [a, b): the captions' (by word time), else the whisper lines overlapping it. */
function heardIn(c: Clip, a: number, b: number): string[] {
  const cw = captionsOf(c);
  if (cw) return spoken(cw.filter((w) => w.t >= a - 0.2 && w.t < b).map((w) => w.w));
  return (transcriptOf(c) ?? []).filter((l) => l.t[0] < b && l.t[1] > a).flatMap((l) => spoken(l.en.split(/[\s\-–]+/)));
}
/** Where `needle` starts in `hay`. */
const at = (hay: string[], needle: string[]) => (needle.length ? hay.flatMap((_, i) => (needle.every((w, k) => hay[i + k] === w) ? [i] : [])) : []);

export function gapOffenders(c: Clip): string[] {
  return live(c).flatMap((q) => {
    if (!q.choices || q.a === undefined) return [];
    const g = gapOf(q.stem);
    if (!g) return [];
    const heard = played(q).flatMap(([a, b]) => heardIn(c, a, b));
    const tok = (s: string) => spoken(s.split(/[\s\-–]+/));
    // the distractor put in the gap, heard with the gap's own neighbours (one word each side, so a common word said
    // elsewhere in the segment, or a key holding the distractor, doesn't count); with no context, 2+ words heard at all
    const needleOf = (d: string) => [...g[0].slice(-1), ...tok(d), ...g[1].slice(0, 1)];
    // where the key is heard (a distractor inside the key's words, “you know what” in “do you know what”, isn't said)
    const key = needleOf(q.choices[q.a]), keyAt = at(heard, key).map((i) => [i, i + key.length] as const);
    const said = (d: string) => {
      const w = tok(d), needle = needleOf(d);
      if (!w.length || (needle.length === w.length && w.length < 2)) return false;
      return at(heard, needle).some((i) => !keyAt.some(([x, y]) => i >= x && i + needle.length <= y));
    };
    return q.choices.flatMap((d, i) => (i !== q.a && said(d) ? [`${q.id}: “${d}” is said in the gap's place (${q.stem})`] : []));
  });
}

// ── d. crude and drug words
/** Words no played segment may carry (2026-11-28, beside clips.test.ts SWEAR): drugs, crude body and sex words. Not
 *  here, by choice: naked, nipple, hump, a baby's sex, a sex scandal (plain words in these shows). */
export const CRUDE = /\b(cocaine|coke ?heads?|heroin|meth|marijuana|weed|stoned|stoner|smok(?:e|ed|ing) (?:pot|a joint|weed|crack)|pot ?brownies?|roll(?:ed|ing)? a joint|crack ?(?:head|pipe|cocaine)|pimp\w*|hookers?|prostitut\w*|whores?|sluts?|slutty|boob\w*|tits|titties|pee|peed|peeing|pees|piss\w*|porn\w*|virgin(?:s|ity)?|orgasm\w*|horny|condoms?|penis\w*|vagina\w*|boners?|erections?|masturbat\w*|testicles?|(?:have|having|had) sex|sex (?:stuff|life|tape)|sexual\w*)\b/gi;
const crudeIn = (text: string) => text.match(CRUDE) ?? [];

/** Where a whisper line's word (at character `k`) sits when the captions don't have it (bleeped, misheard: “boob” as
 *  “boot”): between the caption words its neighbours align to, the line aligned to the captions near it (whisper's
 *  times drift by seconds); none when they don't align. */
function between(l: { t: Span; en: string }, k: number, cw: Word[]): Span[] {
  const toks = l.en.split(/[\s\-–]+/).map((raw) => ({ w: norm(raw), brk: false, raw })).filter((x) => x.w);
  const idx = l.en.slice(0, k).split(/[\s\-–]+/).map(norm).filter(Boolean).length;
  const lo = Math.max(0, cw.findIndex((x) => x.t >= l.t[0] - 10)), j = cw.findIndex((x) => x.t > l.t[1] + 10), hi = j < 0 ? cw.length : j;
  if (hi <= lo) return [];
  const { map } = align(toks, cw, lo, hi);
  const before = [...map.keys()].filter((i) => i < idx).sort((a, b) => b - a)[0], after = [...map.keys()].filter((i) => i > idx).sort((a, b) => a - b)[0];
  if (before === undefined && after === undefined) return [];
  const t0 = before !== undefined ? cw[map.get(before)!].t + 0.1 : cw[map.get(after!)!].t - 0.6;
  const t1 = after !== undefined ? cw[map.get(after)!].t : t0 + 0.6;
  return [[t0, Math.max(t1, t0 + 0.2)]];
}

/** The crude words a live item plays: found in the whisper text (the better words), placed by the caption words when
 *  the captions have the word near that whisper line (else the whisper line's own span, ±0.5 s). */
export function crudeOffenders(c: Clip): string[] {
  const src = srcOf(c), ex = spansOf(src, 'EXCLUDE'), ok = spansOf(src, 'CRUDE-OK'), shut = [...ex, ...ok];
  const cw = captionsOf(c), lines = transcriptOf(c) ?? [];
  // each whisper hit: its word and the times it may be at
  const hits = lines.flatMap((l) =>
    [...l.en.matchAll(CRUDE)].map((m) => {
      const first = norm(m[0].split(/\s+/)[0]);
      let at = (cw ?? []).filter((w) => w.w === first && w.t >= l.t[0] - 1 && w.t <= l.t[1] + 1).map((w) => [w.t, w.t + 0.4] as Span);
      if (!at.length && cw) at = between(l, m.index!, cw);
      return { m: m[0], at: at.length ? at : [[l.t[0] + 0.5, l.t[1] - 0.5] as Span] };
    })
  );
  const out: string[] = [];
  for (const q of live(c)) {
    const heard = hits.filter((h) => h.at.some((s) => overlaps(s, played(q)) && !shut.some(([x, y]) => x <= s[0] + 0.05 && y >= s[1] - 0.35)));
    const said = heard.map((h) => `“${h.m}” ${f1(h.at[0][0])} s`);
    const quoted = q.line && crudeIn(q.line.replace(/\*/g, ''))[0];
    if (quoted && !overlaps(q.seg, ok)) said.push(`its line quotes “${quoted}”`);
    if (said.length) out.push(`${q.id} [${q.seg.join(', ')}]: ${[...new Set(said)].join(', ')}`);
  }
  return out;
}

// ── e. no captions
export const noCaptions = () => CLIPS.filter((c) => !captionsOf(c)).map((c) => c.id);

export const CHECKS = { tail: tailOffenders, line: lineOffenders, gap: gapOffenders, crude: crudeOffenders } as const;

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const only = process.argv.slice(2);
  const clips = only.length ? CLIPS.filter((c) => only.includes(c.id)) : CLIPS;
  for (const [name, f] of Object.entries(CHECKS)) {
    const rows = clips.flatMap((c) => f(c).map((r) => `${c.id} ${r}`));
    console.log(`\n## ${name}: ${rows.length}\n${rows.join('\n')}`);
  }
  const none = noCaptions();
  console.log(`\n## no captions file: ${none.length} clips\n${none.join(' ')}`);
}
