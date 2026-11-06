// The guides' text on screen (docs/travel.md "Data shape"): a pair shown in the reader's locale, else the other side
// (Seattle's guide is English only; a text-only side like 'SNA 021' is the guide's own), and its inline tokens as
// parts: `{km:}` in the phone's units (units.ts), `{m:}` / `{c:}` metric or imperial with it, `{p:key}` the trip
// note's value, or locked while the note isn't in.
import { parseTokens } from '#lib/travel/tokens.ts';
import type { L } from '#lib/travel/types.ts';
import { fmtKm, unitsNow } from './units.ts';

type Locale = 'ja' | 'en';

/** The reader's side of a pair, else the other ('' for none). */
export const pick = (l: L | undefined | null, locale: Locale): string => (l ? (l[locale] ?? l[locale === 'ja' ? 'en' : 'ja'] ?? '') : '');

/** Whether a pair is shown in the other language than the reader's (no side of its own: lang="…" on it). */
export const otherLang = (l: L | undefined | null, locale: Locale): Locale | null => (l && !l[locale] && l[locale === 'ja' ? 'en' : 'ja'] ? (locale === 'ja' ? 'en' : 'ja') : null);

export type Part = { k: 'text'; s: string } | { k: 'lock'; key: string };

/** A height in metres: '444 m' or '1,457 ft'. */
export const fmtM = (m: number): string => (unitsNow() === 'mi' ? `${Math.round(m * 3.28084).toLocaleString('en-US')} ft` : `${m.toLocaleString('en-US')} m`);
/** A temperature in °C: '29°C' or '84°F'. */
const fmtC = (c: number): string => (unitsNow() === 'mi' ? `${Math.round((c * 9) / 5 + 32)}°F` : `${c}°C`);

/** A string's parts with its tokens rendered: measures in the phone's units, private values from `note` (null: not
 *  loaded yet, every one locked; a key it lacks stays locked too). Neighbouring text runs are joined. */
export function render(s: string, note: Record<string, string> | null): Part[] {
  const out: Part[] = [];
  const text = (x: string) => {
    const last = out.at(-1);
    if (last?.k === 'text') last.s += x;
    else out.push({ k: 'text', s: x });
  };
  for (const tk of parseTokens(s)) {
    if (tk.t === 'text') text(tk.s);
    else if (tk.t === 'km') text(fmtKm(tk.n));
    else if (tk.t === 'm') text(fmtM(tk.n));
    else if (tk.t === 'c') text(fmtC(tk.n));
    else if (tk.t === 'p') {
      const v = note?.[tk.key];
      if (v) text(v);
      else out.push({ k: 'lock', key: tk.key });
    }
  }
  return out;
}

/** A link's href: https as written, or a `{p:key}` from the note (null while locked, or not https). */
export function hrefOf(href: string, note: Record<string, string> | null): string | null {
  const parts = render(href, note);
  if (parts.length !== 1 || parts[0].k !== 'text') return null;
  return /^https:\/\//.test(parts[0].s) ? parts[0].s : null;
}
