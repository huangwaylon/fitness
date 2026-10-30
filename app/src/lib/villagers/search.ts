// The villager picker's search: one field, either language. A query matches a villager's name, species or
// personality (ja or en), or a special character's name or 「とくべつ」 / "special", ignoring case, width (ＡＢ / ｱｲ) and hiragana vs katakana (ねこ finds ネコ, じゅん finds ジュン).
import { ROSTER, ROSTER_IDS, type RosterId } from './roster.ts';
import { PERSONALITIES, SPECIAL, SPECIES } from './species.ts';

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
    const kind = v.species && v.personality ? [...SPECIES[v.species], ...PERSONALITIES[v.personality]] : SPECIAL;
    return [id, [v.nameJa, v.nameEn, ...kind].map(fold)];
  })
) as Record<RosterId, string[]>;

/** Roster ids (picker order) whose name, species or personality (or 「とくべつ」) contains every word of `query`; all for ''. */
export function searchVillagers(query: string): RosterId[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) return ROSTER_IDS;
  return ROSTER_IDS.filter((id) => words.every((w) => HAYSTACK[id].some((h) => h.includes(w))));
}
