// The villager picker's search: one field, either language. A query matches a villager's name, species or
// personality (ja or en), ignoring case, width (ＡＢ / ｱｲ) and hiragana vs katakana (ねこ finds ネコ, じゅん finds ジュン).
import { ROSTER, ROSTER_IDS, type RosterId } from './roster.ts';
import { PERSONALITIES, SPECIES } from './species.ts';

/** NFKC + lower case + hiragana → katakana, so both sides compare in one script. */
export function fold(s: string): string {
  return s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60))
    .trim();
}

const HAYSTACK = Object.fromEntries(
  ROSTER_IDS.map((id) => {
    const v = ROSTER[id];
    return [id, [v.nameJa, v.nameEn, ...SPECIES[v.species], ...PERSONALITIES[v.personality]].map(fold)];
  })
) as Record<RosterId, string[]>;

/** Roster ids (picker order) whose name, species or personality contains every word of `query`; all for ''. */
export function searchVillagers(query: string): RosterId[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) return ROSTER_IDS;
  return ROSTER_IDS.filter((id) => words.every((w) => HAYSTACK[id].some((h) => h.includes(w))));
}
