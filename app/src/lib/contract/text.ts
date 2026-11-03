// Plain text as the record keeps it, shared by the board's notes (contract/board.ts) and the meal log's names
// (contract/food.ts): what is stripped, what counts as a line break, one clean line. Pure and dependency-free.

/** Characters plain text never keeps: C0 and C1 controls but the line break, DEL, the bidirectional overrides and
 *  isolates (they reorder what others read), zero-width joiners' look-alikes that hide text, the BOM and lone
 *  surrogates. */
const u4 = (n: number): string => `\\u${n.toString(16).padStart(4, '0')}`;
const charClass = (ranges: readonly (readonly [number, number])[]): string => `[${ranges.map(([a, b]) => (a === b ? u4(a) : `${u4(a)}-${u4(b)}`)).join('')}]`;
export const STRIP = new RegExp(
  `${charClass([[0x0, 0x8], [0xb, 0x1f], [0x7f, 0x9f], [0x200b, 0x200f], [0x202a, 0x202e], [0x2060, 0x2064], [0x2066, 0x2069], [0xfeff, 0xfeff], [0xfff9, 0xfffb]])}` +
    '|[\\ud800-\\udbff](?![\\udc00-\\udfff])|(?<![\\ud800-\\udbff])[\\udc00-\\udfff]',
  'g'
);
/** Line breaks of other kinds: CR (with or without LF), NEL, the line and paragraph separators. */
export const BREAKS = new RegExp(`\\r\\n?|${charClass([[0x85, 0x85], [0x2028, 0x2029]])}`, 'g');

/**
 * One line of plain text (a food's name and portion label, a recipe's name: contract/food.ts): STRIP stripped as from
 * a note (contract/board.ts cleanText), every run of blank space (line breaks too) one space, trimmed, at most `max`
 * characters. '' when nothing is left. Idempotent.
 */
export function cleanLine(raw: unknown, max: number): string {
  if (typeof raw !== 'string') return '';
  // The same few names come back in every meal (each row is validated once when read): remember the last ones.
  let seen = lines.get(max);
  if (!seen) lines.set(max, (seen = new Map()));
  let out = seen.get(raw);
  if (out === undefined) {
    const s = raw.normalize('NFC').replace(BREAKS, ' ').replace(STRIP, '').replace(/\s+/gu, ' ').trim();
    out = s.length <= max ? s : Array.from(s).slice(0, max).join('').trimEnd(); // never more characters than code units
    if (seen.size >= 4096) seen.clear();
    seen.set(raw, out);
  }
  return out;
}
const lines = new Map<number, Map<string, string>>();
