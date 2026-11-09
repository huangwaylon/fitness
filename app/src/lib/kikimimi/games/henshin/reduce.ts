// 音の へんしん's reduced-form check (scripts/kikimimi-reduce.ts, content/henshin.test.ts): which reduced spellings whisper
// writes as said, whether a transcript has a phrase's, and whether a careful take was heard in full. Pure.

/** The reduced spellings whisper writes when prompted with them (gonna, lemme, outta…). The rest (a flap, a dropped t, a
 *  linked word, a weak vowel) it spells as written whatever is said: for those the natural take is the respelling said
 *  (`tts` carries the spelling as said) and whisper's gate holds that every word is still heard. */
const SPELLED: ReadonlySet<string> = new Set(['gonna', 'wanna', 'gotta', 'lemme', 'gimme', 'kinda', 'sorta', 'outta', 'lotsa', 'lotta', 'coupla', 'dunno',
  'gotcha', 'whatcha', 'betcha', 'getcha', 'letcha', 'didja', 'wouldja', 'couldja', 'whaddaya', 'doncha', 'woulda', 'shoulda', "y'know", "'em"]);

const norm = (w: string) => w.toLowerCase().replace(/[’]/g, "'").replace(/[^a-z0-9']/g, '');
const words = (s: string) => s.split(/[\s,.?!;:]+/).map(norm).filter(Boolean);

/** The whisper-written reduced spellings in a phrase's `red` ("I'm gonna" → gonna). */
export const spellingsOf = (red: string): string[] => words(red).filter((w) => SPELLED.has(w));

/** Whether a transcript has every spelling of `red` whisper would write (false when it has none). */
export function spelledIn(red: string, heard: string): boolean {
  const want = spellingsOf(red), got = new Set(words(heard));
  return want.length > 0 && want.every((w) => got.has(w));
}

/** Whether a transcript has the full form's words in order (a careful take heard in full: no reduced spelling for them). */
export function fullIn(full: string, heard: string): boolean {
  const want = words(full), got = words(heard);
  let k = 0;
  for (const w of got) if (k < want.length && w === want[k]) k++;
  return k === want.length;
}
