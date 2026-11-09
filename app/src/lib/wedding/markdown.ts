// けっこんしき's note (docs/wedding.md "Notes"): the smallest markdown it can be honest about, and the toolbar's
// transforms; ported from the old board's src/lib/markdown.js. Pure.
//
// It parses to data, never to HTML: Markdown.svelte maps these blocks onto elements, so no HTML string is built and
// no `{@html}` is used anywhere (the note is written by the members and read by everyone). Four blocks (heading,
// bullets, numbers, text), two marks (bold, italic) and a link; no images, tables, code, quotes or raw HTML: `<b>`
// is shown as the characters typed. A link is http/https only (links.ts); anything else, and a marker matching
// nothing, renders as typed. A single newline is a line break; a blank line separates paragraphs.
import { safeHref, urlAt } from './links.ts';

export interface Span {
  text: string;
  bold?: true;
  italic?: true;
  href?: string;
}
export type Block =
  | { kind: 'heading'; level: 1 | 2; spans: Span[] }
  | { kind: 'bullets'; items: Span[][] }
  | { kind: 'numbers'; items: Span[][] }
  | { kind: 'text'; lines: Span[][] };

/** `#`, `##` (deeper maps onto 2), then the words; the space is required (`#1 dress` is text). */
const HEADING = /^(#{1,6})[ \t]+(.+)$/;
/** `-` or `*`, up to three spaces of indent (nesting is not a level this renders). */
const BULLET = /^[ \t]{0,3}[-*][ \t]+(.+)$/;
/** `1.` or `1)`; the number itself is dropped (an ordered list numbers itself). */
const NUMBER = /^[ \t]{0,3}\d{1,9}[.)][ \t]+(.+)$/;
/** A `[label](url)`'s URL at most (a longer one prints as typed: the scan stays linear). */
const LINK_URL_MAX = 4096;

const isSpace = (ch: string | undefined): boolean => ch === undefined || /\s/.test(ch);

/** How many asterisks start at `at` (a run: `*`, `**` and `***` are three delimiters). */
function runAt(text: string, at: number): number {
  let n = 0;
  while (text[at + n] === '*') n++;
  return n;
}
/** How many asterisks end at `at`. */
function runBefore(text: string, at: number): number {
  let n = 0;
  while (at - n - 1 >= 0 && text[at - n - 1] === '*') n++;
  return n;
}

/**
 * One line's index, built in one pass so that each question the scanner asks at a character is answered without
 * scanning the rest of the line (a line of `*a ` or `[` would be quadratic: seconds for a long note):
 * - `run[i]`: how many asterisks start at i;
 * - `closers`: by length, where each whole run of asterisks that can close starts (after a non-space), in order;
 * - `bracket[i]`: the first `]` at or after i (-1: none); `stop[i]`: the first `)` or whitespace at or after i.
 */
interface LineIndex { run: Int32Array; closers: Map<number, number[]>; bracket: Int32Array; stop: Int32Array }

function indexOf(line: string): LineIndex {
  const n = line.length;
  const run = new Int32Array(n + 1), bracket = new Int32Array(n + 1), stop = new Int32Array(n + 1);
  bracket[n] = stop[n] = -1;
  for (let i = n - 1; i >= 0; i--) {
    run[i] = line[i] === '*' ? run[i + 1] + 1 : 0;
    bracket[i] = line[i] === ']' ? i : bracket[i + 1];
    stop[i] = line[i] === ')' || /\s/.test(line[i]) ? i : stop[i + 1];
  }
  const closers = new Map<number, number[]>();
  for (let at = 0; at < n; at += run[at] || 1) {
    if (!run[at] || isSpace(line[at - 1])) continue;
    const list = closers.get(run[at]);
    if (list) list.push(at);
    else closers.set(run[at], [at]);
  }
  return { run, closers, bracket, stop };
}

/** Where a run of exactly `length` asterisks closes the one opened at `from`, or -1 (an opener before a non-space,
 *  a closer after one: `2 * 3 * 4` is not italic). */
function closingRun(line: string, ix: LineIndex, from: number, length: number): number {
  if (isSpace(line[from])) return -1;
  const list = ix.closers.get(length);
  if (!list) return -1;
  // the first after `from` (binary search)
  let lo = 0, hi = list.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (list[mid] <= from) lo = mid + 1;
    else hi = mid;
  }
  return lo < list.length ? list[lo] : -1;
}

/** A link at `at`: `[label](url)` (the label no `]`, the URL no whitespace or `)`) or a bare URL, or null (an empty
 *  label or a refused scheme: the brackets print). */
function linkAt(line: string, ix: LineIndex, at: number): { spans: Span[]; href: string; length: number } | null {
  if (line[at] === '[') {
    const close = ix.bracket[at + 1];
    if (close < 0 || line[close + 1] !== '(') return null;
    const end = ix.stop[close + 2];
    if (end <= close + 2 || line[end] !== ')' || end - close - 2 > LINK_URL_MAX) return null;
    const label = line.slice(at + 1, close);
    const href = /\S/.test(label) ? safeHref(line.slice(close + 2, end)) : '';
    return href ? { spans: spansOf(label), href, length: end + 1 - at } : null;
  }
  const url = urlAt(line, at);
  return url ? { spans: [{ text: url }], href: url, length: url.length } : null;
}

/** One line's runs (one asterisk italic, two bold, three both; nesting by recursion; links first). */
function spansOf(line: string): Span[] {
  const ix = indexOf(line);
  const spans: Span[] = [];
  let plain = '';
  let at = 0;
  const flush = () => {
    if (plain) spans.push({ text: plain });
    plain = '';
  };
  while (at < line.length) {
    const link = linkAt(line, ix, at);
    if (link) {
      flush();
      for (const s of link.spans) spans.push({ ...s, href: link.href });
      at += link.length;
      continue;
    }
    const length = ix.run[at];
    const from = at + length;
    const close = length ? closingRun(line, ix, from, length) : -1;
    if (close < 0) {
      plain += line[at];
      at++;
      continue;
    }
    flush();
    const marks: Pick<Span, 'bold' | 'italic'> = {};
    if (length >= 2) marks.bold = true;
    if (length === 1 || length >= 3) marks.italic = true;
    for (const s of spansOf(line.slice(from, close))) spans.push({ ...s, ...marks });
    at = close + length;
  }
  flush();
  return spans;
}

/** The document as blocks, in order (one pass, line by line). */
export function parseMarkdown(text: string): Block[] {
  const blocks: Block[] = [];
  let open = null as Block | null;
  for (const raw of String(text ?? '').replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.replace(/[ \t]+$/, '');
    if (!line) {
      open = null;
      continue;
    }
    const heading = HEADING.exec(line);
    if (heading) {
      blocks.push({ kind: 'heading', level: heading[1].length === 1 ? 1 : 2, spans: spansOf(heading[2]) });
      open = null;
      continue;
    }
    const bullet = BULLET.exec(line);
    const number = bullet ? null : NUMBER.exec(line);
    if (bullet || number) {
      const kind = bullet ? 'bullets' : 'numbers';
      if (open?.kind !== kind) {
        const list: Block = { kind, items: [] };
        blocks.push(list);
        open = list;
      }
      (open as Extract<Block, { items: Span[][] }>).items.push(spansOf((bullet ?? number)![1]));
      continue;
    }
    if (open?.kind !== 'text') {
      open = { kind: 'text', lines: [] };
      blocks.push(open);
    }
    (open as Extract<Block, { kind: 'text' }>).lines.push(spansOf(line));
  }
  return blocks;
}

/** Consecutive spans sharing an href, as one anchor (a label with a mark in it is one link, one tab stop). */
export function groupLinks(spans: Span[]): { href?: string; spans: Span[] }[] {
  const out: { href?: string; spans: Span[] }[] = [];
  for (const s of spans) {
    const last = out.at(-1);
    if (last?.href && last.href === s.href) last.spans.push(s);
    else out.push({ href: s.href, spans: [s] });
  }
  return out;
}

// ---- the toolbar: each transform takes the text and the selection and returns both (the caret stays where it was);
// each a toggle whose second press undoes the first, decided over the whole selection.

export interface Edit {
  text: string;
  start: number;
  end: number;
}

/** Any block marker, any family, any indent (a prefix toggle replaces it rather than stacking `# - `). */
const BLOCK_MARK = /^[ \t]*(?:#{1,6}|[-*]|\d{1,9}[.)])[ \t]+(.*)$/;

/** The full lines the selection touches, as `[from, to]`. */
function lineSpan(text: string, start: number, end: number): [number, number] {
  const from = start === 0 ? 0 : text.lastIndexOf('\n', start - 1) + 1;
  const found = text.indexOf('\n', end);
  return [from, found < 0 ? text.length : found];
}

function parts(line: string) {
  const lead = line.slice(0, line.length - line.trimStart().length);
  const tail = line.slice(line.trimEnd().length);
  return { lead, core: line.trim(), tail };
}

const wrapped = (core: string, mark: string): boolean =>
  core.length > 2 * mark.length && runAt(core, 0) === mark.length && runBefore(core, core.length) === mark.length;

/** `mark` around one line's selection (shrunk to its non-space core), or off again. */
function markRun(text: string, start: number, end: number, mark: string): Edit {
  const w = mark.length;
  const raw = text.slice(start, end);
  const lead = raw.trim() ? raw.length - raw.trimStart().length : 0;
  const at = start + lead;
  const to = raw.trim() ? end - (raw.length - raw.trimEnd().length) : start;
  const core = text.slice(at, to);
  if (runBefore(text, at) === w && runAt(text, to) === w)
    return { text: text.slice(0, at - w) + core + text.slice(to + w), start: at - w, end: to - w };
  if (wrapped(core, mark)) {
    const inner = core.slice(w, -w);
    return { text: text.slice(0, at) + inner + text.slice(to), start: at, end: at + inner.length };
  }
  return { text: `${text.slice(0, at)}${mark}${core}${mark}${text.slice(to)}`, start: at + w, end: to + w };
}

/** `mark` around each touched line's content (after its block marker), or off again. */
function markLines(text: string, start: number, end: number, mark: string): Edit {
  const [from, to] = lineSpan(text, start, end);
  const lines = text.slice(from, to).split('\n');
  const body = (line: string) => {
    const { core } = parts(line);
    const bare = BLOCK_MARK.exec(core);
    return bare ? bare[1] : core;
  };
  const written = lines.filter((l) => l.trim());
  const strip = written.length > 0 && written.every((l) => wrapped(body(l), mark));
  const next = lines
    .map((line) => {
      if (!line.trim()) return line;
      const { lead, core, tail } = parts(line);
      const inner = body(line);
      if (!strip && wrapped(inner, mark)) return line;
      const head = core.slice(0, core.length - inner.length);
      const marked = strip ? inner.slice(mark.length, -mark.length) : `${mark}${inner}${mark}`;
      return `${lead}${head}${marked}${tail}`;
    })
    .join('\n');
  return { text: text.slice(0, from) + next + text.slice(to), start: from, end: from + next.length };
}

function toggleMark(text: string, start: number, end: number, mark: string): Edit {
  const from = Math.min(start, end), to = Math.max(start, end);
  return text.slice(from, to).includes('\n') ? markLines(text, from, to, mark) : markRun(text, from, to, mark);
}

export const toggleBold = (text: string, start: number, end: number): Edit => toggleMark(text, start, end, '**');

/** `prefix` on every touched line, or off from all of them if all carry it (an all-blank selection takes it). */
function togglePrefix(text: string, start: number, end: number, prefix: string, carried: RegExp): Edit {
  const [from, to] = lineSpan(text, start, end);
  const lines = text.slice(from, to).split('\n');
  const written = lines.filter((l) => l.trim());
  const blank = written.length === 0;
  const strip = !blank && written.every((l) => carried.test(l));
  const next = lines
    .map((line) => {
      if (!blank && !line.trim()) return line;
      if (strip) return carried.exec(line)![1];
      const bare = BLOCK_MARK.exec(line);
      return prefix + (bare ? bare[1] : blank ? '' : line);
    })
    .join('\n');
  return { text: text.slice(0, from) + next + text.slice(to), start: from, end: from + next.length };
}

export const toggleBullets = (text: string, start: number, end: number): Edit => togglePrefix(text, start, end, '- ', /^[ \t]{0,3}[-*][ \t]+(.*)$/);
export const toggleHeading = (text: string, start: number, end: number): Edit => togglePrefix(text, start, end, '# ', /^(?:#{1,6})[ \t]+(.*)$/);
