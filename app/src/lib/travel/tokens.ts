// The inline tokens of the trip text (types.ts L): `{km:9.8}`, `{m:444}`, `{c:29}` (a measure, shown metric or
// imperial by the device switch) and `{p:key}` (a private value from the trip note). Everything else is text.

export type Token =
  | { t: 'text'; s: string }
  | { t: 'km' | 'm' | 'c'; n: number }
  | { t: 'p'; key: string };

const TOKEN = /\{(km|m|c):(-?\d+(?:\.\d+)?)\}|\{p:([a-zA-Z][\w]*)\}/g;

/** A string's parts in order: text runs and tokens (a brace that is no token stays text). */
export function parseTokens(s: string): Token[] {
  const out: Token[] = [];
  let at = 0;
  for (const m of s.matchAll(TOKEN)) {
    if (m.index > at) out.push({ t: 'text', s: s.slice(at, m.index) });
    if (m[3]) out.push({ t: 'p', key: m[3] });
    else out.push({ t: m[1] as 'km' | 'm' | 'c', n: Number(m[2]) });
    at = m.index + m[0].length;
  }
  if (at < s.length) out.push({ t: 'text', s: s.slice(at) });
  return out;
}

/** The private keys a string names. */
export const privateKeys = (s: string): string[] => parseTokens(s).flatMap((p) => (p.t === 'p' ? [p.key] : []));
