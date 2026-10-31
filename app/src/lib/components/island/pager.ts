// NH's dialogue box, the logic (docs/design.md "Dialogue"): a line is split into pages of two lines (at the line
// breaks the text has: NH's own catch lines carry the game's), the page types in a glyph at a time, a tap finishes the
// page at once, the next tap turns to the next page (a ▼ bobs at the bottom-right while one follows), and on the last
// page a tap closes it. Pure: Talk.svelte and Plate.svelte keep the state and the timers.

/** Glyphs per second as the text types in (NH: about 30). */
export const TYPE_MS = 33;
/** Lines per page (NH's box holds two). */
const LINES_PER_PAGE = 2;

/** The pages of a dialogue: each item of `parts` starts a new page; within one, every LINES_PER_PAGE lines (split at
 *  '\n') make a page. Empty lines are dropped. */
export function paginate(parts: string | readonly string[], per = LINES_PER_PAGE): string[] {
  const out: string[] = [];
  for (const part of typeof parts === 'string' ? [parts] : parts) {
    const lines = part.split('\n').map((l) => l.trim()).filter(Boolean);
    for (let i = 0; i < lines.length; i += per) out.push(lines.slice(i, i + per).join('\n'));
  }
  return out.length ? out : [''];
}

export interface PagerState { pages: readonly string[]; page: number; shown: number }

/** Still typing the page. */
export const typing = (s: PagerState): boolean => s.shown < [...s.pages[s.page]].length;
/** The ▼: the page is done and another follows. */
export const arrow = (s: PagerState): boolean => !typing(s) && s.page < s.pages.length - 1;

/** A tap on the box: finish the page if it's typing, else turn to the next page, else close. */
export function tapBox(s: PagerState): { action: 'finish' | 'next' | 'close'; state: PagerState } {
  if (typing(s)) return { action: 'finish', state: { ...s, shown: [...s.pages[s.page]].length } };
  if (s.page < s.pages.length - 1) return { action: 'next', state: { ...s, page: s.page + 1, shown: 0 } };
  return { action: 'close', state: s };
}

/** One more glyph typed (no-op once the page is done). */
export const typeOne = (s: PagerState): PagerState => (typing(s) ? { ...s, shown: s.shown + 1 } : s);

/** The typed part and the rest of the page (the rest keeps its room, invisible, so the box never grows as it types). */
export function split(s: PagerState): [string, string] {
  const g = [...s.pages[s.page]];
  return [g.slice(0, s.shown).join(''), g.slice(s.shown).join('')];
}

/** Ink that reads on a name tag of colour `hex` (dark on light tags, cream on dark ones). */
export function tagInk(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return '#4A3A2C';
  const n = parseInt(m[1], 16), lin = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const L = 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return L > 0.36 ? '#4A3A2C' : '#FFF9E3';
}
