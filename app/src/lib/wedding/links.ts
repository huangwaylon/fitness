// What counts as a link in けっこんしき (docs/wedding.md "Notes"), and the only place a URL is judged safe to follow:
// ported from the old board's src/lib/links.js. Pure. Two schemes, allowlisted, tested on the raw characters
// (`http://` or `https://`, no whitespace, no control characters): a `javascript:` URL, or one smuggled past a
// blocklist, is shown as the characters typed. Two consumers, one grammar: the note (markdown.ts) and a subtask's
// title (the same pasted URL live in both).

/** The whole string one URL, anchored at both ends. */
const SAFE_URL = /^https?:\/\/[^\s]+$/i;
/** Control characters (how a scheme is smuggled). */
const CONTROL = /[\x00-\x1f\x7f-\x9f]/;
/** A URL starting exactly here (sticky: the scanner asks at every character), up to a space or a control character
 *  (so one that fails is only the sentence's punctuation after the scheme, and a line is scanned once). */
const URL_HERE = /https?:\/\/[^\s\x00-\x1f\x7f-\x9f]+/iy;
/** Punctuation a sentence puts after a URL, both alphabets. */
const TRAILING = '.,;:!?\'"”’。、・';
/** Closers that belong to the URL only while matched inside it. */
const PAIRS: Record<string, string> = { ')': '(', ']': '[', '}': '{', '）': '（', '」': '「', '』': '『', '】': '【' };

const occurrences = (text: string, ch: string): number => {
  let n = 0;
  for (const c of text) if (c === ch) n++;
  return n;
};

/** A matched run's own end, the sentence's punctuation and unmatched closers handed back (counted once: linear). */
function trimTail(url: string): string {
  const closers = new Map<string, number>();
  for (const [closer, opener] of Object.entries(PAIRS)) {
    const unmatched = occurrences(url, closer) - occurrences(url, opener);
    if (unmatched > 0) closers.set(closer, unmatched);
  }
  let end = url.length;
  while (end > 0) {
    const last = url[end - 1];
    if (TRAILING.includes(last)) {
      end--;
      continue;
    }
    const left = closers.get(last) ?? 0;
    if (left > 0) {
      closers.set(last, left - 1);
      end--;
      continue;
    }
    break;
  }
  return url.slice(0, end);
}

/** A URL safe for an `href`, unchanged, or '' (never a corrected one). The one gate. */
export function safeHref(raw: unknown): string {
  const url = String(raw ?? '').trim();
  if (!SAFE_URL.test(url) || CONTROL.test(url)) return '';
  return url;
}

/** The bare URL starting at `at`, trimmed of the sentence's punctuation, or ''. */
export function urlAt(text: string, at: number): string {
  URL_HERE.lastIndex = at;
  const m = URL_HERE.exec(text);
  return m ? safeHref(trimTail(m[0])) : '';
}

export interface Run {
  text: string;
  href?: string;
}

/** Plain text → runs, each `{ text }` plus an `href` where the run is a URL (markdown.ts' span shape). */
export function splitLinks(text: string): Run[] {
  const src = String(text ?? '');
  const runs: Run[] = [];
  let at = 0, from = 0;
  while (at < src.length) {
    const url = urlAt(src, at);
    if (!url) {
      at++;
      continue;
    }
    if (at > from) runs.push({ text: src.slice(from, at) });
    runs.push({ text: url, href: url });
    at += url.length;
    from = at;
  }
  if (from < src.length) runs.push({ text: src.slice(from) });
  return runs;
}
