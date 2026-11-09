// 音の へんしん's reduced-form check (scripts/kikimimi-reduce.ts, content.test): which reduced spellings whisper writes as
// said, whether a transcript has a phrase's, and a rough syllable count for the time a focus takes. Pure.

/** The reduced spellings whisper writes when prompted with them (the rest, a flap or a dropped t, it spells as written). */
const SPELLED: ReadonlySet<string> = new Set(['gonna', 'wanna', 'gotta', 'hafta', 'hasta', 'lemme', 'gimme', 'kinda', 'sorta', 'outta', 'lotsa', 'lotta',
  'coupla', 'dunno', 'gotcha', 'whatcha', 'betcha', 'getcha', 'letcha', 'didja', 'wouldja', 'couldja', 'whaddaya', 'doncha', 'woulda', 'shoulda', "'em", "y'know", 'useta']);

const norm = (w: string) => w.toLowerCase().replace(/[’]/g, "'").replace(/[^a-z']/g, '');

/** Whether a transcript has the reduced spelling in `red` (false when `red` has none whisper would write). */
export function spelledIn(red: string, heard: string): boolean {
  const want = red.split(/\s+/).map(norm).filter((w) => SPELLED.has(w));
  if (!want.length) return false;
  const got = new Set(heard.split(/\s+/).map(norm));
  return want.every((w) => got.has(w) || got.has(w.replace(/^'/, '')));
}

/** A phrase passes the timing check when its natural focus takes at most this share of the careful one's time per syllable. */
export const REDUCE_SHORTER = 0.85;

/** Syllables in spoken English, roughly (vowel groups, a silent final e aside; scripts/kikimimi-audio.ts's). */
export function syllables(text: string): number {
  return (text.toLowerCase().match(/[a-z']+/g) ?? []).reduce((s, w) => {
    const v = w.replace(/'/g, '').replace(/(?:[^laeiouy]es|[^laeiouy]ed|[^laeiouy]e)$/, (m) => m[0]).replace(/^y/, '');
    return s + Math.max(1, v.match(/[aeiouy]+/g)?.length ?? 0);
  }, 0);
}
