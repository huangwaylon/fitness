// English Study's segments from YouTube's word timings (docs/english.md "Content"). Reads the auto captions as json3
// (<video>.en-orig.json3 or <video>.en.json3, fetched as for scripts/english-wpm.ts), whose words carry their own
// offsets; the whisper transcripts lend them sentence ends (punctuation, aligned word by word), as do pauses ≥ 1.3 s
// and >> turns. Each live item's `line` (stars and … dropped) is aligned to the words near its segment, and its segment
// set from where the line really is: from the start of its sentence and ≥ 1.5 s before its first word, to the end of
// its sentence and ≥ 1 s after its last word (an end landing in the next sentence goes on to its end when ≤ 3 s off,
// else back to just before it when that's after the line: the player plays 0.4 s on); ≥ 5 s;
// ≤ 12 s where the margins allow (a gist ≤ 45 s, only ever longer; a dictation ≤ 8 s); never shrunk when it already
// held the line with margins. A predict keeps its cut (seg's end = then's start): its start is set so, and its `then`
// reaches the reply's sentence end (≤ 10 s). No line: only an end mid-sentence is carried to the sentence's end. A line
// matched < 60 % (or twice, neither nearer) is left and listed.
//   npm run english:segs -- <captions dir>                  → the stats before/after, nothing written
//   npm run english:segs -- <captions dir> --write [left.md] → and writes seg/then (items re-sorted into clip order),
//                                                             the ones left listed in left.md
//   SEGDBG=<clip id> …                                      → its items, old → new, with the caption words (| an end)
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { CLIPS } from '../src/lib/english/clips/index.ts';
import type { Clip, Question, TranscriptFile } from '../src/lib/english/types.ts';

type Json3 = { events?: { tStartMs?: number; dDurationMs?: number; segs?: { utf8?: string; tOffsetMs?: number }[] }[] };
/** A caption word: its text (normalized), start and end (s), and whether a sentence or turn ends after it. */
type Word = { w: string; t: number; e: number; end: boolean };

const SHORT = 12, GIST = 45, DICT = 8, MIN = 5, LEAD = 1.5, TAIL = 1, REACH = 8, PAUSE = 1.3;
const norm = (s: string) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9']/g, '').replace(/'/g, '');

/** The caption words, sentence ends from pauses and >> only. */
function wordsOf(d: Json3): Word[] {
  const out: Word[] = [];
  let turn = false;
  for (const ev of d.events ?? []) for (const s of ev.segs ?? []) {
    const raw = s.utf8 ?? '';
    if (/>>/.test(raw)) turn = true;
    for (const part of raw.replace(/\[[^\]]*\]/g, ' ').split(/[\s\-–]+/)) {
      const w = norm(part);
      if (!w) continue;
      if (turn && out.length) out[out.length - 1].end = true;
      turn = false;
      out.push({ w, t: ((ev.tStartMs ?? 0) + (s.tOffsetMs ?? 0)) / 1000, e: 0, end: false });
    }
  }
  out.sort((a, b) => a.t - b.t);
  out.forEach((x, i) => {
    const next = out[i + 1]?.t ?? x.t + 0.8;
    x.e = Math.min(next, x.t + 0.8);
    if (next - x.t >= PAUSE) x.end = true;
  });
  return out;
}

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
/** 2 the same word, 1.2 a spelling apart (whisper vs captions), −1 another. */
const sim = (a: string, b: string): number =>
  a === b ? 2 : a.length >= 4 && b.length >= 4 && lev(a, b) / Math.max(a.length, b.length) <= 0.25 ? 1.2 : -1;

/** Whisper's sentence ends onto the caption words: a global alignment of the two word streams. */
function punctuate(cw: Word[], tf: TranscriptFile): void {
  const ww = tf.lines.flatMap((l) => l.en.split(/[\s\-–]+/).map((x) => ({ w: norm(x), stop: /[.?!]["”’)]*$/.test(x) })).filter((x) => x.w));
  const n = ww.length, m = cw.length, W = m + 1;
  const H = new Float32Array((n + 1) * W);
  for (let i = 1; i <= n; i++) H[i * W] = -i * 0.5;
  for (let j = 1; j <= m; j++) H[j] = -j * 0.5;
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++)
    H[i * W + j] = Math.max(H[(i - 1) * W + j - 1] + (ww[i - 1].w === cw[j - 1].w ? 2 : -1), H[(i - 1) * W + j] - 0.5, H[i * W + j - 1] - 0.5);
  for (let i = n, j = m; i > 0 && j > 0;) {
    const h = H[i * W + j];
    if (h === H[(i - 1) * W + j - 1] + (ww[i - 1].w === cw[j - 1].w ? 2 : -1)) {
      if (ww[i - 1].stop && ww[i - 1].w === cw[j - 1].w) cw[j - 1].end = true;
      i--, j--;
    } else if (h === H[(i - 1) * W + j] - 0.5) i--;
    else j--;
  }
}

/** The line's words, with where a fragment ends (… or a turn —): skipping caption words there is free. */
function lineTokens(line: string): { w: string[]; brk: boolean[] } {
  const w: string[] = [], brk: boolean[] = [];
  for (const frag of line.replace(/\*/g, '').split(/…|\.\.\.|—/)) {
    const ws = frag.split(/[\s\-–]+/).map(norm).filter(Boolean);
    if (!ws.length) continue;
    if (brk.length) brk[brk.length - 1] = true;
    for (const x of ws) w.push(x), brk.push(false);
  }
  return { w, brk };
}

/** The best local alignment of the line in cw[lo, hi) (masked words excluded): its score, words matched and span. */
function align(L: { w: string[]; brk: boolean[] }, cw: Word[], lo: number, hi: number, mask: Set<number>) {
  const n = L.w.length, m = hi - lo, W = m + 1;
  const H = new Float32Array((n + 1) * W);
  let best = 0, bi = 0, bj = 0;
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
    const s = mask.has(lo + j - 1) ? -1 : sim(L.w[i - 1], cw[lo + j - 1].w);
    const h = Math.max(0, H[(i - 1) * W + j - 1] + s, H[(i - 1) * W + j] - 1, H[i * W + j - 1] - (L.brk[i - 1] ? 0.05 : 0.6));
    H[i * W + j] = h;
    if (h > best) (best = h), (bi = i), (bj = j);
  }
  // traceback: the matched pairs
  const pairs: [number, number][] = [];
  for (let i = bi, j = bj; i > 0 && j > 0 && H[i * W + j] > 0;) {
    const h = H[i * W + j], s = mask.has(lo + j - 1) ? -1 : sim(L.w[i - 1], cw[lo + j - 1].w);
    if (h === H[(i - 1) * W + j - 1] + s) {
      if (s > 0) pairs.push([i - 1, lo + j - 1]);
      i--, j--;
    } else if (h === H[(i - 1) * W + j] - 1) i--;
    else j--;
  }
  pairs.reverse();
  return { score: best, ratio: pairs.length / n, pairs };
}

/** Where the line is in the captions, s ([first word's start, last word's end] and their indexes), or why not. */
function locate(line: string, cw: Word[], q: Question): { a: number; b: number; s: number; e: number } | string {
  const L = lineTokens(line);
  if (!L.w.length) return 'no words';
  const from = (q.seg[0] ?? 0) - 12, to = (q.then?.[1] ?? q.seg[1]) + 12;
  const lo = Math.max(0, cw.findIndex((x) => x.t >= from)), hi = (() => { const k = cw.findIndex((x) => x.t > to); return k < 0 ? cw.length : k; })();
  if (hi <= lo) return 'no captions there';
  const one = align(L, cw, lo, hi, new Set());
  if (one.ratio < 0.6 || (L.w.length <= 2 && one.ratio < 1)) return `match ${Math.round(one.ratio * 100)} %`;
  const span = (p: [number, number][]) => [p[0][1], p[p.length - 1][1]] as const;
  let [a, b] = span(one.pairs);
  const two = align(L, cw, lo, hi, new Set(Array.from({ length: b - a + 1 }, (_, k) => a + k)));
  if (two.ratio >= 0.6 && two.score >= 0.9 * one.score) {
    // twice: the one nearer the segment, if clearly
    const mid = (q.seg[0] + q.seg[1]) / 2, [a2, b2] = span(two.pairs);
    const d1 = Math.abs((cw[a].t + cw[b].t) / 2 - mid), d2 = Math.abs((cw[a2].t + cw[b2].t) / 2 - mid);
    if (Math.abs(d1 - d2) < 3) return `twice (${cw[a].t.toFixed(1)} s, ${cw[a2].t.toFixed(1)} s)`;
    if (d2 < d1) [a, b] = [a2, b2], (one.pairs = two.pairs);
  }
  // words of the line outside the match: about 0.3 s each
  const head = one.pairs[0][0], tail = L.w.length - 1 - one.pairs[one.pairs.length - 1][0];
  return { a, b, s: cw[a].t - 0.3 * head, e: cw[b].e + 0.3 * tail };
}

/** The start of the sentence holding word a (≤ REACH back), or null; the end of the one holding word b. */
const sentStart = (cw: Word[], a: number) => {
  for (let k = a; k >= 0; k--) {
    if (cw[a].t - cw[k].t > REACH) return null;
    if (k === 0 || cw[k - 1].end) return cw[k].t - 0.2;
  }
  return null;
};
const sentEnd = (cw: Word[], b: number) => {
  for (let k = b; k < cw.length; k++) {
    if (cw[k].t - cw[b].e > REACH) return null;
    if (cw[k].end || k === cw.length - 1) return cw[k].e + 0.3;
  }
  return null;
};
/** The caption word index at or before t. */
const at = (cw: Word[], t: number) => {
  let k = -1;
  while (k + 1 < cw.length && cw[k + 1].t <= t) k++;
  return k;
};
/** An end mid-sentence: inside a word, or after one whose sentence goes on (the next word close). */
const midSentence = (cw: Word[], t: number) => {
  const k = at(cw, t);
  return k >= 0 && k + 1 < cw.length && (t < cw[k].e - 0.15 || (!cw[k].end && cw[k + 1].t - t < REACH));
};

/** The stats' measure: an end mid-sentence ≥ 1 s into it (not just the next turn's first word or two). */
const cuts = (cw: Word[], t: number) => midSentence(cw, t) && (sentStart(cw, Math.max(0, at(cw, t))) ?? -Infinity) < t - 1;

const r1 = (x: number) => Math.round(x * 10) / 10;

/** The item's new segment (and then), or why it's left. */
function fit(q: Question, c: Clip, cw: Word[]): { seg: [number, number]; then?: [number, number] } | string {
  const [o0, o1] = q.seg;
  const clamp = (s: number, e: number): [number, number] => [r1(Math.max(0, s)), r1(Math.min(c.dur, e))];
  const cap = q.skill === 'gist' ? GIST : q.skill === 'dict' ? DICT : SHORT;
  if (!q.line) {
    // only an end mid-sentence: on to the sentence's end
    const e = midSentence(cw, o1) ? onTo(cw, o1, undefined, q.skill === 'gist' ? REACH : 3) : o1;
    return { seg: clamp(o0, e - o0 <= Math.max(cap, o1 - o0) ? e : o1) };
  }
  const p = locate(q.line, cw, q);
  if (typeof p === 'string') return p;
  if (q.skill === 'predict' && q.then) {
    // the cut stays: the setup's start, the reply's end
    const s = Math.min(o0, p.s < o1 ? backTo(cw, p.a, p.s) : o0, o1 - MIN);
    const e = Math.min(q.then[0] + 10, Math.max(q.then[1], onTo(cw, p.e + TAIL, p.b)));
    return { seg: [r1(Math.max(0, s)), o1], then: [o1, r1(Math.min(c.dur, e))] };
  }
  if (q.skill === 'gist') {
    // a gist's line is a sample of it: only ever longer
    const s = Math.min(o0, backTo(cw, p.a, p.s)), le = onTo(cw, p.e + TAIL, p.b, REACH);
    const e = o1 > le ? onTo(cw, o1, undefined, REACH) : le;
    if (e - s <= GIST) return { seg: clamp(s, e) };
    return { seg: e - o0 <= GIST ? clamp(o0, e) : [o0, o1] };
  }
  // held: the old segment had the line with margins (never shrunk); else its pre-/post-roll kept when near the line
  const held = o0 <= p.s - 1 && o1 >= p.e + 0.8;
  let s = backTo(cw, p.a, p.s), e = onTo(cw, p.e + TAIL, p.b);
  if (held || o0 >= p.s - 6) s = Math.min(s, o0);
  if ((held || o1 <= p.e + 6) && o1 > e) {
    // the old end, carried to its sentence's end; one still mid-sentence only kept when held
    const oe = onTo(cw, o1);
    if (held || !midSentence(cw, oe)) e = oe;
  }
  // ≥ MIN: further back first (context), then on
  if (e - s < MIN) s = Math.max(0, e - MIN);
  if (e - s < MIN) e = Math.min(c.dur, s + MIN);
  const most = q.skill === 'dict' ? DICT : Math.max(cap, held ? o1 - o0 : 0);
  if (e - s > most) s = Math.min(Math.max(s, p.s - LEAD), Math.max(s, e - most));
  if (e - s > most) {
    // the last sentence end in reach, ≥ 0.3 s after the line (the player plays 0.4 s on), else the limit
    const ends = cw.filter((w) => w.end && w.e + 0.3 <= s + most && w.e + 0.3 >= p.e + 0.3);
    e = ends.length ? ends[ends.length - 1].e + 0.3 : Math.max(p.e + TAIL, s + most);
  }
  if (q.skill === 'dict' && e - s > DICT) (s = Math.max(s, p.s - 1)), (e = Math.min(e, p.e + 0.7));
  if (q.skill === 'dict' && e - s > DICT) return `dictation's line + margins > ${DICT} s`;
  return { seg: clamp(s, e) };
}

/** A start for a line whose first word is a (at s): ≥ LEAD before it, from its sentence's start; landing inside an
 *  earlier sentence, from that one's start when ≤ 3 s further. */
function backTo(cw: Word[], a: number, s: number): number {
  let t = Math.min(sentStart(cw, a) ?? Infinity, s - LEAD);
  const k = cw.findIndex((x) => x.t >= t);
  if (k > 0 && !cw[k - 1].end && cw[k - 1].e > t - 0.1) {
    const t2 = sentStart(cw, k - 1);
    if (t2 !== null && t - t2 <= 3) t = t2;
  }
  return t;
}

/** An end at or after t (the line's last word b's sentence's end when given): landing inside a sentence, on to its end
 *  when ≤ `more` s further, else (a line's) back to just before that sentence when that's still after the line
 *  (the player plays 0.4 s on). */
function onTo(cw: Word[], t: number, b?: number, more = 3): number {
  const own = b === undefined ? 0 : (sentEnd(cw, b) ?? 0), e = Math.max(t, own);
  if (!midSentence(cw, e)) return e;
  const k = Math.max(0, at(cw, e)), e2 = sentEnd(cw, k);
  if (e2 !== null && e2 - e <= more) return e2;
  const st = sentStart(cw, k);
  return b !== undefined && st !== null && st + 0.15 >= t - TAIL - 0.1 ? st + 0.15 : e;
}

// ── the run
const [dir, flag, listPath] = process.argv.slice(2);
if (!dir) {
  console.error('usage: node scripts/english-segs.ts <captions dir> [--write [unaligned.md]]');
  process.exit(1);
}
const here = join(import.meta.dirname, '../src/lib/english');
const before: number[] = [], after: number[] = [];
let midBefore = 0, midAfter = 0, wMidBefore = 0, wMidAfter = 0, changed = 0, items = 0;
const unaligned: string[] = [], noCaps: string[] = [];
/** An end inside a whisper line (≥ 0.5 s from its ends): the transcripts' measure. */
const wMid = (tf: TranscriptFile | null, t: number) => !!tf?.lines.some((l) => t > l.t[0] + 0.5 && t < l.t[1] - 0.5);

for (const c of CLIPS) {
  const cap = [`${c.video}.en-orig.json3`, `${c.video}.en.json3`].map((f) => join(dir, f)).find(existsSync);
  const tPath = join(here, 'transcripts', `${c.video}.en.json`);
  const tf: TranscriptFile | null = existsSync(tPath) ? JSON.parse(readFileSync(tPath, 'utf8')) : null;
  if (!cap) {
    noCaps.push(c.id);
    continue;
  }
  const cw = wordsOf(JSON.parse(readFileSync(cap, 'utf8')));
  if (tf) punctuate(cw, tf);
  const next = new Map<string, { seg: [number, number]; then?: [number, number] }>();
  for (const q of c.questions) {
    if (q.retired) continue;
    items++;
    before.push(q.seg[1] - q.seg[0]);
    if (cuts(cw, q.seg[1])) midBefore++;
    if (wMid(tf, q.seg[1])) wMidBefore++;
    const f = cw.length ? fit(q, c, cw) : 'no caption words';
    const seg = typeof f === 'string' ? q.seg : f.seg;
    if (typeof f === 'string') unaligned.push(`- ${c.id} ${q.id} (${q.skill}, seg ${q.seg.join('–')}): ${f}${q.line ? ` — “${q.line.replace(/\*/g, '')}”` : ''}`);
    else if (f.seg[0] !== q.seg[0] || f.seg[1] !== q.seg[1] || (f.then && (f.then[0] !== q.then![0] || f.then[1] !== q.then![1]))) next.set(q.id, f);
    if (process.env.SEGDBG === c.id) {
      const w = cw.filter((x) => x.t >= seg[0] - 3 && x.t <= seg[1] + 3).map((x) => `${x.t >= seg[0] && x.t <= seg[1] ? '' : '~'}${x.w}${x.end ? ' |' : ''}`).join(' ');
      console.log(`${q.id} ${q.skill} ${q.seg.join('-')} → ${seg.join('-')} ${typeof f === 'string' ? f : ''}\n  ${q.line ?? ''}\n  ${w}`);
    }
    after.push(seg[1] - seg[0]);
    if (cuts(cw, seg[1])) midAfter++;
    if (wMid(tf, seg[1])) wMidAfter++;
  }
  changed += next.size;
  if (flag === '--write' && next.size) writeBank(join(here, 'clips', `${c.id}.ts`), next);
}

/** seg/then written into the bank's items; the items sorted by seg[0] (stable), their comments going with them. */
function writeBank(path: string, next: Map<string, { seg: [number, number]; then?: [number, number] }>): void {
  const src = readFileSync(path, 'utf8');
  const sf = ts.createSourceFile(path, src, ts.ScriptTarget.Latest, true);
  let arr: ts.ArrayLiteralExpression | undefined;
  const find = (n: ts.Node): void => {
    if (ts.isPropertyAssignment(n) && n.name.getText(sf) === 'questions' && ts.isArrayLiteralExpression(n.initializer)) arr = n.initializer;
    else ts.forEachChild(n, find);
  };
  find(sf);
  if (!arr) return void console.error(`  ${path}: no questions array`);
  const els = arr.elements.map((el) => {
    const full = src.slice(el.getFullStart(), el.getEnd());
    const ws = full.match(/^\s*/)![0];
    let body = full.slice(ws.length);
    const obj = el as ts.ObjectLiteralExpression;
    const prop = (k: string) => obj.properties.find((p) => ts.isPropertyAssignment(p) && p.name.getText(sf) === k) as ts.PropertyAssignment | undefined;
    const id = (prop('id')?.initializer as ts.StringLiteral | undefined)?.text ?? '';
    const f = next.get(id);
    if (f) {
      body = body.replace(/seg: \[[^\]]*\]/, `seg: [${f.seg.join(', ')}]`);
      if (f.then) body = body.replace(/then: \[[^\]]*\]/, `then: [${f.then.join(', ')}]`);
    }
    const seg0 = f ? f.seg[0] : Number((prop('seg')?.initializer as ts.ArrayLiteralExpression).elements[0].getText(sf));
    return { ws, body, seg0, start: el.getFullStart(), end: el.getEnd() };
  });
  const sorted = [...els].sort((x, y) => x.seg0 - y.seg0);
  let out = '', pos = arr.elements.pos;
  els.forEach((el, i) => {
    out += src.slice(pos, el.start) + el.ws + sorted[i].body;
    pos = el.end;
  });
  writeFileSync(path, src.slice(0, arr.elements.pos) + out + src.slice(pos));
}

const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;
const stat = (xs: number[], mid: number, wm: number) =>
  `median ${median(xs).toFixed(1)} s, < 4 s: ${xs.filter((d) => d < 4).length}, < 5 s: ${xs.filter((d) => d < 5).length}, end mid-sentence (captions, ≥ 1 s in): ${mid}, end inside a whisper line: ${wm}`;
console.log(`${items} live items in ${CLIPS.length - noCaps.length} clips with captions; ${changed} changed, ${unaligned.length} left`);
console.log(`before: ${stat(before, midBefore, wMidBefore)}`);
console.log(`after:  ${stat(after, midAfter, wMidAfter)}`);
if (noCaps.length) console.log(`no captions: ${noCaps.join(' ')}`);
if (flag === '--write' && listPath)
  writeFileSync(listPath, `# English Study segments left as they were (scripts/english-segs.ts)\n\n${unaligned.length} items: the line not found in YouTube's captions near its segment (< 60 % of its words), found twice, or too long for its limits.\n\n${unaligned.join('\n')}\n`);
